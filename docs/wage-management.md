# Wage and Workforce Management

## Module boundaries

### Wage Management
- Permanent employees: effective-dated monthly compensation with fixed amount and employee-specific salary components.
- Hourly employees: effective-dated hourly rate and explicitly configured overtime multiplier.
- Daily employees: effective-dated daily rate.
- Salary components can be earnings or manual deductions. A reason is required for a manual deduction.
- Historical configurations are retained; duplicate employee/effective-date rate records are rejected.
- Daily rate configuration does not calculate payable days. Partial-day, holiday, leave, absence and proration rules remain undefined.

### Hourly Workforce
- Displays actual paired attendance and break evidence in the organization timezone.
- Flags incomplete punch sequences and pending geofence review.
- Supervisors submit regular payable hours with a reason.
- Superadmin approves or rejects regular payable hours; rejection requires a note.
- Approval validates that regular payable minutes do not exceed recorded work minutes and that an applicable hourly rate exists.
- This module does not submit or approve overtime requests. Overtime is managed in the separate Overtime module.

### Overtime
- At checkout, verified attendance is compared with the assigned shift end for hourly employees. Extra minutes are calculated from actual post-shift work intervals minus overlapping breaks.
- Automatically detected overtime is first placed in `awaiting_employee_confirmation`. The employee can confirm or decline it in My Requests. Confirmation moves it to the supervisor review queue; decline records a decision and excludes it from payroll.
- Manual employee-submitted overtime minutes are disabled so requests cannot bypass attendance validation.
- Superadmin approves or rejects. Rejection requires a note.
- Approved minutes cannot exceed requested/detected minutes. Superadmin may reduce the approved minutes.
- Superadmin may override the multiplier for an individual request (1×–10×). The employee's permanent wage-rate configuration is never changed.
- The configured employee multiplier is used when present; missing multiplier defaults to 1×. The configured multiplier, optional override, applied multiplier and hourly-rate snapshot are retained on the approved request.
- Submitter/reviewer metadata and audit events are retained.
- Approved overtime requests are joined into hourly workforce earnings for the same employee/work date, using the applicable hourly rate and configured multiplier.
- Overtime request records are separate from regular payable-hour reviews. Only approved overtime requests contribute to overtime earnings.

## Authorization
- Wage-rate creation and hourly payable-hour approval: Superadmin only.
- Hourly payable-hour suggestions and overtime request submission: Supervisor only.
- Overtime approval/rejection: Superadmin only.
- All backend operations validate organization ownership and employee status/type as applicable.
- Employee-facing users cannot call admin mutations.

## Calculations currently supported
- Recorded work minutes = paired check-in/check-out duration minus paired break duration.
- Regular earnings = approved regular minutes × applicable hourly rate / 60.
- Overtime earnings = each approved request's approved minutes × its rate snapshot / 60 × its applied multiplier. Pending, employee-unconfirmed and rejected requests contribute zero.
- Currency is stored in integer paise; displayed calculations are rounded to the nearest paise.
- Regular and overtime earnings are separate.
- Default overtime multiplier is 1× when no employee multiplier is configured. Per-request admin override is supported.
- No daily payable-day calculation is implemented.

## Data model
- `employeeCompensation`: permanent monthly compensation history.
- `salaryComponents`: organization salary component catalogue.
- `wageRates`: effective-dated hourly and daily employee rates; hourly records may include an overtime multiplier.
- `hourlyWageReviews`: regular payable-hours suggestion and approval history.
- `overtimeRequests`: overtime request and decision lifecycle.
- `attendanceEvents`: source attendance evidence.
- `auditLogs`: actor and action history.

## Payroll workflow\n- Superadmin configures each payroll period from the Workforce > Payroll screen using an explicit start and end date; monthly and weekly are labels, not hardcoded date boundaries. Custom periods are supported. Any overlapping period is rejected to prevent duplicate payroll.\n- Generation creates a draft `wagePeriod` and one draft `wageRecord` per eligible employee. Draft payroll is administrator-only.\n- Monthly employees use the latest effective permanent compensation record as of the period end. Fixed monthly pay and configured earning/deduction components are applied without joining, exit, absence or leave proration.\n- Daily employees receive one configured daily-rate unit for each finalized present/late attendance day with a checkout and positive payable minutes. Partial-day proration is not applied.\n- Hourly employees receive approved regular minutes from `hourlyWageReviews` and approved overtime requests. Each daily regular-hours line and overtime line is calculated using the applicable effective rate; approved overtime uses its rate snapshot and multiplier.\n- Superadmin can add one-time earnings or deductions/advances to draft records. A reason is required and all adjustments are audited. Deductions cannot make net pay negative.\n- Superadmin reviews employee-level gross, deductions and net amounts, then approves the period. Approval publishes immutable payslip snapshots to employees. Locking closes the period.\n- Employees can view approved/locked payslips and use browser Print / Save as PDF. Payroll approval is not proof of bank transfer; payment tracking is not implemented.\n- Payroll records retain employee identity, period, line items, rate/calculation details, notes, payslip number and calculation version. Changes to compensation after generation do not rewrite existing snapshots.\n\n## Known limitations and decisions not inferred
- Overnight shifts crossing midnight are not paired across work dates. A shift/workday attribution policy is required.
- Daily wage rate configuration is implemented, but payable-day and partial-day calculation is not.
- Overtime is auto-detected at checkout and requires employee confirmation before supervisor/Superadmin review.
- Overnight shifts are excluded from automatic overtime detection until an explicit cross-midnight work-date attribution policy is defined.
- Automatic overtime detection currently applies to hourly employees with an active assigned/default shift and fully verified, complete attendance sequences.
- Overtime request approval does not independently define legal/statutory eligibility.
- Payroll period generation, approval/locking and employee payslips are implemented. Payment tracking, statutory deductions, tax, PF, ESI, professional tax, leave proration, partial-day rules and accounting integration are not implemented.
- Existing legacy hourly review records may contain suggested overtime minutes. New regular-hour submissions use zero overtime; approved overtime now comes from `overtimeRequests`. Historical data should be reconciled before payroll use.

## QA checklist
- Configure hourly and daily rates with valid effective dates; reject wrong employment types, inactive employees, invalid amounts and duplicate effective dates.
- Confirm hourly rate and multiplier are selected for the work date.
- Confirm attendance pairing, breaks, incomplete punches and pending geofence events.
- Confirm supervisors can submit regular payable hours only and cannot approve.
- Confirm regular payable hours cannot exceed recorded work and require a configured hourly rate.
- Confirm verified checkout creates attendance-day summaries and auto-detects post-shift work after subtracting breaks.
- Confirm the employee must confirm or decline detected overtime before it enters admin review.
- Confirm only approved overtime contributes to earnings; default multiplier is 1×; admin overrides are per request and do not alter the employee wage rate.
- Confirm overnight shifts, incomplete punches, pending geofence reviews and non-hourly employees do not create automatic overtime.
- Confirm only Superadmin can decide overtime requests; approved minutes cannot exceed requested minutes; rejection requires a note.
- Confirm approved overtime requests contribute to overtime earnings separately from regular earnings.\n- Confirm custom payroll date ranges, overlapping-period rejection, draft generation, employee-level review, manual adjustments, approval, locking and employee payslip access.\n- Confirm draft payroll is hidden from employees, approved/locked payslips are visible only to their owner, and a later compensation change does not alter an issued payslip.\n- Confirm deductions exceeding gross pay are rejected and manual adjustments are audit logged.
- Confirm cross-organization IDs are rejected and audit records are created.
- Confirm no sample business records are inserted.
