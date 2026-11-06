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

## Location management
- Organization → Locations lists the caller organization's locations, including inactive drafts.
- HR can search an address using OpenStreetMap/Nominatim and select a returned place to populate the address and coordinates. The embedded OpenStreetMap preview displays the selected coordinate pin; HR should verify it before saving.
- Use current GPS requests browser geolocation permission and captures device coordinates. It does not infer or fill the postal address; HR must provide/search the address separately.
- Geofence radius is explicitly entered in whole metres and validated from 10 through 1,000 metres. No default radius is treated as approved until HR saves it.
- Save as draft persists configuration while keeping the location inactive. Save & activate is an explicit action; activation requires a non-empty address, valid latitude/longitude, and valid radius.
- convex/locations.ts scopes list/update operations to the authenticated user's organization and superadmin/supervisor roles. Configuration and activation changes are audit logged.
- Active locations are returned by employee.listOnboardingOptions; draft locations remain unavailable for employee assignment.
- Address search requires network access to Nominatim. GPS capture requires HTTPS and user permission. Map tiles/search results are third-party OpenStreetMap services; verify the pin and address against the actual workplace before activation.

## Location configuration QA checklist
- Search an address and select a result; verify address, coordinates and map marker.
- Deny GPS permission, grant GPS permission, and simulate unavailable/timeout cases.
- Verify invalid latitude/longitude and radius values are rejected by the Convex mutation.
- Save as draft and confirm the location remains absent from onboarding options.
- Activate a fully configured location and confirm it appears in onboarding options.
- Confirm a user from another organization cannot read or configure the location.
- Confirm non-admin roles cannot list or update locations.
- Confirm each save/activation writes an audit log.
