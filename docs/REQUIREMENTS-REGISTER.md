# Orchid One Phase 1 – Requirements register

| ID | Requirement | Agreement section | Implementation status |
|---|---|---|---|
| HR-01 | Dashboard with employee, attendance, leave, hours, overtime and pending approvals | 4.1 | Foundation only |
| AUTH-01 | Secure login, password/session/profile and role access | 4.2 | Provider configuration pending |
| REC-01 | Candidate registration, resume, interviews, evaluation, offer and status | 4.3 | Schema foundation |
| EMP-01 | Employee profile, ID, job, employment, reporting/approver, benefits, emergency contact and records | 4.4 | Schema foundation |
| DOC-01 | Store employee supporting documents | 4.5 | Metadata schema; private storage integration pending |
| HOUR-01 | Hourly employees, wage rates, effective dates, breaks, payable hours and summaries | 4.6 | Schema foundation; rules pending |
| OT-01 | Overtime tracking, approval, rates and calculation | 4.6–4.7 | Schema foundation; rules pending |
| ATT-01 | GPS login/logout, geofence, history, late/early, hours and reports | 4.7 | Punch mutation foundation |
| LEAVE-01 | Leave application, approval, balances and history | 4.8 | Schema foundation |
| SHIFT-01 | Shift allocation, change requests and schedules | 4.8 | Partial schema |
| ORG-01 | Policies, org chart, holidays, events, birthdays, appointments and site visits | 4.9 | Partial schema |
| REP-01 | Ten named reports and export where applicable | 4.10 | Not implemented |
| DEL-01 | Android app, admin dashboard, authentication, modules, documentation, manual and deployment assistance | 5 | Android/PWA decision unresolved |

## Confirmed project direction (working decisions)
- Single initial operating location, while retaining location IDs in location-sensitive records.
- Employee and management access.
- GPS + geofence attendance.
- Hierarchical approvals.
- Next.js PWA + Convex as current technical direction.

## Decisions requiring client/business confirmation
1. PWA replacing Android deliverable, or Android package required?
2. Geofence radius and accuracy threshold.
3. Punch-only GPS vs any additional location collection.
4. Break treatment and payable-minute rounding.
5. Daily, weekly and monthly wage period boundaries.
6. Overtime eligibility, approval and rate calculation.
7. Monthly employee treatment: profile/salary display vs calculated monthly payable amount.
8. Approval role chain for each request type and delegation/escalation rules.
9. Leave accrual, carry-forward, holidays and half-day rules.
10. Document retention, visibility and access policy.
