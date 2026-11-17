import type { AppRole } from "./auth";

export function hasRole(userRole: AppRole, allowedRoles: readonly AppRole[]) {
  return allowedRoles.includes(userRole);
}

export function canManageAccountRole(
  actorRole: AppRole,
  targetRole: AppRole,
  nextRole: AppRole,
) {
  if (actorRole === "superadmin") return true;
  if (actorRole !== "admin") return false;
  return (
    (targetRole === "employee" || targetRole === "supervisor") &&
    (nextRole === "employee" || nextRole === "supervisor")
  );
}

export function canChangeAccountStatus(
  actorRole: AppRole,
  targetRole: AppRole,
) {
  if (actorRole === "superadmin") return true;
  if (actorRole !== "admin") return false;
  return targetRole === "employee" || targetRole === "supervisor";
}

export function canChangePrimarySuperadmin(
  isPrimarySuperadmin: boolean,
  nextRole: AppRole,
  nextStatus?: "active" | "suspended",
) {
  if (!isPrimarySuperadmin) return true;
  return nextRole === "superadmin" && nextStatus !== "suspended";
}


export function canDeletePayrollPeriod(
  actorRole: AppRole,
  isPrimarySuperadmin: boolean,
  periodStatus: "draft" | "pending_approval" | "approved" | "locked",
  recordStatuses: readonly ("draft" | "pending_approval" | "approved" | "locked")[],
) {
  if (actorRole === "superadmin" && isPrimarySuperadmin) return true;
  if (actorRole !== "admin" || periodStatus !== "draft") return false;
  return recordStatuses.every((status) => status === "draft");
}


/**
 * Weekly payroll is reserved for variable-wage employees. Permanent employees
 * receive their fixed monthly salary only through monthly or custom runs.
 */
export function isEmployeeEligibleForPayrollPeriod(
  periodType: "weekly" | "monthly" | "custom",
  employmentType: "permanent" | "hourly" | "daily",
) {
  return periodType !== "weekly" || employmentType !== "permanent";
}
