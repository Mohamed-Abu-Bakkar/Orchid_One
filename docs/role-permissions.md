# Orchid One role permissions

## Role hierarchy

The application supports four distinct roles:

| Role | Authority |
| --- | --- |
| `superadmin` | Highest authority. Manages admins, superadmins, employees, supervisors, and all organization operations. |
| `admin` | Organization-wide operational authority. Manages employees and supervisors, but cannot view or manage admin/superadmin accounts or grant administrator privileges. |
| `supervisor` | Existing supervisor-scoped access and approval workflows. |
| `employee` | Existing self-service employee access. |

## User and account management boundary

- Only `superadmin` can list, view, promote, demote, suspend, or reactivate `admin` and `superadmin` accounts.
- Administrator account records are excluded from the user-management query for an `admin`; they are not merely hidden by the frontend.
- An `admin` can view and manage only `employee` and `supervisor` accounts.
- An `admin` can change roles only between `employee` and `supervisor`; backend mutations reject attempts to modify administrator accounts or assign `admin`/`superadmin` roles.
- An `admin` can suspend/reactivate only `employee` and `supervisor` accounts.
- A `superadmin` can manage all four roles and account statuses.
- Role and status changes continue to write audit records.
- The last active `superadmin` cannot be demoted or suspended. Admin accounts do not count as superadmins for this safeguard.
- Users cannot change their own role or suspend their own account.

## Other organization permissions

The current phase retains the existing admin inheritance for operational organization-wide permissions, including employee/workforce administration, wage and payroll operations, policy/settings administration, and other organization functions. The separation above is an explicit exception for administrator-account governance.

Backend authorization remains authoritative. Frontend controls and filtered lists are usability measures only; every privileged mutation independently enforces the role boundary and organization scope.

## Verification checklist

- [ ] Admin user-management list contains employees and supervisors only.
- [ ] Admin cannot retrieve admin/superadmin account records through the account-list query.
- [ ] Admin can change employee/supervisor roles between those two roles.
- [ ] Admin cannot promote an account to admin/superadmin.
- [ ] Admin cannot change the role or status of an admin/superadmin, including by direct mutation calls.
- [ ] Superadmin can view and manage all account roles and statuses.
- [ ] Last active superadmin cannot be demoted or suspended.
- [ ] Role/status changes remain audited and cross-organization access remains rejected.
