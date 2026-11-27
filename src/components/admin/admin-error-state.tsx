"use client";

import { AlertCircle, RefreshCw, ShieldAlert } from "lucide-react";
import { getAdminErrorMessage, classifyAdminError } from "@/lib/admin-errors";

type Props = {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  compact?: boolean;
};

export function AdminErrorState({ error, onRetry, title, compact = false }: Props) {
  const kind = classifyAdminError(error);
  const restricted = kind === "forbidden" || kind === "suspended";
  return (
    <div className={compact ? "admin-inline-error" : "admin-error-state"} role="alert">
      <span className="admin-error-icon">{restricted ? <ShieldAlert size={20} /> : <AlertCircle size={20} />}</span>
      <h3>{title ?? (restricted ? "Access restricted" : "Unable to load this information")}</h3>
      <p>{getAdminErrorMessage(error, "We couldn't load this information. Please try again.")}</p>
      {onRetry && kind !== "forbidden" && kind !== "suspended" && (
        <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}
