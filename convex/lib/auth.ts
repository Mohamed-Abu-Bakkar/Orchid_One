import type { QueryCtx, MutationCtx } from "../_generated/server";

export type AppRole = "superadmin" | "admin" | "supervisor" | "employee";

export async function requireIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("UNAUTHENTICATED");
  const user = await ctx.db.query("users")
    .withIndex("by_auth_subject", (q) => q.eq("authSubject", identity.subject))
    .unique();
  if (!user) throw new Error("FORBIDDEN");
  if (!user.isActive || user.accountStatus === "suspended") throw new Error("ACCOUNT_SUSPENDED");
  return user;
}

export async function requireRole(ctx: QueryCtx | MutationCtx, allowedRoles: readonly AppRole[]) {
  const user = await requireIdentity(ctx);
  // During the current phase, admin inherits every permission granted to superadmin.
  // Keep the role values distinct so a future permission hierarchy can separate them.
  const effectiveRoles = allowedRoles.includes("superadmin")
    ? [...allowedRoles, "admin" as const]
    : allowedRoles;
  if (!effectiveRoles.includes(user.role as AppRole)) throw new Error("FORBIDDEN");
  return user;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  return requireRole(ctx, ["superadmin", "admin", "supervisor"]);
}

export async function requireSupervisorOrAdmin(ctx: QueryCtx | MutationCtx) {
  return requireRole(ctx, ["superadmin", "admin", "supervisor"]);
}

export async function requireSuperadmin(ctx: QueryCtx | MutationCtx) {
  return requireRole(ctx, ["superadmin", "admin"]);
}
