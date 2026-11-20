# Hourly Workforce — automatic payable-hour workflow

## Behaviour
- Regular hourly payable minutes are calculated from complete, verified attendance intervals.
- Recorded break intervals are deducted automatically.
- When a shift exists, regular work is clipped to the configured shift start and end. When no shift is assigned, verified work less breaks is used.
- Regular hourly payable time does not require a supervisor suggestion or Superadmin approval.
- Approved overtime remains separate and is included only from approved overtime requests.
- Payroll generation remains an explicit administrative workflow; calculated attendance is not itself a payment or payroll approval.

## Exception handling
The Hourly Workforce view withholds regular payable hours and displays an actionable reason when:
- A punch is pending review or has been rejected.
- Check-in/check-out or break events are incomplete or out of sequence.
- Multiple shifts are assigned to the same employee and work date.
- The assigned shift is missing, inactive, overnight, or invalid.
- Attendance evidence is not verified (including unresolved geofence evidence).
- No applicable hourly wage rate exists for the work date.

Resolve attendance evidence in Attendance Reviews / Geofence Exceptions, correct shift assignments in Shifts & Schedules, or configure the applicable rate in Wage Management. The query does not silently convert invalid evidence into payable time.

## Role boundaries
- Supervisors can view hourly attendance and regular-hour calculations and submit attendance recommendations where the attendance-review workflow permits.
- Admins and Superadmins can perform final attendance exception decisions and manage wage configuration.
- Regular payable-hour entry and approval controls are removed from Hourly Workforce for every role.
- Server-side authorization remains authoritative; the UI is not a security boundary.

## Historical data
Existing hourly wage review records are retained for audit/history compatibility but are no longer used by the Hourly Workforce screen to calculate regular payable hours. Existing approved or locked payroll snapshots are not rewritten.
