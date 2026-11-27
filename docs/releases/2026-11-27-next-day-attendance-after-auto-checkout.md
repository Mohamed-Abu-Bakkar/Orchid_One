# Release: next-day attendance after prior session closure

## Behaviour
- Pending attendance events from the current organization-local workday continue to block further punches.
- Pending geofence exceptions from an earlier workday remain in the review queue and are not approved or discarded.
- Once the prior workday's latest non-rejected event is a checkout, unresolved reviews from that prior day no longer block a new workday's check-in.
- If the previous session has no checkout, the employee remains blocked.
- Midnight auto-checkout continues to close open prior-day sessions with a system-generated event and audit record.
- Attendance-day summaries with pending reviews remain pending and payable minutes remain zero until review is finalized.

## Validation
- Unit tests cover prior-day pending geofence check-in plus midnight checkout, current-day pending event, open prior session, completed prior session, and organization timezone grouping.
- GitHub Actions CI passed unit tests, TypeScript, lint, and production build.

## Deployment
- Vercel production deployment is triggered by the final release commit ending in [deploy].
- Convex production deployment is separate and is not triggered by this release marker. Follow the project's controlled Convex production release process before expecting the updated mutation to run in production.
