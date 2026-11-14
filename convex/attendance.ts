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


function localDateTimeUtc(date: string, minuteOfDay: number, timeZone: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const target = Date.UTC(year, month - 1, day, Math.floor(minuteOfDay / 60), minuteOfDay % 60);
  let guess = target;
  for (let attempt = 0; attempt < 4; attempt++) {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", second:"2-digit", hourCycle:"h23" }).formatToParts(new Date(guess));
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const represented = Date.UTC(Number(values.year), Number(values.month)-1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second));
    const difference = represented - target;
    if (!difference) break;
    guess -= difference;
  }
  return guess;
}

async function refreshAttendanceDay(ctx: any, employee: any, organization: any, workDate: string) {
  const start = localDateTimeUtc(workDate, 0, organization.timezone);
  const end = localDateTimeUtc(workDate, 1440, organization.timezone);
  const events = await ctx.db.query("attendanceEvents")
    .withIndex("by_employee_time", (q: any) => q.eq("employeeId", employee._id).gte("receivedAt", start).lt("receivedAt", end))
    .collect();
  events.sort((a: any, b: any) => a.receivedAt - b.receivedAt);
  let openIn: number | null = null, openBreak: number | null = null, workMs = 0, breakMs = 0, incomplete = false;
  for (const event of events) {
    if (event.reviewStatus === "rejected") continue;
    if (event.eventType === "check_in") {
      if (openIn !== null) incomplete = true; else openIn = event.receivedAt;
    } else if (event.eventType === "check_out") {
      if (openIn === null) incomplete = true;
      else { workMs += Math.max(0, event.receivedAt - openIn); openIn = null; }
    } else if (event.eventType === "break_start") {
      if (openBreak !== null || openIn === null) incomplete = true; else openBreak = event.receivedAt;
    } else if (event.eventType === "break_end") {
      if (openBreak === null) incomplete = true;
      else { breakMs += Math.max(0, event.receivedAt - openBreak); openBreak = null; }
    }
  }
  if (openIn !== null || openBreak !== null) incomplete = true;
  const pending = events.some((event: any) => event.reviewStatus === "pending");
  const firstCheckInAt = events.find((event: any) => event.eventType === "check_in" && event.reviewStatus !== "rejected")?.receivedAt;
  const lastCheckOutAt = [...events].reverse().find((event: any) => event.eventType === "check_out" && event.reviewStatus !== "rejected")?.receivedAt;
  const existing = await ctx.db.query("attendanceDays").withIndex("by_employee_date", (q: any) => q.eq("employeeId", employee._id).eq("workDate", workDate)).first();
  const values = {
    organizationId: employee.organizationId, employeeId: employee._id, workDate,
    firstCheckInAt, lastCheckOutAt,
    payableMinutes: incomplete || pending ? 0 : Math.max(0, Math.floor((workMs - breakMs) / 60000)),
    breakMinutes: Math.floor(breakMs / 60000),
    status: pending ? "pending_review" : events.some((event: any) => event.reviewStatus === "rejected") ? "exception" : "present",
    updatedAt: Date.now(),
  };
  if (existing) await ctx.db.patch(existing._id, values); else await ctx.db.insert("attendanceDays", values);
  return { events, incomplete, pending };
}

