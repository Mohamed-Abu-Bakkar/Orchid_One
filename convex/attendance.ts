import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./lib/auth";

const EARTH_RADIUS_M = 6_371_000;
function distanceMeters(aLat:number,aLon:number,bLat:number,bLon:number) {
  const rad = (n:number) => n * Math.PI / 180;
  const dLat=rad(bLat-aLat), dLon=rad(bLon-aLon);
  const h=Math.sin(dLat/2)**2+Math.cos(rad(aLat))*Math.cos(rad(bLat))*Math.sin(dLon/2)**2;
  return 2*EARTH_RADIUS_M*Math.asin(Math.sqrt(h));
}

export const recordPunch = mutation({
  args: {
    eventType: v.union(v.literal("check_in"),v.literal("check_out"),v.literal("break_start"),v.literal("break_end")),
    latitude: v.number(), longitude: v.number(), accuracyM: v.number(),
    clientTimestamp: v.number(), idempotencyKey: v.string()
  },
  handler: async (ctx,args) => {
    const user = await requireIdentity(ctx);
    if (!user.employeeId) throw new Error("EMPLOYEE_PROFILE_REQUIRED");
    const employee = await ctx.db.get(user.employeeId);
    if (!employee || employee.status !== "active") throw new Error("EMPLOYEE_INACTIVE");
    const location = await ctx.db.get(employee.locationId);
    if (!location || !location.isActive) throw new Error("LOCATION_UNAVAILABLE");
    const existing = await ctx.db.query("attendanceEvents").withIndex("by_idempotency",q=>q.eq("idempotencyKey",args.idempotencyKey)).unique();
    if (existing) return { eventId: existing._id, duplicate: true, geofencePassed: existing.geofencePassed };
    if (args.accuracyM <= 0 || args.accuracyM > 1000) throw new Error("INVALID_GPS_ACCURACY");
    const distance = distanceMeters(location.latitude,location.longitude,args.latitude,args.longitude);
    const geofencePassed = distance <= location.geofenceRadiusM;
    const now = Date.now();
    const eventId = await ctx.db.insert("attendanceEvents",{
      organizationId:user.organizationId,employeeId:employee._id,locationId:location._id,eventType:args.eventType,
      latitude:args.latitude,longitude:args.longitude,accuracyM:args.accuracyM,clientTimestamp:args.clientTimestamp,
      receivedAt:now,geofencePassed,exceptionCode:geofencePassed?undefined:"OUTSIDE_GEOFENCE",idempotencyKey:args.idempotencyKey
    });
    await ctx.db.insert("auditLogs",{organizationId:user.organizationId,actorUserId:user._id,action:"attendance.punch",entityType:"attendanceEvent",entityId:String(eventId),metadata:{eventType:args.eventType,geofencePassed,distanceM:Math.round(distance)},createdAt:now});
    return { eventId, duplicate:false, geofencePassed, distanceM:Math.round(distance), requiresReview:!geofencePassed };
  }
});

export const myRecentEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx,{limit}) => {
    const user = await requireIdentity(ctx);
    if (!user.employeeId) return [];
    return ctx.db.query("attendanceEvents").withIndex("by_employee_time",q=>q.eq("employeeId",user.employeeId!)).order("desc").take(Math.min(Math.max(limit ?? 20,1),50));
  }
});
