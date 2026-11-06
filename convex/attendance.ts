import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
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
    if (latest?.eventType === "check_in" && latest.reviewStatus === "pending") throw new Error("ATTENDANCE_REVIEW_PENDING");

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
    const events = await ctx.db.query("attendanceEvents")
      .withIndex("by_org_time", q => q.eq("organizationId", reviewer.organizationId))
      .order("desc").take(200);
    const pending = events.filter(event => event.reviewStatus === "pending" && event.exceptionCode === "OUTSIDE_GEOFENCE");
    return Promise.all(pending.map(async event => {
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
