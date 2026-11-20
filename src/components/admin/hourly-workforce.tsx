"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { AlertCircle, CheckCircle2, Clock3, MapPin, Wallet } from "lucide-react";

const money = (paise?: number | null) => paise == null ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(paise / 100);
const localDate = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
const hours = (minutes: number) => (minutes / 60).toFixed(2) + "h";

type Props = { onOpenExceptions?: () => void };

export function HourlyWorkforce({ onOpenExceptions }: Props) {
  const account = useQuery(api.account.getMyAccountStatus, {});
  const [fromDate, setFromDate] = useState(() => { const date = new Date(); date.setDate(date.getDate() - 6); return localDate(date); });
  const [toDate, setToDate] = useState(() => localDate(new Date()));
  const validRange = /^\\d{4}-\\d{2}-\\d{2}$/.test(fromDate) && /^\\d{4}-\\d{2}-\\d{2}$/.test(toDate) && fromDate <= toDate && (Date.parse(toDate + "T00:00:00Z") - Date.parse(fromDate + "T00:00:00Z")) / 86400000 <= 30;
  const hourly = useQuery(api.wages.hourlyAdminData, validRange ? { fromDate, toDate } : "skip");
  const rows = hourly?.rows ?? [];
  const summary = useMemo(() => ({
    regularMinutes: rows.reduce((sum, row) => sum + row.regularMinutes, 0),
    overtimeMinutes: rows.reduce((sum, row) => sum + row.approvedOvertimeMinutes, 0),
    exceptions: rows.filter(row => row.exceptionCode).length,
    employees: new Set(rows.map(row => String(row.employeeId))).size,
  }), [rows]);
  const role = account?.role;
  const canReviewExceptions = role === "supervisor" || role === "admin" || role === "superadmin";

  if (account === undefined) return <section className="sec"><p className="sub">Loading account permissions…</p></section>;
  if (!account) return <section className="sec"><div className="panel panel-body"><p role="alert">Your account could not be loaded. Refresh the page or sign in again.</p></div></section>;

  return <section className="sec">
    <div className="page-head">
      <div><h2 className="t-h1" style={{ fontSize: 22 }}>Hourly Workforce</h2><p className="sub">Verified attendance, automatically calculated regular hours, and approved overtime.</p></div>
      {canReviewExceptions && summary.exceptions > 0 && onOpenExceptions && <button className="btn btn-outline" type="button" onClick={onOpenExceptions}><MapPin size={16}/> Review attendance exceptions ({summary.exceptions})</button>}
    </div>
    <div className="panel mt-4">
      <div className="employee-directory-toolbar">
        <label className="policy-field">From date<input className="input" type="date" value={fromDate} max={toDate} onChange={event => setFromDate(event.target.value)}/></label>
        <label className="policy-field">To date<input className="input" type="date" value={toDate} min={fromDate} onChange={event => setToDate(event.target.value)}/></label>
        <span className="t-caption text-tertiary">Maximum range: 31 days · {hourly?.timezone ?? "Organization timezone"}</span>
      </div>
      {!validRange ? <div className="panel-body"><p className="form-error" role="alert">Choose a valid date range of no more than 31 days.</p></div> :
        hourly === undefined ? <div className="panel-body"><p className="sub">Loading hourly attendance…</p></div> :
        hourly.truncated ? <div className="panel-body"><div className="row gap-2"><AlertCircle size={18}/><div><strong>Too many attendance records</strong><p className="t-caption text-tertiary">Narrow the date range to 31 days or less and try again.</p></div></div></div> :
        <>
          <div className="kpi-grid" style={{ padding: 16 }}>
            <div className="kpi card"><span className="kpi-icon"><Clock3 size={18}/></span><span className="kpi-label">Regular payable hours</span><span className="kpi-val">{hours(summary.regularMinutes)}</span><span className="kpi-sub">Calculated from verified attendance</span></div>
            <div className="kpi card"><span className="kpi-icon"><Wallet size={18}/></span><span className="kpi-label">Approved overtime</span><span className="kpi-val">{hours(summary.overtimeMinutes)}</span><span className="kpi-sub">Only approved overtime is included</span></div>
            <div className="kpi card"><span className="kpi-icon"><AlertCircle size={18}/></span><span className="kpi-label">Attendance exceptions</span><span className="kpi-val">{summary.exceptions}</span><span className="kpi-sub">Excluded until resolved</span></div>
            <div className="kpi card"><span className="kpi-icon"><CheckCircle2 size={18}/></span><span className="kpi-label">Employees recorded</span><span className="kpi-val">{summary.employees}</span><span className="kpi-sub">Hourly employees with attendance</span></div>
          </div>
          {rows.length === 0 ? <div className="panel-body empty-state"><Clock3 size={26}/><strong>No hourly attendance records</strong><p>Attendance records for active hourly employees will appear here.</p></div> :
            <div className="employee-directory-table-wrap"><table className="employee-directory-table">
              <thead><tr><th>Employee / date</th><th>Check-in</th><th>Check-out</th><th>Attendance</th><th>Break</th><th>Recorded work</th><th>Hourly rate</th><th>Regular payable</th><th>Overtime</th><th>Status</th></tr></thead>
              <tbody>{rows.map(row => <tr key={String(row.employeeId) + ":" + row.workDate}>
                <td><strong>{row.employeeName}</strong><small>{row.employeeCode} · {row.workDate}</small></td>
                <td>{row.firstCheckInAt ? new Date(row.firstCheckInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                <td>{row.lastCheckOutAt ? new Date(row.lastCheckOutAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                <td>{hours(row.attendanceMinutes)}</td><td>{hours(row.breakMinutes)}</td><td>{hours(row.recordedWorkMinutes)}</td>
                <td>{row.ratePaise == null ? "Not configured" : money(row.ratePaise) + "/hr"}{row.overtimeMultiplier != null && <small>OT ×{row.overtimeMultiplier}</small>}</td>
                <td><strong>{row.exceptionCode ? "—" : hours(row.regularMinutes)}</strong>{!row.exceptionCode && <small>{money(row.regularEarningsPaise)}</small>}</td>
                <td><strong>{hours(row.approvedOvertimeMinutes)} approved</strong>{row.overtimeEarningsPaise != null && <small>{money(row.overtimeEarningsPaise)}</small>}{row.pendingOvertimeMinutes > 0 && <small>{hours(row.pendingOvertimeMinutes)} awaiting review</small>}</td>
                <td>{row.exceptionCode ? <div className="col gap-1"><span className="badge badge-warning">{row.exceptionCode.replaceAll("_", " ").toLowerCase()}</span><small>{row.exceptionMessage}</small>{canReviewExceptions && onOpenExceptions && (row.pendingPunchReview || row.exceptionCode === "UNVERIFIED_ATTENDANCE") && <button type="button" className="btn btn-outline btn-sm" onClick={onOpenExceptions}>Open attendance reviews</button>}</div> : <span className="badge badge-success">Calculated</span>}</td>
              </tr>)}</tbody>
            </table></div>}
          <div className="panel-body"><p className="t-caption text-tertiary">Regular hours are calculated automatically from verified, paired attendance, less recorded breaks and within configured shift boundaries. Routine supervisor approval is not required. Attendance exceptions must be resolved in Attendance Reviews. Overtime remains a separate employee-confirmation and approval workflow. Payroll generation and approval are separate steps.</p></div>
        </>}
    </div>
  </section>;
}
