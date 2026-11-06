# Orchid One — Codex Implementation Handoff

> **Purpose:** This document is the implementation brief for Codex or another terminal-enabled coding agent working in this repository. It is not evidence that the implementation has already been completed.

## 1. Repository and working rules

- Repository: https://github.com/Mohamed-Abu-Bakkar/Orchid_One
- Required branch: `feature/orchid-one-production`
- Production app: `https://orchid-one.cusptech.dev`
- Production Convex URL: `https://giant-clam-371.convex.cloud`
- Production Convex HTTP Actions URL: `https://giant-clam-371.convex.site`

Before editing:
1. Check `git status` and `git branch --show-current`.
2. Fetch the remote and confirm the feature branch exists.
3. Work only on `feature/orchid-one-production`; never commit directly to `main`.
4. Preserve uncommitted user changes. Do not reset, force-push, or overwrite work.
5. Commit in small, reviewable units.
6. Do not deploy or migrate production without explicit approval.

**Production data safety:** The owner initially selected the production Convex deployment for development. This is unsafe for an HR system containing employee information, attendance, wages and documents. Treat the production deployment as release-only. Create/use a separate Convex development deployment for all local development, test registrations, test punches, schema experiments and automated tests. If no separate development deployment is configured, stop before any command or mutation that could touch production and explain the required setup. Do not point local `.env.local` at production.

## 2. Environment setup

Install dependencies after checking the existing package manager and lockfiles. The repository previously had no lockfile; if that is still true and npm is used, generate and commit `package-lock.json`.

Create local `.env.local` using the **development** deployment values:

```env
NEXT_PUBLIC_CONVEX_URL=https://YOUR-DEV-DEPLOYMENT.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://YOUR-DEV-DEPLOYMENT.convex.site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Start/configure the development deployment with the current Convex CLI and set its server-side environment:

```bash
npx convex dev
openssl rand -base64 32
npx convex env set SITE_URL http://localhost:3000
npx convex env set BETTER_AUTH_SECRET "YOUR_UNIQUE_DEVELOPMENT_SECRET"
```

Run the Convex CLI commands against the development deployment explicitly. Verify the selected deployment before every push or environment mutation.

Production Vercel variables (Production environment only):

```env
NEXT_PUBLIC_CONVEX_URL=https://giant-clam-371.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://giant-clam-371.convex.site
NEXT_PUBLIC_SITE_URL=https://orchid-one.cusptech.dev
```

Production Convex environment (configure only during an approved production release):

- `SITE_URL=https://orchid-one.cusptech.dev`
- `BETTER_AUTH_SECRET` = a separately generated production secret, never reused from development.

Never commit secrets, tokens, credentials, signing keys or real employee data. Do not put `BETTER_AUTH_SECRET` in a public `NEXT_PUBLIC_*` variable. Keep development and production secrets separate.

Remove obsolete Clerk and Cloudflare R2 environment variables after confirming no remaining code references. The agreed stack uses Better Auth and Convex storage.

## 3. Role and assignment

Act as the senior full-stack architect, technical lead, backend and frontend engineer, database architect, security engineer, DevOps engineer and QA lead for Orchid One.

This is an existing application. Inspect it before changing it. Do not scaffold a replacement project or blindly replace working code.

Use the existing Next.js App Router, React, TypeScript, Convex and CSS/design system where suitable. Use the official Better Auth Convex component integration. Use Capacitor for Android packaging. Vercel hosts the Next.js application.

Do not introduce Clerk, a separate PostgreSQL database, Cloudflare R2, S3, a separate FastAPI backend or a custom password/session implementation.

Consult current official documentation before implementing version-sensitive integrations:
- https://labs.convex.dev/better-auth/framework-guides/next
- https://better-auth.com/docs/integrations/convex

Use the actual installed versions and current official APIs. Do not rely on stale snippets.

## 4. Scope boundary

Implement Phase 1 HRM based on the signed Orchid One agreement. The broader proposal may describe future business capabilities; do not silently add sales, procurement, inventory, CRM or unrelated modules to Phase 1.

Phase 1 includes:
- HR dashboard
- Authentication and role management
- Employee management
- Recruitment and candidates/interviews
- Employee onboarding and documents
- Attendance management
- Hourly workforce management
- Shifts and working hours
- Overtime requests
- Wage rates, wage periods and wage records
- Leave requests and balances where supported by approved rules
- Approval workflows
- Organization and location configuration
- Policies and holidays
- Notifications
- Reports
- Technical documentation and user manual
- Android application packaging

