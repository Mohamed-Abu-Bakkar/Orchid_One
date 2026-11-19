# Automatic midnight attendance checkout

## Behaviour
- A Convex scheduled job runs every five minutes.
- During each organization's local midnight hour, it examines active employees' attendance events for the previous organization-local date.
- If the last non-rejected event is an open check-in or break-start, it inserts a system-generated checkout at the final millisecond of that workday.
- If a break is still open, it inserts a system-generated break-end immediately before checkout.
- Generated events use deterministic idempotency keys and carry a system-generated reason.
- Attendance-day summaries are refreshed using the existing attendance calculation.
- Existing overtime detection runs after closure; qualifying hourly overtime continues through the existing employee confirmation and approval workflow.
- An audit event records the system-generated checkout.

## Safety
- No original attendance event is changed or deleted.
- Rejected events do not keep a session open.
- Existing pending review state is preserved; pending attendance is not silently approved.
- Organizations are evaluated using their configured IANA timezone.
- The scheduled mutation is internal-only.

## Operational note
Convex schema/functions and cron configuration must be deployed to the production Convex deployment separately from the Vercel frontend deployment. Verify the cron appears in the production Convex dashboard after deployment.


Release verification: final main-branch release commit includes the scheduled cron registration and system-generated event schema fields.
