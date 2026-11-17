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
 * Blocks a punch for any unresolved event from today, or any unresolved
 * non-checkout event from an earlier workday. A prior-day pending checkout
 * is allowed only when the previous session is actually closed.
 */
export function shouldBlockAttendancePunch(
  currentWorkDate: string,
  pendingEvents: AttendanceReviewEvent[],
  timeZone: string,
  latestPriorNonRejectedEvent?: AttendanceReviewEvent,
): boolean {
  const blockingPendingEvent = pendingEvents.some((event) => {
    const eventWorkDate = getOrganizationWorkDate(event.receivedAt, timeZone);
    return eventWorkDate === currentWorkDate || event.eventType !== "check_out";
  });

  if (blockingPendingEvent) return true;

  return Boolean(
    latestPriorNonRejectedEvent &&
    latestPriorNonRejectedEvent.eventType !== "check_out",
  );
}
