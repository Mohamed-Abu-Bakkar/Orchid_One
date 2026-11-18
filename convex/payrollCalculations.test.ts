import { describe, expect, it } from "vitest";
import {
  calculateRegularMinutes,
  calculateVerifiedWorkIntervals,
  localDateTimeUtc,
} from "./payrollCalculations";

const minute = 60_000;
const at = (hour: number, minuteOfHour = 0) => Date.UTC(2026, 0, 15, hour, minuteOfHour);

describe("hourly payroll attendance calculations", () => {
  it("pays actual worked time for a late arrival and excludes breaks", () => {
    const intervals = calculateVerifiedWorkIntervals([
      { eventType: "check_in", receivedAt: at(9, 30), locationType: "remote" },
      { eventType: "break_start", receivedAt: at(13), locationType: "remote" },
      { eventType: "break_end", receivedAt: at(13, 30), locationType: "remote" },
      { eventType: "check_out", receivedAt: at(18), locationType: "remote" },
    ]);

    expect(intervals).not.toBeNull();
    expect(calculateRegularMinutes(intervals!, at(9), at(18))).toBe(8 * 60);
  });

  it("caps regular hours at shift end so overtime is not double-counted", () => {
    const intervals = calculateVerifiedWorkIntervals([
      { eventType: "check_in", receivedAt: at(9), locationType: "remote" },
      { eventType: "break_start", receivedAt: at(13), locationType: "remote" },
      { eventType: "break_end", receivedAt: at(13, 30), locationType: "remote" },
      { eventType: "check_out", receivedAt: at(19), locationType: "remote" },
    ]);

    expect(intervals).not.toBeNull();
    expect(calculateRegularMinutes(intervals!, at(9), at(18))).toBe(8 * 60 + 30);
    expect(Math.floor((at(19) - at(18)) / minute)).toBe(60);
  });

  it("does not pay work performed before scheduled shift start as regular time", () => {
    const intervals = calculateVerifiedWorkIntervals([
      { eventType: "check_in", receivedAt: at(8), locationType: "remote" },
      { eventType: "check_out", receivedAt: at(18), locationType: "remote" },
    ]);

    expect(intervals).not.toBeNull();
    expect(calculateRegularMinutes(intervals!, at(9), at(18))).toBe(9 * 60);
  });

  it("uses actual verified work when no shift boundaries are configured", () => {
    const intervals = calculateVerifiedWorkIntervals([
      { eventType: "check_in", receivedAt: at(9), locationType: "remote" },
      { eventType: "break_start", receivedAt: at(13) },
      { eventType: "break_end", receivedAt: at(13, 30) },
      { eventType: "check_out", receivedAt: at(19) },
    ]);

    expect(intervals).not.toBeNull();
    expect(calculateRegularMinutes(intervals!)).toBe(9 * 60 + 30);
  });

  it("excludes incomplete, pending-review, and rejected attendance", () => {
    expect(calculateVerifiedWorkIntervals([
      { eventType: "check_in", receivedAt: at(9) },
    ])).toBeNull();

    expect(calculateVerifiedWorkIntervals([
      { eventType: "check_in", receivedAt: at(9), locationType: "remote", reviewStatus: "pending" },
      { eventType: "check_out", receivedAt: at(18) },
    ])).toBeNull();

    expect(calculateVerifiedWorkIntervals([
      { eventType: "check_in", receivedAt: at(9) },
      { eventType: "check_out", receivedAt: at(18), locationType: "remote", reviewStatus: "rejected" },
    ])).toBeNull();
  });

  it("converts organization-local shift times to UTC correctly", () => {
    const result = localDateTimeUtc("2026-01-15", 9 * 60, "Asia/Kolkata");
    expect(new Date(result).toISOString()).toBe("2026-01-15T03:30:00.000Z");
  });
});
