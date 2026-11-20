"use client";

import { Component, type ErrorInfo, type ReactNode, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { AlertCircle, CheckCircle2, Clock3, MapPin, RefreshCw, Wallet } from "lucide-react";

const money = (paise?: number | null) => paise == null
  ? "—"
  : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(paise / 100);
const localDate = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date);
const hours = (minutes: number) => (minutes / 60).toFixed(2) + "h";
const time = (value: number | null, timeZone: string) => value == null
  ? "—"
  : new Intl.DateTimeFormat("en-IN", { timeZone, hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date(value));

function friendlyQueryError(error: Error) {
  const message = error.message ?? "";
  if (message.includes("UNAUTHENTICATED")) return "Your session has expired. Sign in again to continue.";
  if (message.includes("ACCOUNT_SUSPENDED") || message.includes("FORBIDDEN")) return "Your account does not have permission to view Hourly Workforce.";
  if (message.includes("ORGANIZATION_NOT_FOUND")) return "Your organization could not be loaded. Contact an administrator.";
  if (message.includes("INVALID_WAGE_DATE_RANGE")) return "Choose a valid date range.";
  if (message.includes("WAGE_RANGE_LIMIT_31_DAYS")) return "The selected period is too long. Choose 31 days or fewer.";
  return "Hourly Workforce could not be loaded. Refresh the data and try again. If the issue continues, contact support.";
}

class HourlyWorkforceErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Orchid One] Hourly Workforce failed to render:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return <section className="sec">
        <div className="panel panel-body" role="alert">
          <div className="row gap-2"><AlertCircle size={20}/><strong>Hourly Workforce is temporarily unavailable</strong></div>
          <p className="sub">The page encountered an unexpected error. Your attendance and payroll records have not been changed.</p>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}><RefreshCw size={15}/> Refresh page</button>
        </div>
      </section>;
    }
    return this.props.children;
  }
}

export function HourlyWorkforce() {
  return <HourlyWorkforceErrorBoundary><HourlyWorkforceContent /></HourlyWorkforceErrorBoundary>;
}

