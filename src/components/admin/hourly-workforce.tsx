"use client";
import {useState} from "react";
import {useMutation,useQuery} from "convex/react";
import {api} from "@/../convex/_generated/api";
import {CheckCircle2} from "lucide-react";
const money=(p?:number)=>p===undefined?"—":new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(p/100);
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");};
export function HourlyWorkforce(){
 const account=useQuery(api.account.getMyAccountStatus,{});const [fromDate,setFromDate]=useState(()=>{const d=new Date();d.setDate(d.getDate()-6);return d.toLocaleDateString("en-CA");});const [toDate,setToDate]=useState(today);
 const hourly=useQuery(api.wages.hourlyAdminData,fromDate&&toDate&&fromDate<=toDate?{fromDate,toDate}:"skip");
 const submitHourlyReview=useMutation(api.wages.submitHourlyReview);const decideHourlyReview=useMutation(api.wages.decideHourlyReview);
 const [hourInputs,setHourInputs]=useState<Record<string,{regular:string;overtime:string;reason:string}>>({});const [reviewNotes,setReviewNotes]=useState<Record<string,string>>({});
 const [hourlyBusy,setHourlyBusy]=useState(false);const [message,setMessage]=useState("");const [error,setError]=useState("");
 if(account===undefined)return <section className="sec"><p className="sub">Loading account permissions…</p></section>;
 return <section className="sec"><div className="page-head"><div><h2 className="t-h1" style={{fontSize:22}}>Hourly Workforce</h2><p className="sub">Attendance evidence, supervisor payable-hour suggestions and Superadmin approval.</p></div></div>
 {message&&<div className="onboarding-success" role="status"><CheckCircle2 size={16}/>{message}</div>}{error&&<div className="auth-error" role="alert">{error}</div>}
    <div className="panel mt-4">
        <div className="employee-directory-toolbar">
          <label className="policy-field">From date<input className="input" type="date" value={fromDate} max={toDate} onChange={e=>setFromDate(e.target.value)}/></label>
          <label className="policy-field">To date<input className="input" type="date" value={toDate} min={fromDate} onChange={e=>setToDate(e.target.value)}/></label>
          <span className="t-caption text-tertiary">Maximum range: 31 days · {hourly?.timezone ?? "Organization timezone"}</span>
        </div>
        {hourly===undefined ? <p className="sub">Loading hourly attendance…</p> : hourly.truncated ? <p className="form-error">More than 5,000 attendance events were found. Narrow the date range.</p> :
          hourly.rows.length===0 ? <div className="empty-state"><Clock3 size={24}/><strong>No hourly attendance records</strong><p>Hourly employee check-in and check-out events will appear here.</p></div> :
          <div className="employee-directory-table-wrap"><table className="employee-directory-table"><thead><tr><th>Employee / date</th><th>Check-in</th><th>Check-out</th><th>Recorded attendance</th><th>Break</th><th>Recorded work</th><th>Hourly rate</th><th>Payable hours</th><th>Overtime</th><th>Status / action</th></tr></thead><tbody>
          {hourly.rows.map(row=>{
            const values=hourInputs[String(row.employeeId)+":"+row.workDate] ?? {regular:"",overtime:"",reason:""};
            const reviewId=String(row.review?._id ?? "");
            return <tr key={String(row.employeeId)+":"+row.workDate}>
              <td><strong>{row.employeeName}</strong><small>{row.employeeCode} · {row.workDate}</small></td>
              <td>{row.firstCheckInAt?new Date(row.firstCheckInAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}):"—"}</td>
              <td>{row.lastCheckOutAt?new Date(row.lastCheckOutAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}):"—"}</td>
              <td>{Math.floor(row.attendanceMinutes/60)}h {row.attendanceMinutes%60}m</td>
              <td>{Math.floor(row.breakMinutes/60)}h {row.breakMinutes%60}m</td>
              <td>{Math.floor(row.recordedWorkMinutes/60)}h {row.recordedWorkMinutes%60}m</td>
              <td>{row.ratePaise===null?"Not configured":money(row.ratePaise)+"/hr"}{row.overtimeMultiplier===null?"":<small>OT ×{row.overtimeMultiplier}</small>}</td>
              <td>{row.review?.status==="approved"?<strong>{((row.review.approvedRegularMinutes??0)/60).toFixed(2)}h</strong>:row.review?.status==="pending"?<span className="badge badge-warning">Awaiting approval</span>:account?.role==="supervisor"&&!row.review&&!row.incomplete&&!row.pendingPunchReview?<div className="wage-form"><input className="input" type="number" min="0" step="0.25" value={values.regular} onChange={e=>setHourInputs(s=>({...s,[String(row.employeeId)+":"+row.workDate]:{...values,regular:e.target.value}}))} aria-label="Suggested regular payable hours"/><small>Regular hours</small></div>: "—"}</td>
              <td>{row.review?.status==="approved"?<strong>{((row.review.approvedOvertimeMinutes??0)/60).toFixed(2)}h</strong>:account?.role==="supervisor"&&!row.review&&!row.incomplete&&!row.pendingPunchReview?<div className="wage-form"><input className="input" type="number" min="0" step="0.25" value={values.overtime} onChange={e=>setHourInputs(s=>({...s,[String(row.employeeId)+":"+row.workDate]:{...values,overtime:e.target.value}}))} aria-label="Suggested overtime hours"/></div>:"—"}</td>
              <td>
                {row.incomplete?<span className="badge badge-warning">Incomplete punches</span>:row.pendingPunchReview?<span className="badge badge-warning">Punch review pending</span>:row.review?.status==="approved"?<><span className="badge badge-success">Approved</span><small>Normal: {money(row.regularEarningsPaise??undefined)}</small><small>Overtime: {row.overtimeEarningsPaise===null?"Multiplier unavailable":money(row.overtimeEarningsPaise)}</small></>:row.review?.status==="pending"?account?.role==="superadmin"?<div className="wage-form"><small>Suggested: {((row.review.suggestedRegularMinutes??0)/60).toFixed(2)}h regular + {((row.review.suggestedOvertimeMinutes??0)/60).toFixed(2)}h OT</small><small>Supervisor reason: {row.review.supervisorReason}</small><textarea className="input" rows={2} value={reviewNotes[reviewId]??""} onChange={e=>setReviewNotes(s=>({...s,[reviewId]:e.target.value}))} placeholder="Approval / rejection note (required for rejection)"/><button className="btn btn-primary btn-sm" disabled={hourlyBusy} onClick={async()=>{setHourlyBusy(true);try{await decideHourlyReview({reviewId:row.review._id,decision:"approved"});setMessage("Payable hours approved.");}catch(e){setError(e instanceof Error?e.message:"Approval failed.");}finally{setHourlyBusy(false);}}}><ShieldCheck size={13}/> Approve</button><button className="btn btn-outline btn-sm" disabled={hourlyBusy||!(reviewNotes[reviewId]??"").trim()} onClick={async()=>{setHourlyBusy(true);try{await decideHourlyReview({reviewId:row.review._id,decision:"rejected",note:reviewNotes[reviewId]});setMessage("Payable hours rejected.");}catch(e){setError(e instanceof Error?e.message:"Rejection failed.");}finally{setHourlyBusy(false);}}}>Reject</button></div>:"Awaiting Superadmin":row.review?.status==="rejected"?<span className="badge badge-warning">Rejected</span>:account?.role==="supervisor"?<div className="wage-form"><input className="input" value={values.reason} onChange={e=>setHourInputs(s=>({...s,[String(row.employeeId)+":"+row.workDate]:{...values,reason:e.target.value}}))} placeholder="Reason for payable hours"/><button className="btn btn-primary btn-sm" disabled={hourlyBusy||!values.reason.trim()||!values.regular.trim()||!values.overtime.trim()||!Number.isFinite(Number(values.regular))||!Number.isFinite(Number(values.overtime))} onClick={async()=>{setHourlyBusy(true);try{await submitHourlyReview({employeeId:row.employeeId,workDate:row.workDate,regularMinutes:Math.round(Number(values.regular)*60),overtimeMinutes:Math.round(Number(values.overtime)*60),reason:values.reason});setMessage("Payable hours submitted for Superadmin approval.");}catch(e){setError(e instanceof Error?e.message:"Submission failed.");}finally{setHourlyBusy(false);}}}>Submit for approval</button></div>:"Supervisor review required"}
              </td>
            </tr>;
          })}
          </tbody></table></div>}
        <p className="t-caption text-tertiary">Recorded attendance and break durations are informational evidence. Supervisors suggest regular and overtime payable hours separately; only Superadmin-approved hours contribute to earnings. Overtime is not included in regular hours.</p>
      </div>
    </div>

 </section>;
}