Do not invent payroll formulas, statutory rates, tax treatment, leave accrual, overtime multipliers, travel rules, break deductions, rounding, proration or other client business rules. Where requirements are missing, implement safe data capture/configuration only, clearly mark the calculation or workflow as awaiting business approval, and document the open question.

## 5. Mandatory repository audit

Inspect at minimum:
- `package.json` and lockfiles
- all `src/app` routes
- all React components
- `convex/schema.ts` and all Convex functions
- authentication and authorization code
- `.env.example` and environment references
- existing CSS/design system
- PWA manifest/service worker/assets
- original `OrchidHRM/` prototype
- tests and deployment configuration

Read `convex/_generated/ai/guidelines.md` if present. If missing, follow current Convex documentation and project conventions; do not invent generated files.

First produce a concise audit of architecture, existing functionality, incomplete work, auth/security risks, data migration risks, missing business rules and proposed execution sequence. Then proceed with implementation unless a real blocker makes work unsafe.

## 6. Authentication — Better Auth + Convex

Remove Clerk completely, including dependencies, providers, middleware, environment variables, references and obsolete configuration.

Use the official Better Auth Convex component integration. Do not create custom password storage or duplicate session tables. Generate the component schema using the official CLI command for the installed version; do not hand-write generated component schema.

Implement:
- Email/password registration
- Login and logout
- Persistent sessions
- Session-aware Next.js provider and route handling
- Authenticated Convex function access
- Safe unauthorized/forbidden handling
- Protected routes
- Correct JWT/auth configuration for the official integration

Email verification is deliberately deferred. Do not claim an address is verified, and do not fake a verification flow. Document the future email-provider and verification work. Apply appropriate abuse/rate-limit protections supported by the chosen setup.

## 7. Roles and account lifecycle

Roles:
- `superadmin`
- `admin`
- `hr_manager`
- `department_manager`
- `supervisor`
- `employee`

Account statuses:
- `pending`
- `active`
- `rejected`
- `suspended`

Role and account status are separate. A role promotion must never automatically activate an account.

New public registrations receive role `employee` and status `pending`. Pending/rejected/suspended users must not access employee or admin business data; allow only the minimum account-status view and sign-out.

Never trust role, account status, employee ID or organization ID supplied by the browser. Enforce authorization in every protected Convex query, mutation and action. Hiding UI controls is not security.

Initial superadmin bootstrap:
1. Register the first account.
2. Locate the linked Better Auth user and application profile using the real generated schema.
3. Provision `superadmin` and `active` through a documented, controlled, one-time administrative procedure.
4. Verify access.
5. Disable or lock the bootstrap path after successful initialization.

Do not guess Better Auth internal table names or edit undocumented component internals. Do not expose a public role-promotion mutation. Once initialized, authorized admins approve/reject new accounts. Prevent self-approval. Restrict privileged role changes to superadmin or explicitly authorized actors. Audit every approval, rejection, suspension and role change.

## 8. Organization bootstrap

The existing application schema includes organizations and organization-scoped records. Provision one Orchid Flowers organization; do not create one organization per registrant.

Create a protected, idempotent one-time bootstrap process for the organization and initial location. It must not be callable by arbitrary public users and must not create duplicates. Use actual schema and supported Convex tooling. Document how to execute and verify it.

## 9. Routes and access behaviour

Implement:
- `/` — employee portal
- `/admin` — administrator portal
- `/login` — shared login
- `/register` — public registration
- `/pending-approval` — pending account status
- `/rejected` — rejected status
- `/suspended` — suspended status

Unauthenticated protected-route requests go to login. Active employees access employee features. Only authorized active administrators access admin features. Pending/rejected/suspended accounts cannot access business data. Prevent redirect loops and handle loading/error states. The root route must not render the admin shell.

## 10. UI preservation — critical requirement

The original `OrchidHRM/` prototype is the visual source of truth.

Inspect and preserve:
- `OrchidHRM/index.html` — admin UI
- `OrchidHRM/employee_mobileApp.html` — employee mobile UI
- `OrchidHRM/code.html` — profile/detail reference
- `OrchidHRM/css/design-system.css`
- `OrchidHRM/css/mobile.css`
- `OrchidHRM/css/web.css`
- `OrchidHRM/js/data.js`
- `OrchidHRM/js/icons.js`
- `OrchidHRM/js/web.js`

