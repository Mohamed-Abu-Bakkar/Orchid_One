# Orchid One role permissions

## Authority model

| Role | Scope | Authority |
| --- | --- | --- |
| `superadmin` | Platform operator identity; current operational data is still organization-scoped | Platform-level account governance and all organization operations |
| `admin` | Its assigned organization only | Business administration for Orchid Flowers; cannot govern platform administrator accounts |
| `supervisor` | Existing supervisor scope | Existing supervisor workflows and approvals |
| `employee` | Own linked employee profile | Employee self-service |

## Super Admin and Admin boundary

- `requireSuperadmin` accepts only `superadmin`; no implicit Admin inheritance.
- `requireOrganizationAdmin` accepts `superadmin` and `admin` for organization-level configuration and management.
- `requireAdmin` retains the existing supervisor-inclusive operational access where that is intentional.
- Admin account lists are filtered server-side to employee and supervisor accounts.
- Admins can only change employee/supervisor roles and account statuses.
- Only Super Admins can manage Admin and Super Admin accounts.
- Role and status mutations enforce authorization independently of the UI.
- Users cannot change their own role or suspend their own account.
- The primary Super Admin marker is protected from downgrade and suspension.
- The primary account is established once through the internal-only `claimPrimarySuperadmin` bootstrap mutation. It requires the auth subject of the existing active Super Admin account and cannot be called from a browser session.
- The last active Super Admin safeguard remains in place.

## Tenant isolation

Organization operational queries and mutations continue to scope records to the authenticated user's `organizationId`. Client-provided organization IDs are not treated as authorization. The current release does not add a cross-organization data browser or raw database console; these require a separately designed platform operations surface and audited APIs.

## Database and infrastructure access

Convex does not expose conventional per-user SQL database logins. Super Admin application permissions are enforced in Convex functions. Production deployment credentials, Convex dashboard access, backup/export controls and Vercel/GitHub administration remain infrastructure-level capabilities and must be secured separately with MFA and least privilege. Never place deployment or database secrets in browser code.

## Additional Super Admins

Additional Super Admin accounts are not provisioned by this change. Existing Super Admin role assignment remains available to Super Admins in the current account-management flow. Additional accounts receive the same application role. The primary marker prevents another Super Admin from demoting or suspending the primary account.

## One-time primary account setup

After the schema/function deployment, an operator must run the internal mutation `bootstrap:claimPrimarySuperadmin` once using the auth subject belonging to the existing primary Super Admin account. Do not guess the subject or use an email address in place of the provider subject. Verify the account's `isPrimarySuperadmin` field before enabling additional Super Admin accounts.

## Verification

- Admin cannot invoke platform-only functions protected by `requireSuperadmin`.
- Admin retains organization configuration and workforce operations protected by `requireOrganizationAdmin`.
- Admin cannot list, promote, demote, suspend or reactivate Admin/Super Admin accounts.
- Super Admin can manage organization accounts and all organization roles.
- Primary Super Admin cannot be downgraded or suspended by another Super Admin.
- Profile refresh does not reactivate a suspended account.
- Organization data access remains tenant-scoped.


## Primary Super Admin payroll deletion

- The payroll history query exposes a delete action only when the authenticated user is the claimed Primary Super Admin.
- The server mutation independently requires `role === "superadmin"` and `isPrimarySuperadmin === true`; hiding the button is not treated as authorization.
- Permanent deletion is limited to a `wagePeriod` whose status is exactly `draft` and whose every linked `wageRecord` is also `draft`.
- The mutation writes a `payroll.draft_period_deleted` audit event, deletes the draft wage records, and then deletes the period in one Convex transaction.
- Pending-approval, approved, and locked periods/records cannot be deleted through this operation.
- The UI requires an explicit browser confirmation; the mutation also requires the fixed confirmation token.
