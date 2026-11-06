"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Check, Clock3, X } from "lucide-react";
import { api } from "@/../convex/_generated/api";

export function PendingUsersPanel() {
  const users = useQuery(api.users.listPendingUsers, { limit: 50 });
  const review = useMutation(api.users.reviewAccount);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function decide(userId: (typeof users extends (infer T)[] | undefined ? T extends { _id: infer I } ? I : never : never), status: "active" | "rejected") {
    setBusyId(String(userId));
    setMessage("");
    try {
      await review({ userId, status });
      setMessage(status === "active" ? "Account approved." : "Registration rejected.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update account.");
    } finally {
      setBusyId(null);
    }
  }

  if (users === undefined) {
    return <div className="panel"><div className="panel-body empty-state">Loading pending registrations…</div></div>;
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <div><span className="t-h3">Pending registrations</span><p className="t-caption text-tertiary">Review access requests for Orchid Flowers</p></div>
        <span className="badge badge-neutral">{users.length} pending</span>
      </div>
      {message && <p className="t-body-sm" role="status" style={{padding:"10px 18px"}}>{message}</p>}
      {users.length === 0 ? (
        <div className="panel-body empty-state"><Clock3 size={26}/><p className="t-body-sm text-secondary">There are no pending registrations.</p></div>
      ) : (
        <div className="panel-body" style={{display:"grid",gap:12}}>
          {users.map((user) => (
            <article key={user._id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,flexWrap:"wrap",padding:"12px 0",borderBottom:"1px solid var(--border)"}}>
              <div className="col" style={{gap:4}}>
                <strong className="t-body-sm">{user.fullName}</strong>
                <span className="t-caption text-tertiary">{user.email || "No email on profile"} · Registered {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="row gap-2">
                <button className="btn btn-outline" disabled={busyId === String(user._id)} onClick={() => decide(user._id, "rejected")}><X size={15}/> Reject</button>
                <button className="btn btn-primary" disabled={busyId === String(user._id)} onClick={() => decide(user._id, "active")}><Check size={15}/> Approve</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
