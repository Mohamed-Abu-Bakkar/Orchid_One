# Orchid One Attendance Management

## Scope implemented

The admin Attendance page reads attendance records from the organization's Convex deployment. It does not seed or synthesize attendance data.

- Date-range register, limited to 31 calendar days per request.
- Optional employee filter and text search.
- Employee/day grouping based on the organization's configured timezone.
- Actual check-in, check-out, break-start and break-end event history.
- First recorded check-in and last recorded check-out timestamps.
- Scheduled date-specific shifts where present.
- Geofence pass/fail and pending/rejected review counts.
- Existing geofence exception review workflow remains available separately.
- CSV export of the currently filtered register.
- Organization-scoped access restricted to supervisors and superadmins.
- Results are capped at 5,000 events per request; the UI warns when the cap is reached.

## Data integrity

- `attendanceEvents` remains the immutable source event stream for this view.
- The register does not create attendance rows or fill missing days.
- A day without a recorded event is not displayed as absent.
- A failed geofence event remains visible as an exception; it is not silently discarded.
- Existing review decisions are reflected in the register.
- The register uses server-received timestamps and the organization's configured timezone for day grouping.

## Deliberately not calculated yet

The agreement includes late-entry monitoring, early-logout tracking, working-hour calculation and overtime-hour calculation. These require approved business rules that are not encoded in the current data model/configuration. The Attendance page therefore displays actual timestamps and scheduled shifts but does not infer late/early status, payable hours, break deductions, overtime, or absence.

Before enabling those calculations, confirm:
1. Late-entry grace period (minutes) and whether it differs by shift/location.
2. Early-logout tolerance and whether supervisor approval can override it.
3. Whether working time is first check-in to last check-out or accumulated intervals, and how multiple shifts are handled.
4. Whether breaks are employee-recorded start/end events, manually adjusted by HR, or both; whether any break is automatically deducted.
5. Overtime eligibility, rounding, approval, and rate rules. Do not derive overtime from wage settings without an approved rule.

## QA checklist

- Empty organization: show zero KPI values and an empty state; no rows are inserted.
- Existing punches: group by employee and organization-local date.
- Employee filter: return only the selected employee's events.
- Date range: include the complete local first/last days, including timezone offset.
- Invalid or reversed date range: reject without querying.
- More than 31 days: reject with a clear range limit.
- More than 5,000 events: show the truncation warning and allow narrower filters.
- Check-in/check-out/break events: display in chronological event history.
- Geofence failures: remain visible with review state and accuracy.
- Cross-organization employee IDs: reject.
- Supervisor and superadmin: may view the organization register; employee role cannot.
- CSV: exports the currently filtered rows and uses proper CSV quoting.
