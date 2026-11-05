# Phase 1 requirements register

| ID | Requirement | Agreement | Status |
|---|---|---|---|
| HR-01 | Dashboard: employees, attendance, leave, hours, overtime, approvals | 4.1 | UI foundation |
| AUTH-01 | Secure login, sessions, profile and roles | 4.2 | Integration pending |
| REC-01 | Candidates, resume, interviews, evaluation, offers, status | 4.3 | Schema foundation |
| EMP-01 | Employee profiles, reporting, approvers, benefits, emergency contacts | 4.4 | Schema foundation |
| DOC-01 | Employee supporting documents | 4.5 | Metadata schema; private storage pending |
| HOUR-01 | Hourly workforce, rates, breaks, payable hours, summaries and approvals | 4.6 | Schema foundation; policy pending |
| OT-01 | OT tracking, approval, rate and calculation | 4.6–4.7 | Schema foundation; policy pending |
| ATT-01 | GPS in/out, geofence, history, late/early, hours and reports | 4.7 | Punch mutation foundation |
| LEAVE-01 | Leave applications, approval, balances, history | 4.8 | Schema foundation |
| SHIFT-01 | Shift allocation, changes and schedules | 4.8 | Schema foundation |
| ORG-01 | Policies, org chart, holidays, events, birthdays, appointments, site visits | 4.9 | Partial schema |
| REP-01 | Ten named management reports and applicable exports | 4.10 | Pending |
| DEL-01 | Android app, dashboard, modules, docs, user manual and deployment support | 5 | Android/PWA decision open |

## Working technical decisions
Next.js + TypeScript; Convex; PWA-first; one initial location with location IDs retained; employee and management access; GPS/geofence; hierarchical approvals.

## Required business decisions
Android vs PWA acceptance; geofence radius/accuracy; wage breaks and rounding; daily/weekly/monthly period boundaries; OT eligibility and multipliers; monthly employee treatment; approval chain per request; leave accrual/carry-forward/half-day/holiday rules; document retention and access policy.
