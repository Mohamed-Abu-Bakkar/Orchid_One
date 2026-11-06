# Admin Dashboard

## Purpose
The admin dashboard is a read-only, organization-scoped operational overview backed by Convex. Business metrics and activity are loaded from persisted records; the UI must not substitute sample data when a source is empty.

## Data source
The public query `api.dashboard.getOverview` is implemented in `convex/dashboard.ts`. It requires an admin identity and scopes organization-owned records to the authenticated admin's organization.

The reporting date is calculated using the organization's configured IANA timezone. The current organization configuration uses `Asia/Kolkata`; the query falls back to that timezone only if the organization record or timezone is unavailable.

## Dashboard sections and source tables

| Section | Convex source |
|---|---|
| Employee totals and employment mix | `employees` |
| Today's attendance and 14-day trend | `attendanceDays` |
| Approved leave today and pending leave | `leaveRequests` |
| Pending overtime | `overtimeRequests` |
| Workflow approvals | `approvalRequests` |
| Geofence exceptions | `attendanceEvents` |
| Recruitment candidates and interviews | `candidates`, `interviews` |
| Departments, locations and shifts | `departments`, `locations`, `shifts` |
| Today's work assignment progress | `workAssignments`, `workAssignmentProgress` |
| Policy status | `policies` |
| Company document status | `companyDocuments` |
| Wage period and wage record status | `wagePeriods`, `wageRecords` |
| Upcoming holidays | `holidays` |
| Current admin's notifications | `notifications` |
| Recent organization audit activity | `auditLogs` |

## Empty-state behavior
- Empty collections produce zero counts and an explicit empty state for the corresponding section.
- No placeholder employee, attendance, leave, recruitment, wage, holiday, notification, or audit records are created.
- The dashboard does not estimate wages or calculate payroll.
- Attendance hours are the sum of the stored `attendanceDays.payableMinutes` values for the reporting date. The dashboard does not derive payable time from raw punches.

## Security and privacy
- Query access is protected by `requireAdmin`.
- Organization-owned tables are queried using organization indexes.
- Interview records are fetched through candidate IDs belonging to the current organization.
- Wage records are fetched through this organization's wage periods and filtered against this organization's employee IDs.
- Notifications are limited to the authenticated admin user.
- Recent activity is limited to the current organization.

## Known limitations / follow-up
- Dashboard data is queried live; no aggregate snapshots or caching layer is introduced.
- Some collections are read in full for accurate counts. Add pagination, denormalized counters, or scheduled aggregates after measuring organization scale and query cost.
- Attendance is based on `attendanceDays`. If the attendance processing pipeline has not generated a day record, raw punch events are not treated as a completed attendance-day metric.
- Approval counts are shown by source rather than combined into one total because the same business request may also have an approval workflow record.
- Wage figures are counts/statuses only. No wage estimate, amount, or payroll formula is inferred.
- UI and query require validation with a running development Convex deployment. GitHub file updates do not execute builds or tests.

## QA checklist
1. Empty organization: all metrics show zero and all record-based sections show empty states.
2. Add employees of each employment type/status: total, active, and employment mix update.
3. Add attendance-day records for today and prior 13 days: status counts, payable time, and trend update.
4. Add approved leave spanning today and pending leave requests: only approved requests contribute to on-leave-today.
5. Add pending overtime, workflow, and geofence review records: each category updates independently.
6. Add candidates and interviews: recruitment totals are limited to the organization.
7. Add work assignments and progress: today's task counts match persisted progress records.
8. Add wage periods/records: counts update without displaying estimated compensation.
9. Add policies, documents, holidays, notifications, and audit logs: their sections update and remain organization/user scoped.
10. Verify timezone boundary behavior around midnight in the organization's configured timezone.
