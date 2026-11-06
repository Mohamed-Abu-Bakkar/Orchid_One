"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { CheckCircle2, Clock3, MapPin, XCircle } from "lucide-react";

export function AttendanceExceptionReview() {
  const items = useQuery(api.attendance.pendingGeofenceExceptions, {});
  const review = useMutation(api.attendance.reviewGeofenceException);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  async function decide(eventId: (typeof items extends (infer T)[] | undefined ? T : never) extends { _id: infer I } ? I : never, decision: "approved" | "rejected") {
    setBusyId(String(eventId));
    setError("");
    try {
      await review({ eventId, decision, note: notes[String(eventId)]?.trim() || undefined });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to review attendance exception.");
    } finally {
      setBusyId(null);
    }
  }

  if (items === undefined) return <section className="sec"><p className="sub">Loading attendance exceptions…</p></section>;
  return <section className="sec">
    <div className="page-head"><div><h2 className="t-h1" style={{ fontSize: 22 }}>Geofence exceptions</h2><p className="sub">Review attendance punches recorded outside the employee’s assigned work location.</p></div><span className="badge badge-neutral">{items.length} pending</span></div>
    {error && <p role="alert" className="text-sm" style={{ color: "var(--error)", marginBottom: 16 }}>{error}</p>}
    {items.length === 0 ? <div className="panel"><div className="panel-body empty-state"><CheckCircle2 size={28}/><h3 className="t-h3">No pending exceptions</h3><p className="t-body-sm text-secondary">New outside-geofence attempts will appear here for supervisor or admin review.</p></div></div> :
      <div className="grid-2-equal">{items.map(item => <article className="panel" key={item._id}>
        <div className="panel-head"><div><h3 className="t-h3">{item.employeeName}</h3><p className="t-caption text-tertiary">{item.employeeCode}</p></div><span className="badge badge-warning"><Clock3 size={13}/> Pending</span></div>
        <div className="panel-body">
          <p className="t-body-sm"><strong>Attempt:</strong> {item.eventType.replace("_", " ")}</p>
          <p className="t-body-sm"><strong>Work location:</strong> {item.locationName}</p>
          <p className="t-body-sm"><strong>Time:</strong> {new Date(item.clientTimestamp).toLocaleString("en-IN")}</p>
          <p className="t-body-sm"><strong>GPS accuracy:</strong> {Math.round(item.accuracyM)} m</p>
          <p className="t-caption text-tertiary" style={{ marginTop: 6 }}><MapPin size={13} style={{ display: "inline", verticalAlign: "middle" }}/> {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}</p>
          <label className="t-caption text-tertiary" htmlFor={"review-note-" + item._id}>Reviewer note (optional)</label>
          <textarea id={"review-note-" + item._id} className="input" rows={2} value={notes[String(item._id)] ?? ""} onChange={e => setNotes(current => ({ ...current, [String(item._id)]: e.target.value }))} placeholder="Add a reason or context"/>
          <div className="row gap-2" style={{ marginTop: 12 }}>
            <button className="btn btn-primary" type="button" disabled={busyId !== null} onClick={() => decide(item._id, "approved")}><CheckCircle2 size={15}/> Approve</button>
            <button className="btn btn-outline" type="button" disabled={busyId !== null} onClick={() => decide(item._id, "rejected")}><XCircle size={15}/> Reject</button>
          </div>
        </div>
      </article>)}</div>}
  </section>;
}
