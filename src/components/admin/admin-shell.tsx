"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { ChangePassword } from "@/components/auth/change-password";
import { PolicyManagement } from "@/components/admin/policy-management";
import { CompanyDocumentManagement } from "@/components/admin/company-document-management";
import { EmployeeDocumentReview } from "@/components/admin/employee-document-review";
import { EmployeeOnboarding } from "@/components/admin/employee-onboarding";
import { UserManagement } from "@/components/admin/user-management";
import { AttendanceExceptionReview } from "@/components/admin/attendance-exception-review";
import { AttendanceManagement } from "@/components/admin/attendance-management";
import { LocationManagement } from "@/components/admin/location-management";
import { TeamWorkManagement } from "@/components/admin/team-work-management";
import { ShiftScheduleManagement } from "@/components/admin/shift-schedule-management";
import { WageManagement } from "@/components/admin/wage-management";
import { HourlyWorkforce } from "@/components/admin/hourly-workforce";
import { OvertimeManagement } from "@/components/admin/overtime-management";
import orchidLogo from "../../../OrchidHRM/assets/android/launchericon-192x192.png";
import { Activity, BookOpen, Building2, CalendarDays, ChartNoAxesCombined, CheckCircle2, Clock3, Download, Flower2, Folder, GraduationCap, Grid2X2, LogOut, MapPin, Menu, Plus, Search, Settings, Shield, Star, UserRound, Users, Wallet, X, Zap } from "lucide-react";

const groups = [
{group:"Overview",items:[["dashboard","Dashboard",Grid2X2]]},
 {group:"People",items:[["employees","Employees",Users],["onboarding","Onboarding",GraduationCap],["documents","Documents",Folder]]},
 {group:"Workforce",items:[["attendance","Attendance",Activity],["attendance-exceptions","Geofence Exceptions",MapPin],["hourly","Hourly Workforce",Clock3],["overtime","Overtime",Zap],["wages","Wage Management",Wallet],["shifts","Shifts & Schedules",CalendarDays],["teams-work","Teams & Work",Users]]},
 {group:"Employee Experience",items:[["leave","Leave",CalendarDays],["performance","Performance",Star]]},
 {group:"Organization",items:[["organization","Departments",Building2],["locations","Locations",MapPin],["policies","Policies",BookOpen],["holidays","Holidays",CalendarDays]]},
 {group:"Reports",items:[["reports","Reports",ChartNoAxesCombined]]},
 {group:"Settings",items:[["roles","Roles & Permissions",Shield],["users","User Management",Users],["settings","Organization Settings",Settings]]}
];
const titles:Record<string,[string,string]> = {dashboard:["Dashboard","Overview"],employees:["People","Employees"],onboarding:["People","Onboarding"],documents:["People","Documents"],attendance:["Workforce","Attendance"],"attendance-exceptions":["Workforce","Geofence Exceptions"],hourly:["Workforce","Hourly Workforce"],overtime:["Workforce","Overtime"],wages:["Workforce","Wage Management"],shifts:["Workforce","Shifts & Schedules"],"teams-work":["Workforce","Teams & Work"],leave:["Employee Experience","Leave"],performance:["Employee Experience","Performance"],organization:["Organization","Departments"],locations:["Organization","Locations"],policies:["Organization","Policies"],holidays:["Organization","Holidays"],reports:["Reports","Reports"],roles:["Settings","Roles & Permissions"],users:["Settings","User Management"],settings:["Settings","Organization Settings"],};
const descriptions:Record<string,string> = {employees:"Employee profiles, employment details and records",onboarding:"Joining workflows and employee activation",documents:"Secure employee document records",attendance:"GPS check-in, check-out and attendance exceptions","attendance-exceptions":"Review employee punches recorded outside assigned work locations",hourly:"Hourly workforce registration and work hours",overtime:"Overtime requests, review and approval",wages:"Hourly payable-hours approval and permanent employee compensation",shifts:"Shift definitions, assignments and schedules","teams-work":"Shift-based teams and daily work assignments",leave:"Leave applications, balances and approvals",performance:"Performance reviews and appraisal records",organization:"Departments, reporting lines and organization structure",locations:"Workplace addresses and GPS geofence configuration",policies:"Company policies and procedures",holidays:"Holiday calendar and working days",reports:"Employee, attendance, leave and wage reports",roles:"Role definitions and access permissions",users:"Application users and account access",settings:"Organization profile and application configuration",};