Preserve layout, colors, typography, spacing, navigation, responsive behaviour, icons and interaction patterns. Do not redesign or substitute a generic admin template. Convert the static prototype into real reusable React/TypeScript components and React event handling. Do not use an iframe as the production application.

Keep the employee UI mobile-first and admin UI responsive. Reuse existing styles where practical. Demo data and hardcoded sample policies are not production data or approved business rules. Replace demo content with Convex queries and honest empty states. Avoid dependence on external profile-image URLs; use stored profile data and sensible fallbacks.

## 11. Convex database and persistence

Convex is the sole source of truth for application data. Do not use localStorage, sessionStorage, browser state or hardcoded arrays as persistent application data.

Inspect and preserve useful existing tables, including:
- organizations, locations, departments
- users, employees, employeeDocuments
- candidates, interviews
- shifts, shiftAssignments
- attendanceEvents, attendanceDays
- leaveTypes, leaveBalances, leaveRequests
- wageRates, overtimeRequests, wagePeriods, wageRecords
- approvalWorkflows, approvalRequests, approvalActions
- policies, holidays, notifications, auditLogs

Avoid duplicate concepts and destructive migrations. Use Convex validators for all public function arguments and return values where appropriate. Use indexes for important query paths, organization scoping on every relevant operation, pagination for potentially large datasets, and bounded reads. Avoid unbounded `.collect()`.

Use Convex document IDs and validate relationships. Maintain audit history for sensitive operations.

For schema evolution, use staged migrations: add optional fields, safely backfill, validate, then tighten constraints. Never delete or rewrite production data as part of ordinary development.

## 12. File storage and privacy

Use Convex built-in file storage:
- Upload with `ctx.storage.store()`.
- Store the resulting storage ID in the business record.
- Resolve access URLs with `ctx.storage.getUrl()` only after authorization.
- Do not store file bytes in ordinary database documents.

Validate file type and size. Enforce ownership and organization access. Record metadata and relevant audit events. Employee documents contain sensitive information: do not assume a generated storage URL is private. Assess the URL access model and implement an authenticated download approach where necessary. No R2/S3.

## 13. Attendance

Implement and preserve:
- Punch-in and punch-out
- GPS coordinates captured at punch time only
- GPS accuracy
- Location association
- Configurable geofence validation
- Client timestamp and server receipt timestamp
- Idempotency protection
- Audit events and attendance history

Do not track GPS continuously. Do not invent the geofence radius; make it configurable and document that Orchid Flowers must approve it.

Handle duplicate requests, network failure, invalid accuracy, outside-geofence punches, missing/inactive employees, repeated requests, device clock manipulation and GPS spoofing limitations. Do not claim GPS alone prevents spoofing. Do not silently rewrite historical attendance.

## 14. Hourly workforce and wages

Support data and workflows for effective-dated wage rates, working hours, shifts, break records, overtime requests, wage periods, wage records, approvals and history.

Do not invent formulas, overtime multipliers, statutory deductions, tax, break deduction, rounding, salary proration or leave salary rules. Separate data capture from calculations when rules are not approved. Mark unapproved calculations clearly.

Approved wage records must be immutable. Corrections must be auditable adjustments, not silent overwrites. Do not describe a basic wage summary as statutory payroll compliance.

## 15. Recruitment, onboarding, leave and approvals

Recruitment: candidate records, resume/document storage, interview scheduling, evaluation records, offer status and workflow.

Onboarding: employee profile, employee ID, department/designation association, reporting hierarchy, document uploads and onboarding status.

Leave and shifts: request submission/history, shift assignments, approval/rejection, balances only where approved rules exist.

Approval infrastructure must be configurable by request type. Prevent duplicate actions and unauthorized self-approval. Audit all sensitive decisions. Do not invent leave entitlement or accrual rules.

## 16. Notifications and reports

Persist notifications in Convex, with recipient targeting and read/unread state. Do not claim push notifications work unless an actual push provider and device flow are integrated and tested.

Reports must use real Convex data, with appropriate date filters, pagination and authorization. Never show fabricated totals or demo figures. Provide honest empty states.

## 17. Capacitor Android

The agreement requires an Android application. Use Capacitor to package the mobile-first employee experience after the web application works.

Inspect existing PWA configuration before changing it. Implement Capacitor configuration, Android project, icons/splash assets where available, HTTPS production origin, required permissions only, location permission handling for attendance, camera/file selection if needed, network failure handling, session behaviour and Android back navigation.

