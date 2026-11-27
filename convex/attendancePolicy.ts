export type AttendanceEventType = "check_in" | "check_out" | "break_start" | "break_end";

export interface AttendanceReviewEvent {
  eventType: AttendanceEventType;
  receivedAt: number;
  reviewStatus?: "pending" | "approved" | "rejected";
}

export function getOrganizationWorkDate(timestamp: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(timestamp));
}

/**
 * Blocks punches for unresolved events on the current workday.
 *
 * An unresolved event from an earlier workday remains in the review queue,
 * but it must not prevent a new-day punch once the previous session is closed.
 * The latest prior non-rejected event is the source of truth for session
 * closure; a non-checkout means the employee still has an unfinished session.
 */
export function shouldBlockAttendancePunch(
  currentWorkDate: string,
  pendingEvents: AttendanceReviewEvent[],
  timeZone: string,
  latestPriorNonRejectedEvent?: AttendanceReviewEvent,
): boolean {
  const hasPendingEventToday = pendingEvents.some(
    (event) => getOrganizationWorkDate(event.receivedAt, timeZone) === currentWorkDate,
  );

  if (hasPendingEventToday) return true;

  return Boolean(
    latestPriorNonRejectedEvent &&
    latestPriorNonRejectedEvent.eventType !== "check_out",
  );
}
