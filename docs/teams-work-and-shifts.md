# Teams, Work Assignments, Shifts and Schedules

## Teams & Work
- Create reusable teams tied to a shift template.
- Maintain date-specific team membership. Members must be active employees assigned to the team's shift for that work date.
- An employee cannot be assigned to multiple teams for the same shift/date.
- Assign work to an individual employee or a team for a work date, with category, priority and optional instructions.
- Team assignments create per-member progress records and in-app notifications for linked employee accounts.
- Employees update their own work status (not started, in progress, completed); the admin view summarizes progress.
- Team membership changes are date-scoped; historical membership records are retained as inactive rather than deleted.

## Shifts & Schedules
- Create reusable shift templates with name, start time, end time and break duration.
- Overnight shifts are represented when end time is earlier than start time.
- Assign an employee a default shift and override it with zero or more date-specific shifts.
- Date-specific assignments replace the default shift for that date.
- Reject overlapping shifts within the same day and across adjacent days, including overnight boundaries.
- A shift template cannot be archived while referenced by an active team or any employee shift assignment. This protects historical schedule references.
- Shift changes, assignments and team/work actions are organization-scoped and audited.

## Permissions
- Admin workspace queries and team/shift configuration mutations require an authenticated admin role.
- Employee progress updates require the signed-in user's linked employee record and only permit updates to that employee's own assignment progress.
- Organization ownership is checked for referenced employees, shifts, teams and assignments.

## Boundaries and assumptions
- Shift definitions are scheduling templates, not attendance/payroll policy.
- The configured break duration is descriptive schedule metadata; it is not automatically deducted from attendance or wages.
- No automatic roster generation, recurring pattern, public holiday rules, shift differential, overtime trigger, payroll calculation or employee swap workflow is inferred.
- The current shift assignment model is employee/date/shift. It does not encode assigned headcount, minimum staffing, location coverage, or approval workflows for schedule changes.
- Team work is assigned to the selected work date; changes to team membership after assignment do not rewrite already-created per-employee progress records.
- Work assignment progress is updated by employees through their own portal; administrators can monitor but do not impersonate employees.

## QA checklist
- Create a normal and overnight shift; reject equal start/end times and invalid break durations.
- Assign default and date-specific shifts; confirm the dated schedule overrides the default.
- Reject overlapping same-day and cross-midnight shifts.
- Confirm employees from another organization, inactive employees and inactive shifts cannot be assigned.
- Confirm team membership enforces shift eligibility and prevents duplicate team membership for the same shift/date.
- Assign work to a team and individual; confirm per-employee progress rows and notifications.
- Confirm employee A cannot update employee B's progress record.
- Confirm shift archival is blocked when active teams or schedule assignments reference the shift.
