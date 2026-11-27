export type AdminErrorKind =
  | "unauthenticated"
  | "forbidden"
  | "suspended"
  | "not-found"
  | "conflict"
  | "network"
  | "validation"
  | "configuration"
  | "unknown";

export type AdminErrorDetails = {
  kind: AdminErrorKind;
  title: string;
  message: string;
  code?: string;
  technicalDetails?: string;
};

function collectErrorText(error: unknown, depth = 0): string[] {
  if (depth > 3 || error == null) return [];
  if (typeof error === "string") return [error];
  if (error instanceof Error) {
    const nested = "cause" in error ? collectErrorText(error.cause, depth + 1) : [];
    return [error.message, ...nested];
  }
  if (typeof error !== "object") return [];
  const value = error as Record<string, unknown>;
  return [
    ...(typeof value.message === "string" ? [value.message] : []),
    ...(typeof value.data === "string" ? [value.data] : []),
    ...(typeof value.code === "string" ? [value.code] : []),
    ...collectErrorText(value.data, depth + 1),
    ...collectErrorText(value.cause, depth + 1),
  ];
}

function getErrorCode(error: unknown): string | undefined {
  const text = collectErrorText(error).join(" ");
  const matches = text.match(/\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+){1,}\b/g) ?? [];
  return matches.find((code) =>
    /^(UNAUTHENTICATED|NOT_AUTHENTICATED|FORBIDDEN|NOT_AUTHORIZED|PERMISSION|ACCOUNT_SUSPENDED|SUSPENDED|.*NOT_FOUND|.*DOES_NOT_EXIST|.*ALREADY_.*|.*CONFLICT.*|.*STALE.*|.*INVALID_.*|.*REQUIRED|.*NOT_CONFIGURED|.*EXISTS|.*FAILED|.*TIMEOUT|.*NETWORK.*|.*OFFLINE.*|UNSUPPORTED_.*|SUPERVISOR_REVIEW_REQUIRED|ADMIN_ONLY|ROLE_REQUIRED|NOT_ALLOWED|INSUFFICIENT.*)$/.test(code)
  );
}

const codeMessages: Record<string, { kind: AdminErrorKind; title: string; message: string }> = {
  UNAUTHENTICATED: { kind: "unauthenticated", title: "Your session has expired", message: "Sign in again, then repeat the action." },
  NOT_AUTHENTICATED: { kind: "unauthenticated", title: "Your session has expired", message: "Sign in again, then repeat the action." },
  FORBIDDEN: { kind: "forbidden", title: "Permission denied", message: "Your current role does not allow this action. Ask an administrator to review your access." },
  SUPERVISOR_REVIEW_REQUIRED: { kind: "forbidden", title: "Supervisor review is required", message: "This request cannot be finalized until a supervisor has submitted a recommendation." },
  ADMIN_ONLY: { kind: "forbidden", title: "Administrator access required", message: "This action is restricted to an administrator." },
  ROLE_REQUIRED: { kind: "forbidden", title: "Your role cannot perform this action", message: "Ask an administrator if you believe your role should have this permission." },
  ACCOUNT_SUSPENDED: { kind: "suspended", title: "Account suspended", message: "Your account is suspended. Contact your organization administrator." },
  EMPLOYEE_NOT_FOUND: { kind: "not-found", title: "Employee not found", message: "The employee may have been removed or may not belong to your organization. Refresh the list and check the employee selection." },
  OVERTIME_REQUEST_NOT_FOUND: { kind: "not-found", title: "Overtime request not found", message: "The request may have been removed or is outside your organization. Refresh the overtime list." },
  OVERTIME_REQUEST_ALREADY_DECIDED: { kind: "conflict", title: "Overtime request already processed", message: "Another administrator has already decided this request. Refresh it to see the latest status." },
  PENDING_OVERTIME_REQUEST_EXISTS: { kind: "conflict", title: "A pending overtime request already exists", message: "There is already a pending request for this employee and date. Open that request instead of creating another." },
  HOURLY_RATE_NOT_CONFIGURED: { kind: "configuration", title: "Hourly rate is missing", message: "Configure an active hourly wage rate for this employee and work date before approving overtime." },
  REJECTION_REASON_REQUIRED: { kind: "validation", title: "A rejection reason is required", message: "Enter a reason before rejecting this request." },
  INVALID_APPROVED_OVERTIME_MINUTES: { kind: "validation", title: "Approved overtime minutes are invalid", message: "Enter a whole number from zero up to the requested minutes." },
  INVALID_OVERTIME_MULTIPLIER: { kind: "validation", title: "Overtime multiplier is invalid", message: "Use a multiplier between 1 and 10." },
  ORCHID_ORGANIZATION_CODE_NOT_CONFIGURED: { kind: "configuration", title: "Organization setup is incomplete", message: "The organization onboarding code is not configured. Contact the system administrator." },
  INVALID_DATE: { kind: "validation", title: "Date is invalid", message: "Choose a valid calendar date and try again." },
  INVALID_DATE_RANGE: { kind: "validation", title: "Date range is invalid", message: "The start date must be valid and cannot be after the end date." },
};

