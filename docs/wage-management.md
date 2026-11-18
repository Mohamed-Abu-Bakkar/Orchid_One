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
- Regular hourly payable time is calculated automatically from complete, verified attendance events; breaks are excluded.
- Regular payable time is capped at the scheduled shift window: early time before shift start and work after shift end are not included as regular hours. Late arrival reduces actual payable time; grace periods affect attendance classification only.
- Post-shift work is calculated separately and contributes to payroll only after the existing employee-confirmation and supervisor/Superadmin overtime approval workflow.
- Incomplete, pending-review, rejected, or exception attendance is excluded from automatic hourly payroll.
- When no shift is configured, verified actual work time less breaks is treated as regular time; overtime cannot be inferred without a shift boundary.
- Multiple assigned shifts on one work date and overnight/invalid shifts are rejected during payroll generation rather than silently producing an inaccurate calculation.
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
- Overtime request records are separate from legacy regular-hour reviews. Only approved overtime requests contribute to overtime earnings.

## Authorization
- Wage-rate creation: Admin/Superadmin according to the wage-rate mutation's role policy.
- Hourly regular payroll calculation: automatic from verified attendance; legacy `hourlyWageReviews` remain historical and are not a prerequisite for payroll-v2.
- Overtime approval/rejection: Superadmin only.
- All backend operations validate organization ownership and employee status/type as applicable.
- Employee-facing users cannot call admin mutations.

## Calculations currently supported
- Recorded work minutes = paired check-in/check-out duration minus paired break duration.
- Regular hourly earnings = verified attendance minutes inside the scheduled shift window, less overlapping breaks, × applicable hourly rate / 60. When no shift is configured, verified actual attendance less breaks is used. Late arrival is paid as actual time worked; grace periods do not add payable minutes.
- Overtime earnings = each approved request's approved minutes × its rate snapshot / 60 × its applied multiplier. Pending, employee-unconfirmed and rejected requests contribute zero.
- Currency is stored in integer paise; displayed calculations are rounded to the nearest paise.
- Regular and overtime earnings are separate.
- Default overtime multiplier is 1× when no employee multiplier is configured. Per-request admin override is supported.
- No daily payable-day calculation is implemented.

## Data model
- `employeeCompensation`: permanent monthly compensation history.
- `salaryComponents`: organization salary component catalogue.
- `wageRates`: effective-dated hourly and daily employee rates; hourly records may include an overtime multiplier.
- `hourlyWageReviews`: legacy regular-hours suggestion and approval history; not consumed by payroll-v2 regular-hour calculations.
- `overtimeRequests`: overtime request and decision lifecycle.
- `attendanceEvents`: source attendance evidence.
- `auditLogs`: actor and action history.

## Payroll workflow\n- Superadmin configures each payroll period from the Workforce > Payroll screen using an explicit start and end date; monthly and weekly are labels, not hardcoded date boundaries. Custom periods are supported. Any overlapping period is rejected to prevent duplicate payroll.\n- Generation creates a draft `wagePeriod` and one draft `wageRecord` per eligible employee. Draft payroll is administrator-only.\n- Monthly employees use the latest effective permanent compensation record as of the period end. Fixed monthly pay and configured earning/deduction components are applied without joining, exit, absence or leave proration.\n- Daily employees receive one configured daily-rate unit for each finalized present/late attendance day with a checkout and positive payable minutes. Partial-day proration is not applied.\n- Hourly employees receive regular payable minutes calculated from verified attendance intervals, clipped to the configured shift start/end and reduced by overlapping breaks. Actual work after shift end is excluded from regular pay and is included only through approved overtime requests. Each daily regular-hours line uses the effective hourly rate; approved overtime uses its rate snapshot and multiplier.
- Hourly payroll generation uses `orchid-payroll-v2`. Existing approved/locked payslip snapshots are never recalculated. If a draft was generated under the previous calculation, delete that draft period and generate it again to apply the new calculation.\n- Superadmin can add one-time earnings or deductions/advances to draft records. A reason is required and all adjustments are audited. Deductions cannot make net pay negative.\n- Superadmin reviews employee-level gross, deductions and net amounts, then approves the period. Approval publishes immutable payslip snapshots to employees. Locking closes the period.\n- Employees can view approved/locked payslips and use browser Print / Save as PDF. Payroll approval is not proof of bank transfer; payment tracking is not implemented.\n- Payroll records retain employee identity, period, line items, rate/calculation details, notes, payslip number and calculation version. Changes to compensation after generation do not rewrite existing snapshots.\n\n## Known limitations and decisions not inferred
- Overnight shifts crossing midnight are not paired across work dates. A shift/workday attribution policy is required.
- Daily wage rate configuration is implemented, but payable-day and partial-day calculation is not.
- Overtime is auto-detected at checkout and requires employee confirmation before supervisor/Superadmin review.
- Overnight shifts are excluded from automatic overtime detection until an explicit cross-midnight work-date attribution policy is defined.
- Automatic overtime detection currently applies to hourly employees with an active assigned/default shift and fully verified, complete attendance sequences.
- Overtime request approval does not independently define legal/statutory eligibility.
- Payroll period generation, approval/locking and employee payslips are implemented. Payment tracking, statutory deductions, tax, PF, ESI, professional tax, leave proration, partial-day rules and accounting integration are not implemented.
- Existing legacy hourly review records may contain suggested regular/overtime minutes. Payroll-v2 ignores those records for regular pay; approved overtime continues to come only from `overtimeRequests`. Draft payroll created under payroll-v1 should be deleted and regenerated. Approved/locked historical snapshots are preserved.

## QA checklist
- Configure hourly and daily rates with valid effective dates; reject wrong employment types, inactive employees, invalid amounts and duplicate effective dates.
- Confirm hourly rate and multiplier are selected for the work date.
- Confirm attendance pairing, breaks, incomplete punches and pending geofence events.
- Confirm hourly regular payroll uses verified attendance directly and does not require a manual regular-hour review.
- Confirm regular hours are clipped to shift start/end, breaks are subtracted, and late arrivals reduce actual payable time.
- Confirm verified checkout creates attendance-day summaries and auto-detects post-shift work after subtracting breaks.
- Confirm the employee must confirm or decline detected overtime before it enters admin review.
- Confirm only approved overtime contributes to earnings; default multiplier is 1×; admin overrides are per request and do not alter the employee wage rate.
- Confirm overnight shifts, incomplete punches, pending geofence reviews and non-hourly employees do not create automatic overtime.
- Confirm only Superadmin can decide overtime requests; approved minutes cannot exceed requested minutes; rejection requires a note.
- Confirm approved overtime requests contribute separately and are never double-counted as regular time; test the no-shift fallback using the stored overtime shift-end snapshot.\n- Confirm custom payroll date ranges, overlapping-period rejection, draft generation, employee-level review, manual adjustments, approval, locking and employee payslip access. Recreate draft periods generated before payroll-v2; never rewrite approved/locked snapshots.\n- Confirm draft payroll is hidden from employees, approved/locked payslips are visible only to their owner, and a later compensation change does not alter an issued payslip.\n- Confirm deductions exceeding gross pay are rejected and manual adjustments are audit logged.
- Confirm cross-organization IDs are rejected and audit records are created.
- Confirm no sample business records are inserted.
