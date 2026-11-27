"use client";
import "@/styles/muhurtham-calendar.css";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

type RecordItem = { _id: string; date: string; notes?: string; status: "draft" | "published" | "archived" };
const pad = (value: number) => String(value).padStart(2, "0");
const key = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;
const monthRange = (year: number, month: number) => ({ fromDate: key(year, month, 1), toDate: key(year, month, new Date(Date.UTC(year, month + 1, 0)).getUTCDate()) });
const dateLabel = (value: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(value + "T00:00:00Z"));
const monthLabel = (year: number, month: number) => new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month, 1)));

export function AdminMuhurthamCalendar() {
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState("");
  const [editing, setEditing] = useState<RecordItem | null>(null);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const year = cursor.getFullYear(), month = cursor.getMonth();
  const range = monthRange(year, month);
  const records = useQuery(api.muhurtham.listForAdmin, range) as RecordItem[] | undefined;
  const save = useMutation(api.muhurtham.save);
  const remove = useMutation(api.muhurtham.remove);
  const byDate = useMemo(() => new Map((records ?? []).map(item => [item.date, item])), [records]);
  const selectedRecord = selected ? byDate.get(selected) : undefined;
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const leading = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const openNew = (value: string) => { setEditing(null); setDate(value); setNotes(""); setStatus("draft"); setError(""); };
  const openEdit = (item: RecordItem) => { setEditing(item); setDate(item.date); setNotes(item.notes ?? ""); setStatus(item.status === "published" ? "published" : "draft"); setError(""); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      await save({ date, notes: notes.trim() || undefined, status, dateId: editing ? editing._id as any : undefined });
      setSelected(date); setEditing(null); setDate("");
    } catch (err) { setError(err instanceof Error ? err.message.replaceAll("_", " ").toLowerCase() : "Unable to save this date."); }
    finally { setSaving(false); }
  };
  const deleteRecord = async (item: RecordItem) => { if (!window.confirm("Delete this Muhurtham entry? This cannot be undone.")) return; try { await remove({ dateId: item._id as any }); setSelected(""); setEditing(null); } catch { setError("Unable to delete this entry."); } };
  return <section className="sec muhurtham-calendar">
    <div className="page-head"><div><h2 className="t-h1" style={{fontSize:22}}>Muhurtham Calendar</h2><p className="sub">Manage and publish Muhurtham dates for Orchid Flowers.</p></div><div className="page-actions"><button className="btn btn-primary" onClick={() => openNew(selected || new Date().toISOString().slice(0,10))}>+ Add Muhurtham</button></div></div>
    <div className="muhurtham-admin-grid">
      <div className="panel p-4">
        <div className="flex items-center justify-between gap-3 mb-4"><button className="btn btn-outline" onClick={() => setCursor(new Date(year,month-1,1))}>Previous</button><h3 className="t-h3">{monthLabel(year,month)}</h3><button className="btn btn-outline" onClick={() => setCursor(new Date(year,month+1,1))}>Next</button></div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day=><span key={day} className="text-xs text-secondary font-semibold py-2">{day}</span>)}</div>
        <div className="grid grid-cols-7 gap-1">{Array.from({length:leading},(_,i)=><span key={"blank"+i}/>)}{Array.from({length:days},(_,i)=>{const value=key(year,month,i+1);const item=byDate.get(value);return <button key={value} onClick={()=>setSelected(value)} title={item?.notes || undefined} className={`min-h-24 rounded-lg border p-1.5 flex flex-col items-center justify-start gap-1 overflow-hidden ${selected===value?"border-primary bg-secondary-fixed":"border-outline-variant/50"}`}><span className="text-sm font-semibold">{i+1}</span>{item&&<><span className={`text-[9px] rounded-full px-1.5 py-0.5 ${item.status==="published"?"bg-green-100 text-green-800":"bg-amber-100 text-amber-800"}`}>{item.status==="published"?"Muhurtham":"Draft"}</span>{item.notes?.trim()&&<span className="w-full text-left text-[9px] leading-tight text-secondary line-clamp-2 break-words">{item.notes}</span>}</>}</button>})}</div>
        <div className="flex gap-4 mt-4 text-xs text-secondary"><span>🟢 Published Muhurtham</span><span>🟠 Draft (admin only)</span></div>
      </div>
      <div className="panel p-4">
        <h3 className="t-h3 mb-3">{selected ? dateLabel(selected) : "Select a date"}</h3>
        {selectedRecord ? <div className="space-y-3"><span className={`badge ${selectedRecord.status==="published"?"badge-success":"badge-neutral"}`}>{selectedRecord.status}</span>{selectedRecord.notes&&<p className="text-sm whitespace-pre-wrap">{selectedRecord.notes}</p>}<div className="flex flex-wrap gap-2"><button className="btn btn-primary" onClick={()=>openEdit(selectedRecord)}>Edit</button><button className="btn btn-outline" onClick={()=>void deleteRecord(selectedRecord)}>Delete</button></div></div>:selected?<p className="text-sm text-secondary">No Muhurtham entry for this date.</p>:<p className="text-sm text-secondary">Choose a date to view or manage its entry.</p>}
      </div>
    </div>
    {(editing || date) && <div className="panel p-4 mt-5"><div className="flex justify-between items-center mb-4"><h3 className="t-h3">{editing?"Edit Muhurtham":"Add Muhurtham date"}</h3><button className="btn btn-outline" onClick={()=>{setEditing(null);setDate("");setError("");}}>Close</button></div><form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <label className="text-sm flex flex-col gap-1">Date<input required type="date" className="input" value={date} onChange={e=>setDate(e.target.value)}/></label>
      <label className="text-sm flex flex-col gap-1">Publication status<select className="input" value={status} onChange={e=>setStatus(e.target.value as "draft"|"published")}><option value="draft">Draft</option><option value="published">Published</option></select></label>
      <label className="md:col-span-2 text-sm flex flex-col gap-1">Notes<textarea className="input min-h-20" value={notes} onChange={e=>setNotes(e.target.value)} maxLength={1000}/></label>
      {error&&<p className="md:col-span-2 text-sm text-red-600" role="alert">{error}</p>}<div className="md:col-span-2 flex justify-end"><button className="btn btn-primary" disabled={saving}>{saving?"Saving…":"Save Muhurtham"}</button></div>
    </form></div>}
    <p className="text-xs text-secondary mt-3">Muhurtham dates are entered and published by Orchid Flowers administrators.</p>
  </section>;
}