function humanizeCode(code: string): string {
  return code.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getAdminErrorDetails(error: unknown, fallback = "We couldn't identify the exact cause. Try again, and share the reference code with support if it continues."): AdminErrorDetails {
  const code = getErrorCode(error);
  const known = code ? codeMessages[code] : undefined;
  if (known) return { ...known, code };

  const text = collectErrorText(error).join(" ").toUpperCase();
  let kind: AdminErrorKind = "unknown";
  if (text.includes("ACCOUNT_SUSPENDED") || text.includes("SUSPENDED")) kind = "suspended";
  else if (text.includes("UNAUTHENTICATED") || text.includes("NOT_AUTHENTICATED")) kind = "unauthenticated";
  else if (text.includes("FORBIDDEN") || text.includes("PERMISSION") || text.includes("NOT_AUTHORIZED") || text.includes("NOT_ALLOWED") || text.includes("INSUFFICIENT")) kind = "forbidden";
  else if (text.includes("NOT_FOUND") || text.includes("DOES_NOT_EXIST")) kind = "not-found";
  else if (text.includes("ALREADY_") || text.includes("CONFLICT") || text.includes("STALE")) kind = "conflict";
  else if (text.includes("NETWORK") || text.includes("TIMEOUT") || text.includes("FETCH_FAILED") || text.includes("FAILED TO FETCH") || text.includes("CONNECTION") || text.includes("ECONN") || text.includes("OFFLINE")) kind = "network";
  else if (text.includes("VALIDATION") || text.includes("INVALID_") || text.includes("REQUIRED")) kind = "validation";
  else if (text.includes("NOT_CONFIGURED")) kind = "configuration";

  const defaults: Record<AdminErrorKind, Omit<AdminErrorDetails, "kind" | "code">> = {
    unauthenticated: { title: "Your session has expired", message: "Sign in again, then repeat the action." },
    forbidden: { title: "Permission denied", message: "Your current role does not allow this action. Ask an administrator to review your access." },
    suspended: { title: "Account suspended", message: "Contact your organization administrator." },
    "not-found": { title: "Record not found", message: "The record may have been removed or may no longer be available to your account. Refresh the list and try again." },
    conflict: { title: "This record has changed", message: "Another action may have updated this record. Refresh it before trying again." },
    network: { title: "Connection problem", message: "The application could not reach the service. Check your connection and try again." },
    validation: { title: "Some information is invalid", message: "Review the form fields and correct the values before trying again." },
    configuration: { title: "Required setup is missing", message: "An organization or system setting required for this action has not been configured. Contact an administrator." },
    unknown: { title: "Action could not be completed", message: fallback },
  };
  const detail = defaults[kind];
  if (kind === "unknown" && code) {
    return {
      kind,
      title: "The service reported a specific error",
      message: `The service returned this reason: ${humanizeCode(code)}. Refresh the section and check the related record or settings before retrying.`,
      code,
      technicalDetails: humanizeCode(code),
    };
  }
  return { kind, ...detail, ...(code ? { code, technicalDetails: humanizeCode(code) } : {}) };
}

export function classifyAdminError(error: unknown): AdminErrorKind {
  return getAdminErrorDetails(error).kind;
}

export function getAdminErrorMessage(error: unknown, fallback?: string): string {
  return getAdminErrorDetails(error, fallback).message;
}
