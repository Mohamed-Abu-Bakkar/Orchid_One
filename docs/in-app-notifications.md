# In-app notifications

## Scope
- Authenticated Admin and Super Admin accounts receive organization-scoped alerts for employee leave submissions and overtime confirmations/declines.
- Employees receive notifications for assigned work (existing workflow), leave decisions, and overtime decisions.
- Each account reads only notifications addressed to its own user record.
- Notifications are persisted in the existing `notifications` table.

## API
- `notifications.listMine`: latest 50 records and unread count for the authenticated user.
- `notifications.markRead`: marks one notification read after verifying both user and organization ownership.
- `notifications.markAllRead`: marks up to the latest 500 notifications read and reports whether the result was truncated.

## UI
- Admin notification bell in the authenticated admin header with unread badge, live list, individual read action, and mark-all-read.
- Employee notification screen displays real records and read state; actions are bridged from the static employee shell to authenticated Convex mutations in the parent application.
- Legacy sample notification data, fixed unread count, and fake mark-all-read action were removed.

## Delivery
- Organization admin alerts are delivered to active Admin and Super Admin accounts only.
- Employee alerts are delivered to active accounts linked to the affected employee record.
- Notification creation happens in the same Convex mutation as the originating business action, so failed business writes do not leave orphan notifications.

## Limitations
- This is in-app delivery only; push, email, and SMS are not included.
- Mark-all-read operates on the latest 500 notifications per user per request. The API returns a `truncated` flag if more exist.
- The first admin-triggered event integrated in this release is employee leave submission. Other workflow events should be added deliberately as each workflow's state transitions are reviewed.
