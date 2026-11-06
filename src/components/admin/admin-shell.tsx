"use client";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { PolicyManagement } from "@/components/admin/policy-management";
import { CompanyDocumentManagement } from "@/components/admin/company-document-management";
import { EmployeeManagement } from "@/components/admin/employee-management";
import orchidLogo from "../../../OrchidHRM/assets/android/launchericon-192x192.png";
import { Activity, Bell, BookOpen, Building2, CalendarDays, ChartNoAxesCombined, CheckCircle2, Clock3, Download, Flower2, Folder, GraduationCap, Grid2X2, Megaphone, Menu, Plus, Search, Settings, Shield, Star, UserRound, Users, Wallet, X, Zap } from "lucide-react";

const groups = [
 {group:"Overview",items:[["dashboard","Dashboard",Grid2X2],["notifications","Notifications",Bell,"4"]]},
 {group:"People",items:[["employees","Employees",Users],["recruitment","Recruitment",UserRound,"2"],["onboarding","Onboarding",GraduationCap,"1"],["documents","Documents",Folder]]},
 {group:"Workforce",items:[["attendance","Attendance",Activity],["hourly","Hourly Workforce",Clock3],["overtime","Overtime",Zap,"2"],["wages","Wage Management",Wallet,"2"],["shifts","Shifts & Schedules",CalendarDays]]},
 {group:"Employee Experience",items:[["leave","Leave",CalendarDays,"2"],["performance","Performance",Star]]},
 {group:"Organization",items:[["organization","Departments",Building2],["policies","Policies",BookOpen],["holidays","Holidays",CalendarDays],["events","Events",Megaphone]]},
 {group:"Reports",items:[["reports","Reports",ChartNoAxesCombined]]},
 {group:"Settings",items:[["roles","Roles & Permissions",Shield],["users","User Management",Users],["settings","Organization Settings",Settings]]}
];
const titles:Record<string,[string,string]> = {dashboard:["Dashboard","Overview"],employees:["People","Employees"],recruitment:["People","Recruitment"],onboarding:["People","Onboarding"],documents:["People","Documents"],attendance:["Workforce","Attendance"],hourly:["Workforce","Hourly Workforce"],overtime:["Workforce","Overtime"],wages:["Workforce","Wage Management"],shifts:["Workforce","Shifts & Schedules"],leave:["Employee Experience","Leave"],performance:["Employee Experience","Performance"],organization:["Organization","Departments"],policies:["Organization","Policies"],holidays:["Organization","Holidays"],events:["Organization","Events"],reports:["Reports","Reports"],roles:["Settings","Roles & Permissions"],users:["Settings","User Management"],settings:["Settings","Organization Settings"],notifications:["Dashboard","Notifications"]};
const descriptions:Record<string,string> = {employees:"Employee profiles, employment details and records",recruitment:"Vacancies, candidates, interviews and offers",onboarding:"Joining workflows and employee activation",documents:"Secure employee document records",attendance:"GPS check-in, check-out and attendance exceptions",hourly:"Hourly workforce registration and work hours",overtime:"Overtime requests, review and approval",wages:"Wage periods, calculations and approvals",shifts:"Shift definitions, assignments and schedules",leave:"Leave applications, balances and approvals",performance:"Performance reviews and appraisal records",organization:"Departments, reporting lines and organization structure",policies:"Company policies and procedures",holidays:"Holiday calendar and working days",events:"Company events and employee milestones",reports:"Employee, attendance, leave and wage reports",roles:"Role definitions and access permissions",users:"Application users and account access",settings:"Organization profile and application configuration",notifications:"System notifications and pending actions"};