export function EmployeeMuhurthamCalendar() {
  const [cursor,setCursor]=useState(()=>new Date());
  const [selected,setSelected]=useState("");
  const year=cursor.getFullYear(),month=cursor.getMonth(),range=monthRange(year,month);
  const records=useQuery(api.muhurtham.listPublished,range) as RecordItem[]|undefined;
  const byDate=useMemo(()=>new Map((records??[]).map(item=>[item.date,item])),[records]);
  const days=new Date(Date.UTC(year,month+1,0)).getUTCDate();
  const leading=new Date(Date.UTC(year,month,1)).getUTCDay();
  const chosen=selected?byDate.get(selected):undefined;
  const today=key(new Date().getFullYear(),new Date().getMonth(),new Date().getDate());
  const publishedCount=records?.length ?? 0;
  const changeMonth=(offset:number)=>{setCursor(new Date(year,month+offset,1));setSelected("");};
  return <section className="employee-muhurtham" aria-labelledby="employee-muhurtham-title">
    <header className="employee-muhurtham__header">
      <a className="employee-muhurtham__back" href="/employee" aria-label="Back to employee home"><span className="material-symbols-outlined">arrow_back</span></a>
      <div className="employee-muhurtham__brand"><span>Orchid One</span><small>Employee · Calendar</small></div>
      <span className="material-symbols-outlined employee-muhurtham__brand-icon" aria-hidden="true">calendar_month</span>
    </header>
    <div className="employee-muhurtham__content">
      <div className="employee-muhurtham__intro">
        <p className="employee-muhurtham__eyebrow">ORCHID FLOWERS</p>
        <h1 id="employee-muhurtham-title">Muhurtham Calendar</h1>
        <p>Find the published Muhurtham dates for the month.</p>
      </div>
      <div className="employee-muhurtham__summary">
        <div className="employee-muhurtham__summary-icon"><span className="material-symbols-outlined">event_available</span></div>
        <div><strong>{records===undefined?"—":publishedCount}</strong><span>{records===undefined?"Loading dates":"Muhurtham dates this month"}</span></div>
        <span className="employee-muhurtham__summary-note">Published</span>
      </div>
      <section className="employee-muhurtham__calendar-card" aria-label="Monthly Muhurtham calendar">
        <div className="employee-muhurtham__monthbar">
          <button type="button" onClick={()=>changeMonth(-1)} aria-label="Previous month"><span className="material-symbols-outlined">chevron_left</span></button>
          <div><h2>{monthLabel(year,month)}</h2><span>Choose a highlighted date</span></div>
          <button type="button" onClick={()=>changeMonth(1)} aria-label="Next month"><span className="material-symbols-outlined">chevron_right</span></button>
        </div>
        <div className="employee-muhurtham__weekdays" aria-hidden="true">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day=><span key={day}>{day}</span>)}</div>
        <div className="employee-muhurtham__days">
          {Array.from({length:leading},(_,i)=><span key={"blank-"+i} className="employee-muhurtham__blank" aria-hidden="true"/>)}
          {Array.from({length:days},(_,i)=>{
            const value=key(year,month,i+1),item=byDate.get(value),isSelected=selected===value,isToday=value===today;
            return <button key={value} type="button" disabled={!item} onClick={()=>setSelected(value)} aria-pressed={isSelected} aria-label={item?dateLabel(value)+", Muhurtham":dateLabel(value)} className={["employee-muhurtham__day",item?"is-muhurtham":"",isSelected?"is-selected":"",isToday?"is-today":""].filter(Boolean).join(" ")}>
              <span>{i+1}</span>{item&&<i aria-hidden="true"/>}
            </button>;
          })}
        </div>
        <div className="employee-muhurtham__legend"><span><i/> Muhurtham day</span><span><i className="is-today-dot"/> Today</span></div>
      </section>
      <section className="employee-muhurtham__details" aria-live="polite">
        {chosen?<><div className="employee-muhurtham__details-top"><div><span className="employee-muhurtham__eyebrow">SELECTED DATE</span><h2>{dateLabel(chosen.date)}</h2></div><span className="employee-muhurtham__published"><i/> Published</span></div>
          {chosen.notes&&<p className="employee-muhurtham__notes">{chosen.notes}</p>}
        </>:<div className="employee-muhurtham__empty"><span className="material-symbols-outlined">touch_app</span><strong>{records===undefined?"Loading calendar…":"Select a highlighted date"}</strong><p>{records===undefined?"Published dates will appear here.":"Choose a marked day to view its Muhurtham details."}</p></div>}
      </section>
      <p className="employee-muhurtham__footnote"><span className="material-symbols-outlined">info</span> Only dates published by Orchid Flowers administrators are shown.</p>
    </div>
    <nav className="employee-muhurtham__bottom-nav" aria-label="Employee navigation">
      <a href="/employee"><span className="material-symbols-outlined">home</span><small>Home</small></a>
      <a href="/employee/calendar" aria-current="page"><span className="material-symbols-outlined">calendar_month</span><small>Calendar</small></a>
    </nav>
  </section>;
}
