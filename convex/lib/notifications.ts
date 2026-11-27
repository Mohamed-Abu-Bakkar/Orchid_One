import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/** Deliver an organization-scoped alert to active Admin and Super Admin accounts. */
export async function notifyOrganizationAdmins(
  ctx: MutationCtx,
  organizationId: Id<"organizations">,
  title: string,
  body: string,
  destination?: "leave" | "overtime",
) {
  const users = await ctx.db.query("users")
    .withIndex("by_org", q => q.eq("organizationId", organizationId))
    .collect();
  const now = Date.now();
  for (const user of users) {
    if (user.isActive && user.accountStatus !== "suspended" && (user.role === "admin" || user.role === "superadmin")) {
      await ctx.db.insert("notifications", { organizationId, userId: user._id, title, body, destination, createdAt: now });
    }
  }
}

/** Deliver an alert to active accounts linked to one employee record. */
export async function notifyEmployee(
  ctx: MutationCtx,
  organizationId: Id<"organizations">,
  employeeId: Id<"employees">,
  title: string,
  body: string,
) {
  const users = await ctx.db.query("users")
    .withIndex("by_org_employee", q => q.eq("organizationId", organizationId).eq("employeeId", employeeId))
    .collect();
  const now = Date.now();
  for (const user of users) {
    if (user.isActive && user.accountStatus !== "suspended") {
      await ctx.db.insert("notifications", { organizationId, userId: user._id, title, body, createdAt: now });
    }
  }
}
