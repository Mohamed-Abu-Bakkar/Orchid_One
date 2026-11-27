# Supervisor and Admin Error Handling Release

- Release date: 2026-11-27
- Pull request: #18
- Merge commit: 1977f2288cdc4504d8b202a2848c66e2e3975d2f

## Included
- Centralized safe error classification and messaging.
- Admin module error boundaries and recovery states.
- Standardized supervisor/admin mutation failure messages.
- Unit tests for error classification and sensitive-message suppression.

## Validation status
GitHub Actions checks were not reported for the pull request at release preparation time. The release must be verified by the production build/deployment and subsequent application smoke tests.

## Deployment scope
Frontend and shared admin UI only. No Convex schema or backend function changes are included; no Convex deployment is required.
