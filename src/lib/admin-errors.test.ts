import { describe, expect, it } from "vitest";
import { classifyAdminError, getAdminErrorDetails, getAdminErrorMessage } from "./admin-errors";

describe("admin error classification and explanation", () => {
  it.each([
    ["UNAUTHENTICATED", "unauthenticated"],
    ["FORBIDDEN", "forbidden"],
    ["SUPERVISOR_REVIEW_REQUIRED", "forbidden"],
    ["ACCOUNT_SUSPENDED", "suspended"],
    ["EMPLOYEE_NOT_FOUND", "not-found"],
    ["OVERTIME_REQUEST_ALREADY_DECIDED", "conflict"],
    ["NETWORK_TIMEOUT", "network"],
    ["INVALID_DATE_RANGE", "validation"],
    ["HOURLY_RATE_NOT_CONFIGURED", "configuration"],
  ] as const)("classifies %s", (message, expected) => {
    expect(classifyAdminError(new Error(message))).toBe(expected);
  });

  it("explains known business errors instead of showing a generic failure", () => {
    const details = getAdminErrorDetails(new Error("Uncaught Error: HOURLY_RATE_NOT_CONFIGURED"));
    expect(details.title).toBe("Hourly rate is missing");
    expect(details.message).toContain("Configure an active hourly wage rate");
    expect(details.code).toBe("HOURLY_RATE_NOT_CONFIGURED");
  });

  it("explains the cause when the Convex error is nested in data", () => {
    const details = getAdminErrorDetails({
      message: "Server Error",
      data: "OVERTIME_REQUEST_ALREADY_DECIDED",
    });
    expect(details.title).toBe("Overtime request already processed");
    expect(details.kind).toBe("conflict");
  });

  it("never exposes unknown backend messages or stack traces", () => {
    const secret = "INTERNAL_DATABASE_HOST_AND_STACK_TRACE";
    expect(getAdminErrorMessage(new Error(secret))).toContain("couldn't identify the exact cause");
    expect(getAdminErrorMessage(new Error(secret))).not.toContain(secret);
  });

  it("provides actionable permission guidance", () => {
    expect(getAdminErrorMessage(new Error("FORBIDDEN"))).toContain("role does not allow");
  });
});
