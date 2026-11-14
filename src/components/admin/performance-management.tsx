"use client";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

function today() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  return parts;
}
export function PerformanceManagement() {
  const [workDate,setWorkDate]=useState(today());
  const [deadline,setDeadline]=useState("20:00");
  const [notice,setNotice]=useState("");
  const workspace=useQuery(api.performanceFeedback.adminFeedbackWorkspace,{workDate});
  const account=useQuery(api.account.getMyAccountStatus,{});
  const configure=useMutation(api.performanceFeedback.configureFeedbackDeadline);
  const reopen=useMutation(api.performanceFeedback.reopenDailyFeedback);
  useEffect(()=>{if(workspace?.deadline)setDeadline(workspace.deadline);},[workspace?.deadline]);
  if(!workspace||!account)return <section className="sec"><p className="sub">Loading performance feedback…</p></section>;
  const submitted=workspace.employees.filter(x=>x.submitted).length;
  const missing=workspace.employees.length-submitted;
  return <section className="sec">
    <div className="page-head"><div><h2 className="t-h1" style={{fontSize:22}}>Employee Performance & Self-Feedback</h2><p className="sub">Daily employee reflections, submission status and self-ratings.</p></div></div>
    {(account.role === "superadmin" || account.role === "admin")&&<div className="panel" style={{marginBottom:18}}><div className="panel-head"><span className="t-h3">Daily submission deadline</span><span className="t-caption text-tertiary">Organization-wide · {workspace.deadline}</span></div><div className="panel-body" style={{display:"flex",gap:12,alignItems:"end",flexWrap:"wrap"}}><label style={{display:"grid",gap:6}}>Deadline time<input className="input" type="time" value={deadline} onChange={e=>setDeadline(e.target.value)}/></label><button className="btn btn-primary" onClick={async()=>{try{await configure({deadline});setNotice("Daily feedback deadline saved.");}catch(e){setNotice(e instanceof Error?e.message:"Unable to save deadline.");}}}>Save deadline</button><p className="t-caption text-tertiary">Employees cannot submit after this time unless a superadmin reopens their submission.</p></div></div>}
    <div className="kpi-grid" style={{marginBottom:18}}><div className="kpi card"><span className="kpi-label">Employees in scope</span><span className="kpi-val">{workspace.employees.length}</span></div><div className="kpi card"><span className="kpi-label">Submitted</span><span className="kpi-val">{submitted}</span></div><div className="kpi card"><span className="kpi-label">Missing</span><span className="kpi-val">{missing}</span></div></div>
    <div className="panel"><div className="panel-head"><span className="t-h3">Daily feedback register</span><label>Work date <input className="input" type="date" value={workDate} onChange={e=>setWorkDate(e.target.value)}/></label></div><div className="panel-body"><div className="employee-directory-table-wrap"><table className="employee-directory-table"><thead><tr><th>Employee</th><th>Status</th><th>Self-rating</th><th>Feedback</th><th>Action</th></tr></thead><tbody>{workspace.employees.map(employee=><tr key={employee.employeeId}><td><strong>{employee.employeeName}</strong><small>{employee.employeeCode}</small></td><td><span className={"badge "+(employee.submitted?"badge-success":"badge-neutral")}>{employee.submitted?"Submitted":employee.locked?"Missed deadline":"Pending"}</span></td><td>{employee.record?employee.record.selfRating+"/5":"—"}</td><td>{employee.record?<details><summary>View feedback</summary><div style={{minWidth:240,whiteSpace:"pre-wrap",padding:"10px 0"}}><strong>Work completed</strong><p>{employee.record.completedWork}</p><strong>Achievements</strong><p>{employee.record.achievements}</p><strong>Challenges</strong><p>{employee.record.challenges}</p><strong>Next day plan</strong><p>{employee.record.nextDayPlan}</p>{employee.record.additionalFeedback&&<><strong>Additional feedback</strong><p>{employee.record.additionalFeedback}</p></>}<small>Submitted {new Date(employee.record.submittedAt).toLocaleString("en-IN")}</small></div></details>:"Not submitted"}</td><td>{(account.role === "superadmin" || account.role === "admin")&&(employee.locked||employee.record)?<button className="btn btn-outline" onClick={async()=>{try{await reopen({employeeId:employee.employeeId,workDate});setNotice("Submission reopened for "+employee.employeeName+".");}catch(e){setNotice(e instanceof Error?e.message:"Unable to reopen submission.");}}}>Reopen</button>:"—"}</td></tr>)}</tbody></table></div>{workspace.employees.length===0&&<p className="sub">No employees are assigned to your supervision for this date.</p>}</div></div>
    {notice&&<p className="sub" role="status" style={{marginTop:12}}>{notice}</p>}
  </section>;
}
