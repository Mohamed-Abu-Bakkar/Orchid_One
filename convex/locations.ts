import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./lib/auth";

export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireIdentity(ctx);
    if (admin.role !== "superadmin" && admin.role !== "supervisor") throw new Error("FORBIDDEN");
    return await ctx.db.query("locations")
      .withIndex("by_org", q => q.eq("organizationId", admin.organizationId))
      .order("asc")
      .collect();
  },
});

export const saveConfiguration = mutation({
  args: {
    locationId: v.id("locations"),
    address: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    geofenceRadiusM: v.number(),
    activate: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await requireIdentity(ctx);
    if (admin.role !== "superadmin" && admin.role !== "supervisor") throw new Error("FORBIDDEN");
    const location = await ctx.db.get(args.locationId);
    if (!location || location.organizationId !== admin.organizationId) throw new Error("LOCATION_NOT_FOUND");

    const address = args.address.trim().replace(/\\s+/g, " ");
    if (!address || address.length > 300) throw new Error("INVALID_LOCATION_ADDRESS");
    if (!Number.isFinite(args.latitude) || args.latitude < -90 || args.latitude > 90) throw new Error("INVALID_LATITUDE");
    if (!Number.isFinite(args.longitude) || args.longitude < -180 || args.longitude > 180) throw new Error("INVALID_LONGITUDE");
    if (!Number.isInteger(args.geofenceRadiusM) || args.geofenceRadiusM < 10 || args.geofenceRadiusM > 1000) throw new Error("INVALID_GEOFENCE_RADIUS");

    await ctx.db.patch(location._id, {
      address,
      latitude: args.latitude,
      longitude: args.longitude,
      geofenceRadiusM: args.geofenceRadiusM,
      isActive: args.activate,
    });
    await ctx.db.insert("auditLogs", {
      organizationId: admin.organizationId,
      actorUserId: admin._id,
      action: args.activate ? "location.activated" : "location.configuration_saved",
      entityType: "location",
      entityId: String(location._id),
      metadata: {
        address,
        latitude: args.latitude,
        longitude: args.longitude,
        geofenceRadiusM: args.geofenceRadiusM,
      },
      createdAt: Date.now(),
    });
    return { locationId: location._id, isActive: args.activate };
  },
});