export default function AdminShell() {
 const session=authClient.useSession();
 const account=useQuery(api.account.getMyAccountStatus,session.data?{}:"skip");
 const [active,setActive]=useState("dashboard"),[open,setOpen]=useState(false),[notice,setNotice]=useState("");
 const title=titles[active]||["Orchid One","Overview"];
 const go=(id:string)=>{setActive(id);setOpen(false);setNotice("");};
 return <div className="web-app orchid-app">
  <aside className={"sidebar "+(open?"open":"")}>
   <div className="sb-brand"><div className="auth-logo"><img src={orchidLogo.src} alt="Orchid One" width={32} height={32} style={{ display: "block", width: "100%", height: "100%", objectFit: "contain", borderRadius: 8 }} /></div><div className="col"><span className="sb-name">ORCHID ONE</span><span className="sb-tag">People. Workforce. Performance.</span></div></div>
   <nav className="sb-nav" aria-label="Main navigation">{groups.map(g=><div className="sb-group" key={g.group}><div className="sb-group-title">{g.group}</div>{g.items.map(([id,label,Icon,count]:any)=><button type="button" key={id} onClick={()=>go(id)} className={"sb-item "+(active===id?"active":"")}><span className="sb-ic"><Icon size={18}/></span><span>{label}</span>{count&&<span className="sb-cnt">{count}</span>}</button>)}</div>)}</nav>
   <div className="sb-foot"><div className="sb-role card"><div className="row gap-3"><div className="avatar">OF</div><div className="col flex-1"><p className="t-body-sm" style={{fontWeight:600}}>Orchid Flowers</p><p className="t-caption text-tertiary">Workspace</p></div><span className="badge badge-neutral">Preview</span></div></div></div>
  </aside>
  <div className="main-col">
   <header className="topbar"><div className="row gap-3"><button className="icon-btn" id="hamburger" aria-label="Toggle navigation" onClick={()=>setOpen(!open)}>{open?<X size={19}/>:<Menu size={19}/>}</button><div className="col"><p className="t-caption text-tertiary">{title[0]}</p><h2 className="t-h2">{title[1]}</h2></div></div><div className="row gap-3">{account?.role === "superadmin" && <button className="btn btn-outline" type="button" onClick={()=>window.location.assign("/employee")}>Employee View</button>}<div className="input-icon-wrap tb-search"><span className="input-prefix"><Search size={16}/></span><input className="input" placeholder="Search employees, requests, candidates..."/></div><button className="icon-btn" aria-label="Notifications" onClick={()=>go("notifications")}><Bell size={18}/></button><div className="divider-v"></div><div className="avatar">OF</div></div></header>
   <main className="content">{active==="dashboard"?<Dashboard go={go} notice={setNotice}/>:active==="policies"?<PolicyManagement/>:active==="documents"?<CompanyDocumentManagement/>:active==="employees"?<EmployeeManagement/>:<section className="sec"><div className="page-head"><div><h2 className="t-h1" style={{fontSize:22}}>{title[1]}</h2><p className="sub">{descriptions[active]}</p></div><div className="page-actions"><button className="btn btn-outline" onClick={()=>setNotice("Export will be enabled when this module has connected records.")}><Download size={16}/> Export</button><button className="btn btn-primary" onClick={()=>setNotice("Create action will be enabled with the module workflow.")}><Plus size={16}/> Add new</button></div></div><div className="panel"><div className="panel-body empty-state"><Flower2 size={28}/><h3 className="t-h3">{title[1]} module</h3><p className="t-body-sm text-secondary">The original Orchid HRM interface has been migrated. This module is awaiting its live Convex queries, mutations and approved business rules.</p><span className="badge badge-neutral">Integration pending</span></div></div></section>}
   {notice&&<div className="orchid-notice" role="status">{notice}<button className="icon-btn icon-btn-sm" onClick={()=>setNotice("")} aria-label="Dismiss"><X size={15}/></button></div>}</main>
  </div>
 </div>;
}
function Dashboard({go,notice}:{go:(id:string)=>void;notice:(s:string)=>void}) {
 const items:any[]=[["Total employees","—","Live employee records",Users,"var(--primary-light)","var(--primary)"],["Present today","—","Attendance records",Activity,"var(--success-bg)","var(--success-dark)"],["On leave","—","Approved leave records",CalendarDays,"var(--warning-bg)","var(--warning)"],["Hours today","—","Approved attendance hours",Clock3,"var(--info-bg)","var(--info)"],["Pending approvals","—","Requests awaiting review",CheckCircle2,"var(--error-bg)","var(--error)"],["Week wage est.","—","Approved wage run",Wallet,"var(--success-bg)","var(--success-dark)"]];
 return <section className="sec"><div className="page-head"><div><h2 className="t-h1" style={{fontSize:22}}>Workforce overview</h2><p className="sub">Your Orchid Flowers people and workforce activity at a glance.</p></div><div className="page-actions"><button className="btn btn-outline" onClick={()=>notice("Reports become available when live records are connected.")}><Download size={16}/> Export</button><button className="btn btn-primary" onClick={()=>go("employees")}><Plus size={16}/> Quick add</button></div></div>
 <div className="kpi-grid">{items.map(([label,value,sub,Icon,bg,color])=><div className="kpi card" key={label}><span className="kpi-icon" style={{background:bg,color}}><Icon size={18}/></span><span className="kpi-label">{label}</span><span className="kpi-val">{value}</span><span className="kpi-sub">{sub}</span></div>)}</div>
 <div className="grid-2-equal mt-6"><Panel title="Attendance trend" subtitle="Last 14 days" icon={Activity} text="Attendance analytics will appear when verified attendance records are available."/><Panel title="Workforce mix" subtitle="By employment type" icon={Users} text="Permanent, contract and hourly workforce distribution will be calculated from employee records."/></div>
 <div className="grid-2-equal mt-6"><Panel title="Pending approvals" action="Review" onAction={()=>go("leave")} icon={CheckCircle2} text="Connect the approval workflow to see pending requests."/><Panel title="Hiring pipeline" action="Open" onAction={()=>go("recruitment")} icon={UserRound} text="Candidate stages will appear after recruitment records are connected."/></div>
 </section>;
}
function Panel({title,subtitle,icon:Icon,text,action,onAction}:any){return <div className="panel"><div className="panel-head"><span className="t-h3">{title}</span>{action?<button className="section-link" onClick={onAction}>{action}</button>:<span className="t-caption text-tertiary">{subtitle}</span>}</div><div className="panel-body empty-state"><Icon size={26}/><p className="t-body-sm text-secondary">{text}</p></div></div>}


