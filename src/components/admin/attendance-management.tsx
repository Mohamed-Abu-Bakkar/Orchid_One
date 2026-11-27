"use client";


import { getAdminErrorMessage } from "@/lib/admin-errors";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Activity, CalendarDays, CheckCircle2, Clock3, Download, MapPin, Search, ShieldAlert } from "lucide-react";

function localToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

function clock(value: number | null, timeZone: string) {
  return value === null ? "—" : new Intl.DateTimeFormat("en-IN", {
    timeZone, hour: "2-digit", minute: "2-digit", hour12: true,
  }).format(new Date(value));
}

function duration(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return Math.floor(value / 60) + "h " + String(value % 60).padStart(2, "0") + "m";
}

function stamp(value: number, timeZone: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone, day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).format(new Date(value));
}

function dateTimeInputInZone(value: string, timeZone: string) {
  const [date, time] = value.split("T");
  if (!date || !time) return NaN;
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let guess = target;
  for (let attempt = 0; attempt < 4; attempt++) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date(guess));
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const represented = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute));
    const difference = represented - target;
    if (!difference) break;
    guess -= difference;
  }
  return guess;
}


export function AttendanceManagement({ onOpenExceptions }: { onOpenExceptions: () => void }) {
  const today = localToday();
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [employeeId, setEmployeeId] = useState("");
  const [search, setSearch] = useState("");
  const employees = useQuery(api.employee.listForAdmin, {});
  const account = useQuery(api.account.getMyAccountStatus, {});
  const openSessions = useQuery(api.attendanceReview.openSessions, {});
  const resolveOpenSession = useMutation(api.attendanceReview.resolveOpenSession);
  const [checkoutTimes, setCheckoutTimes] = useState<Record<string, string>>({});
  const [breakEndTimes, setBreakEndTimes] = useState<Record<string, string>>({});
  const [correctionNotes, setCorrectionNotes] = useState<Record<string, string>>({});
  const [correctionBusy, setCorrectionBusy] = useState<string | null>(null);
  const [correctionError, setCorrectionError] = useState("");
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
  const canCorrectSessions = account?.role === "admin" || account?.role === "superadmin";

  async function correctOpenSession(item: any) {
    const id = String(item.employeeId);
    const checkoutAt = checkoutTimes[id] ? dateTimeInputInZone(checkoutTimes[id], timezone) : NaN;
    const breakEndAt = breakEndTimes[id] ? dateTimeInputInZone(breakEndTimes[id], timezone) : undefined;
    const note = correctionNotes[id]?.trim() ?? "";
    if (!Number.isFinite(checkoutAt) || note.length < 3 || (item.eventType === "break_start" && (!Number.isFinite(breakEndAt) || breakEndAt! >= checkoutAt))) {
      setCorrectionError("Enter a verified checkout time, a valid break end time when required, and a correction note of at least 3 characters.");
      return;
    }
    setCorrectionBusy(id); setCorrectionError("");
    try {
      await resolveOpenSession({
        employeeId: item.employeeId,
        expectedLastEventId: item.latestEventId,
        checkoutAt,
        breakEndAt: item.eventType === "break_start" ? breakEndAt : undefined,
        note,
      });
      setCheckoutTimes(current => ({ ...current, [id]: "" }));
      setBreakEndTimes(current => ({ ...current, [id]: "" }));
      setCorrectionNotes(current => ({ ...current, [id]: "" }));
    } catch (cause) {
      setCorrectionError(getAdminErrorMessage(cause, "Unable to correct the attendance session."));
    } finally { setCorrectionBusy(null); }
  }
  function exportCsv() {
    if (!register || rows.length === 0) return;
    const quote = (value: unknown) => '"' + String(value ?? "").replace(/"/g, '""') + '"';
    const lines = [
      ["Employee", "Employee code", "Date", "Scheduled shifts", "First check-in", "Last check-out", "Payable minutes (stored)", "Break minutes (stored)", "Attendance status", "Event count", "Outside-geofence events", "Pending reviews"],
      ...rows.map((row: any) => [
        row.employeeName, row.employeeCode, row.workDate,
        row.scheduledShifts.map((shift: any) => shift.name).join("; "),
        row.firstCheckInAt === null ? "" : stamp(row.firstCheckInAt, timezone),
        row.lastCheckOutAt === null ? "" : stamp(row.lastCheckOutAt, timezone),
        row.payableMinutes ?? "", row.breakMinutes ?? "", row.status,
        row.eventCount, row.outsideGeofenceEvents, row.pendingReviews,
      ]),
    ];
    const csv = lines.map(line => line.map(quote).join(",")).join(String.fromCharCode(13, 10));
    const url = URL.createObjectURL(new Blob([String.fromCharCode(0xfeff), csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "orchid-attendance-" + fromDate + "-to-" + toDate + ".csv";
    link.click();
    URL.revokeObjectURL(url);
  }



  return <section className="sec">
    <div className="page-head">
      <div><h2 className="t-h1" style={{ fontSize: 22 }}>Attendance management</h2><p className="sub">Live attendance events recorded by employees through the GPS and geofence workflow.</p></div>
      <div className="page-actions"><span className="badge badge-neutral"><Activity size={13}/> Convex live data</span><button className="btn btn-outline" type="button" onClick={exportCsv} disabled={!register || rows.length===0}><Download size={15}/> Export CSV</button></div>
    </div>

    <div className="employee-directory-stats">
      {[
        ["Attendance days", register?.recordedDays ?? "—"],
        ["Recorded events", register?.totalEvents ?? "—"],
        ["Pending reviews", register?.pendingReviews ?? "—"],
        ["Outside geofence", register?.outsideGeofenceEvents ?? "—"],
      ].map(([label, value]) => <div className="kpi card" key={label}><span className="kpi-label">{label}</span><span className="kpi-val">{value}</span></div>)}
    </div>


    <div className="panel mt-4">
      <div className="panel-head">
        <div><h3 className="t-h3">Attendance punch blockers</h3><p className="t-caption text-tertiary">Unresolved pending events and previous-workday sessions that currently prevent another employee punch. Separate from geofence totals.</p></div>
        <span className="badge badge-warning">{openSessions?.length ?? "—"} blocking</span>
      </div>
      <div className="panel-body">
        {openSessions === undefined ? <p className="sub">Checking previous attendance sessions…</p>
          : openSessions.length === 0 ? <div className="empty-state"><CheckCircle2 size={24}/><strong>No attendance punch blockers</strong><p className="t-body-sm text-secondary">No unresolved attendance event or previous session is currently blocking a new-day punch.</p></div>
          : <>
            {correctionError && <p className="form-error" role="alert" style={{marginBottom:14}}>{correctionError}</p>}
            <div className="grid-2-equal">
              {openSessions.map((item: any) => {
                const id = String(item.employeeId);
                return <article className="panel" key={item.latestEventId}>
                  <div className="panel-head">
                    <div><strong>{item.employeeName}</strong><p className="t-caption text-tertiary">{item.employeeCode} · {item.workDate}</p></div>
                    <span className="badge badge-warning">{item.hasPendingReview ? "Review pending" : "Checkout missing"}</span>
                  </div>
                  <div className="panel-body">
                    <p className="t-body-sm"><strong>Last event:</strong> {item.eventType.replace("_", " ")} · {stamp(item.receivedAt, timezone)}</p>
                    <p className="t-body-sm"><strong>Location:</strong> {item.locationName} · {item.locationType}</p>
                    <p className="t-caption text-tertiary">{item.hasPendingReview
                      ? "This unresolved event is included in the employee punch blocker. Resolve it before correcting or continuing the session."
                      : "This is the exact previous-day event that causes the next-day punch guard to block the employee."}</p>
                    {item.hasPendingReview && <button className="section-link" type="button" onClick={onOpenExceptions}>Open attendance reviews</button>}
                    {!item.hasPendingReview && canCorrectSessions && <>
                      {item.eventType === "break_start" && <label className="policy-field" style={{display:"block",marginTop:12}}><span>Verified break end time · {timezone}</span><input className="input" type="datetime-local" value={breakEndTimes[id] ?? ""} onChange={e => setBreakEndTimes(current => ({...current,[id]:e.target.value}))}/></label>}
                      <label className="policy-field" style={{display:"block",marginTop:12}}><span>Verified checkout time · {timezone}</span><input className="input" type="datetime-local" value={checkoutTimes[id] ?? ""} onChange={e => setCheckoutTimes(current => ({...current,[id]:e.target.value}))}/></label>
                      <label className="policy-field" style={{display:"block",marginTop:12}}><span>Correction reason</span><textarea className="input" rows={2} value={correctionNotes[id] ?? ""} onChange={e => setCorrectionNotes(current => ({...current,[id]:e.target.value}))} placeholder="Record the source used to verify the checkout time"/></label>
                      <p className="t-caption text-tertiary">Only enter a time verified by the employee or an authorized attendance record. The original punches remain unchanged; the correction is audited.</p>
                      <button className="btn btn-primary" type="button" disabled={correctionBusy !== null} onClick={() => void correctOpenSession(item)}>{correctionBusy === id ? "Saving correction…" : "Record verified checkout"}</button>
                    </>}
                    {!item.hasPendingReview && !canCorrectSessions && <p className="t-caption text-tertiary">An Admin or Super Admin must record the verified checkout correction.</p>}
                  </div>
                </article>;
              })}
            </div>
          </>}
      </div>
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
            {register.truncated && <p className="form-error" role="status">This result exceeds the 5,000-event display limit. Narrow the date range or select an employee to view a complete subset.</p>}
            {rows.length === 0 ? <div className="empty-state"><Clock3 size={28}/><h3 className="t-h3">{register.rows.length === 0 ? "No attendance records for this period" : "No matching attendance records"}</h3><p className="t-body-sm text-secondary">{register.rows.length === 0 ? "Actual check-in, check-out and break events will appear here after employees record attendance. No sample records are inserted." : "Try another employee or search term."}</p></div>
            : <div className="employee-directory-table-wrap"><table className="employee-directory-table">
                <thead><tr><th>Employee</th><th>Work date</th><th>Scheduled shift</th><th>First check-in</th><th>Last check-out</th><th>Payable time</th><th>Break time</th><th>Status</th><th>Events</th><th>Geofence</th><th>Review</th><th>History</th></tr></thead>
                <tbody>{rows.map((row: any) => <tr key={row.id}>
                  <td><strong>{row.employeeName}</strong><small>{row.employeeCode}</small><small>{row.locationName}</small></td>
                  <td>{row.workDate}</td>
                  <td>{row.scheduledShifts.length ? row.scheduledShifts.map((shift: any) => shift.name + " (" + String(Math.floor(shift.startMinute / 60)).padStart(2, "0") + ":" + String(shift.startMinute % 60).padStart(2, "0") + ")").join(", ") : "Not scheduled"}</td>
                  <td>{clock(row.firstCheckInAt, timezone)}</td>
                  <td>{clock(row.lastCheckOutAt, timezone)}</td>
                  <td>{duration(row.payableMinutes)}</td>
                  <td>{duration(row.breakMinutes)}</td>
                  <td><span className="badge badge-neutral">{String(row.status).replace("_", " ")}</span></td>
                  <td>{row.eventCount}</td>
                  <td>{row.outsideGeofenceEvents ? <span className="badge badge-warning"><MapPin size={12}/> {row.outsideGeofenceEvents} exception(s)</span> : <span className="badge badge-success">Passed</span>}</td>
                  <td>{row.pendingReviews ? <span className="badge badge-warning">{row.pendingReviews} pending</span> : row.rejectedEvents ? <span className="badge badge-warning">{row.rejectedEvents} rejected</span> : <span className="badge badge-neutral">{row.status === "present" ? "Recorded" : "Events only"}</span>}</td>
                  <td><details><summary className="section-link">Event history</summary><div className="attendance-event-history">{row.events.map((event: any) => <div className="attendance-event-row" key={event._id}>
                    <div><strong>{event.eventType.replace("_", " ")}</strong><small>{stamp(event.receivedAt, timezone)}</small>{event.systemGenerated && <span className="badge badge-neutral">System generated</span>}</div>
                    <span className={"badge "+(event.locationType === "remote" || event.geofencePassed === true ? "badge-success" : "badge-warning")}>{event.locationType === "remote" ? "Remote · no geofence" : event.geofencePassed ? "Inside geofence" : event.reviewStatus.replace("_", " ")}</span>
                    <small>{event.locationName} · {event.accuracyM != null ? `GPS ±${Math.round(event.accuracyM)}m` : "GPS unavailable"}</small>
                    {event.systemGeneratedReason && <small>Correction: {event.systemGeneratedReason}</small>}
                    {event.reviewNote && <small>Review note: {event.reviewNote}</small>}
                  </div>)}</div></details></td>
                </tr>)}</tbody>
              </table></div>}
          </>}
      </div>
    </div>

    <div className="panel mt-4"><div className="panel-body row gap-3">
      <ShieldAlert size={20}/><div><strong className="t-body-sm">Review attendance exceptions</strong><p className="t-caption text-tertiary">Pending attendance events and outside-geofence punches remain recorded and require an authorized review decision.</p></div>
      <button className="section-link" type="button" onClick={onOpenExceptions}>Open attendance reviews</button>
    </div></div>
  </section>;
}
