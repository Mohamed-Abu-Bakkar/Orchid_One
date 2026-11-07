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
- Supervisors can submit an overtime request for an active employee, work date, requested minutes and reason.
- Superadmin approves or rejects. Rejection requires a note.
- Approved minutes cannot exceed requested minutes.
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
- Overtime earnings = approved overtime request minutes × applicable hourly rate / 60 × configured overtime multiplier.
- Currency is stored in integer paise; displayed calculations are rounded to the nearest paise.
- Regular and overtime earnings are separate.
- No default overtime multiplier, overtime eligibility threshold or rounding policy is inferred.
- No daily payable-day calculation is implemented.

## Data model
- `employeeCompensation`: permanent monthly compensation history.
- `salaryComponents`: organization salary component catalogue.
- `wageRates`: effective-dated hourly and daily employee rates; hourly records may include an overtime multiplier.
- `hourlyWageReviews`: regular payable-hours suggestion and approval history.
- `overtimeRequests`: overtime request and decision lifecycle.
- `attendanceEvents`: source attendance evidence.
- `auditLogs`: actor and action history.

## Known limitations and decisions not inferred
- Overnight shifts crossing midnight are not paired across work dates. A shift/workday attribution policy is required.
- Daily wage rate configuration is implemented, but payable-day and partial-day calculation is not.
- Overtime request submission is supervisor-initiated on behalf of an employee; employee self-service request submission is not implemented.
- Overtime request approval does not independently define legal/statutory eligibility.
- No wage-period generation, payslips, payments, statutory deductions, tax, PF, leave proration or accounting workflow is implemented.
- Existing legacy hourly review records may contain suggested overtime minutes. New regular-hour submissions use zero overtime; approved overtime now comes from `overtimeRequests`. Historical data should be reconciled before payroll use.

## QA checklist
- Configure hourly and daily rates with valid effective dates; reject wrong employment types, inactive employees, invalid amounts and duplicate effective dates.
- Confirm hourly rate and multiplier are selected for the work date.
- Confirm attendance pairing, breaks, incomplete punches and pending geofence events.
- Confirm supervisors can submit regular payable hours only and cannot approve.
- Confirm regular payable hours cannot exceed recorded work and require a configured hourly rate.
- Confirm overtime requests require a valid date, positive whole minutes and reason.
- Confirm only Superadmin can decide overtime requests; approved minutes cannot exceed requested minutes; rejection requires a note.
- Confirm approved overtime requests contribute to overtime earnings separately from regular earnings.
- Confirm cross-organization IDs are rejected and audit records are created.
- Confirm no sample business records are inserted.
