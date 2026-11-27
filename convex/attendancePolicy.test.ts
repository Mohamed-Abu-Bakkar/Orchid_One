import { describe, expect, it } from "vitest";
import {
  getOrganizationWorkDate,
  shouldBlockAttendancePunch,
  type AttendanceReviewEvent,
} from "./attendancePolicy";

const event = (
  eventType: AttendanceReviewEvent["eventType"],
  receivedAt: string,
  reviewStatus: AttendanceReviewEvent["reviewStatus"] = "pending",
): AttendanceReviewEvent => ({
  eventType,
  receivedAt: new Date(receivedAt).getTime(),
  reviewStatus,
});

describe("attendance next-day punch policy", () => {
  it("uses the organization's timezone to determine the work date", () => {
    const timestamp = new Date("2026-11-16T18:45:00.000Z").getTime();
    expect(getOrganizationWorkDate(timestamp, "Asia/Kolkata")).toBe("2026-11-17");
    expect(getOrganizationWorkDate(timestamp, "America/Los_Angeles")).toBe("2026-11-16");
  });

  it("allows a new-day check-in when yesterday's pending geofence check-in was closed by midnight auto-checkout", () => {
    const pendingYesterdayCheckIn = event("check_in", "2026-11-16T03:00:00.000Z");
    const generatedCheckout = event("check_out", "2026-11-16T18:29:59.999Z", undefined);

    expect(shouldBlockAttendancePunch(
      "2026-11-17",
      [pendingYesterdayCheckIn],
      "Asia/Kolkata",
      generatedCheckout,
    )).toBe(false);
  });

  it("allows a new-day check-in when the only pending event is a prior-day checkout", () => {
    const priorCheckout = event("check_out", "2026-11-16T16:00:00.000Z");
    expect(shouldBlockAttendancePunch(
      "2026-11-17",
      [priorCheckout],
      "Asia/Kolkata",
      priorCheckout,
    )).toBe(false);
  });

  it("blocks when any pending event belongs to the current workday", () => {
    expect(shouldBlockAttendancePunch(
      "2026-11-17",
      [
        event("check_out", "2026-11-16T16:00:00.000Z"),
        event("check_in", "2026-11-17T03:00:00.000Z"),
      ],
      "Asia/Kolkata",
      event("check_out", "2026-11-16T16:00:00.000Z"),
    )).toBe(true);
  });

  it("blocks a new-day punch when the previous session is still open", () => {
    expect(shouldBlockAttendancePunch(
      "2026-11-17",
      [event("check_in", "2026-11-16T03:00:00.000Z")],
      "Asia/Kolkata",
      event("break_start", "2026-11-16T11:00:00.000Z"),
    )).toBe(true);
  });

  it("blocks when the previous session has no checkout, even without a pending review", () => {
    expect(shouldBlockAttendancePunch(
      "2026-11-17",
      [],
      "Asia/Kolkata",
      event("check_in", "2026-11-16T03:00:00.000Z", undefined),
    )).toBe(true);
  });

  it("allows a new-day check-in after a completed prior session", () => {
    expect(shouldBlockAttendancePunch(
      "2026-11-17",
      [],
      "Asia/Kolkata",
      event("check_out", "2026-11-16T16:00:00.000Z", undefined),
    )).toBe(false);
  });

  it("does not let rejected prior events keep a session open when the caller selects the latest non-rejected event", () => {
    expect(shouldBlockAttendancePunch(
      "2026-11-17",
      [],
      "Asia/Kolkata",
      event("check_out", "2026-11-16T16:00:00.000Z", "approved"),
    )).toBe(false);
  });
});
