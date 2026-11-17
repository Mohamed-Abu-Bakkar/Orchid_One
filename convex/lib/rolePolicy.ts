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