function HourlyWorkforceContent() {
  const account = useQuery(api.account.getMyAccountStatus, {});
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return localDate(date);
  });
  const [toDate, setToDate] = useState(() => localDate(new Date()));
  const validRange = /^\\d{4}-\\d{2}-\\d{2}$/.test(fromDate) &&
    /^\\d{4}-\\d{2}-\\d{2}$/.test(toDate) &&
    fromDate <= toDate &&
    (Date.parse(toDate + "T00:00:00Z") - Date.parse(fromDate + "T00:00:00Z")) / 86400000 <= 30;
  const hourly = useQuery(api.wages.hourlyAdminData, validRange ? { fromDate, toDate } : "skip");
  const rows = hourly?.rows ?? [];
  const summary = useMemo(() => ({
    regularMinutes: rows.reduce((sum, row) => sum + row.regularMinutes, 0),
    overtimeMinutes: rows.reduce((sum, row) => sum + row.approvedOvertimeMinutes, 0),
    exceptions: rows.filter(row => row.exceptionCode).length,
    pendingReviews: rows.filter(row => row.pendingPunchReview).length,
    employees: new Set(rows.map(row => String(row.employeeId))).size,
  }), [rows]);
  const role = account?.role;
  const canReviewAttendance = role === "supervisor" || role === "admin" || role === "superadmin";

  if (account === undefined) return <section className="sec"><p className="sub">Loading account permissions…</p></section>;
  if (account === null) return <section className="sec"><div className="panel panel-body" role="alert">
    <strong>Account unavailable</strong><p className="sub">Your account could not be verified. Refresh the page or sign in again.</p>
    <button type="button" className="btn btn-outline" onClick={() => window.location.reload()}><RefreshCw size={15}/> Refresh</button>
  </div></section>;

  return <section className="sec">
    <div className="page-head">
      <div><h2 className="t-h1" style={{ fontSize: 22 }}>Hourly Workforce</h2><p className="sub">Verified attendance, automatically calculated regular hours, and separately approved overtime.</p></div>
      {canReviewAttendance && summary.pendingReviews > 0 && <button className="btn btn-outline" type="button" onClick={() => window.location.assign("/admin")}><MapPin size={16}/> Pending attendance reviews ({summary.pendingReviews})</button>}
    </div>

    <div className="panel mt-4">
      <div className="employee-directory-toolbar">
        <label className="policy-field">From date<input className="input" type="date" value={fromDate} max={toDate} onChange={event => setFromDate(event.target.value)}/></label>
        <label className="policy-field">To date<input className="input" type="date" value={toDate} min={fromDate} onChange={event => setToDate(event.target.value)}/></label>
        <span className="t-caption text-tertiary">Maximum range: 31 days · {hourly?.timezone ?? "Organization timezone"}</span>
      </div>

      {!validRange ? <div className="panel-body"><p className="form-error" role="alert">Choose a valid date range of no more than 31 days.</p></div> :
        hourly === undefined ? <div className="panel-body"><p className="sub">Loading verified attendance…</p></div> :
        hourly.truncated ? <div className="panel-body" role="alert"><div className="row gap-2"><AlertCircle size={18}/><div><strong>Results are too large to calculate safely</strong><p className="t-caption text-tertiary">No partial totals are shown. Narrow the date range and try again.</p></div></div></div> :
        <>
          <div className="kpi-grid" style={{ padding: 16 }}>
            <div className="kpi card"><span className="kpi-icon"><Clock3 size={18}/></span><span className="kpi-label">Regular payable hours</span><span className="kpi-val">{hours(summary.regularMinutes)}</span><span className="kpi-sub">Automatically calculated from verified work</span></div>
            <div className="kpi card"><span className="kpi-icon"><Wallet size={18}/></span><span className="kpi-label">Approved overtime</span><span className="kpi-val">{hours(summary.overtimeMinutes)}</span><span className="kpi-sub">Pending overtime is excluded</span></div>
            <div className="kpi card"><span className="kpi-icon"><AlertCircle size={18}/></span><span className="kpi-label">Attendance exceptions</span><span className="kpi-val">{summary.exceptions}</span><span className="kpi-sub">Payable time withheld until resolved</span></div>
            <div className="kpi card"><span className="kpi-icon"><CheckCircle2 size={18}/></span><span className="kpi-label">Employees recorded</span><span className="kpi-val">{summary.employees}</span><span className="kpi-sub">Hourly employees with attendance</span></div>
          </div>

          {rows.length === 0 ? <div className="panel-body empty-state"><Clock3 size={26}/><strong>No hourly attendance records</strong><p>Verified attendance records for active hourly employees will appear here.</p></div> :
            <div className="employee-directory-table-wrap"><table className="employee-directory-table">
              <thead><tr><th>Employee / date</th><th>Check-in</th><th>Check-out</th><th>Attendance</th><th>Break</th><th>Recorded work</th><th>Hourly rate</th><th>Regular payable</th><th>Overtime</th><th>Status / exception</th></tr></thead>
              <tbody>{rows.map(row => <tr key={String(row.employeeId) + ":" + row.workDate}>
                <td><strong>{row.employeeName}</strong><small>{row.employeeCode} · {row.workDate}</small></td>
                <td>{time(row.firstCheckInAt, hourly.timezone)}</td>
                <td>{time(row.lastCheckOutAt, hourly.timezone)}</td>
                <td>{hours(row.attendanceMinutes)}</td><td>{hours(row.breakMinutes)}</td><td>{hours(row.recordedWorkMinutes)}</td>
                <td>{row.ratePaise == null ? "Not configured" : money(row.ratePaise) + "/hr"}{row.overtimeMultiplier != null && <small>OT ×{row.overtimeMultiplier}</small>}</td>
                <td><strong>{row.exceptionCode ? "Withheld" : hours(row.regularMinutes)}</strong>{!row.exceptionCode && <small>{money(row.regularEarningsPaise)}</small>}</td>
                <td><strong>{hours(row.approvedOvertimeMinutes)} approved</strong>{row.overtimeEarningsPaise != null && <small>{money(row.overtimeEarningsPaise)}</small>}{row.pendingOvertimeMinutes > 0 && <small>{hours(row.pendingOvertimeMinutes)} awaiting confirmation / review</small>}</td>
                <td>{row.exceptionCode ?
                  <div className="col gap-1"><span className="badge badge-warning">{row.exceptionCode.replaceAll("_", " ").toLowerCase()}</span><small>{row.exceptionMessage}</small>
                    {row.exceptionCode === "PUNCH_REVIEW_PENDING" && canReviewAttendance && <small>Open Attendance Reviews to resolve the pending punch.</small>}
                    {row.exceptionCode === "INVALID_SHIFT" || row.exceptionCode === "MULTIPLE_SHIFTS" || row.exceptionCode === "UNSUPPORTED_SHIFT" ? <small>Correct the shift in Shifts &amp; Schedules.</small> : null}
                    {row.exceptionCode === "HOURLY_RATE_MISSING" && (role === "admin" || role === "superadmin") ? <small>Configure the effective hourly rate in Wage Management.</small> : null}
                  </div> : <span className="badge badge-success">Calculated</span>}</td>
              </tr>)}</tbody>
            </table></div>}
          <div className="panel-body"><p className="t-caption text-tertiary">Regular payable hours are calculated from complete, verified attendance, less recorded breaks and within the scheduled shift. No routine supervisor payable-hour approval is required. Overtime is separate and only approved requests contribute to overtime earnings. Payroll generation, approval and payment remain separate workflows.</p></div>
        </>}
    </div>
  </section>;
}
