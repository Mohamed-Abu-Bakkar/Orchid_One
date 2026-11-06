# First Orchid One administrator bootstrap

This is a one-time operational procedure. Do not expose the bootstrap mutation as a public API and do not run it against production until the production release is explicitly approved.

## 1. Configure the organization code

Set the same non-secret organization code in the intended Convex deployment:

```bash
npx convex env set ORCHID_ORGANIZATION_CODE ORCHID
```

The value `ORCHID` is the initial deployment identifier. Keep it consistent with the code used by the application. Do not set this against production during local development.

## 2. Seed the organization

Run the internal mutation `bootstrap:seedOrchidOrganization` once using the Convex dashboard or another authorized internal-function invocation. It is idempotent: if the organization code already exists, it returns the existing organization ID.

The initial organization uses:
- Name: Orchid Flowers
- Time zone: Asia/Kolkata
- Currency: INR

A physical location is deliberately not seeded here because its address, GPS coordinates and approved geofence radius must be supplied by Orchid Flowers.

## 3. Register the first account

Open the local application and register the designated initial administrator using the normal registration flow. The account profile is created with:
- role: employee
- accountStatus: pending
- isActive: false

The registration process does not grant elevated access.

## 4. Promote the first administrator manually

After the pending profile has been created, use the Convex dashboard for the correct deployment. Locate the corresponding `users` document by its Better Auth `authSubject` and verify the account owner's identity out-of-band.

Update only that document:
- `role`: `superadmin`
- `accountStatus`: `active`
- `isActive`: `true`

Do not modify Better Auth component records directly. The application user profile is the authorization record.

## 5. Verify

Sign out and sign back in. Confirm that:
- the user can access `/admin`
- employee-only accounts cannot access `/admin`
- pending users cannot access employee or admin data
- backend functions reject inactive and pending users

## 6. Subsequent registrations

New registrations remain pending employees. Authorized administrators can review them through the user approval workflow. Self-approval is rejected and every decision is recorded in `auditLogs`.

## Operational cautions

- Never use the production deployment for development or test accounts.
- Keep the production Better Auth secret separate from development.
- Do not seed a location with invented GPS coordinates or geofence radius.
- This procedure is not a substitute for a production backup and reviewed release.
