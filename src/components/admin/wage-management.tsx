"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Plus, Wallet, UserRound, Settings2, Archive, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";

type Line = { componentId: string; amount: string; reason: string };
const money = (paise?: number) => paise === undefined ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(paise / 100);
const toPaise = (value: string) => Math.round(Number(value) * 100);
const localDate = () => { const date = new Date(); return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-"); };

export function WageManagement() {
  const data = useQuery(api.wages.listForAdmin, {});\n  const account = useQuery(api.account.getMyAccountStatus, {});\n  const [fromDate, setFromDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 6); return d.toLocaleDateString("en-CA"); });\n  const [toDate, setToDate] = useState(localDate);\n  const hourly = useQuery(api.wages.hourlyAdminData, fromDate && toDate && fromDate <= toDate ? { fromDate, toDate } : "skip");\n  const saveHourlyRate = useMutation(api.wages.saveHourlyRate);\n  const submitHourlyReview = useMutation(api.wages.submitHourlyReview);\n  const decideHourlyReview = useMutation(api.wages.decideHourlyReview);\n  const [rateEmployeeId, setRateEmployeeId] = useState("");\n  const [hourlyAmount, setHourlyAmount] = useState("");\n  const [overtimeMultiplier, setOvertimeMultiplier] = useState("");\n  const [rateEffectiveFrom, setRateEffectiveFrom] = useState(localDate);\n  const [hourInputs, setHourInputs] = useState<Record<string, { regular: string; overtime: string; reason: string }>>({});\n  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});\n  const [hourlyBusy, setHourlyBusy] = useState(false);
  const createComponent = useMutation(api.wages.createSalaryComponent);
  const setComponentActive = useMutation(api.wages.setSalaryComponentActive);
  const saveCompensation = useMutation(api.wages.saveEmployeeCompensation);
  const [employeeId, setEmployeeId] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(localDate);
  const [fixedAmount, setFixedAmount] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [componentName, setComponentName] = useState("");
  const [componentCode, setComponentCode] = useState("");
  const [componentCategory, setComponentCategory] = useState<"earning" | "deduction">("earning");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeComponents = data?.components.filter(item => item.isActive) ?? [];
  const selectedComponents = new Set(lines.map(line => line.componentId));

  const addLine = () => {
    const next = activeComponents.find(item => !selectedComponents.has(item._id));
    if (next) setLines(current => [...current, { componentId: next._id, amount: "", reason: "" }]);
  };
  const updateLine = (index: number, patch: Partial<Line>) => setLines(current => current.map((line, i) => i === index ? { ...line, ...patch } : line));

  const submitComponent = async () => {
    setError(""); setMessage("");
    try {
      await createComponent({ name: componentName, code: componentCode, category: componentCategory });
      setComponentName(""); setComponentCode("");
      setMessage("Salary component added to the organization catalogue.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create component."); }
  };

  const submitCompensation = async () => {
    setError(""); setMessage("");
    if (!employeeId) { setError("Select a permanent employee."); return; }
    const fixed = fixedAmount.trim() === "" ? undefined : toPaise(fixedAmount);
    if (fixed !== undefined && (!Number.isFinite(fixed) || fixed < 0)) { setError("Enter a valid fixed monthly amount."); return; }
    if (lines.some(line => line.amount.trim() === "")) { setError("Enter an amount for every selected salary component."); return; }
    const payload = lines.map(line => ({ componentId: line.componentId as any, amountPaise: toPaise(line.amount), ...(line.reason.trim() ? { reason: line.reason.trim() } : {}) }));
    if (payload.some(line => !Number.isSafeInteger(line.amountPaise) || line.amountPaise < 0)) { setError("Enter a valid amount for every salary component."); return; }
    if (fixed === undefined && payload.length === 0) { setError("Enter a fixed monthly amount or add at least one component."); return; }
    setSaving(true);
    try {
      await saveCompensation({ employeeId: employeeId as any, effectiveFrom, fixedMonthlyAmountPaise: fixed, components: payload });
      setMessage("Compensation configuration saved. It is a configuration record, not an approved or paid payroll run.");
      setFixedAmount(""); setLines([]);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save compensation."); }
    finally { setSaving(false); }
  };

  if (data === undefined) return <section className="sec"><p className="sub">Loading wage configuration…</p></section>;

  return <section className="sec">
    <div className="page-head"><div><h2 className="t-h1" style={{fontSize:22}}>Wage Management</h2><p className="sub">Manage hourly payable-hours approval and permanent employee monthly compensation.</p></div><span className="badge badge-neutral">{data.employees.length} permanent employees</span></div>
    <div className="wage-scope-note"><Wallet size={18}/><span><strong>Hourly and monthly wage configuration</strong> — approved hourly attendance is calculated separately from permanent employee monthly compensation. This does not generate payslips, process statutory deductions or record payments.</span></div>
    {message && <div className="onboarding-success" role="status"><CheckCircle2 size={16}/>{message}</div>}
    {error && <div className="auth-error" role="alert">{error}</div>}

    <div className="panel mt-4">
      <div className="panel-head"><div><span className="t-h3">Hourly workforce wages</span><p className="t-caption text-tertiary">Configure hourly rates, review recorded attendance and approve payable hours.</p></div><Clock3 size={18}/></div>
      <div className="panel-body wage-form">
        {account?.role === "superadmin" && <div className="grid-2-equal">
          <label className="policy-field">Hourly employee
            <select className="input" value={rateEmployeeId} onChange={e=>setRateEmployeeId(e.target.value)}><option value="">Select hourly employee</option>{(hourly?.employees ?? []).map(employee=><option key={employee._id} value={employee._id}>{employee.employeeCode} · {employee.name}</option>)}</select>
          </label>
          <label className="policy-field">Hourly rate (₹)<input className="input" type="number" min="0.01" step="0.01" value={hourlyAmount} onChange={e=>setHourlyAmount(e.target.value)} placeholder="e.g. 80.00"/></label>
          <label className="policy-field">Overtime multiplier<input className="input" type="number" min="1" max="10" step="0.01" value={overtimeMultiplier} onChange={e=>setOvertimeMultiplier(e.target.value)} placeholder="Set approved multiplier"/></label>
          <label className="policy-field">Effective from<input className="input" type="date" value={rateEffectiveFrom} onChange={e=>setRateEffectiveFrom(e.target.value)}/></label>
          <div><button className="btn btn-primary" type="button" disabled={hourlyBusy || !rateEmployeeId || !hourlyAmount || !overtimeMultiplier} onClick={async()=>{setHourlyBusy(true);setError("");setMessage("");try{await saveHourlyRate({employeeId:rateEmployeeId as any,amountPaise:Math.round(Number(hourlyAmount)*100),overtimeMultiplier:Number(overtimeMultiplier),effectiveFrom:rateEffectiveFrom});setMessage("Hourly rate saved as a new effective-dated record.");setHourlyAmount("");setOvertimeMultiplier("");}catch(e){setError(e instanceof Error?e.message:"Could not save hourly rate.");}finally{setHourlyBusy(false);}}}>Save hourly rate</button></div>
        </div>}
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
    <div className="grid-2-equal wage-config-grid">
      <div className="panel">
        <div className="panel-head"><div><span className="t-h3">Employee monthly compensation</span><p className="t-caption text-tertiary">Set a fixed amount, components, or both.</p></div><UserRound size={18}/></div>
        <div className="panel-body wage-form">
          <label className="policy-field">Permanent employee
            <select className="input" value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
              <option value="">Select employee</option>
              {data.employees.map(item => <option key={item._id} value={item._id}>{item.employeeCode} · {item.firstName} {item.lastName} — {item.departmentName}</option>)}
            </select>
          </label>
          <label className="policy-field">Effective from
            <input className="input" type="date" value={effectiveFrom} onChange={e => setEffectiveFrom(e.target.value)}/>
          </label>
          <label className="policy-field">Fixed monthly amount (₹) <span className="t-caption text-tertiary">Optional when salary components are configured.</span>
            <input className="input" type="number" min="0" step="0.01" value={fixedAmount} onChange={e => setFixedAmount(e.target.value)} placeholder="e.g. 25000.00"/>
          </label>
          <div className="wage-component-heading"><strong>Employee component amounts</strong><button type="button" className="btn btn-outline btn-sm" onClick={addLine} disabled={activeComponents.length === lines.length}><Plus size={14}/> Add component</button></div>
          {lines.length === 0 && <p className="t-caption text-tertiary">No component amounts added. You can save a fixed monthly amount alone.</p>}
          {lines.map((line,index) => {
            const component = data.components.find(item => item._id === line.componentId);
            return <div className="wage-line" key={line.componentId + "-" + index}>
              <div className="wage-line-top"><strong>{component?.name ?? "Component"}</strong><span className={component?.category === "deduction" ? "badge badge-neutral" : "badge badge-success"}>{component?.category === "deduction" ? "Deduction" : "Earning"}</span><button type="button" className="section-link" onClick={() => setLines(current => current.filter((_,i) => i !== index))}>Remove</button></div>
              <label className="policy-field">Component
                <select className="input" value={line.componentId} onChange={e => updateLine(index,{componentId:e.target.value})}>
                  {data.components.filter(item => item.isActive && (item._id === line.componentId || !selectedComponents.has(item._id))).map(item => <option key={item._id} value={item._id}>{item.name} · {item.category}</option>)}
                </select>
              </label>
              <label className="policy-field">Monthly amount (₹)<input className="input" type="number" min="0" step="0.01" value={line.amount} onChange={e => updateLine(index,{amount:e.target.value})} placeholder="0.00"/></label>
              {component?.category === "deduction" && <label className="policy-field">Deduction reason (required)<input className="input" value={line.reason} onChange={e => updateLine(index,{reason:e.target.value})} placeholder="Enter reason for this deduction"/></label>}
            </div>;
          })}
          <button type="button" className="btn btn-primary" onClick={submitCompensation} disabled={saving}>{saving ? "Saving…" : "Save compensation configuration"}</button>
          <p className="t-caption text-tertiary">Each save creates a dated configuration record. A duplicate effective date for the same employee is rejected; existing records remain unchanged.</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><div><span className="t-h3">Organization salary components</span><p className="t-caption text-tertiary">Shared catalogue available to permanent employee configurations.</p></div><Settings2 size={18}/></div>
        <div className="panel-body wage-form">
          <label className="policy-field">Component name<input className="input" value={componentName} onChange={e => setComponentName(e.target.value)} placeholder="e.g. Basic Pay"/></label>
          <label className="policy-field">Component code<input className="input" value={componentCode} onChange={e => setComponentCode(e.target.value)} placeholder="e.g. BASIC_PAY"/></label>
          <label className="policy-field">Component type<select className="input" value={componentCategory} onChange={e => setComponentCategory(e.target.value as "earning" | "deduction")}><option value="earning">Earning</option><option value="deduction">Manual deduction</option></select></label>
          <button type="button" className="btn btn-outline" onClick={submitComponent} disabled={!componentName.trim() || !componentCode.trim()}><Plus size={15}/> Add to catalogue</button>
          <div className="wage-component-list">
            {data.components.map(component => <div className="wage-component-item" key={component._id}><div><strong>{component.name}</strong><small>{component.code} · {component.category === "earning" ? "Earning" : "Manual deduction"}</small></div><span className={component.isActive ? "badge badge-success" : "badge badge-neutral"}>{component.isActive ? "Active" : "Archived"}</span><button type="button" className="section-link" onClick={() => setComponentActive({componentId:component._id,isActive:!component.isActive})}>{component.isActive ? <><Archive size={13}/> Archive</> : "Reactivate"}</button></div>)}
            {data.components.length === 0 && <p className="t-caption text-tertiary">No components configured yet.</p>}
          </div>
        </div>
      </div>
    </div>

    <div className="panel mt-6">
      <div className="panel-head"><span className="t-h3">Current and scheduled employee configurations</span><span className="t-caption text-tertiary">Historical records are retained</span></div>
      <div className="wage-record-list">
        {data.employees.map(item => <div className="wage-employee-record" key={item._id}><div className="wage-employee-heading"><div><strong>{item.firstName} {item.lastName}</strong><small>{item.employeeCode} · {item.departmentName}</small></div><span className="badge badge-neutral">{item.compensation.length} configuration(s)</span></div>
          {item.compensation.length === 0 ? <p className="t-caption text-tertiary">No monthly compensation configured.</p> : item.compensation.map(record => <div className="wage-history-row" key={record._id}><span>Effective {record.effectiveFrom}</span><strong>{money(record.fixedMonthlyAmountPaise)}</strong><span>{record.components.length} component(s)</span></div>)}
        </div>)}
        {data.employees.length === 0 && <div className="empty-state"><UserRound size={24}/><strong>No active permanent employees</strong><p>Active permanent employee records will appear here.</p></div>}
      </div>
    </div>
  </section>;
}
