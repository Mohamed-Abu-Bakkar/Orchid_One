"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Link2, Search, ShieldCheck, Users } from "lucide-react";

export function UserManagement() {
 const accounts=useQuery(api.employee.listAccountsForLinking,{});
 const employees=useQuery(api.employee.listForAdmin,{});
 const me=useQuery(api.account.getMyAccountStatus,{});
 const link=useMutation(api.employee.linkAccount);
 const unlink=useMutation(api.employee.unlinkAccount);
 const changeRole=useMutation(api.employee.updateAccountRole);
 const changeStatus=useMutation(api.employee.setAccountStatus);
 const [filter,setFilter]=useState("all"),[search,setSearch]=useState(""),[selected,setSelected]=useState<Record<string,string>>({}),[busy,setBusy]=useState(""),[message,setMessage]=useState("");
 const isSuperadmin=(me?.role==="superadmin"||me?.role==="admin");
 const rows=useMemo(()=>(accounts??[]).filter(a=>filter==="all"||(filter==="linked"?!!a.employeeId:!a.employeeId)).filter(a=>[a.fullName,a.email,a.employeeName??"",a.employeeCode??"",a.role,a.accountStatus].join(" ").toLowerCase().includes(search.toLowerCase())),[accounts,filter,search]);
 if(accounts===undefined||employees===undefined||me===undefined)return <section className="sec"><p className="sub">Loading user accounts…</p></section>;
 const available=employees.filter(e=>!accounts.some(a=>a.employeeId===e._id));
 async function run(id:string,fn:()=>Promise<unknown>){setBusy(id);setMessage("");try{await fn();setMessage("Account updated successfully.");}catch(e){setMessage(e instanceof Error?e.message:"Unable to update account.");}finally{setBusy("");}}
 return <section className="sec">
 <div className="page-head"><div><h2 className="t-h1" style={{fontSize:22}}>User management</h2><p className="sub">Manage employee links and account access. Role and status changes are administrator-only.</p></div><span className="badge badge-neutral">{accounts.length} accounts</span></div>
 <div className="employee-directory-toolbar"><div className="segmented-control">{["all","unlinked","linked"].map(x=><button type="button" key={x} className={filter===x?"active":""} onClick={()=>setFilter(x)}>{x==="all"?"All accounts":x==="unlinked"?"Unlinked":"Linked"}</button>)}</div><div className="input-icon-wrap employee-directory-search"><span className="input-prefix"><Search size={16}/></span><input className="input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, email, role or status…"/></div></div>
 {message&&<p className="onboarding-success" role="status">{message}</p>}
 <div className="panel"><div className="user-link-list">{rows.map(a=><div className="user-link-row" key={a._id}>
 <div className="user-link-main"><strong>{a.fullName||"Unnamed account"}</strong><span>{a.email||"No email"} · {a.role} · {a.accountStatus}</span><small>{a.employeeId?("Linked: "+(a.employeeName||"Employee")+" · "+(a.employeeCode||"No code")):"Not linked to an employee"}</small></div>
 <div className="user-link-actions" style={{flexWrap:"wrap"}}>
 {!a.employeeId&&a.role==="employee"&&<select className="input" value={selected[a._id]??""} onChange={e=>setSelected(s=>({...s,[a._id]:e.target.value}))}><option value="">Select employee</option>{available.map(e=><option key={e._id} value={e._id}>{e.employeeCode} · {e.firstName} {e.lastName}</option>)}</select>}
 {!a.employeeId&&a.role==="employee"&&<button className="btn btn-primary btn-sm" disabled={!selected[a._id]||busy===a._id} onClick={()=>void run(a._id,()=>link({userId:a._id as any,employeeId:selected[a._id] as any}))}><Link2 size={14}/>Link</button>}
 {!!a.employeeId&&a.role==="employee"&&<button className="btn btn-outline btn-sm" disabled={busy===a._id} onClick={()=>void run(a._id,()=>unlink({userId:a._id as any}))}>Unlink</button>}
 {isSuperadmin&&<label className="policy-field"><span className="t-caption">Role</span><select className="input" value={a.role} disabled={busy===a._id} onChange={e=>void run(a._id,()=>changeRole({userId:a._id as any,role:e.target.value as any}))}><option value="employee">Employee</option><option value="supervisor">Supervisor</option><option value="admin">Admin</option><option value="superadmin">Superadmin</option></select></label>}
 {isSuperadmin&&<button className="btn btn-outline btn-sm" disabled={busy===a._id} onClick={()=>void run(a._id,()=>changeStatus({userId:a._id as any,status:a.accountStatus==="suspended"?"active":"suspended"}))}><ShieldCheck size={14}/>{a.accountStatus==="suspended"?"Reactivate":"Suspend"}</button>}
 </div></div>)}
 {!rows.length&&<div className="empty-state"><Users size={26}/><strong>No matching accounts</strong><p>Try another search or filter.</p></div>}</div></div>
 {!isSuperadmin&&<p className="t-caption text-tertiary">Admins and superadmins can change account roles or access status.</p>}
 </section>;
}
