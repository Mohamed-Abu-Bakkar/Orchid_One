import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";

const accountStatusValidator = v.union(v.literal("active"), v.literal("suspended"));
const roleValidator = v.union(v.literal("superadmin"), v.literal("admin"), v.literal("supervisor"), v.literal("employee"));

async function getOrCreateOrganization(ctx: MutationCtx) {
  const code = "ORCHID";
  const existing = await ctx.db
    .query("organizations")
    .withIndex("by_code", (q) => q.eq("code", code))
    .unique();

  if (existing) return existing._id;

  const now = Date.now();
  return ctx.db.insert("organizations", {
    name: "Orchid Flowers",
    code,
    timezone: "Asia/Kolkata",
    currency: "INR",
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * Every authenticated Better Auth user receives an active employee account.
 * Elevated roles are assigned separately by the owner in the database.
 */
export const ensureUserProfile = mutation({
  args: {},
  returns: v.object({ status: accountStatusValidator, role: roleValidator }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("UNAUTHENTICATED");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", identity.subject))
      .unique();

    if (existing) {
      const status: "active" | "suspended" =
        existing.accountStatus === "suspended" ? "suspended" : "active";

      if (status === "active" && (!existing.isActive || existing.accountStatus !== "active")) {
        await ctx.db.patch(existing._id, { accountStatus: "active", isActive: true });
      }

      return {
        status,
        role: existing.role as "superadmin" | "admin" | "supervisor" | "employee",
      };
    }

    const organizationId = await getOrCreateOrganization(ctx);
    await ctx.db.insert("users", {
      organizationId,
      authSubject: identity.subject,
      fullName: identity.name,
      email: identity.email,
      role: "employee",
      accountStatus: "active",
      isActive: true,
      createdAt: Date.now(),
    });

    return { status: "active" as const, role: "employee" as const };
  },
});

export const getMyAccountStatus = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      status: accountStatusValidator,
      role: roleValidator,
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
      status: user.accountStatus === "suspended" || !user.isActive ? "suspended" as const : "active" as const,
      role: user.role as "superadmin" | "admin" | "supervisor" | "employee",
      employeeId: user.employeeId,
    };
  },
});
