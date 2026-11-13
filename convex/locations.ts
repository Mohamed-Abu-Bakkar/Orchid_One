import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity, requireRole } from "./lib/auth";

export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireRole(ctx, ["superadmin"]);
    return await ctx.db.query("locations")
      .withIndex("by_org", q => q.eq("organizationId", admin.organizationId))
      .order("asc")
      .collect();
  },
});

export const saveConfiguration = mutation({
  args: {
    locationId: v.id("locations"),
    locationType: v.optional(v.union(v.literal("physical"), v.literal("remote"))),
    address: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    geofenceRadiusM: v.optional(v.number()),
    activate: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await requireRole(ctx, ["superadmin"]);
    const location = await ctx.db.get(args.locationId);
    if (!location || location.organizationId !== admin.organizationId) throw new Error("LOCATION_NOT_FOUND");

    const locationType = args.locationType ?? location.locationType ?? "physical";
    let address = "";
    let latitude = 0;
    let longitude = 0;
    let geofenceRadiusM = 0;
    if (locationType === "physical") {
      address = (args.address ?? "").trim().replace(/\\s+/g, " ");
      latitude = args.latitude ?? Number.NaN;
      longitude = args.longitude ?? Number.NaN;
      geofenceRadiusM = args.geofenceRadiusM ?? Number.NaN;
      if (!address || address.length > 300) throw new Error("INVALID_LOCATION_ADDRESS");
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new Error("INVALID_LATITUDE");
      if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error("INVALID_LONGITUDE");
      if (!Number.isInteger(geofenceRadiusM) || geofenceRadiusM < 10 || geofenceRadiusM > 1000) throw new Error("INVALID_GEOFENCE_RADIUS");
    }

    await ctx.db.patch(location._id, {
      locationType,
      address,
      latitude,
      longitude,
      geofenceRadiusM,
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
        locationType,
        geofenceRadiusM,
      },
      createdAt: Date.now(),
    });
    return { locationId: location._id, isActive: args.activate };
  },
});
