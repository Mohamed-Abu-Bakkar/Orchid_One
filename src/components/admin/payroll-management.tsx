"use client";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { CheckCircle2, LockKeyhole, Play, Wallet } from "lucide-react";

const money=(p?:number)=>p===undefined?"—":new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(p/100);
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");};
const monthStart=()=>today().slice(0,7)+"-01";
const monthEnd=()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth()+1,0).toLocaleDateString("en-CA");};

export function PayrollManagement(){
 const periods=useQuery(api.payroll.listPeriods,{});
 const generate=useMutation(api.payroll.generatePeriod);
 const approve=useMutation(api.payroll.approvePeriod);
 const lock=useMutation(api.payroll.lockPeriod);
 const [fromDate,setFromDate]=useState(monthStart);
 const [toDate,setToDate]=useState(monthEnd);
 const [periodType,setPeriodType]=useState<"weekly"|"monthly"|"custom">("monthly");
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState(""),[expanded,setExpanded]=useState<string|null>(null);
 async function run(action:()=>Promise<any>,success:string){setBusy(true);setError("");setMessage("");try{await action();setMessage(success);}catch(e){setError(e instanceof Error?e.message:"Payroll operation failed.");}finally{setBusy(false);}}
 if(periods===undefined)return <section className="sec"><p className="sub">Loading payroll periods…</p></section>;
 return <section className="sec">
  <div className="page-head"><div><h2 className="t-h1" style={{fontSize:22}}>Payroll</h2><p className="sub">Configure pay periods, calculate wages, review payroll and publish employee payslips.</p></div><span className="badge badge-neutral">{periods.length} payroll periods</span></div>
  <div className="wage-scope-note"><Wallet size={18}/><span><strong>Payroll controls</strong> — periods are defined by HR. Generation creates an immutable draft calculation; approval publishes payslips; locking closes the period against further workflow changes.</span></div>
  {message&&<div className="onboarding-success" role="status"><CheckCircle2 size={16}/>{message}</div>}{error&&<div className="auth-error" role="alert">{error}</div>}
  <div className="panel mt-4"><div className="panel-head"><strong>Create payroll period</strong><span className="t-caption text-tertiary">Choose any date range</span></div><div className="panel-body wage-form">
   <div className="grid-2-equal"><label className="policy-field">Period type<select className="input" value={periodType} onChange={e=>setPeriodType(e.target.value as any)}><option value="monthly">Monthly</option><option value="weekly">Weekly</option><option value="custom">Custom</option></select></label><label className="policy-field">From date<input className="input" type="date" value={fromDate} max={toDate} onChange={e=>setFromDate(e.target.value)}/></label><label className="policy-field">To date<input className="input" type="date" value={toDate} min={fromDate} onChange={e=>setToDate(e.target.value)}/></label></div>
   <p className="t-caption text-tertiary">Only approved attendance, approved regular-hour reviews and approved overtime are included. Employees without applicable wage configuration or payable activity are omitted from the generated run.</p>
   <button className="btn btn-primary" disabled={busy||!fromDate||!toDate||fromDate>toDate} onClick={()=>void run(()=>generate({fromDate,toDate,periodType}),"Payroll draft generated. Review each employee record before approval.")}><Play size={16}/>{busy?"Processing…":"Generate payroll draft"}</button>
  </div></div>
  <div className="page-head mt-6"><div><h3 className="t-h3">Payroll history</h3><p className="sub">Drafts remain private to administrators. Approved and locked payslips are visible to employees.</p></div></div>
  <div className="col gap-3">{periods.length===0?<div className="panel"><div className="panel-body empty-state"><Wallet size={28}/><h3 className="t-h3">No payroll periods yet</h3><p className="t-body-sm text-secondary">Create a pay period to generate the first payroll draft.</p></div></div>:periods.map(period=><article className="panel" key={period._id}>
   <div className="panel-head"><div className="col"><strong>{period.fromDate} – {period.toDate}</strong><span className="t-caption text-tertiary">{period.periodType.toUpperCase()} · {period.employeeCount??period.records.length} employees · {period.status.replace("_"," ")}</span></div><div className="row gap-2">{period.status==="draft"&&<button className="btn btn-primary btn-sm" disabled={busy||!period.records.length} onClick={()=>void run(()=>approve({periodId:period._id}),"Payroll approved. Payslips are now available to employees.")}>Approve & publish</button>}{period.status==="approved"&&<button className="btn btn-outline btn-sm" disabled={busy} onClick={()=>void run(()=>lock({periodId:period._id}),"Payroll period locked.")}><LockKeyhole size={14}/> Lock period</button>}<button className="btn btn-outline btn-sm" onClick={()=>setExpanded(expanded===period._id?null:period._id)}>{expanded===period._id?"Hide details":"Review details"}</button></div></div>
   <div className="panel-body"><div className="grid-3"><div><span className="t-caption text-tertiary">Gross</span><p className="t-h3">{money(period.totalGrossPaise)}</p></div><div><span className="t-caption text-tertiary">Deductions</span><p className="t-h3">{money(period.totalDeductionsPaise)}</p></div><div><span className="t-caption text-tertiary">Net payroll</span><p className="t-h3">{money(period.totalNetPaise)}</p></div></div>
   {expanded===period._id&&<div className="employee-directory-table-wrap mt-4"><table className="employee-directory-table"><thead><tr><th>Employee</th><th>Type</th><th>Gross</th><th>Deduction</th><th>Net pay</th><th>Status</th></tr></thead><tbody>{period.records.map(record=><tr key={record._id}><td><strong>{record.employeeName}</strong><small>{record.employeeCode}</small></td><td>{record.employmentType}</td><td>{money(record.grossPaise)}</td><td>{money((record.deductions??[]).reduce((s:number,x:any)=>s+x.amountPaise,0))}</td><td><strong>{money(record.totalPaise)}</strong></td><td><span className="badge badge-neutral">{record.status}</span></td></tr>)}</tbody></table>{period.records.length===0&&<p className="sub">No employee payroll records were generated.</p>}</div>}
   </div></article>)}</div>
 </section>;
}
