import { QueryCtx, MutationCtx } from "../_generated/server";

const ACTIVE_ROLES = [
  "superadmin",
  "admin",
  "hr_manager",
  "department_manager",
  "supervisor",
  "employee",
] as const;

export type AppRole = (typeof ACTIVE_ROLES)[number];
export type AccountStatus = "pending" | "active" | "rejected" | "suspended";

export async function requireIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("UNAUTHENTICATED");

  const user = await ctx.db
    .query("users")
    .withIndex("by_auth_subject", (q) => q.eq("authSubject", identity.subject))
    .unique();

  if (!user) throw new Error("FORBIDDEN");

  // accountStatus is optional during the staged migration. Legacy active
  // accounts remain active; newly provisioned accounts must set it explicitly.
  const accountStatus: AccountStatus =
    user.accountStatus ?? (user.isActive ? "active" : "pending");

  if (!user.isActive || accountStatus !== "active") {
    throw new Error("ACCOUNT_NOT_ACTIVE");
  }

  return { ...user, accountStatus };
}

export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: readonly AppRole[],
) {
  const user = await requireIdentity(ctx);
  if (!allowedRoles.includes(user.role as AppRole)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  return requireRole(ctx, [
    "superadmin",
    "admin",
    "hr_manager",
  ]);
}
