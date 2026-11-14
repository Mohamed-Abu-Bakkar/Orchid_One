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


## UI migration progress
- The existing `OrchidHRM/` prototype is the visual source of truth; no redesign is authorized.
- Original design-system, web and mobile stylesheets are copied into `src/styles/` and loaded by the Next.js application.
- The admin navigation shell and dashboard composition are migrated to `src/components/admin/admin-shell.tsx`.
- Original module navigation labels and groupings are retained.
- The current dashboard intentionally shows empty/live-data-pending states. Original prototype sample figures are not represented as production data.
- Remaining UI work: migrate each original module screen, dialogs/drawers/forms, tables, filters, charts and employee mobile screens; then connect each to authenticated Convex operations.
- Visual parity and runtime verification have not yet been completed. No build, typecheck or browser test result is claimed in this status.


## Employee interface preview
- Added `/employee` route to display the original employee mobile prototype without redesigning it.
- The preview is intentionally isolated in an iframe so the legacy inline interactions do not leak into the Next.js application shell.
- The preview remains a static prototype: attendance, requests, wage figures, documents and notifications are sample/local interactions only; they are not authenticated or persisted to Convex.
- Prototype image assets are currently loaded from the feature branch's raw GitHub URLs. Before production, move these assets into the app's own `public/` directory and migrate interactions to React components and authenticated backend operations.
- The original employee HTML in `OrchidHRM/` remains unchanged.


## Employee application source of truth

**Active employee application:** the legacy mobile-first employee interface in `OrchidHRM/employee_mobileApp.html`, served through `src/app/employee/page.tsx` and `src/components/employee-realtime-frame.tsx`. Its browser-side controller is `public/employee-controller.js`; authenticated server routes and Convex functions provide persisted operations.

**Deprecated / unused React employee prototype:** `src/components/employee/employee-portal.tsx`. It is not imported by the active `/employee` route and must not be used for new employee features. It is retained temporarily as a reference only and exports `DeprecatedEmployeePortalPrototype` to make its status explicit.

**Development rule:** all employee-side feature changes must target the active OrchidHRM HTML/controller/API/Convex path unless a separately approved migration replaces that implementation. Do not assume that changes to the deprecated React prototype are visible to employees.
