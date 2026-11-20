import { describe, expect, it } from "vitest";
import { calculateShiftWorkBuckets } from "./attendanceTimePolicy";

const t = (hour: number, minute = 0) => new Date(2026, 10, 16, hour, minute).getTime();
const event = (eventType: "check_in"|"check_out"|"break_start"|"break_end", hour: number, minute=0) => ({eventType, receivedAt:t(hour,minute)});

describe("shift-window attendance calculation", () => {
  it("counts early and late work as overtime, regular only inside shift", () => {
    const result = calculateShiftWorkBuckets([
      event("check_in", 11), event("break_start", 14), event("break_end", 14,30), event("check_out", 22),
    ], t(12,30), t(21));
    expect(result.regularMinutes).toBe(8*60);
    expect(result.overtimeMinutes).toBe(90+60);
    expect(result.breakMinutes).toBe(30);
  });

  it("deducts breaks from the relevant regular/overtime buckets", () => {
    const result = calculateShiftWorkBuckets([
      event("check_in", 11), event("break_start", 11,30), event("break_end", 12), event("break_start", 20,30), event("break_end", 21,30), event("check_out", 22),
    ], t(12,30), t(21));
    expect(result.regularMinutes).toBe(8*60-30);
    expect(result.overtimeMinutes).toBe(90);
  });
});
