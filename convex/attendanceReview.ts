import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireRole } from "./lib/auth";

function localDateTimeUtc(date: string, minuteOfDay: number, timeZone: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const target = Date.UTC(year, month - 1, day, Math.floor(minuteOfDay / 60), minuteOfDay % 60);
  let guess = target;
  for (let attempt = 0; attempt < 4; attempt++) {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date(guess));
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const represented = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second));
    const difference = represented - target;
    if (!difference) break;
    guess -= difference;
  }
  return guess;
}

async function refreshDay(ctx: any, event: any, organization: any) {
  const workDate = new Intl.DateTimeFormat("en-CA", { timeZone: organization.timezone }).format(new Date(event.receivedAt));
  const start = localDateTimeUtc(workDate, 0, organization.timezone);
  const end = localDateTimeUtc(workDate, 1440, organization.timezone);
  const events = await ctx.db.query("attendanceEvents")
    .withIndex("by_employee_time", (q: any) => q.eq("employeeId", event.employeeId).gte("receivedAt", start).lt("receivedAt", end))
    .collect();
  events.sort((a: any, b: any) => a.receivedAt - b.receivedAt);
  let openIn: number | null = null, openBreak: number | null = null, workMs = 0, breakMs = 0, incomplete = false;
  for (const item of events) {
    if (item.reviewStatus === "rejected") continue;
    if (item.eventType === "check_in") { if (openIn !== null) incomplete = true; else openIn = item.receivedAt; }
    else if (item.eventType === "check_out") { if (openIn === null) incomplete = true; else { workMs += Math.max(0, item.receivedAt - openIn); openIn = null; } }
    else if (item.eventType === "break_start") { if (openBreak !== null || openIn === null) incomplete = true; else openBreak = item.receivedAt; }
    else if (item.eventType === "break_end") { if (openBreak === null) incomplete = true; else { breakMs += Math.max(0, item.receivedAt - openBreak); openBreak = null; } }
  }
  if (openIn !== null || openBreak !== null) incomplete = true;
  const pending = events.some((item: any) => item.reviewStatus === "pending");
  const rejected = events.some((item: any) => item.reviewStatus === "rejected");
  const firstCheckInAt = events.find((item: any) => item.eventType === "check_in" && item.reviewStatus !== "rejected")?.receivedAt;
  const lastCheckOutAt = [...events].reverse().find((item: any) => item.eventType === "check_out" && item.reviewStatus !== "rejected")?.receivedAt;
  const values = {
    organizationId: event.organizationId, employeeId: event.employeeId, workDate, firstCheckInAt, lastCheckOutAt,
    payableMinutes: incomplete || pending ? 0 : Math.max(0, Math.floor((workMs - breakMs) / 60000)),
    breakMinutes: Math.floor(breakMs / 60000),
    status: pending ? "pending_review" : rejected ? "exception" : "present",
    updatedAt: Date.now(),
  };
  const existing = await ctx.db.query("attendanceDays").withIndex("by_employee_date", (q: any) => q.eq("employeeId", event.employeeId).eq("workDate", workDate)).first();
  if (existing) await ctx.db.patch(existing._id, values); else await ctx.db.insert("attendanceDays", values);
}

export const pendingReviews = query({
  args: {},
  handler: async (ctx) => {
    const reviewer = await requireRole(ctx, ["supervisor", "admin", "superadmin"]);
    const events = await ctx.db.query("attendanceEvents")
      .withIndex("by_org_review_time", q => q.eq("organizationId", reviewer.organizationId).eq("reviewStatus", "pending"))
      .order("desc").collect();
    return Promise.all(events.map(async event => {
      const [employee, location] = await Promise.all([ctx.db.get(event.employeeId), ctx.db.get(event.locationId)]);
      return {
        _id: event._id, eventType: event.eventType, exceptionCode: event.exceptionCode ?? null,
        supervisorRecommendation: event.supervisorRecommendation ?? null,
        supervisorNote: event.supervisorNote ?? null, receivedAt: event.receivedAt,
        geofencePassed: event.geofencePassed ?? null, locationType: event.locationType ?? "physical",
        employeeName: employee ? [employee.firstName, employee.lastName].filter(Boolean).join(" ") : "Unknown employee",
        employeeCode: employee?.employeeCode ?? "—", locationName: location?.name ?? "Unknown location",
      };
    }));
  },
});

export const resolveUnclassifiedReview = mutation({
  args: { eventId: v.id("attendanceEvents"), decision: v.union(v.literal("approved"), v.literal("rejected")), note: v.string() },
  handler: async (ctx, args) => {
    const reviewer = await requireRole(ctx, ["admin", "superadmin"]);
    const event = await ctx.db.get(args.eventId);
    if (!event || event.organizationId !== reviewer.organizationId) throw new Error("ATTENDANCE_EVENT_NOT_FOUND");
    if (event.reviewStatus !== "pending" || event.exceptionCode === "OUTSIDE_GEOFENCE") throw new Error("ATTENDANCE_REVIEW_NOT_RESOLVABLE_HERE");
    const note = args.note.trim();
    if (note.length < 3) throw new Error("REVIEW_NOTE_REQUIRED");
    const now = Date.now();
    await ctx.db.patch(event._id, { reviewStatus: args.decision, reviewedBy: reviewer._id, reviewedAt: now, reviewNote: note });
    const organization = await ctx.db.get(reviewer.organizationId);
    if (organization) await refreshDay(ctx, event, organization);
    await ctx.db.insert("auditLogs", {
      organizationId: reviewer.organizationId, actorUserId: reviewer._id,
      action: args.decision === "approved" ? "attendance.review.approved" : "attendance.review.rejected",
      entityType: "attendanceEvent", entityId: String(event._id),
      metadata: { eventType: event.eventType, exceptionCode: event.exceptionCode ?? null, note }, createdAt: now,
    });
    return { resolved: true, decision: args.decision };
  },
});
