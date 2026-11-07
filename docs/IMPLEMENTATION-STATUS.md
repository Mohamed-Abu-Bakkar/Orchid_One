# Orchid One – Phase 1 implementation status

## Source of truth
Signed agreement CUSP/ORCHID/2026/001 controls Phase 1 scope. Legacy employee prototype is archived in `prototypes/legacy-employee/`; production application is at repository root.

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


## UI migration progress
- The existing `OrchidHRM/` prototype is the visual source of truth; no redesign is authorized.
- Original design-system, web and mobile stylesheets are copied into `src/styles/` and loaded by the Next.js application.
- The admin navigation shell and dashboard composition are migrated to `src/components/admin/admin-shell.tsx`.
- Original module navigation labels and groupings are retained.
- The current dashboard intentionally shows empty/live-data-pending states. Original prototype sample figures are not represented as production data.
- Remaining UI work: migrate each original module screen, dialogs/drawers/forms, tables, filters, charts and employee mobile screens; then connect each to authenticated Convex operations.
- Visual parity and runtime verification have not yet been completed. No build, typecheck or browser test result is claimed in this status.


## Employee application separation
- `/employee` is served by the Convex-connected `EmployeePortal` React application; the root route redirects to `/employee`.
- The legacy HTML employee prototype is archived separately at `prototypes/legacy-employee/employee_mobileApp.html` and is not used by production routes.
- The unused `EmployeeMockReplica` component has been removed to avoid maintaining a second mock employee application.
- Employee data and attendance actions in the active portal use authenticated Convex queries and mutations. UI-only empty states are retained where the underlying business capability or policy is not yet configured.
- The legacy prototype is retained for visual reference only; do not import it into production components or routes.
