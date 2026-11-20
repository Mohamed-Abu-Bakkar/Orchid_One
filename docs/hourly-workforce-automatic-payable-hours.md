# Hourly Workforce — automatic payable-hour calculation

## Calculation rules
- Regular payable minutes are calculated from complete, verified attendance events for active hourly employees.
- Break intervals are deducted from attendance time.
- When a valid shift is assigned, regular time is clipped to the configured shift start and end. Late arrival reduces payable time; work outside the scheduled shift is not regular time.
- When no shift is assigned, verified attendance less breaks is treated as regular time. This fallback should be revisited if Orchid Flowers adopts mandatory shifts for all hourly roles.
- No supervisor-entered regular-hour suggestion or routine admin approval is required.
- Overtime remains separate. Only overtime requests with status `approved` contribute to approved overtime minutes and earnings.
- Payroll generation, approval, locking and payment remain separate workflows. This view is not a payslip or payment record.

## Exception handling
Regular payable minutes are withheld for the affected employee/date when any of these conditions apply:
- `PUNCH_REVIEW_PENDING`: attendance event is awaiting review.
- `PUNCH_REJECTED`: one or more attendance events were rejected.
- `INCOMPLETE_PUNCHES` / `INVALID_ATTENDANCE_SEQUENCE`: missing, overlapping or out-of-order check-in, check-out or break events.
- `MULTIPLE_SHIFTS`: more than one shift assignment exists for the same employee/date.
- `INVALID_SHIFT`: the assigned shift is missing, inactive or belongs to another organization.
- `UNSUPPORTED_SHIFT`: shift times are invalid or cross midnight; overnight shifts require a separate explicit policy.
- `UNVERIFIED_ATTENDANCE`: physical attendance lacks an approved review or passed geofence evidence. Admin-created historical corrections are accepted as audited evidence.
- `HOURLY_RATE_MISSING`: no effective hourly wage rate exists for that work date.

The UI displays the exception code and a plain-language explanation. It directs the reviewer to Attendance Reviews, Shifts & Schedules, or Wage Management as applicable. No partial aggregate is displayed when the attendance query exceeds its safe result limit.

## Role boundaries
- Supervisor, Admin and Superadmin can view the organization-level hourly workforce register, subject to the backend role check.
- Supervisor attendance review actions remain governed by the existing attendance-review workflow. The hourly page does not expose final decision or wage-configuration controls.
- Admin and Superadmin retain final attendance decisions and wage configuration according to existing server-side authorization.
- UI visibility is not a security boundary; every protected operation must continue to enforce authorization in Convex.

## Current attendance correction integration
- Historical open-session corrections are appended as system-generated attendance events by the existing Attendance Review workflow.
- Original punch events remain unchanged and correction metadata remains available for audit.
- System-generated correction events are treated as verified only because they are created by the authorized correction mutation with a documented reason.
- Pending review blockers must be resolved before a session correction is accepted.

## Historical and payroll data
- Existing `hourlyWageReviews` records remain available for audit/history compatibility but no longer determine the regular payable-hour figure shown here.
- Existing approved or locked payroll snapshots are not rewritten by this query.
- The calculated view is a live operational estimate; payroll records are still generated and approved through the Payroll module.
