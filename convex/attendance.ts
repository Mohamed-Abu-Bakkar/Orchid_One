import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { requireIdentity, requireRole } from "./lib/auth";

const EARTH_RADIUS_M = 6_371_000;
function distanceMeters(aLat: number, aLon: number, bLat: number, bLon: number) {
  const rad = (n: number) => n * Math.PI / 180;
  const dLat = rad(bLat - aLat), dLon = rad(bLon - aLon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export const recordPunch = mutation({
  args: {
    eventType: v.union(v.literal("check_in"), v.literal("check_out"), v.literal("break_start"), v.literal("break_end")),
    latitude: v.number(), longitude: v.number(), accuracyM: v.number(),
    clientTimestamp: v.number(), idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireIdentity(ctx);
    if (!user.employeeId) throw new Error("EMPLOYEE_PROFILE_REQUIRED");
    const employee = await ctx.db.get(user.employeeId);
    if (!employee || employee.organizationId !== user.organizationId || employee.status !== "active") throw new Error("EMPLOYEE_INACTIVE");
    const location = await ctx.db.get(employee.locationId);
    if (!location || location.organizationId !== user.organizationId || !location.isActive) throw new Error("LOCATION_UNAVAILABLE");
    if (!Number.isFinite(args.latitude) || args.latitude < -90 || args.latitude > 90 || !Number.isFinite(args.longitude) || args.longitude < -180 || args.longitude > 180) throw new Error("INVALID_GPS_COORDINATES");
    if (!Number.isFinite(location.geofenceRadiusM) || location.geofenceRadiusM <= 0) throw new Error("GEOFENCE_NOT_CONFIGURED");
    if (!Number.isFinite(args.accuracyM) || args.accuracyM <= 0 || args.accuracyM > 1000) throw new Error("INVALID_GPS_ACCURACY");
    if (!Number.isFinite(args.clientTimestamp) || args.clientTimestamp <= 0 || !args.idempotencyKey.trim()) throw new Error("INVALID_PUNCH_REQUEST");

    const existing = await ctx.db.query("attendanceEvents")
      .withIndex("by_idempotency", q => q.eq("idempotencyKey", args.idempotencyKey)).unique();
    if (existing) {
      if (existing.organizationId !== user.organizationId || existing.employeeId !== employee._id) throw new Error("IDEMPOTENCY_KEY_CONFLICT");
      return { eventId: existing._id, duplicate: true, geofencePassed: existing.geofencePassed, requiresReview: existing.reviewStatus === "pending" };
    }

    const latest = await ctx.db.query("attendanceEvents")
      .withIndex("by_employee_time", q => q.eq("employeeId", employee._id)).order("desc").first();
    if (latest?.reviewStatus === "pending") throw new Error("ATTENDANCE_REVIEW_PENDING");

    const distance = distanceMeters(location.latitude, location.longitude, args.latitude, args.longitude);
    const geofencePassed = distance <= location.geofenceRadiusM;
    const now = Date.now();
    const reviewStatus = geofencePassed ? undefined : "pending" as const;
    const eventId = await ctx.db.insert("attendanceEvents", {
      organizationId: user.organizationId, employeeId: employee._id, locationId: location._id, eventType: args.eventType,
      latitude: args.latitude, longitude: args.longitude, accuracyM: args.accuracyM, clientTimestamp: args.clientTimestamp,
      receivedAt: now, geofencePassed, exceptionCode: geofencePassed ? undefined : "OUTSIDE_GEOFENCE",
      reviewStatus, idempotencyKey: args.idempotencyKey,
    });
    await ctx.db.insert("auditLogs", {
      organizationId: user.organizationId, actorUserId: user._id, action: "attendance.punch",
      entityType: "attendanceEvent", entityId: String(eventId),
      metadata: { eventType: args.eventType, geofencePassed, distanceM: Math.round(distance), reviewStatus: reviewStatus ?? "not_required" },
      createdAt: now,
    });
    return { eventId, duplicate: false, geofencePassed, distanceM: Math.round(distance), requiresReview: !geofencePassed };
  },
});

export const pendingGeofenceExceptions = query({
  args: {},
  handler: async (ctx) => {
    const reviewer = await requireRole(ctx, ["supervisor", "superadmin"]);
    const pending = await ctx.db.query("attendanceEvents")
      .withIndex("by_org_review_time", q => q.eq("organizationId", reviewer.organizationId).eq("reviewStatus", "pending"))
      .order("desc").collect();
    const exceptions = pending.filter(event => event.exceptionCode === "OUTSIDE_GEOFENCE");
    return Promise.all(exceptions.map(async event => {
      const [employee, location] = await Promise.all([ctx.db.get(event.employeeId), ctx.db.get(event.locationId)]);
      return {
        _id: event._id, eventType: event.eventType, latitude: event.latitude, longitude: event.longitude,
        accuracyM: event.accuracyM, clientTimestamp: event.clientTimestamp, receivedAt: event.receivedAt,
        employeeName: employee ? [employee.firstName, employee.lastName].filter(Boolean).join(" ") : "Unknown employee",
        employeeCode: employee?.employeeCode ?? "—", locationName: location?.name ?? "Unknown location",
      };
    }));
  },
});

export const reviewGeofenceException = mutation({
  args: {
    eventId: v.id("attendanceEvents"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const reviewer = await requireRole(ctx, ["supervisor", "superadmin"]);
    const event = await ctx.db.get(args.eventId);
    if (!event || event.organizationId !== reviewer.organizationId) throw new Error("ATTENDANCE_EVENT_NOT_FOUND");
    if (event.exceptionCode !== "OUTSIDE_GEOFENCE" || event.geofencePassed) throw new Error("NOT_A_GEOFENCE_EXCEPTION");
    if (event.reviewStatus !== "pending") throw new Error("EXCEPTION_ALREADY_REVIEWED");
    const now = Date.now();
    await ctx.db.patch(event._id, {
      reviewStatus: args.decision,
      reviewedBy: reviewer._id,
      reviewedAt: now,
      reviewNote: args.note?.trim() || undefined,
    });
    await ctx.db.insert("auditLogs", {
      organizationId: reviewer.organizationId, actorUserId: reviewer._id,
      action: args.decision === "approved" ? "attendance.geofence_exception.approved" : "attendance.geofence_exception.rejected",
      entityType: "attendanceEvent", entityId: String(event._id),
      metadata: { employeeId: String(event.employeeId), eventType: event.eventType, note: args.note?.trim() || null },
      createdAt: now,
    });
    return { reviewed: true, decision: args.decision };
  },
});

export const myRecentEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const user = await requireIdentity(ctx);
    if (!user.employeeId) return [];
    return ctx.db.query("attendanceEvents")
      .withIndex("by_employee_time", q => q.eq("employeeId", user.employeeId!))
      .order("desc").take(Math.min(Math.max(limit ?? 20, 1), 50));
  },
});


