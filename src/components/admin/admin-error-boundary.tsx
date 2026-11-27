"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { getAdminErrorDetails } from "@/lib/admin-errors";

type Props = { children: ReactNode; resetKey?: string };
type State = { hasError: boolean; incidentId: string; error: Error | null };

export class AdminErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, incidentId: "", error: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, incidentId: `ADM-${Date.now().toString(36).toUpperCase()}` };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Orchid One][Admin UI] Unhandled module error", {
      incidentId: this.state.incidentId,
      error,
      componentStack: info.componentStack,
    });
  }

  componentDidUpdate(previousProps: Props) {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, incidentId: "", error: null });
    }
  }

  private recover = () => this.setState({ hasError: false, incidentId: "", error: null });

  render() {
    if (this.state.hasError) {
      const details = getAdminErrorDetails(this.state.error, "The section failed while rendering. The exact cause was not included in the error response.");
      return (
        <section className="admin-error-state" role="alert" aria-live="assertive">
          <span className="admin-error-icon"><AlertTriangle size={22} /></span>
          <h2>{details.title}</h2>
          <p>{details.message}</p>
          {details.code && (
            <details className="admin-error-diagnostics">
              <summary>Technical details</summary>
              <code>{details.code}</code>
            </details>
          )}
          <div className="admin-error-actions">
            <button type="button" className="btn btn-primary" onClick={this.recover}>
              <RefreshCw size={15} /> Try again
            </button>
            <button type="button" className="btn btn-outline" onClick={() => window.location.assign("/admin")}>
              Back to dashboard
            </button>
          </div>
          <small>Reference: {this.state.incidentId}</small>
        </section>
      );
    }
    return this.props.children;
  }
}
