"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { ArrowLeft, FileText, UserRound } from "lucide-react";

type Tab = "overview" | "attendance" | "leave" | "work" | "documents" | "pay";

const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "attendance", label: "Attendance" },
  { id: "leave", label: "Leave & OT" },
  { id: "work", label: "Work & feedback" },
  { id: "documents", label: "Documents" },
  { id: "pay", label: "Pay history" },
];

function dateLabel(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "—";
  const date = typeof value === "number" ? new Date(value) : new Date(value + (value.length === 10 ? "T00:00:00" : ""));
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}
function dateTimeLabel(value?: number | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
function statusClass(value: string) {
  return value === "active" || value === "approved" || value === "verified" || value === "completed" || value === "present"
    ? "badge-success" : value === "pending" || value === "pending_review" || value === "awaiting_employee_confirmation"
      ? "badge-warning" : "badge-neutral";
}
function Stat({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return <div className="kpi card"><span className="kpi-label">{label}</span><span className="kpi-val">{value}</span>{detail && <span className="kpi-sub">{detail}</span>}</div>;
}
function Empty({ children }: { children: string }) {
  return <div className="empty-state"><FileText size={24} /><p className="t-body-sm text-secondary">{children}</p></div>;
}

export function EmployeeProfile({ employeeId, onBack }: { employeeId: Id<"employees">; onBack: () => void }) {
  const data = useQuery(api.employee.getProfileForAdmin, { employeeId });
  const [tab, setTab] = useState<Tab>("overview");
  if (data === undefined) return <section className="sec"><button className="btn btn-outline" onClick={onBack}><ArrowLeft size={16} /> Back to employees</button><p className="sub" style={{ marginTop: 18 }}>Loading employee profile…</p></section>;
  if (!data) return <section className="sec"><button className="btn btn-outline" onClick={onBack}><ArrowLeft size={16} /> Back to employees</button><Empty>Employee profile is unavailable.</Empty></section>;

  const p = data.profile;
  const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ");
  const initials = [p.firstName, p.lastName].filter(Boolean).map(part => part[0]).join("").slice(0, 2).toUpperCase();
  const a = data.analytics;
  const residentialAddress = p.address
    ? [p.address.line1, p.address.line2, p.address.city, p.address.district, p.address.state, p.address.postalCode, p.address.country].filter(Boolean).join(", ")
    : "Not provided";
  const money = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(paise / 100);

  return <section className="sec">
    <div className="page-head" style={{ alignItems: "center" }}>
      <div><button className="section-link" type="button" onClick={onBack}><ArrowLeft size={15} /> Employee directory</button><p className="sub" style={{ marginTop: 8 }}>Employee 360° profile</p></div>
      <span className={"badge " + statusClass(p.status)}>{p.status}</span>
    </div>
    <div className="panel" style={{ marginBottom: 18 }}>
      <div className="panel-body" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div className="employee-directory-avatar" style={{ width: 58, height: 58, fontSize: 20 }}>{initials || <UserRound size={22} />}</div>
        <div style={{ flex: "1 1 220px" }}>
          <h2 className="t-h1" style={{ fontSize: 23, margin: 0 }}>{fullName}</h2>
          <p className="sub" style={{ margin: "5px 0" }}>{p.designation} · {p.employeeCode}</p>
          <p className="t-caption text-tertiary">{p.departmentName} · {p.locationName}</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="badge badge-neutral">{p.employmentType}</span>
          <span className="badge badge-neutral">{data.accounts.length ? "Account linked" : "No login linked"}</span>
        </div>
      </div>
    </div>

    <div className="employee-directory-stats" style={{ marginBottom: 18 }}>
      <Stat label="Present days" value={a.presentDays} detail="Recorded present / late days · 90 days" />
      <Stat label="Payable hours" value={a.payableHours + "h"} detail="From attendance-day records" />
      <Stat label="Leave requests" value={a.leaveRequests} detail={a.pendingLeaveRequests + " pending"} />
      <Stat label="Task completion" value={a.taskCompletionRate === null ? "—" : a.taskCompletionRate + "%"} detail={a.completedTasks + " of " + a.totalTasks + " tracked"} />
    </div>

    <div className="panel">
      <div className="employee-directory-toolbar" style={{ overflowX: "auto", flexWrap: "nowrap", gap: 6, paddingBottom: 4 }}>
        {tabs.map(item => <button key={item.id} type="button" className={"btn btn-sm " + (tab === item.id ? "btn-primary" : "btn-outline")} onClick={() => setTab(item.id)} style={{ whiteSpace: "nowrap" }}>{item.label}</button>)}
      </div>
      <div className="panel-body">
        {tab === "overview" && <div className="col gap-4">
          <div><h3 className="t-h3">Employment details</h3><div className="employee-directory-stats" style={{ marginTop: 12 }}>
            <Stat label="Joining date" value={dateLabel(p.joiningDate)} /><Stat label="Reporting manager" value={p.reportingManager || "Not assigned"} /><Stat label="Approver" value={p.approver || "Not assigned"} /><Stat label="Default shift" value={p.defaultShiftName} />
          </div></div>
          <div><h3 className="t-h3">Contact & personal details</h3><div className="employee-directory-table-wrap"><table className="employee-directory-table"><tbody>
            <tr><th>Email</th><td>{p.email || "—"}</td></tr><tr><th>Phone</th><td>{p.phone || "—"}</td></tr><tr><th>Date of birth</th><td>{dateLabel(p.dateOfBirth)}</td></tr><tr><th>Work location</th><td>{p.locationAddress || p.locationName}</td></tr>
            <tr><th>Residential address</th><td>{residentialAddress}</td></tr>
            <tr><th>Emergency contact</th><td>{p.emergencyContact ? p.emergencyContact.name + " · " + p.emergencyContact.relationship + " · " + p.emergencyContact.phone : "Not provided"}</td></tr>
            <tr><th>Employee record created</th><td>{dateTimeLabel(p.createdAt)}</td></tr>
          </tbody></table></div></div>
          <div><h3 className="t-h3">Profile completion</h3><div className="employee-directory-stats" style={{ marginTop: 12 }}>
            <Stat label="Personal profile" value={p.profileComplete ? "Complete" : "Incomplete"} detail={p.profileComplete ? (p.profileCompletedAt ? "Employee submitted " + dateLabel(p.profileCompletedAt) : "Required details are on file") : "Missing required personal information"} />
            <Stat label="Bank details" value={p.bankDetailsConfigured ? "Submitted" : "Not provided"} detail="Encrypted at rest; account values are never displayed here" />
          </div>
          {!p.profileComplete && p.profileMissingFields?.length > 0 && <p className="t-caption text-tertiary">Outstanding: {p.profileMissingFields.join(" · ")}</p>}
          <p className="t-caption text-tertiary">Emergency contact and bank details are optional. Profile completion requires date of birth and residential address.</p></div>
          <div><h3 className="t-h3">Recent activity summary</h3><div className="employee-directory-stats" style={{ marginTop: 12 }}>
            <Stat label="Attendance exceptions" value={a.exceptionDays} /><Stat label="Approved leave days" value={a.approvedLeaveDays} /><Stat label="Overtime requests" value={a.overtimeRequests} /><Stat label="Daily feedback" value={a.feedbackEntries} detail={a.averageSelfRating === null ? "No ratings submitted" : "Average self-rating " + a.averageSelfRating} />
          </div></div>
        </div>}

        {tab === "attendance" && <div className="col gap-3">
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}><h3 className="t-h3">Attendance · last 90 days</h3><span className="t-caption text-tertiary">{data.period.startDate} to {data.period.endDate}</span></div>
          {data.attendanceDays.length ? <div className="employee-directory-table-wrap"><table className="employee-directory-table"><thead><tr><th>Date</th><th>First in</th><th>Last out</th><th>Work</th><th>Break</th><th>Status</th></tr></thead><tbody>
            {data.attendanceDays.map(day => <tr key={day._id}><td>{dateLabel(day.workDate)}</td><td>{dateTimeLabel(day.firstCheckInAt)}</td><td>{dateTimeLabel(day.lastCheckOutAt)}</td><td>{Math.floor(day.payableMinutes / 60)}h {day.payableMinutes % 60}m</td><td>{day.breakMinutes}m</td><td><span className={"badge " + statusClass(day.status)}>{day.status.replaceAll("_", " ")}</span></td></tr>)}
          </tbody></table></div> : <Empty>No attendance-day records were found for this period.</Empty>}
          <h3 className="t-h3">Recent punch events</h3>
          {data.attendanceEvents.length ? <div className="employee-directory-table-wrap"><table className="employee-directory-table"><thead><tr><th>Time</th><th>Event</th><th>Location type</th><th>Review</th></tr></thead><tbody>
            {data.attendanceEvents.map(event => <tr key={event._id}><td>{dateTimeLabel(event.receivedAt)}</td><td>{event.eventType.replaceAll("_", " ")}</td><td>{event.locationType}</td><td><span className={"badge " + statusClass(event.reviewStatus)}>{event.reviewStatus.replaceAll("_", " ")}</span></td></tr>)}
          </tbody></table></div> : <Empty>No punch events found in this period.</Empty>}
        </div>}

        {tab === "leave" && <div className="col gap-4">
          <div><h3 className="t-h3">Current year leave balances</h3>{data.leaveBalances.length ? <div className="employee-directory-table-wrap" style={{ marginTop: 10 }}><table className="employee-directory-table"><thead><tr><th>Leave type</th><th>Allocated</th><th>Used</th><th>Pending</th><th>Available</th></tr></thead><tbody>
            {data.leaveBalances.map(balance => <tr key={balance._id}><td>{balance.leaveTypeName}</td><td>{balance.allocated}</td><td>{balance.used}</td><td>{balance.pending}</td><td>{Math.max(0, balance.allocated - balance.used - balance.pending)}</td></tr>)}
          </tbody></table></div> : <Empty>No leave balance has been configured for the current year.</Empty>}</div>
          <div><h3 className="t-h3">Leave requests</h3>{data.leaveRequests.length ? <div className="employee-directory-table-wrap" style={{ marginTop: 10 }}><table className="employee-directory-table"><thead><tr><th>Type</th><th>Dates</th><th>Days</th><th>Status</th><th>Reason</th></tr></thead><tbody>
            {data.leaveRequests.map(item => <tr key={item._id}><td>{item.leaveTypeName}</td><td>{dateLabel(item.fromDate)} – {dateLabel(item.toDate)}</td><td>{item.requestedDays}</td><td><span className={"badge " + statusClass(item.status)}>{item.status}</span></td><td>{item.reason}</td></tr>)}
          </tbody></table></div> : <Empty>No leave requests recorded.</Empty>}</div>
          <div><h3 className="t-h3">Overtime requests</h3>{data.overtimeRequests.length ? <div className="employee-directory-table-wrap" style={{ marginTop: 10 }}><table className="employee-directory-table"><thead><tr><th>Date</th><th>Requested</th><th>Approved</th><th>Status</th></tr></thead><tbody>
            {data.overtimeRequests.map(item => <tr key={item._id}><td>{dateLabel(item.workDate)}</td><td>{Math.round(item.requestedMinutes / 60 * 10) / 10}h</td><td>{item.approvedMinutes === undefined ? "—" : Math.round(item.approvedMinutes / 60 * 10) / 10 + "h"}</td><td><span className={"badge " + statusClass(item.status)}>{item.status.replaceAll("_", " ")}</span></td></tr>)}
          </tbody></table></div> : <Empty>No overtime requests recorded.</Empty>}</div>
        </div>}

        {tab === "work" && <div className="col gap-4">
          <div><h3 className="t-h3">Work assignment progress · 90 days</h3>{data.workProgress.length ? <div className="employee-directory-table-wrap" style={{ marginTop: 10 }}><table className="employee-directory-table"><thead><tr><th>Work date</th><th>Assignment</th><th>Category</th><th>Priority</th><th>Status</th></tr></thead><tbody>
            {data.workProgress.map(item => <tr key={item._id}><td>{dateLabel(item.workDate)}</td><td><strong>{item.title}</strong></td><td>{item.category}</td><td>{item.priority}</td><td><span className={"badge " + statusClass(item.status)}>{item.status.replaceAll("_", " ")}</span></td></tr>)}
          </tbody></table></div> : <Empty>No tracked work assignments were found.</Empty>}</div>
          <div><h3 className="t-h3">Daily employee feedback</h3>{data.feedback.length ? <div className="col gap-3" style={{ marginTop: 10 }}>{data.feedback.map(item => <article className="panel" key={item._id}><div className="panel-head"><strong>{dateLabel(item.workDate)}</strong><span className="badge badge-neutral">Self-rating {item.selfRating}/5</span></div><div className="panel-body"><p><strong>Completed work</strong><br />{item.completedWork}</p>{item.achievements && <p><strong>Achievements</strong><br />{item.achievements}</p>}{item.challenges && <p><strong>Challenges</strong><br />{item.challenges}</p>}{item.nextDayPlan && <p><strong>Next-day plan</strong><br />{item.nextDayPlan}</p>}{item.additionalFeedback && <p><strong>Additional feedback</strong><br />{item.additionalFeedback}</p>}</div></article>)}</div> : <Empty>No daily feedback entries were submitted.</Empty>}</div>
        </div>}

        {tab === "documents" && <div className="col gap-3"><h3 className="t-h3">Employee documents</h3>{data.documents.length ? <div className="employee-directory-table-wrap"><table className="employee-directory-table"><thead><tr><th>Document</th><th>Category</th><th>Uploaded</th><th>Review status</th><th>Review note</th></tr></thead><tbody>
          {data.documents.map(item => <tr key={item._id}><td><strong>{item.documentType}</strong><small>{item.originalFileName}</small></td><td>{item.documentCategory}</td><td>{dateTimeLabel(item.uploadedAt)}</td><td><span className={"badge " + statusClass(item.reviewStatus)}>{item.reviewStatus}</span></td><td>{item.reviewNote || "—"}</td></tr>)}
        </tbody></table></div> : <Empty>No employee documents were uploaded.</Empty>}</div>}

        {tab === "pay" && <div className="col gap-3"><h3 className="t-h3">Approved and locked wage records</h3><p className="t-caption text-tertiary">Only finalized wage records are shown here. Draft and pending payroll amounts are excluded.</p>{data.wageRecords.length ? <div className="employee-directory-table-wrap"><table className="employee-directory-table"><thead><tr><th>Pay period</th><th>Type</th><th>Gross</th><th>Overtime</th><th>Adjustments</th><th>Total</th><th>Status</th></tr></thead><tbody>
          {data.wageRecords.map(item => <tr key={item._id}><td>{item.period ? dateLabel(item.period.fromDate) + " – " + dateLabel(item.period.toDate) : "Period unavailable"}</td><td>{item.employmentType}</td><td>{money(item.grossPaise)}</td><td>{money(item.overtimePaise)}</td><td>{money(item.adjustmentPaise)}</td><td><strong>{money(item.totalPaise)}</strong></td><td><span className={"badge " + statusClass(item.status)}>{item.status}</span></td></tr>)}
        </tbody></table></div> : <Empty>No finalized wage records are available.</Empty>}</div>}
      </div>
    </div>
  </section>;
}