function localDateStartUtc(date: string, timeZone: string): number {
  const [year, month, day] = date.split("-").map(Number);
  let guess = Date.UTC(year, month - 1, day);
  for (let attempt = 0; attempt < 3; attempt++) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date(guess));
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const represented = Date.UTC(
      Number(values.year), Number(values.month) - 1, Number(values.day),
      Number(values.hour), Number(values.minute), Number(values.second),
    );
    const target = Date.UTC(year, month - 1, day);
    const difference = represented - target;
    if (difference === 0) break;
    guess -= difference;
  }
  return guess;
}

function nextDate(date: string): string {
  const value = new Date(date + "T00:00:00Z");
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

/** Organization-scoped event register. It reports recorded events, not inferred absences or wage calculations. */
export const adminRegister = query({
  args: {
    fromDate: v.string(),
    toDate: v.string(),
    employeeId: v.optional(v.id("employees")),
  },
  handler: async (ctx, args) => {
    const admin = await requireRole(ctx, ["supervisor", "superadmin"]);
    const validDate = (value: string) => /^\\d{4}-\\d{2}-\\d{2}$/.test(value) && new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value;
    if (!validDate(args.fromDate) || !validDate(args.toDate) || args.fromDate > args.toDate) throw new Error("INVALID_ATTENDANCE_DATE_RANGE");
    const span = (Date.parse(args.toDate + "T00:00:00Z") - Date.parse(args.fromDate + "T00:00:00Z")) / 86400000;
    if (span > 30) throw new Error("ATTENDANCE_RANGE_LIMIT_31_DAYS");
    const organization = await ctx.db.get(admin.organizationId);
    if (!organization) throw new Error("ORGANIZATION_NOT_FOUND");
    if (args.employeeId) {
      const employee = await ctx.db.get(args.employeeId);
      if (!employee || employee.organizationId !== admin.organizationId) throw new Error("EMPLOYEE_NOT_FOUND");
    }
    const startAt = localDateStartUtc(args.fromDate, organization.timezone);
    const endAt = localDateStartUtc(nextDate(args.toDate), organization.timezone);
    const [events, scheduledShifts] = await Promise.all([ctx.db.query("attendanceEvents")
      .withIndex("by_org_time", q => q.eq("organizationId", admin.organizationId).gte("receivedAt", startAt).lt("receivedAt", endAt))
      .order("desc")
      .collect(), ctx.db.query("shiftAssignments")
      .withIndex("by_org_date", q => q.eq("organizationId", admin.organizationId).gte("workDate", args.fromDate).lte("workDate", args.toDate))
      .collect()]);
    const filtered = args.employeeId ? events.filter(event => event.employeeId === args.employeeId) : events;
    const employeeIds = [...new Set(filtered.map(event => String(event.employeeId)))];
    const employeeMap = new Map<string, any>();
    await Promise.all(employeeIds.map(async id => {
      const employee = await ctx.db.get(id as Id<"employees">);
      if (employee && employee.organizationId === admin.organizationId) employeeMap.set(id, employee);
    }));
    const locationIds = [...new Set(filtered.map(event => String(event.locationId)))];
    const locationMap = new Map<string, string>();
    await Promise.all(locationIds.map(async id => {
      const location = await ctx.db.get(id as Id<"locations">);
      if (location && location.organizationId === admin.organizationId) locationMap.set(id, location.name);
    }));
    const shiftMap = new Map<string, any[]>();
    await Promise.all(scheduledShifts.map(async assignment => {
      const shift = await ctx.db.get(assignment.shiftId);
      if (!shift || shift.organizationId !== admin.organizationId) return;
      const key = String(assignment.employeeId) + ":" + assignment.workDate;
      const current = shiftMap.get(key) ?? [];
      current.push({ name: shift.name, startMinute: shift.startMinute, endMinute: shift.endMinute });
      shiftMap.set(key, current);
    }));
    const groups = new Map<string, any>();
    for (const event of filtered) {
      const employee = employeeMap.get(String(event.employeeId));
      if (!employee) continue;
      const workDate = new Intl.DateTimeFormat("en-CA", { timeZone: organization.timezone }).format(new Date(event.receivedAt));
      const key = String(event.employeeId) + ":" + workDate;
      let row = groups.get(key);
      if (!row) {
        row = {
          id: key,
          employeeId: event.employeeId,
          employeeName: [employee.firstName, employee.lastName].filter(Boolean).join(" "),
          employeeCode: employee.employeeCode,
          departmentId: employee.departmentId,
          locationName: locationMap.get(String(event.locationId)) ?? "Unknown location",
          scheduledShifts: shiftMap.get(key) ?? [],
          workDate,
          firstCheckInAt: null as number | null,
          lastCheckOutAt: null as number | null,
          eventCount: 0,
          pendingReviews: 0,
          rejectedEvents: 0,
          outsideGeofenceEvents: 0,
          events: [] as any[],
        };
        groups.set(key, row);
      }
      row.eventCount++;
      if (event.eventType === "check_in" && (row.firstCheckInAt === null || event.receivedAt < row.firstCheckInAt)) row.firstCheckInAt = event.receivedAt;
      if (event.eventType === "check_out" && (row.lastCheckOutAt === null || event.receivedAt > row.lastCheckOutAt)) row.lastCheckOutAt = event.receivedAt;
      if (event.reviewStatus === "pending") row.pendingReviews++;
      if (event.reviewStatus === "rejected") row.rejectedEvents++;
      if (!event.geofencePassed) row.outsideGeofenceEvents++;
      row.events.push({
        _id: event._id,
        eventType: event.eventType,
        receivedAt: event.receivedAt,
        clientTimestamp: event.clientTimestamp,
        geofencePassed: event.geofencePassed,
        reviewStatus: event.reviewStatus ?? "not_required",
        exceptionCode: event.exceptionCode ?? null,
        accuracyM: event.accuracyM,
        locationName: locationMap.get(String(event.locationId)) ?? "Unknown location",
      });
    }
    const rows = [...groups.values()].map(row => ({
      ...row,
      status: row.pendingReviews ? "pending_review" : row.rejectedEvents ? "rejected" : row.firstCheckInAt !== null ? "present" : "event_recorded",
      events: row.events.sort((a: any, b: any) => a.receivedAt - b.receivedAt),
    })).sort((a, b) => b.workDate.localeCompare(a.workDate) || a.employeeName.localeCompare(b.employeeName));
    return {
      fromDate: args.fromDate,
      toDate: args.toDate,
      timezone: organization.timezone,
      totalEvents: filtered.length,
      recordedDays: rows.length,
      pendingReviews: rows.reduce((sum, row) => sum + row.pendingReviews, 0),
      outsideGeofenceEvents: rows.reduce((sum, row) => sum + row.outsideGeofenceEvents, 0),
      rows,
    };
  },
});
