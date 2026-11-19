"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";

export function AttendanceExceptionReview() {
  const items = useQuery(api.attendanceReview.pendingReviews, {});
  const account = useQuery(api.account.getMyAccountStatus, {});
  const recommend = useMutation(api.attendance.reviewGeofenceException);
  const finalize = useMutation(api.attendance.finalizeGeofenceException);
  const resolve = useMutation(api.attendanceReview.resolveUnclassifiedReview);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  async function decide(item: any, decision: "approved" | "rejected") {
    const id = String(item._id);
    setBusyId(id); setError("");
    try {
      const note = notes[id]?.trim() ?? "";
      if (item.exceptionCode === "OUTSIDE_GEOFENCE") {
        if (account?.role === "supervisor") await recommend({ eventId: item._id as Id<"attendanceEvents">, decision, note: note || undefined });
        else await finalize({ eventId: item._id as Id<"attendanceEvents">, decision, note: note || undefined });
      } else {
        await resolve({ eventId: item._id as Id<"attendanceEvents">, decision, note });
      }
      setNotes(current => ({ ...current, [id]: "" }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to resolve attendance review.");
    } finally { setBusyId(null); }
  }

  if (items === undefined || account === undefined || account === null) return <section className="sec"><p className="sub">Loading attendance reviews…</p></section>;
  const canFinalize = account.role === "admin" || account.role === "superadmin";
  return <section className="sec">
    <div className="page-head"><div><h2 className="t-h1" style={{ fontSize: 22 }}>Attendance reviews</h2><p className="sub">All unresolved attendance events that may prevent an employee from recording another punch.</p></div><span className="badge badge-neutral">{items.length} pending</span></div>
    {error && <p role="alert" className="text-sm" style={{ color: "var(--error)", marginBottom: 16 }}>{error}</p>}
    {items.length === 0 ? <div className="panel"><div className="panel-body empty-state"><CheckCircle2 size={28}/><h3 className="t-h3">No pending attendance reviews</h3><p className="t-body-sm text-secondary">There are no unresolved attendance events in this organization.</p></div></div> :
      <div className="grid-2-equal">{items.map((item: any) => {
        const geofence = item.exceptionCode === "OUTSIDE_GEOFENCE";
        const waitingForAdmin = geofence && canFinalize && !item.supervisorRecommendation;
        const title = geofence ? "Outside geofence" : item.exceptionCode ?? "Unclassified pending review";
        return <article className="panel" key={item._id}>
          <div className="panel-head"><div><h3 className="t-h3">{item.employeeName}</h3><p className="t-caption text-tertiary">{item.employeeCode}</p></div><span className="badge badge-warning"><Clock3 size={13}/>{title}</span></div>
          <div className="panel-body">
            <p className="t-body-sm"><strong>Event:</strong> {item.eventType.replace("_", " ")}</p>
            <p className="t-body-sm"><strong>Recorded:</strong> {new Date(item.receivedAt).toLocaleString("en-IN")}</p>
            <p className="t-body-sm"><strong>Location:</strong> {item.locationName} · {item.locationType}</p>
            <p className="t-body-sm"><strong>Geofence:</strong> {item.geofencePassed === null ? "Not evaluated" : item.geofencePassed ? "Passed" : "Failed"}</p>
            {item.supervisorRecommendation && <p className="t-body-sm"><strong>Supervisor recommendation:</strong> {item.supervisorRecommendation}{item.supervisorNote ? " · " + item.supervisorNote : ""}</p>}
            <label className="t-caption text-tertiary" htmlFor={"attendance-review-" + item._id}>Review note (required for rejection and unclassified events)</label>
            <textarea id={"attendance-review-" + item._id} className="input" rows={2} value={notes[String(item._id)] ?? ""} onChange={e => setNotes(current => ({ ...current, [String(item._id)]: e.target.value }))} placeholder="Explain the decision"/>
            {waitingForAdmin ? <p className="t-caption text-tertiary">Waiting for supervisor recommendation.</p> : <div className="row gap-2" style={{ marginTop: 12 }}>
              <button className="btn btn-primary" type="button" disabled={busyId !== null || (geofence && canFinalize && !item.supervisorRecommendation)} onClick={() => void decide(item, "approved")}><CheckCircle2 size={15}/>{geofence && !canFinalize ? "Recommend approval" : "Approve"}</button>
              <button className="btn btn-outline" type="button" disabled={busyId !== null || !(notes[String(item._id)] ?? "").trim()} onClick={() => void decide(item, "rejected")}><XCircle size={15}/>{geofence && !canFinalize ? "Recommend rejection" : "Reject"}</button>
            </div>}
          </div>
        </article>;
      })}</div>}
  </section>;
}
