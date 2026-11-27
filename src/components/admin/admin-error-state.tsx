"use client";

import { AlertCircle, RefreshCw, ShieldAlert } from "lucide-react";
import { getAdminErrorDetails } from "@/lib/admin-errors";

type Props = {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  compact?: boolean;
};

export function AdminErrorState({ error, onRetry, title, compact = false }: Props) {
  const details = getAdminErrorDetails(error, "We couldn't identify the exact cause from the server response.");
  const restricted = details.kind === "forbidden" || details.kind === "suspended";
  return (
    <div className={compact ? "admin-inline-error" : "admin-error-state"} role="alert">
      <span className="admin-error-icon">{restricted ? <ShieldAlert size={20} /> : <AlertCircle size={20} />}</span>
      <h3>{title ?? details.title}</h3>
      <p>{details.message}</p>
      {details.code && (
        <details className="admin-error-diagnostics">
          <summary>Technical details</summary>
          <code>{details.code}</code>
        </details>
      )}
      {onRetry && details.kind !== "forbidden" && details.kind !== "suspended" && (
        <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}