async function createDetectedOvertime(ctx: any, employee: any, organization: any, workDate: string, events: any[]) {
  if (employee.employmentType !== "hourly") return null;
  const prior = await ctx.db.query("overtimeRequests").withIndex("by_employee_date", (q: any) => q.eq("employeeId", employee._id).eq("workDate", workDate)).collect();
  if (prior.length) return null;
  const assignments = await ctx.db.query("shiftAssignments").withIndex("by_employee_date", (q: any) => q.eq("employeeId", employee._id).eq("workDate", workDate)).collect();
  if (assignments.length > 1) return null;
  const shiftId = assignments[0]?.shiftId ?? employee.defaultShiftId;
  if (!shiftId) return null;
  const shift = await ctx.db.get(shiftId);
  if (!shift || shift.organizationId !== employee.organizationId || !shift.isActive) return null;
  // Overnight shifts need an explicit work-date attribution policy; do not guess their overtime.
  if (shift.endMinute <= shift.startMinute || shift.endMinute > 1440 || shift.endMinute < 0) return null;
  const shiftEndAt = localDateTimeUtc(workDate, shift.endMinute, organization.timezone);
  const accepted = events.filter(event => event.locationType === "remote" || event.geofencePassed === true || event.reviewStatus === "approved");
  accepted.sort((a, b) => a.receivedAt - b.receivedAt);
  let openIn: number | null = null, openBreak: number | null = null, extraMs = 0;
  for (const event of accepted) {
    if (event.eventType === "check_in") openIn = event.receivedAt;
    else if (event.eventType === "check_out" && openIn !== null) {
      const from = Math.max(openIn, shiftEndAt), to = event.receivedAt;
      if (to > from) extraMs += to - from;
      openIn = null;
    } else if (event.eventType === "break_start") openBreak = event.receivedAt;
    else if (event.eventType === "break_end" && openBreak !== null) {
      const from = Math.max(openBreak, shiftEndAt), to = event.receivedAt;
      if (to > from) extraMs -= to - from;
      openBreak = null;
    }
  }
  const detectedMinutes = Math.max(0, Math.floor(extraMs / 60000));
  if (!detectedMinutes) return null;
  const id = await ctx.db.insert("overtimeRequests", {
    organizationId: employee.organizationId, employeeId: employee._id, workDate,
    requestedMinutes: detectedMinutes, detectedMinutes, shiftEndAt,
    reason: "Automatically detected from verified attendance after the assigned shift",
    status: "awaiting_employee_confirmation", createdAt: Date.now(),
  });
  return id;
}