export default function AdminShell() {
 const router=useRouter();
 const session=authClient.useSession();
 const account=useQuery(api.account.getMyAccountStatus,session.data?{}:"skip");
 const displayName=session.data?.user?.name?.trim() || session.data?.user?.email?.split("@")[0] || "Administrator";
 const initials=displayName.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]?.toUpperCase()).join("") || "AD";
 const [signingOut,setSigningOut]=useState(false);
 const logout=async()=>{if(signingOut)return;setSigningOut(true);try{await authClient.signOut();router.replace("/login");router.refresh();}catch(error){console.error("[Orchid One][Auth] Sign out failed:",error);setNotice("Could not sign out. Please try again.");setSigningOut(false);}};
 const [active,setActive]=useState("dashboard"),[open,setOpen]=useState(false),[notice,setNotice]=useState("");
 const title=titles[active]||["Orchid One","Overview"];
 const go=(id:string)=>{setActive(id);setOpen(false);setNotice("");};
 return <div className="web-app orchid-app">
  <aside className={"sidebar "+(open?"open":"")}>
   <div className="sb-brand"><div className="auth-logo"><img src={orchidLogo.src} alt="Orchid One" width={32} height={32} style={{ display: "block", width: "100%", height: "100%", objectFit: "contain", borderRadius: 8 }} /></div><div className="col"><span className="sb-name">ORCHID ONE</span><span className="sb-tag">People. Workforce. Performance.</span></div></div>
   <nav className="sb-nav" aria-label="Main navigation">{groups.map(g=><div className="sb-group" key={g.group}><div className="sb-group-title">{g.group}</div>{g.items.map(([id,label,Icon]:any)=><button type="button" key={id} onClick={()=>go(id)} className={"sb-item "+(active===id?"active":"")}><span className="sb-ic"><Icon size={18}/></span><span>{label}</span></button>)}</div>)}</nav>
   <div className="sb-foot"><div className="sb-role card"><div className="row gap-3"><div className="avatar">OF</div><div className="col flex-1"><p className="t-body-sm" style={{fontWeight:600}}>Orchid Flowers</p><p className="t-caption text-tertiary">Workspace</p></div><span className="badge badge-neutral">Preview</span></div></div></div>
  </aside>
  <div className="main-col">
   <header className="topbar"><div className="row gap-3"><button className="icon-btn" id="hamburger" aria-label="Toggle navigation" onClick={()=>setOpen(!open)}>{open?<X size={19}/>:<Menu size={19}/>}</button><div className="col"><p className="t-caption text-tertiary">{title[0]}</p><h2 className="t-h2">{title[1]}</h2></div></div><div className="row gap-3">{account?.role === "superadmin" && <button className="btn btn-outline" type="button" onClick={()=>window.location.assign("/employee")}>Employee View</button>}<div className="input-icon-wrap tb-search"><span className="input-prefix"><Search size={16}/></span><input className="input" placeholder="Search employees, requests, candidates..."/></div><div className="divider-v"></div><div className="avatar" title={displayName}>{initials}</div><span className="t-body-sm" style={{fontWeight:600}}>{displayName}</span><ChangePassword/><button className="btn btn-outline" type="button" onClick={logout} disabled={signingOut} aria-label="Log out"><LogOut size={16}/>{signingOut?"Signing out…":"Logout"}</button></div></header>
   <main className="content">{active==="dashboard"?<Dashboard go={go} notice={setNotice} displayName={displayName}/>:active==="policies"?<PolicyManagement/>:active==="documents"?<><EmployeeDocumentReview/><CompanyDocumentManagement/></>:active==="employees"?<EmployeeManagement/>:active==="onboarding"?<EmployeeOnboarding/>:active==="users"?<UserManagement/>:active==="locations"?<LocationManagement/>:active==="attendance"?<AttendanceManagement onOpenExceptions={()=>go("attendance-exceptions")}/>:active==="attendance-exceptions"?<AttendanceExceptionReview/>:active==="teams-work"?<TeamWorkManagement/>:active==="shifts"?<ShiftScheduleManagement/>:active==="wages"?<WageManagement/>:active==="hourly"?<HourlyWorkforce/>:active==="overtime"?<OvertimeManagement/>:<section className="sec"><div className="page-head"><div><h2 className="t-h1" style={{fontSize:22}}>{title[1]}</h2><p className="sub">{descriptions[active]}</p></div><div className="page-actions"><button className="btn btn-outline" onClick={()=>setNotice("Export will be enabled when this module has connected records.")}><Download size={16}/> Export</button><button className="btn btn-primary" onClick={()=>setNotice("Create action will be enabled with the module workflow.")}><Plus size={16}/> Add new</button></div></div><div className="panel"><div className="panel-body empty-state"><Flower2 size={28}/><h3 className="t-h3">{title[1]} module</h3><p className="t-body-sm text-secondary">The original Orchid HRM interface has been migrated. This module is awaiting its live Convex queries, mutations and approved business rules.</p><span className="badge badge-neutral">Integration pending</span></div></div></section>}
   {notice&&<div className="orchid-notice" role="status">{notice}<button className="icon-btn icon-btn-sm" onClick={()=>setNotice("")} aria-label="Dismiss"><X size={15}/></button></div>}</main>
  </div>
 </div>;
}
function Dashboard({go,notice,displayName}:{go:(id:string)=>void;notice:(s:string)=>void;displayName:string}) {
 const employees=useQuery(api.employee.listForAdmin,{});
 if(employees===undefined)return <section className="sec"><p className="sub">Loading dashboard records…</p></section>;
 const totalEmployees=employees.length;
 const activeEmployees=employees.filter(employee=>employee.status==="active").length;
 const pendingEmployees=employees.filter(employee=>employee.status==="pending").length;
 const inactiveEmployees=employees.filter(employee=>employee.status==="inactive"||employee.status==="archived").length;
 const items:any[]=[
  ["Total employees",totalEmployees,"All employee records",Users],
  ["Active employees",activeEmployees,"Active employee records",UserRound],
  ["Pending employees",pendingEmployees,"Pending employee records",Clock3],
  ["Inactive / archived",inactiveEmployees,"Inactive and archived records",Users],
 ];
 return <section className="sec">
  <div className="page-head"><div><h2 className="t-h1" style={{fontSize:22}}>Welcome, {displayName}</h2><p className="sub">Here’s your Orchid Flowers workforce overview.</p></div><div className="page-actions"><button className="btn btn-outline" onClick={()=>notice("Dashboard export is not connected yet.")}><Download size={16}/> Export</button><button className="btn btn-primary" onClick={()=>go("employees")}><Plus size={16}/> Employee directory</button></div></div>
  <div className="kpi-grid">{items.map(([label,value,sub,Icon]:any)=><div className="kpi card" key={label}><span className="kpi-icon"><Icon size={18}/></span><span className="kpi-label">{label}</span><span className="kpi-val">{value}</span><span className="kpi-sub">{sub}</span></div>)}</div>
  {employees.length===0?<div className="panel mt-6"><div className="panel-body empty-state"><Users size={28}/><h3 className="t-h3">No employee records yet</h3><p className="t-body-sm text-secondary">Employees added to this organization will appear here.</p><button className="btn btn-primary" onClick={()=>go("onboarding")}><Plus size={16}/> Add employee</button></div></div>:<div className="panel mt-6"><div className="panel-head"><span className="t-h3">Employee records</span><button className="section-link" onClick={()=>go("employees")}>View all</button></div><div className="panel-body"><div className="employee-directory-table-wrap"><table className="employee-directory-table"><thead><tr><th>Employee</th><th>Department</th><th>Designation</th><th>Status</th></tr></thead><tbody>{employees.slice(0,8).map(employee=><tr key={employee._id}><td><strong>{employee.firstName} {employee.lastName}</strong><small>{employee.employeeCode}</small></td><td>{employee.departmentName}</td><td>{employee.designation}</td><td><span className={"badge "+(employee.status==="active"?"badge-success":"badge-neutral")}>{employee.status}</span></td></tr>)}</tbody></table></div></div></div>}
 </section>;
}
function Panel({title,subtitle,icon:Icon,text,action,onAction}:any){return <div className="panel"><div className="panel-head"><span className="t-h3">{title}</span>{action?<button className="section-link" onClick={onAction}>{action}</button>:<span className="t-caption text-tertiary">{subtitle}</span>}</div><div className="panel-body empty-state"><Icon size={26}/><p className="t-body-sm text-secondary">{text}</p></div></div>}


