# Shift-window payroll and historical midnight checkout correction

## Behaviour
- Regular attendance minutes are limited to verified work overlapping the assigned shift window.
- Verified work before shift start and after shift end is combined into an overtime request.
- Break minutes are deducted from whichever regular/overtime time window they overlap.
- Overtime remains subject to the existing employee confirmation and approval workflow.
- The midnight job closes the previous organization-local workday and can catch up missed days; it is idempotent because it skips already-closed sessions.
- A final `break_end` event is a valid open work session and is closed by the synthetic checkout.
- Historical repair is exposed only as an internal mutation and must be explicitly run against production for the selected employee and dates.

## Historical repair command
After deploying Convex, run this exact, employee-code-scoped internal mutation:

```bash
npx convex run --prod attendance:backfillMidnightCheckouts '{"employeeCode":"ORC-0004","workDates":["2026-11-15","2026-11-16"]}'
```

The mutation preserves original attendance events, skips days with pending reviews, inserts system-generated checkout events at local day end, recalculates regular attendance, creates overtime requests when verified work exists outside the shift, and records an audit entry. Inspect its returned per-date statuses before allowing payroll generation.

## Limitations
- Overnight shifts are intentionally excluded until cross-workday attribution is defined.
- Historical days with pending reviews are not modified.
- The historical repair must not be run against a payroll period already approved or locked without first following the payroll correction process.