export const recordPunch = mutation({
  args: {
    eventType: v.union(v.literal("check_in"), v.literal("check_out"), v.literal("break_start"), v.literal("break_end")),
    latitude: v.optional(v.number()), longitude: v.optional(v.number()), accuracyM: v.optional(v.number()),
    clientTimestamp: v.number(), idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireIdentity(ctx);
    if (!user.employeeId) throw new Error("EMPLOYEE_PROFILE_REQUIRED");
    const employee = await ctx.db.get(user.employeeId);
    if (!employee || employee.organizationId !== user.organizationId || employee.status !== "active") throw new Error("EMPLOYEE_INACTIVE");
    const location = await ctx.db.get(employee.locationId);
    if (!location || location.organizationId !== user.organizationId || !location.isActive) throw new Error("LOCATION_UNAVAILABLE");
    const locationType = location.locationType ?? "physical";
    const hasAnyGps = args.latitude !== undefined || args.longitude !== undefined || args.accuracyM !== undefined;
    const hasCompleteGps = args.latitude !== undefined && args.longitude !== undefined && args.accuracyM !== undefined;
    if (locationType === "physical") {
      if (!hasCompleteGps) throw new Error("GPS_REQUIRED_FOR_PHYSICAL_LOCATION");
      if (!Number.isFinite(args.latitude) || args.latitude! < -90 || args.latitude! > 90 || !Number.isFinite(args.longitude) || args.longitude! < -180 || args.longitude! > 180) throw new Error("INVALID_GPS_COORDINATES");
      if (!Number.isFinite(location.geofenceRadiusM) || location.geofenceRadiusM <= 0) throw new Error("GEOFENCE_NOT_CONFIGURED");
      if (!Number.isFinite(args.accuracyM) || args.accuracyM! <= 0 || args.accuracyM! > 1000) throw new Error("INVALID_GPS_ACCURACY");
    } else if (hasAnyGps && !hasCompleteGps) {
      throw new Error("INCOMPLETE_GPS_READING");
    } else if (hasCompleteGps) {
      if (!Number.isFinite(args.latitude) || args.latitude! < -90 || args.latitude! > 90 || !Number.isFinite(args.longitude) || args.longitude! < -180 || args.longitude! > 180) throw new Error("INVALID_GPS_COORDINATES");
      if (!Number.isFinite(args.accuracyM) || args.accuracyM! <= 0 || args.accuracyM! > 1000) throw new Error("INVALID_GPS_ACCURACY");
    }
    if (!Number.isFinite(args.clientTimestamp) || args.clientTimestamp <= 0 || !args.idempotencyKey.trim()) throw new Error("INVALID_PUNCH_REQUEST");

    const existing = await ctx.db.query("attendanceEvents")
      .withIndex("by_idempotency", q => q.eq("idempotencyKey", args.idempotencyKey)).unique();
    if (existing) {
      if (existing.organizationId !== user.organizationId || existing.employeeId !== employee._id) throw new Error("IDEMPOTENCY_KEY_CONFLICT");
      return { eventId: existing._id, duplicate: true, locationType: existing.locationType ?? "physical", geofencePassed: existing.geofencePassed, requiresReview: existing.reviewStatus === "pending" };
    }

    const latest = await ctx.db.query("attendanceEvents")
      .withIndex("by_employee_time", q => q.eq("employeeId", employee._id)).order("desc").first();
    if (latest?.reviewStatus === "pending") throw new Error("ATTENDANCE_REVIEW_PENDING");
    const organization = await ctx.db.get(user.organizationId);
    if (!organization) throw new Error("ORGANIZATION_NOT_FOUND");
    const localToday = new Intl.DateTimeFormat("en-CA", { timeZone: organization.timezone }).format(new Date());
    const todayEvents = await ctx.db.query("attendanceEvents")
      .withIndex("by_employee_time", q => q.eq("employeeId", employee._id))
      .order("desc").take(100);
    const latestToday = todayEvents.find(event =>
      new Intl.DateTimeFormat("en-CA", { timeZone: organization.timezone }).format(new Date(event.receivedAt)) === localToday &&
      (event.locationType === "remote" || event.geofencePassed === true || event.reviewStatus === "approved")
    );
    const activeSession = Boolean(latestToday && latestToday.eventType !== "check_out");
    if (args.eventType === "check_in" && activeSession) throw new Error("ALREADY_CHECKED_IN");
    if (args.eventType === "break_start" && (!activeSession || latestToday?.eventType === "break_start")) throw new Error("BREAK_NOT_AVAILABLE");
    if (args.eventType === "break_end" && latestToday?.eventType !== "break_start") throw new Error("NO_ACTIVE_BREAK");
    if (args.eventType === "check_out" && (!activeSession || latestToday?.eventType === "break_start")) throw new Error(latestToday?.eventType === "break_start" ? "END_BREAK_BEFORE_CHECKOUT" : "NOT_CHECKED_IN");

    const distance = locationType === "physical"
      ? distanceMeters(location.latitude, location.longitude, args.latitude!, args.longitude!)
      : null;
    const geofencePassed = locationType === "physical" ? distance! <= location.geofenceRadiusM : undefined;
    const now = Date.now();
    const reviewStatus = geofencePassed === false ? "pending" as const : undefined;
    const eventId = await ctx.db.insert("attendanceEvents", {
      organizationId: user.organizationId, employeeId: employee._id, locationId: location._id, eventType: args.eventType,
      locationType, latitude: args.latitude, longitude: args.longitude, accuracyM: args.accuracyM, clientTimestamp: args.clientTimestamp,
      receivedAt: now, geofencePassed, exceptionCode: geofencePassed === false ? "OUTSIDE_GEOFENCE" : undefined,
      reviewStatus, idempotencyKey: args.idempotencyKey,
    });
    await ctx.db.insert("auditLogs", {
      organizationId: user.organizationId, actorUserId: user._id, action: "attendance.punch",
      entityType: "attendanceEvent", entityId: String(eventId),
      metadata: { eventType: args.eventType, locationType, geofencePassed: geofencePassed ?? null, distanceM: distance === null ? null : Math.round(distance), gpsCaptured: hasCompleteGps, reviewStatus: reviewStatus ?? "not_required" },
      createdAt: now,
    });
    const workDate = new Intl.DateTimeFormat("en-CA", { timeZone: organization.timezone }).format(new Date(now));
    const refreshed = await refreshAttendanceDay(ctx, employee, organization, workDate);
    const overtimeRequestId = args.eventType === "check_out" && !refreshed.pending && !refreshed.incomplete
      ? await createDetectedOvertime(ctx, employee, organization, workDate, refreshed.events)
      : null;
    if (overtimeRequestId) await ctx.db.insert("auditLogs", {
      organizationId: user.organizationId, actorUserId: user._id, action: "overtime.auto_detected",
      entityType: "overtimeRequest", entityId: String(overtimeRequestId),
      metadata: { workDate, employeeCode: employee.employeeCode }, createdAt: now,
    });
    return { eventId, duplicate: false, locationType, geofencePassed, distanceM: distance === null ? null : Math.round(distance), requiresReview: reviewStatus === "pending", overtimeRequestId };
  },
});

