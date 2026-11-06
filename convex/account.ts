import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const accountStatusValidator = v.union(
  v.literal("pending"),
  v.literal("active"),
  v.literal("rejected"),
  v.literal("suspended"),
);

export const ensurePendingProfile = mutation({
  args: {},
  returns: v.object({
    status: accountStatusValidator,
    role: v.union(
      v.literal("superadmin"),
      v.literal("admin"),
      v.literal("hr_manager"),
      v.literal("department_manager"),
      v.literal("supervisor"),
      v.literal("employee"),
    ),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("UNAUTHENTICATED");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", identity.subject))
      .unique();

    if (existing) {
      return {
        status: existing.accountStatus ?? (existing.isActive ? "active" : "pending"),
        role: existing.role,
      };
    }

    const organizationCode = process.env.ORCHID_ORGANIZATION_CODE;
    if (!organizationCode) {
      throw new Error("ORCHID_ORGANIZATION_CODE_NOT_CONFIGURED");
    }

    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_code", (q) => q.eq("code", organizationCode))
      .unique();

    if (!organization) throw new Error("ORCHID_ORGANIZATION_NOT_BOOTSTRAPPED");

    await ctx.db.insert("users", {
      organizationId: organization._id,
      authSubject: identity.subject,
      fullName: identity.name,
      email: identity.email,
      role: "employee",
      accountStatus: "pending",
      isActive: false,
      createdAt: Date.now(),
    });

    return { status: "pending" as const, role: "employee" as const };
  },
});

export const getMyAccountStatus = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      status: accountStatusValidator,
      role: v.union(
        v.literal("superadmin"),
        v.literal("admin"),
        v.literal("hr_manager"),
        v.literal("department_manager"),
        v.literal("supervisor"),
        v.literal("employee"),
      ),
      employeeId: v.optional(v.id("employees")),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", identity.subject))
      .unique();

    if (!user) return null;

    return {
      status: user.accountStatus ?? (user.isActive ? "active" : "pending"),
      role: user.role,
      employeeId: user.employeeId,
    };
  },
});
