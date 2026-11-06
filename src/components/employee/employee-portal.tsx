"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { authClient } from "@/lib/auth-client";
import { EmployeePolicies } from "@/components/employee/employee-policies";

type Tab = "home" | "attendance" | "requests" | "documents" | "more";
type Panel = "home" | "attendance" | "requests" | "documents" | "payslips" | "notifications" | "profile" | "policies" | "helpdesk";

const money = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);
const dateLabel = (value: number | string) => new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(typeof value === "number" ? new Date(value) : new Date(value + "T00:00:00"));
const timeLabel = (value: number) => new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date(value));
const minuteLabel = (value?: number) => value == null ? "—" : `${String(Math.floor(value / 60) % 24).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;

export function EmployeePortal() {
  const router = useRouter();
  const session = authClient.useSession();
  const account = useQuery(api.account.getMyAccountStatus, session.data ? {} : "skip");
  const workspace = useQuery(
    api.employee.myWorkspace,
    session.data && account?.status === "active" && account.role === "employee" ? {} : "skip",
  );
  const punch = useMutation(api.attendance.recordPunch);
  const generateDocumentUploadUrl = useMutation(api.employee.generateDocumentUploadUrl);
  const saveMyDocument = useMutation(api.employee.saveMyDocument);
  const [tab, setTab] = useState<Tab>("home");
  const [panel, setPanel] = useState<Panel>("home");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [documentBusy, setDocumentBusy] = useState(false);
  const [documentType, setDocumentType] = useState("Identity");
  const [documentMessage, setDocumentMessage] = useState("");
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const todayEvents = useMemo(() => {
    if (!workspace?.linked) return [];
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
    return workspace.attendance
      .filter(event => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(event.receivedAt)) === today)
      .sort((a, b) => a.receivedAt - b.receivedAt);
  }, [workspace]);

  const latestEvent = todayEvents[todayEvents.length - 1];
  const nextPunch = latestEvent?.eventType === "check_in" || latestEvent?.eventType === "break_end" ? "check_out" : "check_in";
  const todayHours = useMemo(() => {
    let start: number | null = null;
    let total = 0;
    for (const event of todayEvents) {
      if (event.eventType === "check_in" || event.eventType === "break_end") start = event.receivedAt;
      if ((event.eventType === "check_out" || event.eventType === "break_start") && start !== null) {
        total += Math.max(0, event.receivedAt - start);
        start = null;
      }
    }
    if (start !== null) total += Math.max(0, Date.now() - start);
    return total / 3_600_000;
  }, [todayEvents, clock]);

  async function signOut() {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  async function uploadDocument(file: File) {
    if (!workspace?.linked) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) {
      setDocumentMessage("Choose a PDF, JPG or PNG document.");
      return;
    }
    setDocumentBusy(true);
    setDocumentMessage("");
    try {
      const uploadUrl = await generateDocumentUploadUrl({});
      const response = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      if (!response.ok) throw new Error("The file could not be uploaded. Please try again.");
      const result = await response.json() as { storageId: Id<"_storage"> };
      await saveMyDocument({ storageId: result.storageId, documentType, originalFileName: file.name, mimeType: file.type });
      setDocumentMessage("Document uploaded. It is now awaiting HR verification.");
    } catch (cause) {
      setDocumentMessage(cause instanceof Error ? cause.message : "Unable to upload this document.");
    } finally {
      setDocumentBusy(false);
    }
  }

  async function recordAttendance() {
    if (!workspace?.linked) {
      setMessage("Your employee profile is not linked yet. Please contact HR before recording attendance.");
      return;
    }
    if (!navigator.geolocation) {
      setMessage("This device does not support location services.");
      return;
    }
    setBusy(true);
    setMessage("");
    navigator.geolocation.getCurrentPosition(async position => {
      try {
        const result = await punch({
          eventType: nextPunch,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyM: position.coords.accuracy,
          clientTimestamp: Date.now(),
          idempotencyKey: crypto.randomUUID(),
        });
        setMessage(result.geofencePassed ? "Attendance recorded successfully." : "Punch recorded outside the configured attendance area and flagged for review.");
      } catch (cause) {
        setMessage(cause instanceof Error ? cause.message : "Unable to record attendance.");
      } finally {
        setBusy(false);
      }
    }, error => {
      setBusy(false);
      setMessage(error.code === error.PERMISSION_DENIED ? "Location permission is required to record attendance." : "Unable to obtain your current location.");
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }

  function open(next: Panel) {
    setPanel(next);
    if (["home", "attendance", "requests", "documents"].includes(next)) setTab(next as Tab);
    else if (next === "payslips" || next === "notifications" || next === "profile" || next === "policies" || next === "helpdesk") setTab("more");
  }

  if (session.isPending || (session.data && (account === undefined || workspace === undefined))) {
    return <main className="employee-loading"><div className="employee-loading-mark">✿</div><p>Preparing your Orchid workspace…</p></main>;
  }
  if (!session.data) {
    return <main className="auth-page"><section className="auth-card"><div className="auth-brand"><span className="auth-mark">✿</span><span>ORCHID ONE</span></div><p className="auth-eyebrow">ORCHID FLOWERS</p><h1>People. Workforce. Performance.</h1><p className="auth-subtitle">Your employee workspace for attendance, documents and requests.</p><a className="auth-submit auth-link-button" href="/login">Sign in</a><p className="auth-switch">New employee? <a href="/register">Register here</a></p></section></main>;
  }
  if (!account) return <main className="auth-page"><section className="auth-card"><h1>Account setup required</h1><p className="auth-subtitle">Your login is valid, but your Orchid account profile is not available. Please contact the system administrator.</p><button className="auth-submit" onClick={signOut}>Sign out</button></section></main>;
  if (account.status === "suspended") { router.replace("/suspended"); return <main className="employee-loading"><p>Opening account status…</p></main>; }
  if (account.role !== "employee") { router.replace("/admin"); return <main className="employee-loading"><p>Opening your workspace…</p></main>; }

  const profile = workspace?.linked ? workspace.profile : null;
  const fullName = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") : session.data.user.name || "Employee";
  const leaveDays = workspace?.linked ? workspace.leaveBalances.reduce((sum, item) => sum + Math.max(0, item.allocated - item.used - item.pending), 0) : null;
  const monthEvents = workspace?.linked ? workspace.attendance.filter(event => {
    const d = new Date(event.receivedAt);
    return d.getMonth() === clock.getMonth() && d.getFullYear() === clock.getFullYear() && event.eventType === "check_in";
  }).length : 0;
  const latestWage = workspace?.linked ? workspace.wageRecords[0] : null;

  return (
    <main className="orchid-employee-app">
      <header className="oe-topbar">
        <div className="oe-topbar-inner">
          <div className="oe-brand-block"><span className="oe-brand">Orchid One</span><span className="oe-identity">{profile?.employeeCode || "Employee"}{workspace?.linked && workspace.department ? ` · ${workspace.department.name}` : ""}</span></div>
          <div className="oe-top-actions">
            <button className="oe-icon-button oe-notification-button" aria-label="Notifications" onClick={() => open("notifications")}>♧{workspace?.linked && workspace.notifications.some(item => !item.readAt) && <i />}</button>
            <button className="oe-avatar" aria-label="Open profile" onClick={() => open("profile")}>{fullName.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase()}</button>
          </div>
        </div>
      </header>

      <section className="oe-main">
        {panel === "home" && <>
          <div className="oe-greeting"><p className="oe-eyebrow">ORCHID FLOWERS · EMPLOYEE WORKSPACE</p><h1>Good {clock.getHours() < 12 ? "morning" : clock.getHours() < 17 ? "afternoon" : "evening"}, {fullName.split(" ")[0]}</h1><p>Here is your daily summary.</p></div>
          {!workspace?.linked && <div className="oe-alert"><strong>Employee profile not linked</strong><p>Your login is active, but HR has not linked an employee record yet. Attendance, leave and wage information will appear after your employee profile is assigned.</p></div>}
          <section className="oe-checkin-card">
            <div className="oe-card-topline"><span className="oe-shift-chip">{workspace?.shift ? `${workspace.shift.name} · ${minuteLabel(workspace.shift.startMinute)} – ${minuteLabel(workspace.shift.endMinute)}` : "Shift not assigned"}</span><span className="oe-live-dot">Live</span></div>
            <div className="oe-clock">{clock.toLocaleTimeString("en-IN", { hour12: false, timeZone: "Asia/Kolkata" })}</div>
            <p className="oe-date">{clock.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}</p>
            <div className={latestEvent?.eventType === "check_in" || latestEvent?.eventType === "break_end" ? "oe-fingerprint oe-fingerprint-done" : "oe-fingerprint"}><span>◎</span></div>
            <strong className="oe-checkin-state">{!workspace?.linked ? "Attendance is not enabled yet" : latestEvent?.eventType === "check_in" || latestEvent?.eventType === "break_end" ? "You are currently checked in" : "You are not checked in yet"}</strong>
            <p className="oe-muted">{latestEvent ? `Last event at ${timeLabel(latestEvent.receivedAt)}` : "Location is checked when you record attendance"}</p>
            <button className="oe-primary-button" disabled={busy || !workspace?.linked} onClick={recordAttendance}>{busy ? "Getting location…" : nextPunch === "check_in" ? "Check In" : "Check Out"}</button>
            {message && <p className="oe-feedback" role="status">{message}</p>}
          </section>
          <div className="oe-stats-grid">
            <button className="oe-stat-card" onClick={() => open("attendance")}><span>Today's hours</span><strong>{todayHours.toFixed(1)}</strong><small>Hours recorded today</small></button>
            <button className="oe-stat-card" onClick={() => open("attendance")}><span>Month attendance</span><strong>{monthEvents}</strong><small>Check-in events this month</small></button>
            <button className="oe-stat-card" onClick={() => open("requests")}><span>Leave balance</span><strong>{leaveDays === null ? "—" : leaveDays}</strong><small>Available days · configured balances</small></button>
            <button className="oe-stat-card" onClick={() => open("payslips")}><span>Latest wage record</span><strong>{latestWage ? money(latestWage.totalPaise) : "—"}</strong><small>{latestWage?.period ? `${dateLabel(latestWage.period.fromDate)} – ${dateLabel(latestWage.period.toDate)}` : "No wage record available"}</small></button>
          </div>
          <div className="oe-section-heading"><h2>Quick actions</h2></div>
          <div className="oe-quick-grid">
            <button onClick={() => open("payslips")}><span>▤</span>Payslips</button><button onClick={() => open("documents")}><span>▧</span>Documents</button><button onClick={() => open("policies")}><span>✓</span>Policies</button><button onClick={() => open("helpdesk")}><span>◉</span>Helpdesk</button>
          </div>
          <div className="oe-section-heading"><h2>Recent attendance</h2><button onClick={() => open("attendance")}>View all</button></div>
          <div className="oe-list-card">{workspace?.linked && workspace.attendance.length ? workspace.attendance.slice(0, 4).map(event => <div className="oe-list-row" key={event._id}><span className="oe-list-icon">◷</span><span className="oe-list-copy"><strong>{event.eventType.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</strong><small>{dateLabel(event.receivedAt)} · {timeLabel(event.receivedAt)}</small></span><span className={event.geofencePassed ? "oe-status oe-status-success" : "oe-status oe-status-warning"}>{event.geofencePassed ? "Verified" : "Review"}</span></div>) : <div className="oe-empty"><span>◷</span><strong>No attendance activity yet</strong><p>Your recorded check-ins and check-outs will appear here.</p></div>}</div>
        </>}

        {panel === "attendance" && <><div className="oe-page-heading"><p className="oe-eyebrow">MY WORK</p><h1>Attendance</h1><p>Review your recorded attendance events.</p></div><section className="oe-checkin-card oe-checkin-compact"><div className="oe-clock">{clock.toLocaleTimeString("en-IN", { hour12: false, timeZone: "Asia/Kolkata" })}</div><p className="oe-date">{dateLabel(Date.now())}</p><button className="oe-primary-button" disabled={busy || !workspace?.linked} onClick={recordAttendance}>{busy ? "Getting location…" : nextPunch === "check_in" ? "Check In" : "Check Out"}</button>{message && <p className="oe-feedback">{message}</p>}</section><div className="oe-section-heading"><h2>Attendance history</h2></div><div className="oe-list-card">{workspace?.linked && workspace.attendance.length ? workspace.attendance.map(event => <div className="oe-list-row" key={event._id}><span className="oe-list-icon">◷</span><span className="oe-list-copy"><strong>{event.eventType.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</strong><small>{dateLabel(event.receivedAt)} · {timeLabel(event.receivedAt)} · GPS ±{Math.round(event.accuracyM)}m</small></span><span className={event.geofencePassed ? "oe-status oe-status-success" : "oe-status oe-status-warning"}>{event.geofencePassed ? "Verified" : "Review"}</span></div>) : <div className="oe-empty"><span>◷</span><strong>No attendance records</strong><p>There are no attendance events linked to your employee profile.</p></div>}</div></>}

        {panel === "requests" && <><div className="oe-page-heading"><p className="oe-eyebrow">MY WORK</p><h1>My Requests</h1><p>Track leave and overtime requests.</p></div><div className="oe-stats-grid oe-request-stats"><div className="oe-stat-card"><span>Pending</span><strong>{workspace?.linked ? workspace.leaveRequests.filter(item => item.status === "pending").length : "—"}</strong><small>Awaiting review</small></div><div className="oe-stat-card"><span>Approved</span><strong>{workspace?.linked ? workspace.leaveRequests.filter(item => item.status === "approved").length : "—"}</strong><small>Approved leave requests</small></div></div><div className="oe-section-heading"><h2>Leave requests</h2></div><div className="oe-list-card">{workspace?.linked && workspace.leaveRequests.length ? workspace.leaveRequests.map(item => <div className="oe-list-row" key={item._id}><span className="oe-list-icon">▤</span><span className="oe-list-copy"><strong>{dateLabel(item.fromDate)} – {dateLabel(item.toDate)}</strong><small>{item.requestedDays} day(s) · {item.reason}</small></span><span className={`oe-status ${item.status === "approved" ? "oe-status-success" : item.status === "rejected" ? "oe-status-danger" : "oe-status-warning"}`}>{item.status}</span></div>) : <div className="oe-empty"><span>▤</span><strong>No requests submitted</strong><p>Your leave requests will appear here once submitted through the configured HR workflow.</p></div>}</div><div className="oe-section-heading"><h2>Leave balances</h2></div><div className="oe-list-card">{workspace?.linked && workspace.leaveBalances.length ? workspace.leaveBalances.map(item => <div className="oe-list-row" key={item._id}><span className="oe-list-icon">◫</span><span className="oe-list-copy"><strong>{item.leaveTypeName}</strong><small>{item.periodYear} · {item.used} used · {item.pending} pending</small></span><span className="oe-status oe-status-neutral">{Math.max(0, item.allocated - item.used - item.pending)} left</span></div>) : <div className="oe-empty"><strong>No leave balance configured</strong><p>HR has not assigned leave balances to your profile.</p></div>}</div></>}

        {panel === "documents" && <><div className="oe-page-heading"><p className="oe-eyebrow">MY RECORDS</p><h1>Documents</h1><p>Your employee documents and verification status.</p></div>{workspace?.linked && <section className="oe-upload-card"><div><strong>Upload a document</strong><p>PDF, JPG or PNG · submitted files are sent to HR for verification.</p></div><select value={documentType} onChange={event => setDocumentType(event.target.value)} aria-label="Document type"><option>Identity</option><option>Education</option><option>Address proof</option><option>Other</option></select><label className="oe-upload-button">{documentBusy ? "Uploading…" : "Choose file"}<input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" disabled={documentBusy} onChange={event => { const file = event.target.files?.[0]; if (file) void uploadDocument(file); event.currentTarget.value = ""; }} /></label>{documentMessage && <p className="oe-feedback" role="status">{documentMessage}</p>}</section>}<div className="oe-list-card">{workspace?.linked && workspace.documents.length ? workspace.documents.map(doc => <div className="oe-list-row" key={doc._id}><span className="oe-list-icon">▧</span><span className="oe-list-copy"><strong>{doc.documentType}</strong><small>{doc.originalFileName} · {dateLabel(doc.uploadedAt)}</small></span><span className={`oe-status ${doc.reviewStatus === "verified" ? "oe-status-success" : doc.reviewStatus === "rejected" ? "oe-status-danger" : "oe-status-warning"}`}>{doc.reviewStatus}</span>{doc.url && <a className="oe-open-link" href={doc.url} target="_blank" rel="noreferrer">Open</a>}</div>) : <div className="oe-empty"><span>▧</span><strong>No documents available</strong><p>Documents uploaded and assigned by HR will appear here.</p></div>}</div></>}

        {panel === "payslips" && <><div className="oe-page-heading"><p className="oe-eyebrow">MY PAY</p><h1>Payslips & wages</h1><p>View wage records published for your employee profile.</p></div><div className="oe-list-card">{workspace?.linked && workspace.wageRecords.length ? workspace.wageRecords.map(item => <div className="oe-list-row" key={item._id}><span className="oe-list-icon">₹</span><span className="oe-list-copy"><strong>{item.period ? `${dateLabel(item.period.fromDate)} – ${dateLabel(item.period.toDate)}` : "Wage period"}</strong><small>{item.payableUnits} payable units · {item.status.replace("_", " ")}</small></span><strong className="oe-wage-value">{money(item.totalPaise)}</strong></div>) : <div className="oe-empty"><span>₹</span><strong>No wage records published</strong><p>Your payslips will appear here after a wage period has been calculated and released.</p></div>}</div></>}

        {panel === "notifications" && <><div className="oe-page-heading"><p className="oe-eyebrow">UPDATES</p><h1>Notifications</h1><p>Updates related to your employee account.</p></div><div className="oe-list-card">{workspace?.linked && workspace.notifications.length ? workspace.notifications.map(item => <div className="oe-list-row" key={item._id}><span className="oe-list-icon">♧</span><span className="oe-list-copy"><strong>{item.title}</strong><small>{item.body} · {dateLabel(item.createdAt)}</small></span><span className={item.readAt ? "oe-status oe-status-neutral" : "oe-status oe-status-warning"}>{item.readAt ? "Read" : "New"}</span></div>) : <div className="oe-empty"><strong>You're all caught up</strong><p>New notifications will appear here.</p></div>}</div></>}

        {panel === "policies" && <><div className="oe-page-heading"><p className="oe-eyebrow">ORCHID FLOWERS</p><h1>Policies</h1><p>Review company policies and acknowledgements.</p></div><EmployeePolicies /></>}
        {panel === "profile" && <><div className="oe-page-heading"><p className="oe-eyebrow">MY ACCOUNT</p><h1>My profile</h1><p>Your employee information.</p></div><div className="oe-profile-card"><div className="oe-profile-avatar">{fullName.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase()}</div><h2>{fullName}</h2><p>{profile?.designation || "Employee"}</p><div className="oe-profile-fields">{[["Employee ID", profile?.employeeCode],["Email", profile?.email],["Phone", profile?.phone],["Department", workspace?.department?.name],["Location", workspace?.location?.name],["Employment type", profile?.employmentType],["Joining date", profile?.joiningDate ? dateLabel(profile.joiningDate) : undefined],["Account status", profile?.status]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || "Not available"}</strong></div>)}</div><button className="oe-secondary-button" onClick={signOut}>Sign out</button></div></>}
        {panel === "helpdesk" && <><div className="oe-page-heading"><p className="oe-eyebrow">SUPPORT</p><h1>Helpdesk</h1><p>Get assistance with your Orchid One account.</p></div><div className="oe-empty oe-standalone-empty"><span>◉</span><strong>Helpdesk requests are not configured yet</strong><p>Contact your supervisor or HR team for assistance. A ticket workflow will be added when its routing and service-level rules are defined.</p></div></>}
      </section>

      <nav className="oe-bottom-nav" aria-label="Employee navigation">
        {([[ "home", "⌂", "Home" ],[ "attendance", "◷", "Attendance" ],[ "requests", "▤", "Requests" ],[ "documents", "▧", "Documents" ],[ "more", "⋯", "More" ]] as const).map(([id, icon, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => { setTab(id); setPanel(id === "more" ? "profile" : id); }}><span>{icon}</span>{label}</button>)}
      </nav>
    </main>
  );
}
