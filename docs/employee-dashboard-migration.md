# Employee dashboard production migration

## Goal
Migrate the original employee mobile dashboard into the authenticated Next.js employee route without redesigning it. The reference source is `OrchidHRM/employee_mobileApp.html`. Preserve its visual hierarchy, screen order, navigation labels, component geometry, colors, typography, and original Orchid logo asset. Do not edit the reference HTML.

## Non-negotiable rules
- Keep the employee route authenticated and employee-scoped.
- Use the existing Better Auth + Convex identity; never trust a client-supplied employee ID.
- Use `api.employee.myWorkspace` for employee-specific workspace data.
- Never display the sample employee (Arun Kumar), sample coworkers, sample attendance, sample wages, sample leave, sample notifications, sample policies, sample dates, or sample contact information from the HTML.
- Do not enable demo-only actions such as simulated check-in, simulated upload, fake request submission, fake feedback submission, fake policy acknowledgement, fake downloads, or fake notification read actions.
- Keep the original HTML file unchanged as a design reference.
- Use the exact checked-in logo from `OrchidHRM/assets/android/launchericon-192x192.png`; do not redraw it or replace it with an icon/glyph.

## Confirmed screen-to-data mapping

| Original screen | Production source / behavior |
| --- | --- |
| Home | Authenticated employee profile, assigned shift, today's attendance, leave balances, latest wage record, recent attendance |
| Attendance | Attendance events for the signed-in employee; punch action uses existing geofence-aware Convex mutation |
| Working Hours | Only derive totals when the attendance event model supports an unambiguous calculation; otherwise show records and an explanatory empty/unavailable state |
| Payslips / My Wages | Employee wage records and wage-period metadata; do not invent PDF downloads or earnings/deduction breakdowns |
| Requests | Existing leave requests and balances are read-only until leave creation and calculation rules are approved |
| Documents | Employee documents; upload through Convex Storage and show HR review status |
| Performance | Do not fabricate metrics; show an unavailable state until performance data and metric definitions exist |
| Notifications | Display only the signed-in user's notification records; mark-as-read stays disabled until a mutation exists |
| Team by shifts | Preserve the original section and layout; show an empty state until team visibility and authorization rules are defined |
| Policies | Use actual policy records only; no hardcoded policy catalog or acknowledgement action |
| Helpdesk | Preserve the screen; explain that ticket/chat workflow is not configured until routing and SLA rules are defined |
| Profile / More | Employee profile fields and sign-out; unknown fields remain unavailable |

## Backend constraints
- Account registration creates a user profile, not an employee record.
- HR must link the user to an employee record through `users.employeeId`.
- If no valid employee link exists, show the explicit “Employee profile not linked” state and disable employee actions.
- Attendance requires an active linked employee and a valid active assigned location/geofence.
- Do not infer leave date counting, weekend/holiday treatment, half-day rules, accrual, or approval routing.
- Do not infer helpdesk routing, SLA, support phone numbers, or policy contents.

## Implementation sequence
1. Replace the current redesigned employee portal with a componentized React migration of the original HTML structure.
2. Move original CSS into scoped styles without changing its visual values; load the original exact logo from a local public asset.
3. Port navigation and screen state into React; remove inline event handlers and direct DOM mutation.
4. Bind each supported screen to the authenticated Convex workspace.
5. Wire only supported mutations: attendance punch and employee document upload.
6. Add honest empty/loading/error states for unimplemented or unconfigured workflows.
7. Check mobile layout against the reference at the original 430px maximum width and at wider desktop widths.
8. Run lint, TypeScript, build, and manual browser checks for unauthenticated, unlinked, linked, suspended, and role-mismatch states.

## Acceptance criteria
- Original source HTML is unchanged.
- Exact original logo asset is used.
- No sample employee/coworker names, fake amounts, fake dates, fake attendance, fake notifications, fake policies, or invented contact details are visible in production.
- Every screen navigation action works without inline script or direct DOM mutation.
- Employee data is fetched only for the authenticated user and is never selected by a client-provided employee ID.
- Attendance and document upload call real Convex mutations and surface server errors.
- Unimplemented workflows do not claim success.
- Loading, empty, unlinked, and error states are understandable and accessible.
- The app passes lint, typecheck, build, and the manual checks above.
