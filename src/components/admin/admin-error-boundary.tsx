"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

type Props = { children: ReactNode; resetKey?: string };
type State = { hasError: boolean; incidentId: string };

export class AdminErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, incidentId: "" };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true, incidentId: `ADM-${Date.now().toString(36).toUpperCase()}` };
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
      this.setState({ hasError: false, incidentId: "" });
    }
  }

  private recover = () => this.setState({ hasError: false, incidentId: "" });

  render() {
    if (this.state.hasError) {
      return (
        <section className="admin-error-state" role="alert" aria-live="assertive">
          <span className="admin-error-icon"><AlertTriangle size={22} /></span>
          <h2>We hit an unexpected problem</h2>
          <p>Something went wrong while loading this section. If an action was in progress, refresh the section before retrying to confirm its latest status.</p>
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
