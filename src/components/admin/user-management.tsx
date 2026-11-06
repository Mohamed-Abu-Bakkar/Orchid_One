"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Link2, Search, Users } from "lucide-react";

export function UserManagement() {
  const accounts=useQuery(api.employee.listAccountsForLinking,{});
  const employees=useQuery(api.employee.listForAdmin,{});
  const linkAccount=useMutation(api.employee.linkAccount);
  const [view,setView]=useState<"unlinked"|"linked">("unlinked");
  const [search,setSearch]=useState("");
  const [selections,setSelections]=useState<Record<string,string>>({});
  const [busy,setBusy]=useState("");
  const [notice,setNotice]=useState("");
  const [error,setError]=useState("");
  const rows=useMemo(()=> (accounts??[]).filter(a=>Boolean(a.employeeId)===(view==="linked")&&a.role==="employee").filter(a=>[a.fullName,a.email,a.employeeName??"",a.employeeCode??""].join(" ").toLowerCase().includes(search.trim().toLowerCase())),[accounts,view,search]);
  if(accounts===undefined||employees===undefined)return <section className="sec"><p className="sub">Loading user accounts…</p></section>;
  const availableEmployees=employees.filter(e=>!accounts.some(a=>a.employeeId===e._id));
  const submit=async(userId:string)=>{
    const employeeId=selections[userId];if(!employeeId)return;
    setBusy(userId);setError("");setNotice("");
    try {await linkAccount({userId:userId as any,employeeId:employeeId as any});setNotice("Account linked successfully. Login status and role were not changed.");setSelections(s=>({...s,[userId]:""}));}
    catch(err){setError(err instanceof Error?err.message:"Unable to link account.");}
    finally{setBusy("");}
  };
  return <section className="sec">
    <div className="page-head"><div><h2 className="t-h1" style={{fontSize:22}}>User management</h2><p className="sub">Connect registered employee login accounts to HR employee records.</p></div><span className="badge badge-neutral">{accounts.length} accounts</span></div>
    <div className="employee-directory-stats"><div className="kpi card"><span className="kpi-label">Unlinked accounts</span><span className="kpi-val">{accounts.filter(a=>a.role==="employee"&&!a.employeeId).length}</span></div><div className="kpi card"><span className="kpi-label">Linked accounts</span><span className="kpi-val">{accounts.filter(a=>a.role==="employee"&&a.employeeId).length}</span></div><div className="kpi card"><span className="kpi-label">Available employee records</span><span className="kpi-val">{availableEmployees.length}</span></div><div className="kpi card"><span className="kpi-label">Other roles</span><span className="kpi-val">{accounts.filter(a=>a.role!=="employee").length}</span></div></div>
    <div className="panel">
      <div className="employee-directory-toolbar"><div className="segmented-control"><button type="button" className={view==="unlinked"?"active":""} onClick={()=>setView("unlinked")}>Unlinked accounts</button><button type="button" className={view==="linked"?"active":""} onClick={()=>setView("linked")}>Linked accounts</button></div><div className="input-icon-wrap employee-directory-search"><span className="input-prefix"><Search size={16}/></span><input className="input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search account or employee…" /></div></div>
      {error&&<p className="auth-error" role="alert">{error}</p>}{notice&&<p className="onboarding-success" role="status">{notice}</p>}
      <div className="user-link-list">{rows.map(account=><div className="user-link-row" key={account._id}><div className="user-link-main"><strong>{account.fullName||"Unnamed account"}</strong><span>{account.email||"No email"} · {account.accountStatus}</span>{account.employeeId&&<small>Linked to {account.employeeName||"Employee"} ({account.employeeCode||"No code"})</small>}</div>{!account.employeeId&&<div className="user-link-actions"><select className="input" value={selections[account._id]??""} onChange={e=>setSelections(s=>({...s,[account._id]:e.target.value}))}><option value="">Select employee record</option>{availableEmployees.map(e=><option key={e._id} value={e._id}>{e.employeeCode} · {e.firstName} {e.lastName}</option>)}</select><button className="btn btn-primary btn-sm" type="button" disabled={!selections[account._id]||busy===account._id} onClick={()=>submit(account._id)}><Link2 size={14}/>{busy===account._id?"Linking…":"Link account"}</button></div>}</div>)}
      {rows.length===0&&<div className="empty-state"><Users size={26}/><strong>{view==="unlinked"?"No unlinked employee accounts":"No linked employee accounts"}</strong><p>{view==="unlinked"?"Registered employee accounts will appear here when available.":"Accounts linked to employee records will appear here."}</p></div>}
      {view==="unlinked"&&availableEmployees.length===0&&rows.length>0&&<p className="t-caption text-tertiary">There are no unlinked employee records available. Create an employee in Onboarding first.</p>}
    </div>
    </div>
  </section>;
}
