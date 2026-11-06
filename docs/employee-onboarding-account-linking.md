# Employee onboarding and account linking

## Scope
Admin-side workflow for creating employee records independently from login registration, then optionally linking a registered employee account during onboarding or later from User Management.

## User experience
- **People → Onboarding** creates an employee record. Account linking is optional.
- Employee codes are generated server-side with the `ORC-` prefix and four-digit minimum padding (for example, `ORC-0001`).
- **Settings → User Management** separates unlinked and linked employee-role accounts. HR selects an available employee record to link.
- Linking never changes the Better Auth session, account status, or role. Login/dashboard access behavior is deliberately unchanged.

## Backend
- `employee.listOnboardingOptions`: returns active departments and locations in the caller's organization.
- `employee.listAccountsForLinking`: returns safe account fields and the linked employee summary, scoped to the caller's organization.
- `employee.createForAdmin`: validates department/location ownership and optionally creates the account link in the same Convex mutation.
- `employee.linkAccount`: links an existing account and employee record.
- `users.by_org_employee` supports organization-scoped duplicate-link checks.

## Security and integrity
- Only superadmin and supervisor roles can access these operations.
- Account and employee records must belong to the same organization.
- Only employee-role accounts can be linked.
- An account already linked to an employee cannot be linked again; an employee already linked to an account cannot be linked to a second account.
- Linking does not silently activate, suspend, reject, or change the role of an account.
- Employee creation and account linking write audit records.
- Employee codes are generated from all retained employee records, including archived records, so an assigned code is not intentionally reused.

## Employee code generation
The mutation scans the organization's retained employee records, finds the largest numeric suffix matching `ORC-<number>`, and assigns the next suffix. Convex mutation transaction conflict detection protects concurrent onboarding attempts that read and modify the same organization employee range.

## Required setup
The organization must have at least one active department and one active work location before an employee can be onboarded.

## Deliberate non-goals
- No automatic user creation or invitation.
- No login blocking or pending-account workflow changes.
- No employee dashboard authorization changes.
- No unlink/reassign operation.
- No payroll, leave, overtime, or wage calculations.

## QA checklist
- Create employee without account; verify employee directory displays generated code.
- Create employee with an unlinked account; verify both records are linked atomically.
- Link a registered account later from User Management.
- Confirm linked account appears in Linked Accounts and is unavailable for a second link.
- Confirm one employee cannot be linked to two accounts.
- Confirm cross-organization IDs and non-employee roles are rejected.
- Confirm account status and role are unchanged by linking.
- Confirm audit records are written for creation and linking.
- Test concurrent employee creation for unique codes.