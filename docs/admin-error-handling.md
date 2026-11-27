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
