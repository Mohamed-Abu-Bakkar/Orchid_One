# Orchid One – Phase 1 implementation status

## Source of truth
The signed development agreement **CUSP/ORCHID/2026/001** controls Phase 1 scope. The proposal and design prototype are supporting references. The original static prototype remains under `OrchidHRM/`; the production application is being built at repository root.

## Agreement scope tracked
- Dashboard and role-based authentication
- Recruitment and interview management
- Employee onboarding, directory and records
- Employee document management
- Hourly workforce and wage calculation
- GPS attendance and geofencing
- Leave and shift management
- Organization and policy management
- Management reports and employee payment summary
- Technical documentation, user manual and deployment assistance

## Architecture baseline
- Next.js App Router + TypeScript
- Convex document database and server functions
- PWA-first responsive UI
- Organization/location scoping in domain records
- Append-only attendance events and audit records
- Effective-dated wage rates and versioned wage calculations
- Hierarchical approval workflow represented as configurable steps

## Critical scope clarification
The agreement names an **Android mobile application** as a deliverable. The current implementation direction is a **PWA**. A PWA is not automatically the same contractual deliverable as a signed Android application package. Obtain written client approval for the substitution, or add a Capacitor Android packaging deliverable.

## Financial-rule safeguards
The agreement includes wage calculation, overtime payment calculation and daily/weekly/monthly wage summaries. It does not specify the numerical calculation policies. Do not invent:
- paid/unpaid break treatment
- rounding rules
- overtime eligibility thresholds or multipliers
- monthly proration or deductions
- leave encashment or statutory deductions
- wage period cut-off rules

A wage result must retain its calculation version and remain traceable to approved attendance and effective-dated rates. No full statutory payroll, payslip, tax, PF or ESI module is implemented by assumption.

## Attendance safeguards
- GPS is captured on an attendance event, not continuously in the background.
- Store coordinates, reported accuracy, client timestamp and server receipt timestamp.
- A geofence failure is recorded as an exception for review rather than silently discarded.
- Browser GPS cannot prove a device is physically present; spoofing and poor accuracy remain operational risks.

## Secrets and external setup
Copy `.env.example` to `.env.local`; never commit real secrets. Configure Convex and the identity provider in their respective dashboards. Sensitive identity documents require private object storage with short-lived signed access; do not expose public URLs.

## Current delivery state
This branch contains the initial Next.js application foundation, a first-pass Convex domain schema, and a GPS punch mutation. This is **not yet a complete or deployable HRM product**. Remaining work includes auth-provider integration, server-side authorization coverage, remaining domain functions, UI migration, file security, notifications, test coverage, UAT and production deployment.
