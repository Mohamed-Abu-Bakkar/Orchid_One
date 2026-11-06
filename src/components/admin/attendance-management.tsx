"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Activity, CalendarDays, Clock3, MapPin, Search, ShieldAlert } from "lucide-react";

function localToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

function clock(value: number | null, timeZone: string) {
  return value === null ? "—" : new Intl.DateTimeFormat("en-IN", {
    timeZone, hour: "2-digit", minute: "2-digit", hour12: true,
  }).format(new Date(value));
}

function stamp(value: number, timeZone: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone, day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).format(new Date(value));
}


export function AttendanceManagement({ onOpenExceptions }: { onOpenExceptions: () => void }) {
  const today = localToday();
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [employeeId, setEmployeeId] = useState("");
  const [search, setSearch] = useState("");
  const employees = useQuery(api.employee.listForAdmin, {});
  const register = useQuery(api.attendance.adminRegister, fromDate && toDate && fromDate <= toDate
    ? { fromDate, toDate, employeeId: employeeId ? employeeId as any : undefined }
    : "skip");

  const rows = useMemo(() => (register?.rows ?? []).filter((row: any) => {
    const term = search.trim().toLowerCase();
    return !term || [row.employeeName, row.employeeCode, row.locationName].join(" ").toLowerCase().includes(term);
  }), [register, search]);

  if (employees === undefined) return <section className="sec"><p className="sub">Loading attendance filters…</p></section>;

  const timezone = register?.timezone ?? "Asia/Kolkata";
  const invalidRange = !fromDate || !toDate || fromDate > toDate;

  return <section className="sec">
    <div className="page-head">
      <div><h2 className="t-h1" style={{ fontSize: 22 }}>Attendance management</h2><p className="sub">Live attendance events recorded by employees through the GPS and geofence workflow.</p></div>
      <span className="badge badge-neutral"><Activity size={13}/> Convex live data</span>
    </div>

    <div className="employee-directory-stats">
      {[
        ["Attendance days", register?.recordedDays ?? "—"],
        ["Recorded events", register?.totalEvents ?? "—"],
        ["Pending reviews", register?.pendingReviews ?? "—"],
        ["Outside geofence", register?.outsideGeofenceEvents ?? "—"],
      ].map(([label, value]) => <div className="kpi card" key={label}><span className="kpi-label">{label}</span><span className="kpi-val">{value}</span></div>)}
    </div>

    <div className="panel">
      <div className="employee-directory-toolbar">
        <label className="policy-field"><span>From date</span><input className="input" type="date" value={fromDate} max={toDate || undefined} onChange={e => setFromDate(e.target.value)}/></label>
        <label className="policy-field"><span>To date</span><input className="input" type="date" value={toDate} min={fromDate || undefined} onChange={e => setToDate(e.target.value)}/></label>
        <label className="policy-field"><span>Employee</span><select className="input" value={employeeId} onChange={e => setEmployeeId(e.target.value)}><option value="">All employees</option>{employees.map(employee => <option key={employee._id} value={employee._id}>{employee.firstName} {employee.lastName} · {employee.employeeCode}</option>)}</select></label>
        <div className="input-icon-wrap employee-directory-search"><span className="input-prefix"><Search size={16}/></span><input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee or location" aria-label="Search attendance"/></div>
      </div>
      <div className="panel-body">
        {invalidRange ? <p className="form-error" role="alert">Select a valid date range.</p>
          : register === undefined ? <p className="sub">Loading attendance records…</p>
          : <><div className="row" style={{justifyContent:"space-between",gap:12,flexWrap:"wrap",marginBottom:14}}>
              <span className="t-caption text-tertiary"><CalendarDays size={13} style={{display:"inline",verticalAlign:"middle"}}/> {register.fromDate} to {register.toDate} · {timezone}</span>
              <span className="t-caption text-tertiary">Maximum range: 31 calendar days</span>
            </div>
            {rows.length === 0 ? <div className="empty-state"><Clock3 size={28}/><h3 className="t-h3">{register.rows.length === 0 ? "No attendance records for this period" : "No matching attendance records"}</h3><p className="t-body-sm text-secondary">{register.rows.length === 0 ? "Actual check-in, check-out and break events will appear here after employees record attendance. No sample records are inserted." : "Try another employee or search term."}</p></div>
            : <div className="employee-directory-table-wrap"><table className="employee-directory-table">
                <thead><tr><th>Employee</th><th>Work date</th><th>Scheduled shift</th><th>First check-in</th><th>Last check-out</th><th>Events</th><th>Geofence</th><th>Review</th><th>History</th></tr></thead>
                <tbody>{rows.map((row: any) => <tr key={row.id}>
                  <td><strong>{row.employeeName}</strong><small>{row.employeeCode}</small><small>{row.locationName}</small></td>
                  <td>{row.workDate}</td>
                  <td>{row.scheduledShifts.length ? row.scheduledShifts.map((shift: any) => shift.name + " (" + String(Math.floor(shift.startMinute / 60)).padStart(2, "0") + ":" + String(shift.startMinute % 60).padStart(2, "0") + ")").join(", ") : "Not scheduled"}</td>
                  <td>{clock(row.firstCheckInAt, timezone)}</td>
                  <td>{clock(row.lastCheckOutAt, timezone)}</td>
                  <td>{row.eventCount}</td>
                  <td>{row.outsideGeofenceEvents ? <span className="badge badge-warning"><MapPin size={12}/> {row.outsideGeofenceEvents} exception(s)</span> : <span className="badge badge-success">Passed</span>}</td>
                  <td>{row.pendingReviews ? <span className="badge badge-warning">{row.pendingReviews} pending</span> : row.rejectedEvents ? <span className="badge badge-danger">{row.rejectedEvents} rejected</span> : <span className="badge badge-neutral">{row.status === "present" ? "Recorded" : "Events only"}</span>}</td>
                  <td><details><summary className="section-link">Event history</summary><div className="attendance-event-history">{row.events.map((event: any) => <div className="attendance-event-row" key={event._id}>
                    <div><strong>{event.eventType.replace("_", " ")}</strong><small>{stamp(event.receivedAt, timezone)}</small></div>
                    <span className={"badge "+(event.geofencePassed ? "badge-success" : "badge-warning")}>{event.geofencePassed ? "Inside geofence" : event.reviewStatus.replace("_", " ")}</span>
                    <small>{event.locationName} · GPS ±{Math.round(event.accuracyM)}m</small>
                  </div>)}</div></details></td>
                </tr>)}</tbody>
              </table></div>}
          </>}
      </div>
    </div>

    <div className="panel mt-4"><div className="panel-body row gap-3">
      <ShieldAlert size={20}/><div><strong className="t-body-sm">Review geofence exceptions separately</strong><p className="t-caption text-tertiary">Outside-geofence punches remain recorded and require an authorized supervisor or admin decision.</p></div>
      <button className="section-link" type="button" onClick={onOpenExceptions}>Open exception review</button>
    </div></div>
  </section>;
}
