"use client";
import "@/styles/muhurtham-calendar.css";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

type Slot = { startTime: string; endTime: string };
type RecordItem = { _id: string; date: string; tamilMonth?: string; tamilDay?: string; timings: Slot[]; notes?: string; status: "draft" | "published" | "archived" };
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
  const [tamilMonth, setTamilMonth] = useState("");
  const [tamilDay, setTamilDay] = useState("");
  const [notes, setNotes] = useState("");
  const [timings, setTimings] = useState<Slot[]>([{ startTime: "", endTime: "" }]);
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
  const openNew = (value: string) => { setEditing(null); setDate(value); setTamilMonth(""); setTamilDay(""); setNotes(""); setTimings([{ startTime: "", endTime: "" }]); setStatus("draft"); setError(""); };
  const openEdit = (item: RecordItem) => { setEditing(item); setDate(item.date); setTamilMonth(item.tamilMonth ?? ""); setTamilDay(item.tamilDay ?? ""); setNotes(item.notes ?? ""); setTimings(item.timings.length ? item.timings.map(slot => ({...slot})) : [{startTime:"",endTime:""}]); setStatus(item.status === "published" ? "published" : "draft"); setError(""); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const validSlots = timings.filter(slot => slot.startTime || slot.endTime);
      await save({ date, tamilMonth: tamilMonth.trim() || undefined, tamilDay: tamilDay.trim() || undefined, notes: notes.trim() || undefined, timings: validSlots, status, dateId: editing ? editing._id as any : undefined });
      setSelected(date); setEditing(null); setDate("");
    } catch (err) { setError(err instanceof Error ? err.message.replaceAll("_", " ").toLowerCase() : "Unable to save this date."); }
    finally { setSaving(false); }
  };
  const deleteRecord = async (item: RecordItem) => { if (!window.confirm("Delete this Muhurtham entry? This cannot be undone.")) return; try { await remove({ dateId: item._id as any }); setSelected(""); setEditing(null); } catch { setError("Unable to delete this entry."); } };
  return <section className="sec muhurtham-calendar">
    <div className="page-head"><div><h2 className="t-h1" style={{fontSize:22}}>Tamil Muhurtham Calendar</h2><p className="sub">Manage auspicious dates and their timings for Orchid Flowers.</p></div><div className="page-actions"><button className="btn btn-primary" onClick={() => openNew(selected || new Date().toISOString().slice(0,10))}>+ Add Muhurtham</button></div></div>
    <div className="muhurtham-admin-grid">
      <div className="panel p-4">
        <div className="flex items-center justify-between gap-3 mb-4"><button className="btn btn-outline" onClick={() => setCursor(new Date(year,month-1,1))}>Previous</button><h3 className="t-h3">{monthLabel(year,month)}</h3><button className="btn btn-outline" onClick={() => setCursor(new Date(year,month+1,1))}>Next</button></div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day=><span key={day} className="text-xs text-secondary font-semibold py-2">{day}</span>)}</div>
        <div className="grid grid-cols-7 gap-1">{Array.from({length:leading},(_,i)=><span key={"blank"+i}/>)}{Array.from({length:days},(_,i)=>{const value=key(year,month,i+1);const item=byDate.get(value);return <button key={value} onClick={()=>setSelected(value)} className={`min-h-16 rounded-lg border p-1 flex flex-col items-center justify-center gap-1 ${selected===value?"border-primary bg-secondary-fixed":"border-outline-variant/50"}`}><span className="text-sm font-semibold">{i+1}</span>{item&&<span className={`text-[9px] rounded-full px-1.5 py-0.5 ${item.status==="published"?"bg-green-100 text-green-800":"bg-amber-100 text-amber-800"}`}>{item.status==="published"?"Muhurtham":"Draft"}</span>}</button>})}</div>
        <div className="flex gap-4 mt-4 text-xs text-secondary"><span>🟢 Published Muhurtham</span><span>🟠 Draft (admin only)</span></div>
      </div>
      <div className="panel p-4">
        <h3 className="t-h3 mb-3">{selected ? dateLabel(selected) : "Select a date"}</h3>
        {selectedRecord ? <div className="space-y-3"><span className={`badge ${selectedRecord.status==="published"?"badge-success":"badge-neutral"}`}>{selectedRecord.status}</span>{selectedRecord.tamilMonth&&<p className="text-sm">Tamil month: <strong>{selectedRecord.tamilMonth}</strong>{selectedRecord.tamilDay? " · Day "+selectedRecord.tamilDay:""}</p>}<div>{selectedRecord.timings.length?selectedRecord.timings.map((slot,i)=><p key={i} className="text-sm py-1">{slot.startTime} – {slot.endTime}</p>):<p className="text-sm text-secondary">No timings provided.</p>}</div>{selectedRecord.notes&&<p className="text-sm whitespace-pre-wrap">{selectedRecord.notes}</p>}<div className="flex flex-wrap gap-2"><button className="btn btn-primary" onClick={()=>openEdit(selectedRecord)}>Edit</button><button className="btn btn-outline" onClick={()=>void deleteRecord(selectedRecord)}>Delete</button></div></div>:selected?<p className="text-sm text-secondary">No Muhurtham entry for this date.</p>:<p className="text-sm text-secondary">Choose a date to view or manage its entry.</p>}
      </div>
    </div>
    {(editing || date) && <div className="panel p-4 mt-5"><div className="flex justify-between items-center mb-4"><h3 className="t-h3">{editing?"Edit Muhurtham":"Add Muhurtham date"}</h3><button className="btn btn-outline" onClick={()=>{setEditing(null);setDate("");setError("");}}>Close</button></div><form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <label className="text-sm flex flex-col gap-1">Date<input required type="date" className="input" value={date} onChange={e=>setDate(e.target.value)}/></label>
      <label className="text-sm flex flex-col gap-1">Tamil month<input className="input" value={tamilMonth} onChange={e=>setTamilMonth(e.target.value)} maxLength={40} placeholder="e.g. Thai"/></label>
      <label className="text-sm flex flex-col gap-1">Tamil day<input className="input" value={tamilDay} onChange={e=>setTamilDay(e.target.value)} maxLength={40} placeholder="Tamil day"/></label>
      <label className="text-sm flex flex-col gap-1">Publication status<select className="input" value={status} onChange={e=>setStatus(e.target.value as "draft"|"published")}><option value="draft">Draft</option><option value="published">Published</option></select></label>
      <div className="md:col-span-2"><div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold">Auspicious time slots</span><button type="button" className="btn btn-outline" disabled={timings.length>=8} onClick={()=>setTimings([...timings,{startTime:"",endTime:""}])}>Add time slot</button></div>{timings.map((slot,index)=><div key={index} className="flex items-end gap-2 mb-2"><label className="flex-1 text-xs">From<input type="time" className="input" value={slot.startTime} onChange={e=>setTimings(timings.map((s,i)=>i===index?{...s,startTime:e.target.value}:s))}/></label><label className="flex-1 text-xs">To<input type="time" className="input" value={slot.endTime} onChange={e=>setTimings(timings.map((s,i)=>i===index?{...s,endTime:e.target.value}:s))}/></label><button type="button" className="btn btn-outline" onClick={()=>setTimings(timings.filter((_,i)=>i!==index))}>Remove</button></div>)}</div>
      <label className="md:col-span-2 text-sm flex flex-col gap-1">Notes<textarea className="input min-h-20" value={notes} onChange={e=>setNotes(e.target.value)} maxLength={1000}/></label>
      {error&&<p className="md:col-span-2 text-sm text-red-600" role="alert">{error}</p>}<div className="md:col-span-2 flex justify-end"><button className="btn btn-primary" disabled={saving}>{saving?"Saving…":"Save Muhurtham"}</button></div>
    </form></div>}
    <p className="text-xs text-secondary mt-3">Dates and timings are entered and verified by Orchid Flowers administrators. No astrology provider is used.</p>
  </section>;
}

