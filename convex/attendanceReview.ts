import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireRole } from "./lib/auth";
import { calculateShiftWorkBuckets } from "./attendanceTimePolicy";

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
  const pending = events.some((item: any) => item.reviewStatus === "pending");
  let incomplete = false;
  let buckets = { totalWorkMinutes: 0, breakMinutes: 0, regularMinutes: 0, overtimeMinutes: 0 };
  try {
    const assignments = await ctx.db.query("shiftAssignments")
      .withIndex("by_employee_date", (q: any) => q.eq("employeeId", event.employeeId).eq("workDate", workDate))
      .collect();
    const employee = await ctx.db.get(event.employeeId);
    const shiftId = assignments.length === 1 ? assignments[0].shiftId : assignments.length === 0 ? employee?.defaultShiftId : null;
    const shift = shiftId ? await ctx.db.get(shiftId) : null;
    const validShift = shift && shift.organizationId === event.organizationId && shift.isActive &&
      shift.endMinute > shift.startMinute && shift.endMinute <= 1440;
    const shiftStartAt = validShift ? localDateTimeUtc(workDate, shift.startMinute, organization.timezone) : undefined;
    const shiftEndAt = validShift ? localDateTimeUtc(workDate, shift.endMinute, organization.timezone) : undefined;
    buckets = calculateShiftWorkBuckets(events, shiftStartAt, shiftEndAt);
  } catch {
    incomplete = true;
  }
  const firstCheckInAt = events.find((item: any) => item.eventType === "check_in" && item.reviewStatus !== "rejected")?.receivedAt;
  const lastCheckOutAt = [...events].reverse().find((item: any) => item.eventType === "check_out" && item.reviewStatus !== "rejected")?.receivedAt;
  const values = {
    organizationId: event.organizationId, employeeId: event.employeeId, workDate, firstCheckInAt, lastCheckOutAt,
    payableMinutes: incomplete || pending ? 0 : buckets.regularMinutes,
    breakMinutes: buckets.breakMinutes,
    status: pending ? "pending_review" : events.some((item: any) => item.reviewStatus === "rejected") ? "exception" : "present",
    updatedAt: Date.now(),
  };
  const existing = await ctx.db.query("attendanceDays")
    .withIndex("by_employee_date", (q: any) => q.eq("employeeId", event.employeeId).eq("workDate", workDate))
    .first();
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


/**
 * Finds previous-workday sessions that would block a new employee punch.
 * This is deliberately separate from geofence/pending-review counts.
 */
export const openSessions = query({
  args: {},
  handler: async (ctx) => {
    const reviewer = await requireRole(ctx, ["supervisor", "admin", "superadmin"]);
    const organization = await ctx.db.get(reviewer.organizationId);
    if (!organization) throw new Error("ORGANIZATION_NOT_FOUND");
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: organization.timezone }).format(new Date());
    const todayStart = localDateTimeUtc(today, 0, organization.timezone);
    const employees = await ctx.db.query("employees")
      .withIndex("by_org_status", q => q.eq("organizationId", reviewer.organizationId).eq("status", "active"))
      .collect();

    const sessions = await Promise.all(employees.map(async employee => {
      // Mirror recordPunch's blocker rules so the admin panel explains the
      // same pending event that prevents the employee from punching.
      const [pendingEvents, latestPrior] = await Promise.all([
        ctx.db.query("attendanceEvents")
          .withIndex("by_employee_review_time", q => q.eq("employeeId", employee._id).eq("reviewStatus", "pending"))
          .collect(),
        ctx.db.query("attendanceEvents")
          .withIndex("by_employee_time", q => q.eq("employeeId", employee._id).lt("receivedAt", todayStart))
          .filter(q => q.neq(q.field("reviewStatus"), "rejected"))
          .order("desc")
          .first(),
      ]);
      const blockingPending = pendingEvents.find(event => {
        const eventDate = new Intl.DateTimeFormat("en-CA", { timeZone: organization.timezone }).format(new Date(event.receivedAt));
        return eventDate === today || event.eventType !== "check_out";
      });
      const hasOpenPriorSession = Boolean(latestPrior && latestPrior.eventType !== "check_out");
      if (!blockingPending && !hasOpenPriorSession) return null;

      const blocker = blockingPending ?? latestPrior!;
      const workDate = new Intl.DateTimeFormat("en-CA", { timeZone: organization.timezone }).format(new Date(blocker.receivedAt));
      const [location] = await Promise.all([ctx.db.get(blocker.locationId)]);
      return {
        employeeId: employee._id,
        employeeName: [employee.firstName, employee.lastName].filter(Boolean).join(" "),
        employeeCode: employee.employeeCode,
        workDate,
        latestEventId: blocker._id,
        eventType: blocker.eventType,
        receivedAt: blocker.receivedAt,
        reviewStatus: blocker.reviewStatus ?? "not_required",
        hasPendingReview: Boolean(blockingPending),
        locationName: location && location.organizationId === reviewer.organizationId ? location.name : "Unknown location",
        locationType: blocker.locationType ?? "physical",
        reason: blockingPending ? "PENDING_REVIEW" : "MISSING_CHECKOUT",
      };
    }));

    return sessions.filter((session): session is NonNullable<typeof session> => session !== null)
      .sort((a, b) => a.workDate.localeCompare(b.workDate) || a.employeeName.localeCompare(b.employeeName));
  },
});

/**
 * Admin correction for a verified historical session that has no checkout.
 * Original punches are retained; a system-generated checkout and audit entry
 * are appended. The administrator must supply the verified actual time.
 */
