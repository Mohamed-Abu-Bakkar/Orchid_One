export interface TimedAttendanceEvent {
  eventType: "check_in" | "check_out" | "break_start" | "break_end";
  receivedAt: number;
  reviewStatus?: "pending" | "approved" | "rejected";
}

type Interval = { start: number; end: number };

function overlapMs(interval: Interval, start: number, end: number): number {
  return Math.max(0, Math.min(interval.end, end) - Math.max(interval.start, start));
}

/** Splits verified net work into regular time inside the scheduled shift and overtime outside it. */
export function calculateShiftWorkBuckets(
  events: TimedAttendanceEvent[],
  shiftStartAt?: number,
  shiftEndAt?: number,
) {
  const ordered = [...events].sort((a, b) => a.receivedAt - b.receivedAt);
  const work: Interval[] = [];
  const breaks: Interval[] = [];
  let checkIn: number | null = null;
  let breakStart: number | null = null;

  for (const event of ordered) {
    if (event.reviewStatus === "rejected") continue;
    if (event.eventType === "check_in") {
      if (checkIn !== null) throw new Error("INVALID_ATTENDANCE_SEQUENCE");
      checkIn = event.receivedAt;
    } else if (event.eventType === "check_out") {
      if (checkIn === null || event.receivedAt <= checkIn || breakStart !== null) throw new Error("INVALID_ATTENDANCE_SEQUENCE");
      work.push({ start: checkIn, end: event.receivedAt });
      checkIn = null;
    } else if (event.eventType === "break_start") {
      if (checkIn === null || breakStart !== null || event.receivedAt <= checkIn) throw new Error("INVALID_ATTENDANCE_SEQUENCE");
      breakStart = event.receivedAt;
    } else if (event.eventType === "break_end") {
      if (breakStart === null || checkIn === null || event.receivedAt <= breakStart) throw new Error("INVALID_ATTENDANCE_SEQUENCE");
      breaks.push({ start: breakStart, end: event.receivedAt });
      breakStart = null;
    }
  }
  if (checkIn !== null || breakStart !== null) throw new Error("INCOMPLETE_ATTENDANCE_SEQUENCE");

  const totalWorkMs = work.reduce((sum, interval) => sum + Math.max(0, interval.end - interval.start), 0);
  const totalBreakMs = breaks.reduce((sum, interval) => sum + Math.max(0, interval.end - interval.start), 0);
  const netWorkMs = Math.max(0, totalWorkMs - totalBreakMs);

  if (shiftStartAt === undefined || shiftEndAt === undefined || shiftEndAt <= shiftStartAt) {
    return {
      totalWorkMinutes: Math.floor(totalWorkMs / 60000),
      breakMinutes: Math.floor(totalBreakMs / 60000),
      regularMinutes: Math.floor(netWorkMs / 60000),
      overtimeMinutes: 0,
    };
  }

  const grossRegularMs = work.reduce((sum, interval) => sum + overlapMs(interval, shiftStartAt, shiftEndAt), 0);
  const regularBreakMs = breaks.reduce((sum, interval) => sum + overlapMs(interval, shiftStartAt, shiftEndAt), 0);
  const regularMs = Math.max(0, grossRegularMs - regularBreakMs);
  return {
    totalWorkMinutes: Math.floor(totalWorkMs / 60000),
    breakMinutes: Math.floor(totalBreakMs / 60000),
    regularMinutes: Math.floor(regularMs / 60000),
    overtimeMinutes: Math.floor(Math.max(0, netWorkMs - regularMs) / 60000),
  };
}
