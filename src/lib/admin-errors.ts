export type AdminErrorKind =
  | "unauthenticated"
  | "forbidden"
  | "suspended"
  | "not-found"
  | "conflict"
  | "network"
  | "validation"
  | "unknown";

function getErrorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "");
  }
  return "";
}

export function classifyAdminError(error: unknown): AdminErrorKind {
  const message = getErrorText(error).toUpperCase();
  if (message.includes("UNAUTHENTICATED") || message.includes("NOT_AUTHENTICATED")) return "unauthenticated";
  if (message.includes("ACCOUNT_SUSPENDED") || message.includes("SUSPENDED")) return "suspended";
  if (message.includes("FORBIDDEN") || message.includes("PERMISSION") || message.includes("NOT_AUTHORIZED") || message.includes("SUPERVISOR_REVIEW_REQUIRED") || message.includes("ADMIN_ONLY") || message.includes("ROLE_REQUIRED") || message.includes("NOT_ALLOWED") || message.includes("INSUFFICIENT")) return "forbidden";
  if (message.includes("NOT_FOUND") || message.includes("DOES_NOT_EXIST")) return "not-found";
  if (message.includes("ALREADY_") || message.includes("CONFLICT") || message.includes("STALE")) return "conflict";
  if (message.includes("NETWORK") || message.includes("TIMEOUT") || message.includes("FETCH_FAILED") || message.includes("FAILED TO FETCH") || message.includes("CONNECTION") || message.includes("ECONN") || message.includes("OFFLINE")) return "network";
  if (message.includes("VALIDATION") || message.includes("INVALID_")) return "validation";
  return "unknown";
}

export function getAdminErrorMessage(error: unknown, fallback = "We couldn't complete that action. Please try again."): string {
  switch (classifyAdminError(error)) {
    case "unauthenticated": return "Your session has expired. Sign in again to continue.";
    case "forbidden": return "You don't have permission to perform this action. If you think this is incorrect, contact an administrator.";
    case "suspended": return "This account is currently suspended. Contact your organization administrator.";
    case "not-found": return "This record is no longer available. Refresh the list and try again.";
    case "conflict": return "This record has changed since you opened it. Refresh the latest details before trying again.";
    case "network": return "We couldn't reach the service. Check your connection and try again.";
    case "validation": return "Some information is invalid. Review the highlighted fields and try again.";
    default: return fallback;
  }
}
