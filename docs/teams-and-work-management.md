# Teams and Work Management

- Teams belong to one organization and one configured shift.
- Membership is date-based. An employee can be in a different team on another date, but only one active team per date.
- Membership requires an active employee with a shift assignment matching the team's shift on that date.
- Assignments target one employee or a team. Every recipient has an independent status: not_started, in_progress, completed.
- Supervisors and superadmins manage teams and assignments in their organization. Employees can read their own team/work and update only their own progress.
- Team and work changes are audit logged. Linked employee accounts receive in-app notifications for new work.
- Configure shifts and employee shift assignments before setting team membership.
- Employee workspace GET includes team/work. PATCH /api/employee/work updates the logged-in employee's status.
- Completion notes and photo proof are not included in this release.
