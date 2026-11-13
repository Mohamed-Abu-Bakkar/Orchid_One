# Admin creatable dropdowns

## Behavior
- Organization master-data dropdowns expose a `＋ Create new` action.
- The shared `CreatableSelect` renders a small inline creation form and selects the newly created value when it is immediately usable.
- Location creation intentionally creates an inactive draft. The draft is not selected until an administrator configures its address and GPS geofence in Location Management.
- Shift creation requires explicit start time, end time, and break duration. No shift schedule is assumed.
- Team creation requires a previously selected shift.
- Work categories and company-document categories are organization-scoped and audit logged.

## Dropdowns covered
- Employee onboarding: department and work location.
- Teams & Work: shift, team, work category, and team target.
- Company Documents: document category.

## Dropdowns intentionally not creatable
- Employee/account selectors choose existing records; employees are created through Employee Onboarding to avoid partial or duplicate employee records.
- Employment type, employee status, priority, and assignment target are controlled business enums. Arbitrary values would bypass validation and reporting rules.
- Policy category is a controlled taxonomy validated by the backend; adding values requires a deliberate schema/business-rule change.

## Security and persistence
- Creation mutations require supervisor or superadmin authorization and scope records to the current organization.
- New master-data records are persisted in Convex and audited.
- Existing work assignments retain their category text so later catalog changes do not rewrite historical assignments.
