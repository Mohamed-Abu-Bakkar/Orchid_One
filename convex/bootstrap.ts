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


/**
 * One-time, operator-invoked bootstrap for the already-existing primary Super Admin.
 * Internal-only: this cannot be called by an application user or browser client.
 */
export const claimPrimarySuperadmin = internalMutation({
  args: { authSubject: v.string() },
  returns: v.object({ claimed: v.boolean() }),
  handler: async (ctx, { authSubject }) => {
    const subject = authSubject.trim();
    if (!subject) throw new Error("AUTH_SUBJECT_REQUIRED");

    const existingPrimary = await ctx.db
      .query("users")
      .withIndex("by_primary_superadmin", (q) => q.eq("isPrimarySuperadmin", true))
      .first();

    if (existingPrimary) {
      if (existingPrimary.authSubject === subject) return { claimed: false };
      throw new Error("PRIMARY_SUPERADMIN_ALREADY_CONFIGURED");
    }

    const account = await ctx.db
      .query("users")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", subject))
      .unique();

    if (!account || account.role !== "superadmin" || !account.isActive || account.accountStatus === "suspended") {
      throw new Error("ACTIVE_SUPERADMIN_ACCOUNT_REQUIRED");
    }

    await ctx.db.patch(account._id, { isPrimarySuperadmin: true });
    return { claimed: true };
  },
});
