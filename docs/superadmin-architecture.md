# Super Admin architecture

## Identity

The existing Super Admin login remains the primary platform-owner identity. No credentials are recreated or changed. A one-time internal bootstrap marks the existing account as primary after the operator verifies its Better Auth subject.

## Authorization layers

1. Authentication: Better Auth session establishes the identity.
2. Application identity: Convex resolves the identity subject to a `users` row.
3. Role authorization: `requireSuperadmin`, `requireOrganizationAdmin` and `requireAdmin` enforce distinct role sets.
4. Tenant authorization: organization functions use the authenticated user's organization ID and validate referenced records against it.
5. Infrastructure authorization: Convex deployment, Vercel, GitHub, exports and backup access remain outside browser sessions.

## Data model

- `users.isPrimarySuperadmin?: boolean` identifies the protected primary operator.
- `users.by_primary_superadmin` supports lookup of the primary identity.
- The field is optional for backward-compatible migration of existing user records.
- `claimPrimarySuperadmin` is an internal-only, one-time mutation. It accepts an auth subject, requires an active existing Super Admin and refuses to replace a previously claimed primary.

## Primary-owner safeguards

- A primary Super Admin cannot be downgraded.
- A primary Super Admin cannot be suspended.
- Self-demotion and self-suspension remain blocked.
- Other Super Admin accounts retain the same current Super Admin application role.

## Current scope and deliberate limits

This change establishes authorization boundaries and protects the primary identity. It does not create a global cross-organization data explorer, unrestricted database editor, backup/restore console, MFA enrollment flow, or raw Convex/Vercel credential management. Those features require dedicated workflows, additional audit design, and infrastructure-level controls. The current application data model remains tenant-scoped to the authenticated user's organization.

## Operational rollout

1. Review the pull request and CI results.
2. Deploy the Convex schema and functions to the intended environment.
3. Confirm the existing Super Admin account and its Better Auth `subject`.
4. Invoke `bootstrap:claimPrimarySuperadmin` through an authenticated operator channel (Convex CLI/dashboard), never from the client.
5. Verify the marker and test Admin/Super Admin negative authorization cases.
6. Deploy the web application only after backend deployment is verified.