export const pendingGeofenceExceptions = query({
  args: {},
  handler: async (ctx) => {
    const reviewer = await requireRole(ctx, ["supervisor", "superadmin", "admin"]);
    const pending = await ctx.db.query("attendanceEvents")
      .withIndex("by_org_review_time", q => q.eq("organizationId", reviewer.organizationId).eq("reviewStatus", "pending"))
      .order("desc").collect();
    const exceptions = pending.filter(event => event.exceptionCode === "OUTSIDE_GEOFENCE");
    return Promise.all(exceptions.map(async event => {
      const [employee, location] = await Promise.all([ctx.db.get(event.employeeId), ctx.db.get(event.locationId)]);
      return {
        _id: event._id, eventType: event.eventType, latitude: event.latitude, longitude: event.longitude,
        supervisorRecommendation: event.supervisorRecommendation, supervisorNote: event.supervisorNote,
        accuracyM: event.accuracyM, clientTimestamp: event.clientTimestamp, receivedAt: event.receivedAt,
        employeeName: employee ? [employee.firstName, employee.lastName].filter(Boolean).join(" ") : "Unknown employee",
        employeeCode: employee?.employeeCode ?? "—",
        locationName: location?.name ?? "Unknown location",
        locationAddress: location?.address ?? "",
        workplaceLatitude: location?.latitude ?? null,
        workplaceLongitude: location?.longitude ?? null,
        geofenceRadiusM: location?.geofenceRadiusM ?? null,
        distanceFromWorkplaceM: location && event.latitude !== undefined && event.longitude !== undefined
          ? Math.round(distanceMeters(location.latitude, location.longitude, event.latitude, event.longitude))
          : null,
      };
    }));
  },
});

export const reviewGeofenceException = mutation({
  args: { eventId: v.id("attendanceEvents"), decision: v.union(v.literal("approved"), v.literal("rejected")), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const reviewer = await requireRole(ctx, ["supervisor"]);
    const event = await ctx.db.get(args.eventId);
    if (!event || event.organizationId !== reviewer.organizationId) throw new Error("ATTENDANCE_EVENT_NOT_FOUND");
    if (event.exceptionCode !== "OUTSIDE_GEOFENCE" || event.geofencePassed || event.reviewStatus !== "pending") throw new Error("EXCEPTION_NOT_REVIEWABLE");
    const note = args.note?.trim();
    if (args.decision === "rejected" && !note) throw new Error("REJECTION_REASON_REQUIRED");
    await ctx.db.patch(event._id, { supervisorRecommendation: args.decision, supervisorReviewedBy: reviewer._id, supervisorReviewedAt: Date.now(), supervisorNote: note || undefined });
    await ctx.db.insert("auditLogs", { organizationId: reviewer.organizationId, actorUserId: reviewer._id, action: "attendance.geofence_exception.recommended", entityType: "attendanceEvent", entityId: String(event._id), metadata: { recommendation: args.decision, note: note || null }, createdAt: Date.now() });
    return { recommended: true, decision: args.decision };
  },
});