export const resolveOpenSession = mutation({
  args: {
    employeeId: v.id("employees"),
    expectedLastEventId: v.id("attendanceEvents"),
    checkoutAt: v.number(),
    breakEndAt: v.optional(v.number()),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    const reviewer = await requireRole(ctx, ["admin", "superadmin"]);
    const employee = await ctx.db.get(args.employeeId);
    if (!employee || employee.organizationId !== reviewer.organizationId) throw new Error("EMPLOYEE_NOT_FOUND");
    const organization = await ctx.db.get(reviewer.organizationId);
    if (!organization) throw new Error("ORGANIZATION_NOT_FOUND");

    const now = Date.now();
    if (!Number.isFinite(args.checkoutAt) || args.checkoutAt <= 0 || args.checkoutAt > now) throw new Error("INVALID_CORRECTION_TIME");
    const note = args.note.trim();
    if (note.length < 3) throw new Error("CORRECTION_NOTE_REQUIRED");

    const today = new Intl.DateTimeFormat("en-CA", { timeZone: organization.timezone }).format(new Date(now));
    const todayStart = localDateTimeUtc(today, 0, organization.timezone);
    const latest = await ctx.db.query("attendanceEvents")
      .withIndex("by_employee_time", q => q.eq("employeeId", employee._id).lt("receivedAt", todayStart))
      .filter(q => q.neq(q.field("reviewStatus"), "rejected"))
      .order("desc")
      .first();
    if (!latest || latest._id !== args.expectedLastEventId) throw new Error("ATTENDANCE_SESSION_CHANGED_REFRESH");
    if (latest.organizationId !== reviewer.organizationId || latest.eventType === "check_out") throw new Error("ATTENDANCE_SESSION_ALREADY_CLOSED");

    const workDate = new Intl.DateTimeFormat("en-CA", { timeZone: organization.timezone }).format(new Date(latest.receivedAt));
    const dayStart = localDateTimeUtc(workDate, 0, organization.timezone);
    const dayEnd = localDateTimeUtc(workDate, 1440, organization.timezone);
    if (args.checkoutAt <= latest.receivedAt || args.checkoutAt < dayStart || args.checkoutAt >= dayEnd || args.checkoutAt >= todayStart) {
      throw new Error("CORRECTION_TIME_OUTSIDE_ATTENDANCE_DAY");
    }

    const dayEvents = await ctx.db.query("attendanceEvents")
      .withIndex("by_employee_time", q => q.eq("employeeId", employee._id).gte("receivedAt", dayStart).lt("receivedAt", dayEnd))
      .collect();
    if (dayEvents.some(event => event.reviewStatus === "pending")) throw new Error("ATTENDANCE_REVIEW_MUST_BE_RESOLVED_FIRST");
    const latestDayEvent = [...dayEvents].filter(event => event.reviewStatus !== "rejected").sort((a, b) => b.receivedAt - a.receivedAt)[0];
    if (!latestDayEvent || latestDayEvent._id !== latest._id) throw new Error("ATTENDANCE_SESSION_CHANGED_REFRESH");

    if (latest.eventType === "break_start") {
      if (!Number.isFinite(args.breakEndAt) || args.breakEndAt! < latest.receivedAt || args.breakEndAt! >= args.checkoutAt) {
        throw new Error("VALID_BREAK_END_TIME_REQUIRED");
      }
    } else if (latest.eventType !== "check_in" && latest.eventType !== "break_end") {
      throw new Error("ATTENDANCE_SESSION_NOT_CORRECTABLE");
    } else if (args.breakEndAt !== undefined) {
      throw new Error("UNEXPECTED_BREAK_END_TIME");
    }

    const location = await ctx.db.get(latest.locationId);
    if (!location || location.organizationId !== reviewer.organizationId) throw new Error("LOCATION_NOT_FOUND");
    const locationType = latest.locationType ?? "physical";
    const base = {
      organizationId: reviewer.organizationId,
      employeeId: employee._id,
      locationId: location._id,
      locationType,
      clientTimestamp: args.checkoutAt,
      systemGenerated: true,
      systemGeneratedReason: "Administrator attendance correction: " + note,
    };

    if (latest.eventType === "break_start") {
      await ctx.db.insert("attendanceEvents", {
        ...base,
        clientTimestamp: args.breakEndAt!,
        eventType: "break_end",
        receivedAt: args.breakEndAt!,
        idempotencyKey: "admin-session-correction:" + String(latest._id) + ":break-end",
      });
    }
    const checkoutId = await ctx.db.insert("attendanceEvents", {
      ...base,
      eventType: "check_out",
      receivedAt: args.checkoutAt,
      idempotencyKey: "admin-session-correction:" + String(latest._id) + ":check-out",
    });

    await refreshDay(ctx, { ...latest, receivedAt: args.checkoutAt }, organization);
    await ctx.db.insert("auditLogs", {
      organizationId: reviewer.organizationId,
      actorUserId: reviewer._id,
      action: "attendance.admin_session_correction",
      entityType: "attendanceEvent",
      entityId: String(checkoutId),
      metadata: {
        employeeId: String(employee._id),
        employeeCode: employee.employeeCode,
        workDate,
        previousEventId: String(latest._id),
        checkoutAt: args.checkoutAt,
        breakEndAt: args.breakEndAt ?? null,
        note,
      },
      createdAt: now,
    });
    return { resolved: true, checkoutEventId: checkoutId, workDate };
  },
});
