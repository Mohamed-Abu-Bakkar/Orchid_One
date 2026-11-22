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
  if (!allowedRoles.includes(user.role as AppRole)) throw new Error("FORBIDDEN");
  return user;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  return requireRole(ctx, ["superadmin", "admin", "supervisor"]);
}

export async function requireSupervisorOrAdmin(ctx: QueryCtx | MutationCtx) {
  return requireRole(ctx, ["superadmin", "admin", "supervisor"]);
}

/** Organization-wide administrative access; supervisors are intentionally excluded. */
export async function requireOrganizationAdmin(ctx: QueryCtx | MutationCtx) {
  return requireRole(ctx, ["superadmin", "admin"]);
}

/** Muhurtham calendar management is delegated to supervisors as well as admins. */
export async function requireMuhurthamManager(ctx: QueryCtx | MutationCtx) {
  return requireRole(ctx, ["superadmin", "admin", "supervisor"]);
}

/** Platform-owner-only access. Never grant this implicitly to organization admins. */
export async function requireSuperadmin(ctx: QueryCtx | MutationCtx) {
  return requireRole(ctx, ["superadmin"]);
}


/** Destructive platform-owner capability. Role alone is insufficient: the account must be the claimed primary operator. */
export async function requirePrimarySuperadmin(ctx: QueryCtx | MutationCtx) {
  const user = await requireRole(ctx, ["superadmin"]);
  if (user.isPrimarySuperadmin !== true) throw new Error("PRIMARY_SUPERADMIN_REQUIRED");
  return user;
}
