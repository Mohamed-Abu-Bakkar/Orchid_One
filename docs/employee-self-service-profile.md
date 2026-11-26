# Employee self-service profile

## Scope
Employees can open More → Settings (or More → Profile) to update first name, last name, date of birth, and optional emergency contact. Employee ID, designation, department, joining date, employment status, payroll and compensation remain HR-controlled.

Email and mobile number are read-only until a verified identity/contact-change workflow exists. Unverified identity changes can compromise account recovery and notifications.

## Authorization and validation
- Convex mutation: `employee.updateMyProfile`.
- Requires an authenticated active employee linked to an employee record in the same organization.
- Employee and organization IDs are derived from the authenticated identity; client-supplied record IDs are not accepted.
- Name lengths and DOB are validated server-side. DOB must be a real calendar date, from 1900-01-01 through today.
- Emergency contact is optional. If any field is supplied, name, relationship and a 7–15 digit phone number are required.
- An empty emergency contact clears the saved value.
- A no-op save does not create an audit record.

## Audit and privacy
Actual changes create an `auditLogs` entry with action `employee.profile.updated`, changed field names and before/after values. DOB and emergency-contact details are sensitive; audit-log readers must remain restricted to authorized HR/admin roles and must not expose these snapshots to ordinary employee queries.

## Contact verification follow-up
Future email/phone editing must verify control of the new address/number, prevent duplicate account identities, update auth identity and employee contact consistently, and audit the transition.

## QA checklist
- Settings opens from More → Account and Profile.
- Employee can update name, DOB and emergency contact.
- Invalid/future DOB and partial emergency contact are rejected server-side.
- Clearing all emergency fields removes the saved contact.
- Employee cannot target another employee or change employment fields.
- Inactive/unlinked accounts cannot update.
- No-op saves do not create audit records.
- Successful saves appear in the realtime employee workspace.
