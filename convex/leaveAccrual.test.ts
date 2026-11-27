import { describe, expect, it } from "vitest";
import { calculateMonthlyAccrual, nextCalendarMonth, previousCalendarMonth } from "./leaveAccrual";

describe("monthly leave accrual policy", () => {
  it("starts credits on the next calendar month", () => {
    expect(calculateMonthlyAccrual(1, "2026-11-01", "2026-11")).toBe(0);
    expect(calculateMonthlyAccrual(1, "2026-11-01", "2026-12")).toBe(1);
  });
  it("grants full first credit for joining days 1–14", () => {
    expect(calculateMonthlyAccrual(1, "2026-11-01", "2026-12")).toBe(1);
    expect(calculateMonthlyAccrual(1, "2026-11-14", "2026-12")).toBe(1);
  });
  it("grants half first credit from joining day 15 onward", () => {
    expect(calculateMonthlyAccrual(1, "2026-11-15", "2026-12")).toBe(0.5);
    expect(calculateMonthlyAccrual(1, "2026-11-30", "2026-12")).toBe(0.5);
  });
  it("grants the full monthly amount after the joining month", () => {
    expect(calculateMonthlyAccrual(1.5, "2026-11-30", "2027-01")).toBe(1.5);
  });
  it("handles year boundaries", () => {
    expect(previousCalendarMonth("2027-01")).toBe("2026-12");
    expect(nextCalendarMonth("2026-12")).toBe("2027-01");
    expect(calculateMonthlyAccrual(2, "2026-12-16", "2027-01")).toBe(1);
  });
  it("rejects invalid amounts, dates, and months", () => {
    expect(() => calculateMonthlyAccrual(0.3, "2026-11-10", "2026-12")).toThrow("INVALID_MONTHLY_LEAVE_ACCRUAL");
    expect(() => calculateMonthlyAccrual(1, "2026-02-30", "2026-03")).toThrow("INVALID_ACCRUAL_DATE");
    expect(() => previousCalendarMonth("2026-13")).toThrow("INVALID_ACCRUAL_MONTH");
  });
});
