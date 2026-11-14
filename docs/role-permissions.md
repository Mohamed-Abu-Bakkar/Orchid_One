# Orchid One role permissions

## Current role model

The application currently supports four distinct account roles:

| Role | Current access |
| --- | --- |
| `superadmin` | Full organization-wide administration |
| `admin` | Inherits the complete current `superadmin` permission set |
| `supervisor` | Existing supervisor-scoped access and approval workflows |
| `employee` | Existing self-service employee access |

## Admin inheritance

For the current phase, any backend authorization check that explicitly allows `superadmin` also allows `admin`. This is implemented centrally in `convex/lib/auth.ts` through `requireRole`, so privileged endpoints do not need duplicated role lists.

The inherited permission set includes account and role management, account status management, organization-wide employee and workforce administration, wage configuration and approvals, payroll operations, policy and settings administration, and other operations currently reserved for `superadmin`.

The `admin` and `superadmin` values remain separate in the database and API. Existing accounts are not migrated or promoted automatically. An authorized administrator can assign the `admin` role through Settings → User Management.

## Preserved restrictions

- `supervisor` retains the existing supervisor workflows and employee/reporting-line scope.
- `employee` retains the existing self-service restrictions.
- Organization isolation, account suspension checks, validation, approval sequencing and audit logging continue to apply.
- Role assignment and account status changes remain restricted to `admin` and `superadmin`.
- An administrator cannot suspend their own account or remove their own administrative role. The last active administrative account cannot be demoted or suspended.

## Future hierarchy

This is an interim compatibility rule, not a permanent role hierarchy. When granular permissions are introduced, replace the inheritance rule with explicit permissions/capabilities (for example, `users.manage`, `payroll.approve`, `organization.settings.manage`) and map each role to the approved permission set. Keep authorization enforced by Convex on the server; frontend visibility is only a usability layer.

## Verification checklist

- [ ] An `admin` can access all routes and mutations currently available to `superadmin`.
- [ ] A `superadmin` retains all existing access.
- [ ] A `supervisor` cannot access superadmin-only account, payroll, wage-configuration or organization-settings operations.
- [ ] An `employee` cannot access administrative operations or another employee's records.
- [ ] Cross-organization resource access remains rejected.
- [ ] Role changes and account suspension remain audited.