Do not embed secrets or privileged credentials. Do not assume the Next.js dev server is a production origin. The Android app must connect to the deployed HTTPS application/backend.

Before setting the Android application ID, propose a reverse-domain ID and request approval; do not guess a client-approved identifier. Document Android SDK requirements and signed release build steps. Never commit signing keys/passwords. Validate the Android build if the environment has the required SDK; otherwise report exactly what remains unverified.

## 18. Security and code quality

Enforce server/backend authorization, account status, role permissions, organization isolation, input validation, file authorization, audit logging and safe errors. Protect against privilege escalation, IDOR, self-approval and arbitrary client-supplied tenant/role values. Never log passwords, tokens or sensitive documents.

Use modular feature-oriented architecture and existing conventions. Separate UI, feature modules, auth, authorization, Convex queries/mutations, validation, shared types and utilities where useful. Maintain TypeScript strictness. Avoid giant components, duplicated logic, unnecessary abstractions, unjustified `any`, magic numbers, dead code and insecure shortcuts.

## 19. Tests and verification

Add and run appropriate unit, integration and end-to-end tests for:
- Authentication and sessions
- Registration and pending state
- Approval and rejection
- Role authorization and privilege escalation
- Employee/admin route access
- Organization isolation
- Attendance duplicate punches and geofence validation
- File authorization
- Wage-record immutability and adjustment history
- Empty/loading/error states

Run the actual available project commands, including:
```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Also run the required Better Auth schema generation, Convex code generation and development deployment validation. Adapt commands to the actual package manager and installed scripts. Do not report a test as passing unless it ran successfully. Record failures and environment limitations accurately.

## 20. Documentation

Create/update:
- `README.md`
- `docs/architecture.md`
- `docs/authentication-and-authorization.md`
- `docs/database-schema.md`
- `docs/environment-setup.md`
- `docs/deployment.md`
- `docs/android-build.md`
- `docs/security.md`
- `docs/testing.md`
- `docs/business-rules-pending.md`
- `docs/first-admin-bootstrap.md`
- `docs/user-manual.md`

Include architecture and Mermaid diagrams where useful, route map, auth flow, permission matrix, data model, storage approach, environment variables, local setup, deployment and rollback, Android build, tests, unresolved business rules and limitations.

## 21. Phased execution

Execute in this order:
1. Repository audit and baseline checks.
2. Dependency/auth migration from Clerk to Better Auth.
3. Account lifecycle, roles, organization bootstrap and route protection.
4. React migration of employee and admin prototype UI.
5. Convex persistence and Phase 1 module integration.
6. Capacitor Android packaging.
7. Testing, security review and documentation.
8. Production release preparation.

At each phase, report files changed, key decisions, commands/tests actually run, results, blockers and commit SHA. Continue independent work if one module is blocked. Ask a focused question only where guessing could affect security, data integrity, payroll correctness or contractual scope.

## 22. Production release gate

Do not deploy or migrate production automatically. Before production release:
1. Verify feature branch changes and development deployment.
2. Confirm production environment variables and secrets are configured in the correct environment.
3. Establish a production backup/recovery point.
4. Review schema migration and rollback plan.
5. Verify organization and first-superadmin bootstrap.
6. Review security-sensitive changes.
7. Obtain explicit owner approval.
8. Deploy using the approved workflow.
9. Run production smoke tests for auth, employee/admin portals, document access and attendance.
10. Record deployment and rollback instructions.

Never run destructive production migrations automatically.

## 23. Acceptance criteria

The work is complete only when:
- Better Auth works through the official Convex integration and Clerk is removed.
- Public registration creates pending employee accounts.
- Role and account status are independent.
- First superadmin provisioning is secure and documented.
- Backend authorization and organization isolation are enforced.
- `/` is the employee portal and `/admin` is the admin portal.
- Original OrchidHRM design is preserved and implemented in React, not an iframe.
- Phase 1 data persists in Convex; no demo arrays are treated as live data.
- Convex file storage is used with appropriate access control.
- Attendance validation and audit history work.
- No unapproved payroll/business formulas are invented.
- Capacitor Android project and build instructions are present.
- Typecheck, lint, tests and build results are recorded truthfully.
- Required documentation is updated.
- Production remains unchanged until explicit approval.

**Start now:** inspect the current feature branch and prototype, report the audit, then implement phase by phase. Do not stop at a plan, and do not claim completion without verification.
