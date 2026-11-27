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


## Progressive profile completion

- On first employee workspace entry, an authenticated active employee with no \`profileCompletedAt\` sees a guided five-step completion flow: residential address, date of birth, emergency contact, bank details, and review.
- Address and DOB are required. Emergency contact and bank details are optional; each optional section must be either fully completed or left blank.
- The wizard sends one final submission to \`employee.completeMyProfile\`. The mutation derives the employee and organization from the authenticated identity and validates every field server-side.
- The profile completion marker prevents the wizard from reappearing on subsequent workspace visits. Existing DOB values are prefilled for employees who previously completed the DOB-only prompt.
- Bank account number and IFSC are validated server-side. Bank details are encrypted with AES-256-GCM before being written to \`employees.bankDetailsEncrypted\`. The raw bank details are not returned by \`employee.myWorkspace\` and are not included in audit metadata.
- Configure the Convex environment variable \`ORCHID_BANK_DETAILS_ENCRYPTION_KEY\` with a base64-encoded, randomly generated 32-byte key before enabling bank-detail submissions. Generate it with \`openssl rand -base64 32\`. Keep it only in Convex environment settings and a managed secrets vault; never commit it, add it to Vercel unless separately needed, or send it in chat. Without the key, submissions containing bank details are rejected while submissions that omit bank details remain available.
- Audit action \`employee.profile.completed\` records only the submitted field names, not the submitted values.

### Progressive completion QA checklist

- First-time employee sees the wizard; completed employee does not see it again.
- Existing DOB is prefilled when the employee had previously completed the DOB-only prompt.
- Required address and DOB validation rejects invalid or missing values.
- Emergency contact and bank fields accept all-empty optional sections and reject partial sections.
- Invalid phone, PIN, DOB, bank account number, and IFSC values are rejected server-side.
- Bank details are not returned by the workspace query and are not copied into audit metadata.
- Bank submission fails closed when the encryption key is missing or malformed.
- With the key configured, ciphertext is stored and no plaintext bank values are persisted.
- Cross-employee and cross-organization updates are impossible because the mutation accepts no employee ID.
