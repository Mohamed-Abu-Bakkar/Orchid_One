import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const seedOrchidOrganization = internalMutation({
  args: {},
  returns: v.id("organizations"),
  handler: async (ctx) => {
    const code = process.env.ORCHID_ORGANIZATION_CODE;
    if (!code) throw new Error("ORCHID_ORGANIZATION_CODE_NOT_CONFIGURED");

    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
    if (existing) return existing._id;

    return ctx.db.insert("organizations", {
      name: "Orchid Flowers",
      code,
      timezone: "Asia/Kolkata",
      currency: "INR",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