function EmployeeManagement() {
 const employees=useQuery(api.employee.listForAdmin,{});
 const [search,setSearch]=useState("");
 const [status,setStatus]=useState("all");
 const filtered=useMemo(()=> (employees??[]).filter(e=>{
  const term=search.trim().toLowerCase();
  const text=[e.employeeCode,e.firstName,e.lastName,e.email,e.phone,e.designation,e.departmentName,e.locationName].join(" ").toLowerCase();
  return (status==="all"||e.status===status)&&(!term||text.includes(term));
 }),[employees,search,status]);
 if(employees===undefined)return <section className="sec"><p className="sub">Loading employee records…</p></section>;
 const count=(s:string)=>employees.filter(e=>e.status===s).length;
 const names:Record<string,string>={active:"Active",inactive:"Inactive",pending:"Pending",archived:"Archived"};
 const types:Record<string,string>={permanent:"Permanent",hourly:"Hourly",daily:"Daily",contract:"Contract"};
 return <section className="sec">
  <div className="page-head"><div><h2 className="t-h1" style={{fontSize:22}}>Employee directory</h2><p className="sub">All employee records in your Orchid Flowers organization.</p></div><span className="badge badge-neutral">{employees.length} total records</span></div>
  <div className="employee-directory-stats">
   {[[ "All employees",employees.length ],["Active",count("active")],["Pending",count("pending")],["Inactive / archived",count("inactive")+count("archived")]].map(([label,value]:any)=><div className="kpi card" key={label}><span className="kpi-label">{label}</span><span className="kpi-val">{value}</span></div>)}
  </div>
  <div className="panel employee-directory-panel">
   <div className="employee-directory-toolbar"><div className="input-icon-wrap employee-directory-search"><span className="input-prefix"><Search size={16}/></span><input className="input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, ID, department, phone…" aria-label="Search employees"/></div>
    <label className="employee-status-filter"><span className="t-caption text-tertiary">Status</span><select className="input" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All statuses ({employees.length})</option>{["active","pending","inactive","archived"].map(s=><option key={s} value={s}>{names[s]} ({count(s)})</option>)}</select></label>
   </div>
   <div className="employee-directory-table-wrap"><table className="employee-directory-table"><thead><tr><th>Employee</th><th>Department</th><th>Designation</th><th>Employment</th><th>Location</th><th>Joined</th><th>Status</th></tr></thead><tbody>
    {filtered.map(e=><tr key={e._id}><td><div className="employee-directory-person"><span className="employee-directory-avatar">{e.firstName.slice(0,1)}{e.lastName.slice(0,1)}</span><span><strong>{e.firstName} {e.lastName}</strong><small>{e.employeeCode}</small><small>{e.email||e.phone}</small></span></div></td><td>{e.departmentName}</td><td>{e.designation}</td><td>{types[e.employmentType]??e.employmentType}</td><td>{e.locationName}</td><td>{e.joiningDate||"—"}</td><td><span className={"badge "+(e.status==="active"?"badge-success":"badge-neutral")}>{names[e.status]??e.status}</span></td></tr>)}
   </tbody></table>{filtered.length===0&&<div className="empty-state"><Users size={26}/><strong>{employees.length===0?"No employee records yet":"No matching employees"}</strong><p>{employees.length===0?"Employee records added to this organization will appear here.":"Try another search term or status filter."}</p></div>}</div>
   <div className="employee-directory-footer">Showing {filtered.length} of {employees.length} employee records</div>
  </div>
 </section>;
}
