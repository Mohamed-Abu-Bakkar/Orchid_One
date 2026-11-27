import { describe, expect, it } from "vitest";
import { classifyAdminError, getAdminErrorMessage } from "./admin-errors";

describe("admin error classification", () => {
  it.each([
    ["UNAUTHENTICATED", "unauthenticated"],
    ["FORBIDDEN", "forbidden"],
    ["SUPERVISOR_REVIEW_REQUIRED", "forbidden"],
    ["ACCOUNT_SUSPENDED", "suspended"],
    ["EMPLOYEE_NOT_FOUND", "not-found"],
    ["REQUEST_ALREADY_DECIDED", "conflict"],
    ["NETWORK_TIMEOUT", "network"],
    ["INVALID_DATE_RANGE", "validation"],
  ] as const)("classifies %s", (message, expected) => {
    expect(classifyAdminError(new Error(message))).toBe(expected);
  });

  it("never exposes unknown backend messages", () => {
    const secret = "INTERNAL_DATABASE_HOST_AND_STACK_TRACE";
    expect(getAdminErrorMessage(new Error(secret))).toBe("We couldn't complete that action. Please try again.");
    expect(getAdminErrorMessage(new Error(secret))).not.toContain(secret);
  });

  it("provides actionable permission guidance", () => {
    expect(getAdminErrorMessage(new Error("FORBIDDEN"))).toContain("don't have permission");
  });
});
