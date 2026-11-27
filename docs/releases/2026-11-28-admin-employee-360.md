# Orchid One — Admin Employee 360 release

Release date: 2026-11-28

## Employee profile improvements
- Admin and Super Admin Employee 360 now displays date of birth, residential address, emergency contact, profile-completion status, and bank-detail submission status.
- The employee edit form supports validated updates to date of birth, residential address, and emergency contact.
- Dashboard employee names open the corresponding Employee 360 profile.

## Privacy and security
- Bank account values remain AES-256-GCM encrypted and are never returned to the admin UI.
- Admin directory projections expose the new personal fields only to Admin and Super Admin roles.
- Supervisor directory projections remain limited to existing operational fields.
- Audit metadata records changed field names without copying personal-data values.

## Deployment sequence
- Convex production functions are deployed first using a production-scoped `CONVEX_DEPLOY_KEY`.
- Vercel production deployment is triggered only after the Convex deploy succeeds.
