# Attendance review visibility fix

- The Admin attendance review queue now lists every pending attendance event, including legacy or unclassified pending records that were previously omitted by the geofence-only filter.
- Geofence exceptions retain the existing supervisor recommendation followed by Admin/Super Admin final decision.
- Unclassified pending records can be resolved only by Admin/Super Admin with a mandatory explanatory note.
- Resolving an unclassified record refreshes the affected employee's organization-local attendance day and writes an audit event.
- Supervisors cannot directly approve or reject unclassified pending records.
- The check-in safeguard remains in place: unresolved events still block punches until the appropriate review is completed.

Deployment note: Vercel deployment and Convex function deployment are separate. The new Convex query/mutation must be published to the production Convex deployment before the new review screen can work.
