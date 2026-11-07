# Wage Management

## Hourly workforce — implemented workflow

### Admin dashboard capabilities
- Superadmin configures an employee-specific hourly rate and overtime multiplier with an effective-from date.
- Rate revisions are append-only; an employee cannot receive two rate records with the same effective date.
- Hourly attendance rows show first check-in, last check-out, total paired attendance duration, paired break duration, and recorded work duration (attendance less recorded breaks).
- A supervisor explicitly suggests regular payable minutes and overtime minutes as separate values and supplies a reason.
- Superadmin approves or rejects the supervisor submission. A rejection requires a note.
- Only approved regular and overtime minutes contribute to the displayed earnings breakdown.
- Regular earnings and overtime earnings are calculated and displayed separately. Overtime minutes are not included in regular payable minutes.
- Rate and approval actions are recorded in the organization audit log.

### Authorization
- Hourly rate configuration: Superadmin only.
- Payable-hours suggestion: Supervisor only.
- Payable-hours approval/rejection: Superadmin only.
- Every operation validates organization ownership and employee employment type on the server.
- Employee-facing users cannot call these admin operations.

### Calculation
- Recorded work minutes = paired check-in/check-out duration minus paired break duration.
- Regular earnings = approved regular minutes × hourly rate / 60.
- Overtime earnings = approved overtime minutes × hourly rate / 60 × configured overtime multiplier.
- Currency is stored as integer paise. Calculated rupee amounts are rounded to the nearest paise.
- The multiplier is configured per employee rate record; no default multiplier is assumed.
- Recorded attendance is evidence only. It does not automatically become payable time.
- Supervisor suggestions are explicit and require a reason; Superadmin approval is the only status that contributes to earnings.

### Data model
- `wageRates`: employee-specific hourly rate, optional overtime multiplier, effective date, and Superadmin approver.
- `hourlyWageReviews`: one daily submission per employee with recorded work/break minutes, separately suggested regular/overtime minutes, decision, approver and review timestamps.
- Existing `salaryComponents` and `employeeCompensation` remain the permanent monthly compensation configuration.

## Permanent employee monthly configuration
- Maintain an organization-wide salary component catalogue.
- Classify components as earnings or manual deductions.
- Archive and reactivate catalogue components.
- Configure fixed monthly amount and/or employee-specific component amounts with an effective-from date.
- Require a reason for manual deductions.
- Retain historical configurations; do not overwrite prior effective-dated records.

## Known limitations and decisions not inferred
- Daily wage review is based on local calendar date in the organization's configured timezone. Overnight attendance spanning midnight is not paired across dates in this initial implementation and requires a separately defined workday/shift attribution rule.
- If attendance events are incomplete or out of sequence, the day is flagged and cannot be submitted for payable-hours review.
- Events with pending geofence review cannot be submitted.
- No wage-period generation, payslip, payment, statutory deduction, tax, PF, leave proration, or accounting workflow is implemented.
- The overtime multiplier value is supplied by Superadmin during rate configuration; no business default is assumed.
- No automatic overtime eligibility threshold or rounding policy is inferred.
- Daily/weekly/monthly wage periods and daily/contract employee wage calculations remain outside this hourly workflow.

## QA checklist
- Configure hourly rate and multiplier; reject zero/negative rate, multiplier below 1 or above 10, invalid dates, wrong employment type, and duplicate effective date.
- Confirm historical rates are selected according to each work date.
- Confirm attendance pairing, multiple check-in/out sessions, breaks, incomplete punches, and out-of-sequence events.
- Confirm pending geofence events block supervisor submission.
- Confirm supervisor can submit separate regular and overtime minutes with a reason but cannot approve.
- Confirm Superadmin can approve or reject; rejection requires a note.
- Confirm employee/cross-organization IDs are rejected.
- Confirm only approved hours produce earnings and overtime remains separate.
- Confirm audit logs for rate creation, submission, approval and rejection.
- Confirm no sample records are inserted.


## Dedicated admin modules — initial implementation
- Wage Management separates permanent monthly compensation from hourly and daily effective-dated employee rate configuration.
- Daily rates are configuration records only. Payable-day, partial-day, holiday, leave and absence rules are not inferred or calculated.
- Hourly Workforce owns attendance evidence, supervisor suggestions and Superadmin approval for hourly payable hours. Wage Management no longer contains the operational attendance-review screen.
- Overtime provides supervisor request submission and Superadmin approval/rejection with required rejection note, approved-minute validation, organization scoping and audit events.
- Overtime request records retain submitter and reviewer metadata. Existing records remain readable because new audit fields are optional.
- The Overtime module reviews request records; it does not define eligibility thresholds, rounding, statutory treatment or payroll formulas.
- The overtime request workflow is distinct from the existing hourly payable-hours review. Before payroll integration, Orchid Flowers must confirm whether both approvals are required or whether one approval source should become authoritative.
