# Wage Management — initial configuration release

## Scope
This release implements admin-side monthly compensation configuration for active permanent employees only. Hourly, daily and contract employees are excluded from this initial screen.

## Admin capabilities
- Maintain an organization-wide salary component catalogue.
- Classify components as earnings or manual deductions.
- Archive and reactivate catalogue components; existing compensation records retain their component references.
- Configure a fixed monthly amount, employee-specific component amounts, or both.
- Require a reason for each manual deduction line.
- Select an explicit effective-from date for each employee compensation configuration.
- View saved and scheduled configuration records per employee.

## Data model
- `salaryComponents`: organization-scoped component catalogue with unique-in-organization name/code validation in the mutation.
- `employeeCompensation`: dated employee configuration containing an optional fixed monthly amount and component amount lines.
- Amounts are stored as integer paise to avoid floating-point currency storage.
- Each configuration is append-only for a given employee/effective date. A duplicate effective date is rejected; existing records are not overwritten.
- Audit log entries are created for component create/archive/reactivate and compensation configuration creation.

## Authorization and validation
- All public operations require an authenticated superadmin or supervisor.
- Employee and component IDs are checked against the caller's organization.
- Only active permanent employees can receive a compensation configuration.
- Only active organization components can be used in a new configuration.
- Duplicate component lines are rejected.
- Manual deduction lines require a non-empty reason.
- Amounts must be non-negative safe integers in paise.

## Explicit non-goals
This release does not calculate gross/net salary, attendance-based proration, leave adjustments, overtime, statutory deductions, tax, PF, payslips, wage runs, approvals, payment records or accounting entries. It does not define whether a fixed monthly amount is inclusive of, or additional to, configured component amounts. Those rules require separate business confirmation before calculation is implemented.

## Next development decisions
- Define how fixed monthly amount interacts with earning and deduction components.
- Define salary revision approval and effective-date cutoff behavior.
- Define monthly wage-period boundaries, attendance/leave adjustments and proration.
- Define wage-run review/approval and payment recording.
- Confirm which deductions, if any, are permitted and what evidence/reason is required.

## QA checklist
- Create earning and deduction components; reject duplicate codes/names.
- Archive a component and verify it cannot be selected for new configurations.
- Configure a fixed monthly amount without components.
- Configure component amounts without a fixed amount.
- Configure both fixed amount and components.
- Verify manual deductions require a reason.
- Verify duplicate component lines and duplicate employee/effective dates are rejected.
- Verify cross-organization employee/component IDs are rejected.
- Verify hourly, daily and contract employees cannot receive monthly permanent compensation configuration.
- Verify audit records are created and prior dated records remain unchanged.
