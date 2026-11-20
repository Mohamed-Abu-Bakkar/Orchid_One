"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Bell, CheckCheck, Check, LoaderCircle } from "lucide-react";

function formatTime(value: number) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function AdminNotificationCenter() {
  const data = useQuery(api.notifications.listMine, {});
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAll, setBusyAll] = useState(false);
  const items = data?.items ?? [];
  const unread = data?.unreadCount ?? 0;

  async function read(id: any) {
    setBusyId(String(id));
    try { await markRead({ notificationId: id }); }
    finally { setBusyId(null); }
  }

  async function readAll() {
    setBusyAll(true);
    try { await markAllRead({}); }
    finally { setBusyAll(false); }
  }

  return <div className="relative">
    <button type="button" className="icon-btn relative" aria-label={`Notifications, ${unread} unread`} onClick={() => setOpen(v => !v)}>
      <Bell size={19}/>
      {unread > 0 && <span className="absolute -right-1 -top-1 min-w-5 h-5 rounded-full bg-[#B42318] px-1 text-[10px] font-semibold text-white flex items-center justify-center">{unread > 99 ? "99+" : unread}</span>}
    </button>
    {open && <div className="absolute right-0 top-12 z-50 w-[min(92vw,420px)] max-h-[min(70vh,620px)] overflow-hidden rounded-xl border border-outline-variant bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
        <div><strong>Notifications</strong><p className="t-caption text-tertiary">{unread} unread</p></div>
        <button type="button" className="btn btn-outline btn-sm" disabled={!unread || busyAll} onClick={readAll}><CheckCheck size={14}/>{busyAll ? "Updating…" : "Mark all read"}</button>
      </div>
      <div className="max-h-[min(60vh,520px)] overflow-y-auto">
        {data === undefined ? <div className="p-6 text-center text-sm text-secondary"><LoaderCircle className="mx-auto mb-2 animate-spin"/>Loading notifications…</div> :
          items.length === 0 ? <div className="p-8 text-center text-sm text-secondary">You're all caught up. New updates will appear here.</div> :
          items.map(item => <article key={item._id} className={`border-b border-outline-variant/50 px-4 py-3 ${item.readAt ? "bg-white" : "bg-[#FBF6FC]"}`}>
            <div className="flex items-start gap-3"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.readAt ? "bg-transparent" : "bg-primary"}`}/>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-on-surface">{item.title}</p><p className="mt-1 text-sm text-secondary">{item.body}</p><p className="mt-2 text-xs text-tertiary">{formatTime(item.createdAt)}</p></div>
              {!item.readAt && <button type="button" className="icon-btn" aria-label="Mark notification as read" disabled={busyId === item._id} onClick={() => void read(item._id)}><Check size={16}/></button>}
            </div>
          </article>)}
      </div>
    </div>}
  </div>;
}
