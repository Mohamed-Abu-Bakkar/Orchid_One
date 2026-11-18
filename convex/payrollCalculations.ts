export interface WorkInterval {
  start: number;
  end: number;
}

export interface VerifiedWorkIntervals {
  work: WorkInterval[];
  breaks: WorkInterval[];
}

export function localDateTimeUtc(date: string, minuteOfDay: number, timeZone: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const target = Date.UTC(year, month - 1, day, Math.floor(minuteOfDay / 60), minuteOfDay % 60);
  let guess = target;
  for (let attempt = 0; attempt < 4; attempt++) {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date(guess));
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const represented = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second));
    const difference = represented - target;
    if (!difference) break;
    guess -= difference;
  }
  return guess;
}

function overlapMs(startA: number, endA: number, startB: number, endB: number) {
  return Math.max(0, Math.min(endA, endB) - Math.max(startA, startB));
}

export function calculateVerifiedWorkIntervals(events: Array<{ eventType: string; receivedAt: number; reviewStatus?: string }>): VerifiedWorkIntervals | null {
  const sorted = [...events].sort((a, b) => a.receivedAt - b.receivedAt);
  if (sorted.some(event => event.reviewStatus === "pending" || event.reviewStatus === "rejected")) return null;
  const work: WorkInterval[] = [];
  const breaks: WorkInterval[] = [];
  let checkIn: number | null = null;
  let breakStart: number | null = null;
  for (const event of sorted) {
    if (event.eventType === "check_in") {
      if (checkIn !== null) return null;
      checkIn = event.receivedAt;
    } else if (event.eventType === "check_out") {
      if (checkIn === null || event.receivedAt <= checkIn) return null;
      work.push({ start: checkIn, end: event.receivedAt });
      checkIn = null;
    } else if (event.eventType === "break_start") {
      if (checkIn === null || breakStart !== null) return null;
      breakStart = event.receivedAt;
    } else if (event.eventType === "break_end") {
      if (breakStart === null || event.receivedAt <= breakStart) return null;
      breaks.push({ start: breakStart, end: event.receivedAt });
      breakStart = null;
    }
  }
  if (checkIn !== null || breakStart !== null || !work.length) return null;
  return { work, breaks };
}

export function calculateRegularMinutes(
  intervals: VerifiedWorkIntervals,
  shiftStartAt?: number,
  shiftEndAt?: number,
) {
  let payableMs = 0;
  for (const interval of intervals.work) {
    const start = Math.max(interval.start, shiftStartAt ?? interval.start);
    const end = Math.min(interval.end, shiftEndAt ?? interval.end);
    if (end <= start) continue;
    let workedMs = end - start;
    for (const pause of intervals.breaks) workedMs -= overlapMs(start, end, pause.start, pause.end);
    payableMs += Math.max(0, workedMs);
  }
  return Math.floor(payableMs / 60000);
}
