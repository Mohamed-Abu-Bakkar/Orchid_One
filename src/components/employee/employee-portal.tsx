"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { authClient } from "@/lib/auth-client";

type Tab = "home" | "attendance" | "documents" | "requests" | "more";

export function EmployeePortal() {
  const router = useRouter();
  const session = authClient.useSession();
  const account = useQuery(api.account.getMyAccountStatus, session.data ? {} : "skip");
  const events = useQuery(
    api.attendance.myRecentEvents,
    session.data && account?.status === "active" && account.role === "employee" ? { limit: 8 } : "skip",
  );
  const punch = useMutation(api.attendance.recordPunch);
  const [tab, setTab] = useState<Tab>("home");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const nextPunch = useMemo(() => {
    const latest = events?.[0];
    return latest?.eventType === "check_in" ? "check_out" : "check_in";
  }, [events]);

  async function signOut() {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  async function recordAttendance() {
    if (!navigator.geolocation) {
      setMessage("This device does not support location services.");
      return;
    }
    setBusy(true);
    setMessage("");
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const result = await punch({
          eventType: nextPunch,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyM: position.coords.accuracy,
          clientTimestamp: Date.now(),
          idempotencyKey: crypto.randomUUID(),
        });
        setMessage(result.geofencePassed ? "Attendance recorded." : "Punch recorded for administrator review: outside the configured geofence.");
      } catch (cause) {
        setMessage(cause instanceof Error ? cause.message : "Unable to record attendance.");
      } finally {
        setBusy(false);
      }
    }, (error) => {
      setBusy(false);
      setMessage(error.code === error.PERMISSION_DENIED ? "Location permission is required to record attendance." : "Unable to obtain your current location.");
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }

  if (session.isPending || (session.data && account === undefined)) {
    return <main className="auth-page"><section className="auth-card"><p className="auth-subtitle">Loading your Orchid workspace…</p></section></main>;
  }
  if (!session.data) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="auth-brand"><span className="auth-mark">✿</span><span>ORCHID ONE</span></div>
          <p className="auth-eyebrow">ORCHID FLOWERS</p>
          <h1>People. Workforce. Performance.</h1>
          <p className="auth-subtitle">Your employee workspace for attendance, documents and requests.</p>
          <a className="auth-submit auth-link-button" href="/login">Sign in</a>
          <p className="auth-switch">New employee? <a href="/register">Register here</a></p>
        </section>
      </main>
    );
  }
  if (!account) {
    return <main className="auth-page"><section className="auth-card"><h1>Account setup required</h1><p className="auth-subtitle">Your login is valid, but an Orchid Flowers account profile has not been provisioned. Contact the system administrator.</p><button className="auth-submit" onClick={signOut}>Sign out</button></section></main>;
  }
  if (account.status === "suspended") {
    router.replace("/suspended");
    return <main className="auth-page"><section className="auth-card"><p className="auth-subtitle">This account is suspended.</p></section></main>;
  }
  if (account.role !== "employee") {
    router.replace("/admin");
    return <main className="auth-page"><section className="auth-card"><p className="auth-subtitle">Opening your workspace…</p></section></main>;
  }

  return (
    <main className="employee-page">
      <header className="employee-header">
        <div className="employee-header-inner">
          <div className="employee-header-top">
            <span className="employee-brand">✿ ORCHID ONE</span>
            <button className="employee-logout" onClick={signOut}>Sign out</button>
          </div>
          <p className="employee-greeting">Hello, {session.data.user.name || "there"}</p>
          <p className="employee-header-sub">Your Orchid Flowers employee workspace</p>
        </div>
      </header>
      <section className="employee-content">
        {tab === "home" && <>
          <div className="employee-card">
            <p className="employee-card-title">Your workspace</p>
            <p className="employee-muted">Your employee account is active. Use the sections below to access attendance, documents and requests as those records become available.</p>
          </div>
          <div className="employee-card">
            <p className="employee-card-title">Today’s attendance</p>
            <p className="employee-muted">Location is requested only when you choose to punch in or out. Your device must allow location access.</p>
            <button className="auth-submit" disabled={busy} onClick={recordAttendance}>{busy ? "Getting location…" : nextPunch === "check_in" ? "Punch in" : "Punch out"}</button>
            {message && <p className="employee-muted" role="status" style={{marginTop:10}}>{message}</p>}
          </div>
          <div className="employee-card">
            <p className="employee-card-title">Recent attendance</p>
            {events?.length ? events.map((event) => <p className="employee-muted" key={event._id}>{event.eventType.replace("_"," ")} · {new Date(event.receivedAt).toLocaleString()} · {event.geofencePassed ? "Location verified" : "Needs review"}</p>) : <p className="employee-muted">No attendance events recorded yet.</p>}
          </div>
        </>}
        {tab === "attendance" && <div className="employee-card"><p className="employee-card-title">Attendance</p><p className="employee-muted">Use the home screen to punch in or out. Attendance history is loaded from your Convex records.</p></div>}
        {tab === "documents" && <div className="employee-card"><p className="employee-card-title">My documents</p><p className="employee-muted">Your secure employee documents will appear here when uploaded and assigned to your profile.</p></div>}
        {tab === "requests" && <div className="employee-card"><p className="employee-card-title">My requests</p><p className="employee-muted">Leave and overtime request workflows will appear here when their approved business rules are configured.</p></div>}
        {tab === "more" && <div className="employee-card"><p className="employee-card-title">More</p><p className="employee-muted">Account and policy information will be available here.</p></div>}
      </section>
      <nav className="employee-tabs" aria-label="Employee navigation">
        {([["home","⌂","Home"],["attendance","◷","Attendance"],["documents","▤","Documents"],["requests","☷","Requests"],["more","⋯","More"]] as const).map(([id,icon,label]) =>
          <button key={id} className={tab===id ? "active" : ""} onClick={() => setTab(id)}><span>{icon}</span>{label}</button>
        )}
      </nav>
    </main>
  );
}