function EmployeeManagement() {
 const employees=useQuery(api.employee.listForAdmin,{});
 const [search,setSearch]=useState("");
 const [status,setStatus]=useState("all");
 const filtered=useMemo(()=> (employees??[]).filter(e=>{
  const term=search.trim().toLowerCase();
  const text=[e.employeeCode,e.firstName,e.lastName,e.email,e.phone,e.designation,e.departmentName,e.locationName,e.defaultShiftName].join(" ").toLowerCase();
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
   <div className="employee-directory-table-wrap"><table className="employee-directory-table"><thead><tr><th>Employee</th><th>Department</th><th>Designation</th><th>Employment</th><th>Default shift</th><th>Location</th><th>Joined</th><th>Status</th></tr></thead><tbody>
    {filtered.map(e=><tr key={e._id}><td><div className="employee-directory-person"><span className="employee-directory-avatar">{e.firstName.slice(0,1)}{e.lastName.slice(0,1)}</span><span><strong>{e.firstName} {e.lastName}</strong><small>{e.employeeCode}</small><small>{e.email||e.phone}</small></span></div></td><td>{e.departmentName}</td><td>{e.designation}</td><td>{types[e.employmentType]??e.employmentType}</td><td>{e.defaultShiftName}</td><td>{e.locationName}</td><td>{e.joiningDate||"—"}</td><td><span className={"badge "+(e.status==="active"?"badge-success":"badge-neutral")}>{names[e.status]??e.status}</span></td></tr>)}
   </tbody></table>{filtered.length===0&&<div className="empty-state"><Users size={26}/><strong>{employees.length===0?"No employee records yet":"No matching employees"}</strong><p>{employees.length===0?"Employee records added to this organization will appear here.":"Try another search term or status filter."}</p></div>}</div>
   <div className="employee-directory-footer">Showing {filtered.length} of {employees.length} employee records</div>
  </div>
 </section>;
}
