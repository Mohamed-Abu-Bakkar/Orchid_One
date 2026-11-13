"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/../convex/_generated/dataModel";
import { api } from "@/../convex/_generated/api";
import { CheckCircle2, Clock3, MapPin, XCircle } from "lucide-react";
import { GeofenceExceptionMap } from "@/components/admin/geofence-exception-map";

export function AttendanceExceptionReview() {
  const items = useQuery(api.attendance.pendingGeofenceExceptions, {});
  const account = useQuery(api.account.getMyAccountStatus, {});
  const review = useMutation(api.attendance.reviewGeofenceException);
  const finalize = useMutation(api.attendance.finalizeGeofenceException);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  async function decide(eventId: Id<"attendanceEvents">, decision: "approved" | "rejected") {
    setBusyId(String(eventId));
    setError("");
    try {
      if (account?.role === "supervisor") await review({ eventId, decision, note: notes[String(eventId)]?.trim() || undefined });
      else await finalize({ eventId, decision, note: notes[String(eventId)]?.trim() || undefined });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to review attendance exception.");
    } finally {
      setBusyId(null);
    }
  }

  if (items === undefined || account === undefined || account === null) return <section className="sec"><p className="sub">Loading attendance exceptions…</p></section>;
  return <section className="sec">
    <div className="page-head"><div><h2 className="t-h1" style={{ fontSize: 22 }}>Geofence exceptions</h2><p className="sub">Review attendance punches recorded outside the employee’s assigned work location.</p></div><span className="badge badge-neutral">{items.length} pending</span></div>
    {error && <p role="alert" className="text-sm" style={{ color: "var(--error)", marginBottom: 16 }}>{error}</p>}
    {items.length === 0 ? <div className="panel"><div className="panel-body empty-state"><CheckCircle2 size={28}/><h3 className="t-h3">No pending exceptions</h3><p className="t-body-sm text-secondary">New outside-geofence attempts will appear here for supervisor or admin review.</p></div></div> :
      <div className="grid-2-equal">{items.map(item => <article className="panel" key={item._id}>
        <div className="panel-head"><div><h3 className="t-h3">{item.employeeName}</h3><p className="t-caption text-tertiary">{item.employeeCode}</p></div><span className="badge badge-warning"><Clock3 size={13}/>{item.supervisorRecommendation ? `Supervisor recommended ${item.supervisorRecommendation}` : "Awaiting supervisor review"}</span></div>
        <div className="panel-body">
          <p className="t-body-sm"><strong>Attempt:</strong> {item.eventType.replace("_", " ")}</p>
          <p className="t-body-sm"><strong>Work location:</strong> {item.locationName}</p>
          <p className="t-body-sm"><strong>Time:</strong> {new Date(item.clientTimestamp).toLocaleString("en-IN")}</p>
          <p className="t-body-sm"><strong>GPS accuracy:</strong> {item.accuracyM != null ? `${Math.round(item.accuracyM)} m` : "Unavailable"}</p>
          {item.locationAddress && <p className="t-body-sm"><strong>Workplace address:</strong> {item.locationAddress}</p>}
          <div className="geofence-distance-summary">
            <div><span>Distance from workplace</span><strong>{item.distanceFromWorkplaceM === null ? "Unavailable" : `${item.distanceFromWorkplaceM.toLocaleString("en-IN")} m`}</strong></div>
            <div><span>Allowed radius</span><strong>{item.geofenceRadiusM === null ? "Not configured" : `${item.geofenceRadiusM.toLocaleString("en-IN")} m`}</strong></div>
          </div>
          {item.latitude != null && item.longitude != null ? (
            <>
              <GeofenceExceptionMap
                employeeLatitude={item.latitude}
                employeeLongitude={item.longitude}
                workplaceLatitude={item.workplaceLatitude}
                workplaceLongitude={item.workplaceLongitude}
                geofenceRadiusM={item.geofenceRadiusM}
                employeeName={item.employeeName}
                workplaceName={item.locationName}
              />
              <details className="geofence-coordinates">
                <summary><MapPin size={13}/> View raw GPS coordinates</summary>
                <p>Employee: {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}</p>
                <p>Workplace: {item.workplaceLatitude?.toFixed(6) ?? "—"}, {item.workplaceLongitude?.toFixed(6) ?? "—"}</p>
              </details>
            </>
          ) : (
            <div className="geofence-map-unavailable">
              Employee GPS coordinates are unavailable for this attendance event.
            </div>
          )}
          {item.supervisorNote && <p className="t-body-sm"><strong>Supervisor note:</strong> {item.supervisorNote}</p>}<label className="t-caption text-tertiary" htmlFor={"review-note-" + item._id}>{account.role === "supervisor" ? "Review note" : "Final decision note"}</label>
          <textarea id={"review-note-" + item._id} className="input" rows={2} value={notes[String(item._id)] ?? ""} onChange={e => setNotes(current => ({ ...current, [String(item._id)]: e.target.value }))} placeholder="Add a reason or context"/>
          <div className="row gap-2" style={{ marginTop: 12 }}>{account.role === "supervisor" ? <><button className="btn btn-primary" type="button" disabled={busyId !== null} onClick={() => decide(item._id, "approved")}><CheckCircle2 size={15}/> Recommend approval</button><button className="btn btn-outline" type="button" disabled={busyId !== null || !(notes[String(item._id)] ?? "").trim()} onClick={() => decide(item._id, "rejected")}><XCircle size={15}/> Recommend rejection</button></> : item.supervisorRecommendation ? <><button className="btn btn-primary" type="button" disabled={busyId !== null} onClick={() => decide(item._id, "approved")}><CheckCircle2 size={15}/> Final approve</button><button className="btn btn-outline" type="button" disabled={busyId !== null || !(notes[String(item._id)] ?? "").trim()} onClick={() => decide(item._id, "rejected")}><XCircle size={15}/> Final reject</button></> : <span className="t-caption text-tertiary">Waiting for supervisor recommendation.</span>}</div>
        </div>
      </article>)}</div>}
  </section>;
}
