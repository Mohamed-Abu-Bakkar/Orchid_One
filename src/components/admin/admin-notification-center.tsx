"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import {
  Bell, BellRing, CalendarClock, Check, CheckCheck, Clock3, Inbox,
  LoaderCircle, Users, Wallet, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import "./admin-notification-center.css";

type Filter = "all" | "unread";
type NotificationItem = NonNullable<ReturnType<typeof useQuery<typeof api.notifications.listMine>>>["items"][number];

function notificationIcon(item: NotificationItem): LucideIcon {
  const content = `${item.title} ${item.body}`.toLowerCase();
  if (/leave|holiday|absence/.test(content)) return CalendarClock;
  if (/overtime|wage|payroll|salary/.test(content)) return Wallet;
  if (/employee|team|work|assignment|onboard/.test(content)) return Users;
  return BellRing;
}

function dayGroup(timestamp: number, now: Date): "Today" | "Yesterday" | "Earlier" {
  const date = new Date(timestamp);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const difference = Math.round((today - day) / 86_400_000);
  return difference <= 0 ? "Today" : difference === 1 ? "Yesterday" : "Earlier";
}

function relativeTime(timestamp: number, now: number) {
  const minutes = Math.max(0, Math.floor((now - timestamp) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(timestamp));
}

function fullTime(timestamp: number) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit",
  }).format(new Date(timestamp));
}

export function AdminNotificationCenter({ onNavigate }: { onNavigate: (destination: "leave" | "overtime") => void }) {
  const data = useQuery(api.notifications.listMine, {});
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAll, setBusyAll] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const items = data?.items ?? [];
  const unread = data?.unreadCount ?? 0;
  const now = Date.now();

  const visibleItems = useMemo(
    () => filter === "unread" ? items.filter(item => item.readAt === undefined) : items,
    [filter, items],
  );
  const groupedItems = useMemo(() => {
    const groups: { title: string; items: typeof visibleItems }[] = [];
    for (const title of ["Today", "Yesterday", "Earlier"] as const) {
      const group = visibleItems.filter(item => dayGroup(item.createdAt, new Date(now)) === title);
      if (group.length) groups.push({ title, items: group });
    }
    return groups;
  }, [visibleItems, now]);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  async function read(id: NotificationItem["_id"]) {
    setBusyId(String(id));
    try { await markRead({ notificationId: id }); }
    finally { setBusyId(null); }
  }

  async function readAll() {
    setBusyAll(true);
    try { await markAllRead({}); }
    finally { setBusyAll(false); }
  }

  return (
    <div className="admin-notification" ref={rootRef}>
      <button
        type="button"
        className={`admin-notification__trigger ${open ? "is-open" : ""}`}
        aria-label={`Notifications, ${unread} unread`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(value => !value)}
      >
        <Bell size={19} strokeWidth={1.8} />
        {unread > 0 && <span className="admin-notification__count">{unread > 99 ? "99+" : unread}</span>}
      </button>

      {open && (
        <section className="admin-notification__panel" role="dialog" aria-label="Notification center">
          <header className="admin-notification__header">
            <div className="admin-notification__heading">
              <span className="admin-notification__eyebrow">ORCHID ONE · INBOX</span>
              <div className="admin-notification__title-row">
                <h2>Notifications</h2>
                {unread > 0 && <span className="admin-notification__unread-pill">{unread} new</span>}
              </div>
              <p>Stay up to date with your workspace.</p>
            </div>
            <button type="button" className="admin-notification__close" onClick={() => setOpen(false)} aria-label="Close notifications">
              <X size={18} />
            </button>
          </header>

          <div className="admin-notification__toolbar">
            <div className="admin-notification__tabs" role="tablist" aria-label="Notification filter">
              <button type="button" role="tab" aria-selected={filter === "all"} className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
                All <span>{items.length}</span>
              </button>
              <button type="button" role="tab" aria-selected={filter === "unread"} className={filter === "unread" ? "active" : ""} onClick={() => setFilter("unread")}>
                Unread <span>{unread}</span>
              </button>
            </div>
            <button type="button" className="admin-notification__mark-all" disabled={!unread || busyAll} onClick={() => void readAll()}>
              {busyAll ? <LoaderCircle size={14} className="spin" /> : <CheckCheck size={14} />}
              Mark all read
            </button>
          </div>

          <div className="admin-notification__list">
            {data === undefined ? (
              <div className="admin-notification__state">
                <span className="admin-notification__state-icon"><LoaderCircle size={22} className="spin" /></span>
                <strong>Loading your updates</strong>
                <p>Fetching the latest activity…</p>
              </div>
            ) : groupedItems.length === 0 ? (
              <div className="admin-notification__state">
                <span className="admin-notification__state-icon"><Inbox size={23} /></span>
                <strong>{filter === "unread" ? "You're all caught up" : "No notifications yet"}</strong>
                <p>{filter === "unread" ? "There are no unread updates right now." : "New workspace activity will appear here."}</p>
                {filter === "unread" && <button type="button" onClick={() => setFilter("all")}>View all notifications</button>}
              </div>
            ) : groupedItems.map(group => (
              <section className="admin-notification__group" key={group.title}>
                <div className="admin-notification__group-label">{group.title}</div>
                {group.items.map(item => {
                  const Icon = notificationIcon(item);
                  const isUnread = item.readAt === undefined;
                  return (
                    <article className={`admin-notification__item ${isUnread ? "is-unread" : ""}`} key={item._id}>
                      <span className="admin-notification__item-icon"><Icon size={17} strokeWidth={1.8} /></span>
                      <button
                        type="button"
                        className={`admin-notification__item-content ${item.destination ? "is-navigable" : ""}`}
                        disabled={!item.destination}
                        aria-label={item.destination ? `Open ${item.title} in ${item.destination === "leave" ? "Leave" : "Overtime"}` : undefined}
                        onClick={() => {
                          if (!item.destination) return;
                          void (async () => {
                            if (isUnread) await read(item._id);
                            setOpen(false);
                            onNavigate(item.destination!);
                          })();
                        }}
                      >
                        <div className="admin-notification__item-heading">
                          <h3>{item.title}</h3>
                          {isUnread && <span className="admin-notification__unread-dot" aria-label="Unread" />}
                        </div>
                        <p>{item.body}</p>
                        <div className="admin-notification__item-meta">
                          <span><Clock3 size={12} />{relativeTime(item.createdAt, now)}</span>
                          <time dateTime={new Date(item.createdAt).toISOString()} title={fullTime(item.createdAt)}>{fullTime(item.createdAt)}</time>
                          {item.destination && <span className="admin-notification__view-link">View {item.destination === "leave" ? "leave requests" : "overtime"} <span aria-hidden="true">→</span></span>}
                        </div>
                      </button>
                      {isUnread && (
                        <button
                          type="button"
                          className="admin-notification__read"
                          aria-label={`Mark "${item.title}" as read`}
                          title="Mark as read"
                          disabled={busyId === String(item._id)}
                          onClick={() => void read(item._id)}
                        >
                          {busyId === String(item._id) ? <LoaderCircle size={15} className="spin" /> : <Check size={16} />}
                        </button>
                      )}
                    </article>
                  );
                })}
              </section>
            ))}
          </div>

          <footer className="admin-notification__footer">
            <span>Showing the latest {items.length} of up to 50 updates</span>
            <span><span className="admin-notification__live-dot" /> Live updates</span>
          </footer>
        </section>
      )}
    </div>
  );
}
