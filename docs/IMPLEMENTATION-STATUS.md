# Orchid One – Phase 1 implementation status

## Source of truth
Signed agreement CUSP/ORCHID/2026/001 controls Phase 1 scope. Original prototype remains in `OrchidHRM/`; production application is at repository root.

## Contract modules
Dashboard; authentication and roles; recruitment; onboarding and employee management; document management; hourly workforce; attendance; leave and shifts; organization and policies; reports including employee payment summary.

## Architecture baseline
Next.js App Router + TypeScript; Convex document database; responsive PWA direction; organization/location scoping; append-only attendance events and audit; effective-dated wage rates; configurable approval steps.

## Contract conflict
Agreement section 5 specifies an **Android Mobile Application**. Current technical direction is **PWA**. A PWA is not automatically equivalent to an Android application deliverable. Obtain written client approval for substitution or include Android packaging and device testing (e.g. Capacitor).

## Policy blockers
Do not invent break treatment, payable-minute rounding, overtime eligibility/multipliers, wage-period cut-offs, monthly proration, leave rules or statutory deductions. Full statutory payroll is not assumed. Wage calculation requires signed business examples and approved rules.

## GPS safeguards
Capture GPS on punch events, not continuous tracking. Persist accuracy, client timestamp and server receipt timestamp. Geofence failures are recorded as reviewable exceptions. GPS is not proof against spoofing.

## Security and release
Configure identity provider, Convex deployment, private document storage, secrets and notification services before production. Do not deploy with placeholder environment variables. This branch currently contains the application foundation, schema and initial attendance mutation; it is not a completed release.
