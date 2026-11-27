# Monthly leave accrual

## Policy

- An administrator configures a monthly accrual amount per leave type, in half-day increments.
- The policy becomes effective on the first day of the next calendar month in the organization's configured timezone.
- For the employee's first eligible accrual month only: joining days 1–14 receive the full monthly amount; joining day 15 or later receive half.
- Subsequent eligible months receive the full configured amount.
- Employees who have not joined before an accrual month receive no credit for that month.
- Unused available leave carries into the next calendar year. Pending requests are not included in the carried available amount.
- Leave requests remain limited to one calendar year and must be split at year boundaries, matching the existing request workflow.

## Data model

- `leaveTypes.monthlyAccrual` stores the monthly entitlement. `monthlyAccrualStartMonth` stores the first eligible accrual month.
- `leaveAccruals` is an append-only credit ledger indexed by employee, leave type, and accrual month. The index lookup makes daily retries idempotent.
- `leaveBalances` remains the operational balance used by the existing request and approval workflow. A new year's monthly balance opens with the previous year's available amount (`allocated - used - pending`); new monthly credits increase the current year's allocation.

## Processing

A daily Convex cron runs a catch-up mutation. For each active employee and configured leave type, it checks every eligible month from the policy start month through the organization's current local month. Existing ledger entries are skipped; missing credits are inserted and applied to the appropriate year balance in the same mutation.

## API and permissions

- `leave.setMonthlyAccrual`: organization-admin mutation; validates 0–31 days in 0.5-day increments and records an audit log.
- `leave.runMonthlyLeaveAccrual`: internal scheduled mutation; not callable by clients.
- Annual default and individual override mutations reject leave types configured for monthly accrual.

## Existing data and assumptions

Existing annual balance rows are retained as the opening balance when a leave type is switched to monthly accrual. This avoids deleting already-earned/used/pending history. Existing annual defaults are hidden from the monthly type's entitlement controls and are not used as a fallback for new monthly balances. The feature does not retroactively create credits before the configured effective month. A live Convex schema/function deployment is required before the feature can operate in production.

## Verification

Unit tests cover next-month eligibility, joining-day proration, full recurring credits, year boundaries, and invalid inputs. The existing leave request and approval integration continues to use `leaveBalances`; requests across calendar years still require separate requests.
