# Hourly Payroll Calculation v2

Release date: 2026-11-18

## Changes

- Calculate regular hourly earnings directly from complete, verified attendance events.
- Exclude recorded break intervals from payable time.
- Clip regular payable time to the configured shift window; late arrival reduces actual payable minutes.
- Keep post-shift work separate from regular hours. Only approved overtime requests contribute overtime earnings.
- Exclude incomplete, pending-review, rejected, or otherwise unverified attendance from automatic hourly payroll.
- Preserve existing approved and locked payroll snapshots; draft periods created under the previous calculation must be regenerated to use v2.

## Operational constraints

- Overnight and invalid shifts are not supported by this payroll calculation.
- Multiple shifts assigned to one employee on the same work date are rejected during payroll generation.
- When no shift is configured, verified work time less breaks is used as regular time; overtime requires a known shift boundary.

## Verification

The pull request CI completed successfully, including unit tests, typecheck, lint, and production build.