export const finalizeGeofenceException = mutation({
  args: { eventId: v.id("attendanceEvents"), decision: v.union(v.literal("approved"), v.literal("rejected")), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const admin = await requireRole(ctx, ["superadmin", "admin"]);
    const event = await ctx.db.get(args.eventId);
    if (!event || event.organizationId !== admin.organizationId) throw new Error("ATTENDANCE_EVENT_NOT_FOUND");
    if (event.reviewStatus !== "pending" || !event.supervisorRecommendation) throw new Error("SUPERVISOR_REVIEW_REQUIRED");
    const note = args.note?.trim();
    if (args.decision === "rejected" && !note) throw new Error("REJECTION_REASON_REQUIRED");
    await ctx.db.patch(event._id, { reviewStatus: args.decision, reviewedBy: admin._id, reviewedAt: Date.now(), reviewNote: note || undefined });
    const employee = await ctx.db.get(event.employeeId);
    const organization = await ctx.db.get(admin.organizationId);
    if (employee && organization) {
      const workDate = new Intl.DateTimeFormat("en-CA", { timeZone: organization.timezone }).format(new Date(event.receivedAt));
      const refreshed = await refreshAttendanceDay(ctx, employee, organization, workDate);
      if (args.decision === "approved" && event.eventType === "check_out" && !refreshed.pending && !refreshed.incomplete) {
        const overtimeRequestId = await createDetectedOvertime(ctx, employee, organization, workDate, refreshed.events);
        if (overtimeRequestId) await ctx.db.insert("auditLogs", { organizationId: admin.organizationId, actorUserId: admin._id, action: "overtime.auto_detected", entityType: "overtimeRequest", entityId: String(overtimeRequestId), metadata: { workDate, employeeCode: employee.employeeCode, source: "geofence_review" }, createdAt: Date.now() });
      }
    }
    await ctx.db.insert("auditLogs", { organizationId: admin.organizationId, actorUserId: admin._id, action: args.decision === "approved" ? "attendance.geofence_exception.approved" : "attendance.geofence_exception.rejected", entityType: "attendanceEvent", entityId: String(event._id), metadata: { supervisorRecommendation: event.supervisorRecommendation, supervisorNote: event.supervisorNote || null, note: note || null }, createdAt: Date.now() });
    return { finalized: true, decision: args.decision };
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
    const admin = await requireRole(ctx, ["supervisor", "superadmin", "admin"]);
    const validDate = (value: string) => {
      if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) return false;
      const parsed = new Date(value + "T00:00:00Z");
      return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
    };
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
    const [events, scheduledShifts, attendanceDays] = await Promise.all([
      args.employeeId
        ? ctx.db.query("attendanceEvents")
            .withIndex("by_employee_time", q => q.eq("employeeId", args.employeeId!).gte("receivedAt", startAt).lt("receivedAt", endAt))
            .order("desc").take(5001)
        : ctx.db.query("attendanceEvents")
            .withIndex("by_org_time", q => q.eq("organizationId", admin.organizationId).gte("receivedAt", startAt).lt("receivedAt", endAt))
            .order("desc").take(5001),
      ctx.db.query("shiftAssignments")
        .withIndex("by_org_date", q => q.eq("organizationId", admin.organizationId).gte("workDate", args.fromDate).lte("workDate", args.toDate))
        .take(5001),
      args.employeeId
        ? ctx.db.query("attendanceDays")
            .withIndex("by_employee_date", q => q.eq("employeeId", args.employeeId!).gte("workDate", args.fromDate).lte("workDate", args.toDate))
            .take(5001)
        : ctx.db.query("attendanceDays")
            .withIndex("by_org_date", q => q.eq("organizationId", admin.organizationId).gte("workDate", args.fromDate).lte("workDate", args.toDate))
            .take(5001),
    ]);
    const hasMoreEvents = events.length > 5000;
    const hasMoreSchedules = scheduledShifts.length > 5000;
    const hasMoreDays = attendanceDays.length > 5000;
    const filtered = events.slice(0, 5000);
    const attendanceDayWindow = attendanceDays.slice(0, 5000);
    const filteredDays = args.employeeId ? attendanceDayWindow.filter(day => day.employeeId === args.employeeId) : attendanceDayWindow;
    const employeeIds = [...new Set([...filtered.map(event => String(event.employeeId)), ...filteredDays.map(day => String(day.employeeId))])];
    const employeeMap = new Map<string, any>();
    await Promise.all(employeeIds.map(async id => {
      const employee = await ctx.db.get(id as Id<"employees">);
      if (employee && employee.organizationId === admin.organizationId) employeeMap.set(id, employee);
    }));
    const locationIds = [...new Set([...filtered.map(event => String(event.locationId)), ...[...employeeMap.values()].map(employee => String(employee.locationId))])];
    const locationMap = new Map<string, string>();
    await Promise.all(locationIds.map(async id => {
      const location = await ctx.db.get(id as Id<"locations">);
      if (location && location.organizationId === admin.organizationId) locationMap.set(id, location.name);
    }));
    const shiftMap = new Map<string, any[]>();
    await Promise.all(scheduledShifts.slice(0, 5000).map(async assignment => {
      const shift = await ctx.db.get(assignment.shiftId);
      if (!shift || shift.organizationId !== admin.organizationId) return;
      const key = String(assignment.employeeId) + ":" + assignment.workDate;
      const current = shiftMap.get(key) ?? [];
      current.push({ name: shift.name, startMinute: shift.startMinute, endMinute: shift.endMinute });
      shiftMap.set(key, current);
    }));
    const defaultShiftCache = new Map<string, any>();
    const shiftsForEmployeeDate = async (employee: any, key: string) => {
      const assigned = shiftMap.get(key) ?? [];
      if (assigned.length || !employee.defaultShiftId) return assigned;
      const id = String(employee.defaultShiftId);
      let shift = defaultShiftCache.get(id);
      if (shift === undefined) {
        shift = await ctx.db.get(employee.defaultShiftId);
        defaultShiftCache.set(id, shift ?? null);
      }
      return shift && shift.organizationId === admin.organizationId
        ? [{ name: shift.name, startMinute: shift.startMinute, endMinute: shift.endMinute }]
        : [];
    };
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
          scheduledShifts: await shiftsForEmployeeDate(employee, key),
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
      if (event.locationType !== "remote" && event.geofencePassed === false) row.outsideGeofenceEvents++;
      row.events.push({
        _id: event._id,
        eventType: event.eventType,
        receivedAt: event.receivedAt,
        clientTimestamp: event.clientTimestamp,
        geofencePassed: event.geofencePassed,
        locationType: event.locationType ?? "physical",
        reviewStatus: event.reviewStatus ?? "not_required",
        exceptionCode: event.exceptionCode ?? null,
        accuracyM: event.accuracyM,
        locationName: locationMap.get(String(event.locationId)) ?? "Unknown location",
      });
    }
    for (const day of filteredDays) {
      const employee = employeeMap.get(String(day.employeeId));
      if (!employee || day.organizationId !== admin.organizationId) continue;
      const key = String(day.employeeId) + ":" + day.workDate;
      let row = groups.get(key);
      if (!row) {
        row = {
          id: key, employeeId: day.employeeId,
          employeeName: [employee.firstName, employee.lastName].filter(Boolean).join(" "),
          employeeCode: employee.employeeCode, departmentId: employee.departmentId,
          locationName: locationMap.get(String(employee.locationId)) ?? "Unknown location",
          scheduledShifts: await shiftsForEmployeeDate(employee, key), workDate: day.workDate,
          firstCheckInAt: null as number | null, lastCheckOutAt: null as number | null,
          eventCount: 0, pendingReviews: 0, rejectedEvents: 0, outsideGeofenceEvents: 0,
          events: [] as any[],
        };
        groups.set(key, row);
      }
      row.persistedStatus = day.status;
      row.payableMinutes = day.payableMinutes;
      row.breakMinutes = day.breakMinutes;
      row.correctionNote = day.correctionNote ?? null;
      row.hasPersistedSummary = true;
      if (row.firstCheckInAt === null && day.firstCheckInAt !== undefined) row.firstCheckInAt = day.firstCheckInAt;
      if (row.lastCheckOutAt === null && day.lastCheckOutAt !== undefined) row.lastCheckOutAt = day.lastCheckOutAt;
    }
    const rows = [...groups.values()].map(row => ({
      ...row,
      status: row.persistedStatus ?? (row.pendingReviews ? "pending_review" : row.rejectedEvents ? "rejected" : row.firstCheckInAt !== null ? "present" : "event_recorded"),
      events: row.events.sort((a: any, b: any) => a.receivedAt - b.receivedAt),
    })).sort((a, b) => b.workDate.localeCompare(a.workDate) || a.employeeName.localeCompare(b.employeeName));
    return {
      fromDate: args.fromDate,
      toDate: args.toDate,
      timezone: organization.timezone,
      totalEvents: filtered.length,
      truncated: hasMoreEvents || hasMoreSchedules || hasMoreDays,
      recordedDays: rows.length,
      pendingReviews: rows.reduce((sum, row) => sum + row.pendingReviews, 0),
      outsideGeofenceEvents: rows.reduce((sum, row) => sum + row.outsideGeofenceEvents, 0),
      rows,
    };
  },
});
