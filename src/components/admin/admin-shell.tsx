"use client";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { PolicyManagement } from "@/components/admin/policy-management";
import { CompanyDocumentManagement } from "@/components/admin/company-document-management";
import { EmployeeOnboarding } from "@/components/admin/employee-onboarding";
import { UserManagement } from "@/components/admin/user-management";
import { AttendanceExceptionReview } from "@/components/admin/attendance-exception-review";
import { LocationManagement } from "@/components/admin/location-management";
import { TeamWorkManagement } from "@/components/admin/team-work-management";
import { WageManagement } from "@/components/admin/wage-management";
import orchidLogo from "../../../OrchidHRM/assets/android/launchericon-192x192.png";
import { Activity, Bell, BookOpen, Building2, CalendarDays, ChartNoAxesCombined, CheckCircle2, Clock3, Download, Flower2, Folder, GraduationCap, Grid2X2, Megaphone, MapPin, Menu, Plus, Search, Settings, Shield, Star, UserRound, Users, Wallet, X, Zap } from "lucide-react";

const groups = [
 {group:"Overview",items:[["dashboard","Dashboard",Grid2X2],["notifications","Notifications",Bell,"4"]]},
 {group:"People",items:[["employees","Employees",Users],["recruitment","Recruitment",UserRound,"2"],["onboarding","Onboarding",GraduationCap,"1"],["documents","Documents",Folder]]},
 {group:"Workforce",items:[["attendance","Attendance",Activity],["attendance-exceptions","Geofence Exceptions",MapPin],["hourly","Hourly Workforce",Clock3],["overtime","Overtime",Zap,"2"],["wages","Wage Management",Wallet],["shifts","Shifts & Schedules",CalendarDays],["teams-work","Teams & Work",Users]]},
 {group:"Employee Experience",items:[["leave","Leave",CalendarDays,"2"],["performance","Performance",Star]]},
 {group:"Organization",items:[["organization","Departments",Building2],["locations","Locations",MapPin],["policies","Policies",BookOpen],["holidays","Holidays",CalendarDays],["events","Events",Megaphone]]},
 {group:"Reports",items:[["reports","Reports",ChartNoAxesCombined]]},
 {group:"Settings",items:[["roles","Roles & Permissions",Shield],["users","User Management",Users],["settings","Organization Settings",Settings]]}
];
const titles:Record<string,[string,string]> = {dashboard:["Dashboard","Overview"],employees:["People","Employees"],recruitment:["People","Recruitment"],onboarding:["People","Onboarding"],documents:["People","Documents"],attendance:["Workforce","Attendance"],"attendance-exceptions":["Workforce","Geofence Exceptions"],hourly:["Workforce","Hourly Workforce"],overtime:["Workforce","Overtime"],wages:["Workforce","Wage Management"],shifts:["Workforce","Shifts & Schedules"],"teams-work":["Workforce","Teams & Work"],leave:["Employee Experience","Leave"],performance:["Employee Experience","Performance"],organization:["Organization","Departments"],locations:["Organization","Locations"],policies:["Organization","Policies"],holidays:["Organization","Holidays"],events:["Organization","Events"],reports:["Reports","Reports"],roles:["Settings","Roles & Permissions"],users:["Settings","User Management"],settings:["Settings","Organization Settings"],notifications:["Dashboard","Notifications"]};
const descriptions:Record<string,string> = {employees:"Employee profiles, employment details and records",recruitment:"Vacancies, candidates, interviews and offers",onboarding:"Joining workflows and employee activation",documents:"Secure employee document records",attendance:"GPS check-in, check-out and attendance exceptions","attendance-exceptions":"Review employee punches recorded outside assigned work locations",hourly:"Hourly workforce registration and work hours",overtime:"Overtime requests, review and approval",wages:"Monthly compensation configuration for permanent employees",shifts:"Shift definitions, assignments and schedules","teams-work":"Shift-based teams and daily work assignments",leave:"Leave applications, balances and approvals",performance:"Performance reviews and appraisal records",organization:"Departments, reporting lines and organization structure",locations:"Workplace addresses and GPS geofence configuration",policies:"Company policies and procedures",holidays:"Holiday calendar and working days",events:"Company events and employee milestones",reports:"Employee, attendance, leave and wage reports",roles:"Role definitions and access permissions",users:"Application users and account access",settings:"Organization profile and application configuration",notifications:"System notifications and pending actions"};

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
   <main className="content">{active==="dashboard"?<Dashboard go={go}/>:active==="policies"?<PolicyManagement/>:active==="documents"?<CompanyDocumentManagement/>:active==="employees"?<EmployeeManagement/>:active==="onboarding"?<EmployeeOnboarding/>:active==="users"?<UserManagement/>:active==="locations"?<LocationManagement/>:active==="attendance-exceptions"?<AttendanceExceptionReview/>:active==="teams-work"?<TeamWorkManagement/>:active==="wages"?<WageManagement/>:<section className="sec"><div className="page-head"><div><h2 className="t-h1" style={{fontSize:22}}>{title[1]}</h2><p className="sub">{descriptions[active]}</p></div><div className="page-actions"><button className="btn btn-outline" onClick={()=>setNotice("Export will be enabled when this module has connected records.")}><Download size={16}/> Export</button><button className="btn btn-primary" onClick={()=>setNotice("Create action will be enabled with the module workflow.")}><Plus size={16}/> Add new</button></div></div><div className="panel"><div className="panel-body empty-state"><Flower2 size={28}/><h3 className="t-h3">{title[1]} module</h3><p className="t-body-sm text-secondary">The original Orchid HRM interface has been migrated. This module is awaiting its live Convex queries, mutations and approved business rules.</p><span className="badge badge-neutral">Integration pending</span></div></div></section>}
   {notice&&<div className="orchid-notice" role="status">{notice}<button className="icon-btn icon-btn-sm" onClick={()=>setNotice("")} aria-label="Dismiss"><X size={15}/></button></div>}</main>
  </div>
 </div>;
}
function Dashboard({go}:{go:(id:string)=>void}) {
 const data=useQuery(api.dashboard.getOverview,{});
 if(data===undefined)return <section className="sec"><p className="sub">Loading dashboard records…</p></section>;
 const minutes=(value:number)=>`${Math.floor(value/60)}h ${value%60}m`;
 const dateLabel=(value:string)=>new Date(value+`T00:00:00Z`).toLocaleDateString(undefined,{day:"numeric",month:"short",timeZone:"UTC"});
 const activityLabel=(value:string)=>value.replace(/[._]/g," ").replace(/\b\w/g,char=>char.toUpperCase());
 const stats=[
  ["Total employees",data.employee.total,"All employee records",Users],
  ["Active employees",data.employee.active,"Currently active",UserRound],
  ["Present today",data.attendance.present,"Attendance day records",Activity],
  ["Late today",data.attendance.late,"Recorded late status",Clock3],
  ["On leave today",data.leave.approvedToday,"Approved leave requests covering today",CalendarDays],
  ["Payable hours",minutes(data.attendance.payableMinutes),"From attendance-day records",Clock3],
  ["Attendance exceptions",data.attendance.exception,"Exception and pending-review statuses",CheckCircle2],
 ];
 return <section className="sec">
  <div className="page-head"><div><h2 className="t-h1" style={{fontSize:22}}>Workforce overview</h2><p className="sub">Live records from Orchid Flowers · {dateLabel(data.today)}</p></div><div className="page-actions"><button className="btn btn-primary" onClick={()=>go("employees")}><Plus size={16}/> Employee directory</button></div></div>
  <div className="kpi-grid">{stats.map(([label,value,sub,Icon]:any)=><div className="kpi card" key={label}><span className="kpi-icon"><Icon size={18}/></span><span className="kpi-label">{label}</span><span className="kpi-val">{value}</span><span className="kpi-sub">{sub}</span></div>)}</div>
  <div className="grid-2-equal mt-6">
   <div className="panel"><div className="panel-head"><span className="t-h3">Attendance today</span><span className="t-caption text-tertiary">{data.attendance.recordedEmployees} records</span></div><div className="panel-body">
    {data.attendance.recordedEmployees===0?<div className="empty-state"><Activity size={24}/><p>No attendance-day records for today.</p></div>:<div className="employee-directory-stats">
     {[[ "Present",data.attendance.present ],["Late",data.attendance.late],["Absent",data.attendance.absent],["Exceptions",data.attendance.exception]].map(([label,value]:any)=><div className="kpi card" key={label}><span className="kpi-label">{label}</span><span className="kpi-val">{value}</span></div>)}
    </div>}
    <p className="t-body-sm text-secondary" style={{marginTop:14}}>Payable time recorded: {minutes(data.attendance.payableMinutes)}</p>
   </div></div>
   <div className="panel"><div className="panel-head"><span className="t-h3">Workforce composition</span><span className="t-caption text-tertiary">Active employees</span></div><div className="panel-body">
    {data.employee.active===0?<div className="empty-state"><Users size={24}/><p>No active employee records.</p></div>:data.employee.employmentMix.map(item=><div className="row" key={item.type} style={{justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--border)"}}><span className="t-body-sm">{activityLabel(item.type)}</span><strong>{item.count}</strong></div>)}
   </div></div>
  </div>
  <div className="grid-2-equal mt-6">
   <div className="panel"><div className="panel-head"><span className="t-h3">Attendance · 14 days</span></div><div className="panel-body">
    {data.attendance.trend.every(day=>day.present+day.late+day.absent+day.exception===0)?<div className="empty-state"><Activity size={24}/><p>No attendance history in this period.</p></div>:<div className="employee-directory-table-wrap"><table className="employee-directory-table"><thead><tr><th>Date</th><th>Present</th><th>Late</th><th>Absent</th><th>Exceptions</th></tr></thead><tbody>{data.attendance.trend.map(day=><tr key={day.date}><td>{dateLabel(day.date)}</td><td>{day.present}</td><td>{day.late}</td><td>{day.absent}</td><td>{day.exception}</td></tr>)}</tbody></table></div>}
   </div></div>
   <div className="panel"><div className="panel-head"><span className="t-h3">Pending items</span></div><div className="panel-body">
    {data.approvals.workflowRequests+data.leave.pendingRequests+data.overtime.pendingRequests+data.approvals.geofenceExceptions===0?<div className="empty-state"><CheckCircle2 size={24}/><p>No pending approval or review records.</p></div>:<>
     {[["Workflow approvals",data.approvals.workflowRequests],["Leave requests",data.leave.pendingRequests],["Overtime requests",data.overtime.pendingRequests],["Geofence exceptions",data.approvals.geofenceExceptions]].map(([label,value]:any)=><div className="row" key={label} style={{justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--border)"}}><span className="t-body-sm">{label}</span><strong>{value}</strong></div>)}
    </>}
   </div></div>
  </div>
  <div className="grid-2-equal mt-6">
   <div className="panel"><div className="panel-head"><span className="t-h3">Work assignments today</span><button className="section-link" onClick={()=>go("teams-work")}>Open</button></div><div className="panel-body">
    {data.work.assignments===0?<div className="empty-state"><CheckCircle2 size={24}/><p>No work assignments recorded for today.</p></div>:<div className="employee-directory-stats">{[["Assignments",data.work.assignments],["Completed",data.work.completed],["In progress",data.work.inProgress],["Not started",data.work.notStarted]].map(([label,value]:any)=><div className="kpi card" key={label}><span className="kpi-label">{label}</span><span className="kpi-val">{value}</span></div>)}</div>}
   </div></div>
   <div className="panel"><div className="panel-head"><span className="t-h3">Recruitment</span><button className="section-link" onClick={()=>go("recruitment")}>Open</button></div><div className="panel-body">
    {data.recruitment.candidates===0?<div className="empty-state"><UserRound size={24}/><p>No candidate records.</p></div>:<div className="employee-directory-stats">{[["Candidates",data.recruitment.candidates],["Active pipeline",data.recruitment.activePipeline],["Interviews",data.recruitment.interviews]].map(([label,value]:any)=><div className="kpi card" key={label}><span className="kpi-label">{label}</span><span className="kpi-val">{value}</span></div>)}</div>}
   </div></div>
  </div>
  <div className="grid-2-equal mt-6">
   <div className="panel"><div className="panel-head"><span className="t-h3">Organization setup</span></div><div className="panel-body">{[["Departments",data.organization.departments],["Active locations",data.organization.locations],["Active shifts",data.organization.shifts]].map(([label,value]:any)=><div className="row" key={label} style={{justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--border)"}}><span className="t-body-sm">{label}</span><strong>{value}</strong></div>)}</div></div>
   <div className="panel"><div className="panel-head"><span className="t-h3">Wage records</span><button className="section-link" onClick={()=>go("wages")}>Open</button></div><div className="panel-body">{data.wages.periods===0&&data.wages.records===0?<div className="empty-state"><Wallet size={24}/><p>No wage period or wage records.</p></div>:<div className="employee-directory-stats">{[["Periods",data.wages.periods],["Records",data.wages.records],["Pending approval",data.wages.pendingApproval],["Approved",data.wages.approved]].map(([label,value]:any)=><div className="kpi card" key={label}><span className="kpi-label">{label}</span><span className="kpi-val">{value}</span></div>)}</div>}</div></div>
  </div>
  <div className="grid-2-equal mt-6">
   <div className="panel"><div className="panel-head"><span className="t-h3">Policies & documents</span></div><div className="panel-body">{data.policies.published+data.policies.drafts+data.policies.archived+data.documents.published+data.documents.archived===0?<div className="empty-state"><BookOpen size={24}/><p>No policy or company document records.</p></div>:<>{[["Published policies",data.policies.published],["Draft policies",data.policies.drafts],["Archived policies",data.policies.archived],["Published documents",data.documents.published],["Archived documents",data.documents.archived]].map(([label,value]:any)=><div className="row" key={label} style={{justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--border)"}}><span className="t-body-sm">{label}</span><strong>{value}</strong></div>)}</>}</div></div>
   <div className="panel"><div className="panel-head"><span className="t-h3">Upcoming holidays</span></div><div className="panel-body">{data.holidays.length===0?<div className="empty-state"><CalendarDays size={24}/><p>No upcoming holiday records.</p></div>:data.holidays.map(holiday=><div className="row" key={holiday.date+holiday.name} style={{justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--border)"}}><span className="t-body-sm">{holiday.name}</span><strong>{dateLabel(holiday.date)}</strong></div>)}</div></div>
  </div>
  <div className="grid-2-equal mt-6">
   <div className="panel"><div className="panel-head"><span className="t-h3">Recent notifications</span><button className="section-link" onClick={()=>go("notifications")}>Open</button></div><div className="panel-body">{data.notifications.length===0?<div className="empty-state"><Bell size={24}/><p>No notification records.</p></div>:data.notifications.map(item=><div key={item._id} style={{padding:"10px 0",borderBottom:"1px solid var(--border)"}}><div className="row" style={{justifyContent:"space-between"}}><strong className="t-body-sm">{item.title}</strong><span className="t-caption text-tertiary">{item.read?"Read":"Unread"}</span></div><p className="t-caption text-secondary">{item.body}</p></div>)}</div></div>
   <div className="panel"><div className="panel-head"><span className="t-h3">Recent activity</span></div><div className="panel-body">{data.recentActivity.length===0?<div className="empty-state"><Activity size={24}/><p>No audit activity records.</p></div>:data.recentActivity.map(item=><div key={item._id} style={{padding:"10px 0",borderBottom:"1px solid var(--border)"}}><strong className="t-body-sm">{activityLabel(item.action)}</strong><p className="t-caption text-tertiary">{activityLabel(item.entityType)} · {new Date(item.createdAt).toLocaleString()}</p></div>)}</div></div>
  </div>
  <p className="t-caption text-tertiary" style={{marginTop:18}}>Dashboard data refreshed from the organization database · {new Date(data.generatedAt).toLocaleTimeString()}</p>
 </section>;
}

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
