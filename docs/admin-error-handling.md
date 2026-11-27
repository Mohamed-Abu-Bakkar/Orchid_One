# Admin and Supervisor Error Handling

## Purpose
Provide consistent, safe, and recoverable error feedback throughout the Orchid One Admin Panel, including supervisor-facing modules.

## Architecture
- `src/lib/admin-errors.ts`: classifies known auth, authorization, suspension, validation, conflict, missing-record, and connectivity errors. It maps them to user-safe messages and never forwards unknown backend messages to the UI.
- `src/components/admin/admin-error-state.tsx`: reusable inline or full-page error presentation for module-level failures.
- `src/components/admin/admin-error-boundary.tsx`: React error boundary for unexpected render and query failures. It creates a short incident reference, logs diagnostic details to the browser console, and offers recovery/navigation actions.
- `AdminAccessGuard`: wraps session/account verification in the error boundary.
- `AdminShell`: isolates each active module so a failure in one module does not take down the whole Admin Panel. Changing modules resets the failed boundary.

## Error behavior
| Category | User experience |
| --- | --- |
| Unauthenticated | Sign in again |
| Suspended account | Contact organization administrator |
| Forbidden / role restriction | Explain missing permission; do not offer retry |
| Validation | Ask the user to review invalid fields |
| Missing record | Explain that the record is no longer available and refresh |
| Conflict / already processed | Explain that the record changed and refresh before another action |
| Network / connection | Offer retry when the operation is safe |
| Unknown mutation failure | Show a neutral fallback; do not expose server message |
| Unexpected render/query failure | Boundary fallback with incident reference |

## Security and consistency
- Backend authorization remains authoritative. Hiding navigation or showing a restriction message is not an authorization control.
- Do not display raw Convex errors, stack traces, database details, or internal identifiers to end users.
- Preserve current form state when a mutation fails; do not automatically replay a mutation.
- Retrying a failed module re-renders the section. Users should verify the latest record state before repeating an action whose outcome is uncertain.
- Diagnostic console output is not a durable centralized observability service. A production telemetry sink can be added later with privacy and retention requirements.

## Validation
Unit tests cover error classification, supervisor permission restrictions, and suppression of unknown backend messages. CI must run unit tests, typecheck, lint, and production build before merge.


## Actionable cause reporting
- Error parsing checks the common Convex error locations (message, data, and cause) and extracts only recognized uppercase error codes.
- Known business error codes map to a specific title and next step. For example, `HOURLY_RATE_NOT_CONFIGURED` tells the administrator to configure an active hourly wage rate before approving overtime.
- Inline mutation errors and render error boundaries show the explanation and an expandable technical code.
- Unknown errors deliberately do not expose arbitrary backend text, stack traces, database details, or environment data. They state that the exact cause was not provided and retain the incident reference for support.
- Add a specific entry to `codeMessages` and a regression test whenever a new backend business error is introduced. This keeps the user explanation accurate without leaking implementation details.
- This improves diagnosis of known application errors. It does not replace centralized server-side observability; network failures and unexpected infrastructure errors may still need support logs to identify their root cause.

## Release gate
- Run the production build after admin workspace JSX changes. Conditional tab sections and modal overlays must each remain inside the intended React fragment boundaries.
- A production release is complete only after Vercel reports the deployment as `READY`.