export function EmployeeMuhurthamCalendar() {
  const [cursor,setCursor]=useState(()=>new Date());
  const [selected,setSelected]=useState("");
  const year=cursor.getFullYear(),month=cursor.getMonth(),range=monthRange(year,month);
  const records=useQuery(api.muhurtham.listPublished,range) as RecordItem[]|undefined;
  const byDate=useMemo(()=>new Map((records??[]).map(item=>[item.date,item])),[records]);
  const days=new Date(Date.UTC(year,month+1,0)).getUTCDate(),leading=new Date(Date.UTC(year,month,1)).getUTCDay();
  const chosen=selected?byDate.get(selected):undefined;
  return <section className="sec"><div className="page-head"><div><h2 className="t-h1" style={{fontSize:22}}>Tamil Muhurtham Calendar</h2><p className="sub">Published Muhurtham dates and timings.</p></div></div><div className="panel p-4"><div className="flex items-center justify-between gap-3 mb-4"><button className="btn btn-outline" onClick={()=>setCursor(new Date(year,month-1,1))}>Previous</button><h3 className="t-h3">{monthLabel(year,month)}</h3><button className="btn btn-outline" onClick={()=>setCursor(new Date(year,month+1,1))}>Next</button></div><div className="grid grid-cols-7 gap-1 text-center mb-2">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day=><span key={day} className="text-xs text-secondary py-2">{day}</span>)}</div><div className="grid grid-cols-7 gap-1">{Array.from({length:leading},(_,i)=><span key={"blank"+i}/>)}{Array.from({length:days},(_,i)=>{const value=key(year,month,i+1);const item=byDate.get(value);return <button key={value} disabled={!item} onClick={()=>setSelected(value)} className={`min-h-14 rounded-lg border p-1 flex flex-col items-center justify-center gap-1 ${selected===value?"border-primary bg-secondary-fixed":item?"border-green-300 bg-green-50":"border-outline-variant/30"} `}><span className="text-sm">{i+1}</span>{item&&<span className="text-[9px] text-green-800 font-semibold">Muhurtham</span>}</button>})}</div></div><div className="panel p-4 mt-4"><h3 className="t-h3 mb-2">{chosen?dateLabel(chosen.date):"Select a highlighted date"}</h3>{chosen?<div className="space-y-2">{chosen.tamilMonth&&<p className="text-sm">{chosen.tamilMonth}{chosen.tamilDay?" · "+chosen.tamilDay:""}</p>}{chosen.timings.length?chosen.timings.map((slot,i)=><p className="text-sm" key={i}>{slot.startTime} – {slot.endTime}</p>):<p className="text-sm text-secondary">Timings have not been provided.</p>}{chosen.notes&&<p className="text-sm whitespace-pre-wrap">{chosen.notes}</p>}</div>:<p className="text-sm text-secondary">Only dates published by Orchid Flowers administrators are displayed.</p>}</div></section>;
}
