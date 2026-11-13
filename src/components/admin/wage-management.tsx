"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Plus, Wallet, UserRound, Settings2, Archive, CheckCircle2 } from "lucide-react";

type Line = { componentId: string; amount: string; reason: string };
const money = (paise?: number) => paise === undefined ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(paise / 100);
const toPaise = (value: string) => Math.round(Number(value) * 100);
const localDate = () => { const date = new Date(); return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-"); };

export function WageManagement() {
  const data = useQuery(api.wages.listForAdmin, {});
  const account = useQuery(api.account.getMyAccountStatus, {});
  const rateData=useQuery(api.wages.wageRateAdminData,{});
  const saveHourlyRate=useMutation(api.wages.saveHourlyRate);const saveDailyRate=useMutation(api.wages.saveDailyRate);
  const [wageTab,setWageTab]=useState<"permanent"|"hourly"|"daily">("permanent");
  const [rateEmployeeId,setRateEmployeeId]=useState("");const [rateAmount,setRateAmount]=useState("");const [overtimeMultiplier,setOvertimeMultiplier]=useState("");
  const [rateEffectiveFrom,setRateEffectiveFrom]=useState(localDate);const [rateSaving,setRateSaving]=useState(false);
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

  if (data === undefined || rateData === undefined || account === undefined || account === null) return <section className="sec"><p className="sub">Loading wage configuration…</p></section>;

  if(account?.role==="supervisor") return <section className="sec"><div className="page-head"><div><h2 className="t-h1" style={{fontSize:22}}>Wage Management</h2><p className="sub">Read-only compensation reference. Final payable-hours decisions are handled in Hourly Workforce.</p></div></div><div className="grid-2-equal"><article className="panel"><div className="panel-head"><strong>Permanent compensation</strong></div><div className="panel-body">{data.employees.map(item=><div className="card p-3 mb-2" key={item._id}><strong>{item.firstName} {item.lastName} · {item.employeeCode}</strong>{item.compensation.map(record=><p className="t-body-sm" key={record._id}>Effective {record.effectiveFrom} · Fixed monthly: {money(record.fixedMonthlyAmountPaise)} · {record.components.length} salary component(s)</p>)}</div>)}</div></article><article className="panel"><div className="panel-head"><strong>Hourly and daily rates</strong></div><div className="panel-body">{[...rateData.hourlyEmployees.map(e=>({...e,type:"Hourly"})),...rateData.dailyEmployees.map(e=>({...e,type:"Daily"}))].map(e=><div className="card p-3 mb-2" key={e._id}><strong>{e.name} · {e.employeeCode} · {e.type}</strong>{e.rates.map(rate=><p className="t-body-sm" key={rate._id}>Effective {rate.effectiveFrom} · {money(rate.amountPaise)} / {e.type.toLowerCase()}{rate.overtimeMultiplier===undefined?"":" · OT ×"+rate.overtimeMultiplier}</p>)}</div>)}</div></article></div></section>;
  return <section className="sec">
    <div className="page-head"><div><h2 className="t-h1" style={{fontSize:22}}>Wage Management</h2><p className="sub">Configure permanent monthly compensation and effective-dated hourly or daily wage rates.</p></div><span className="badge badge-neutral">{data.employees.length} permanent employees</span></div>
    <div className="wage-scope-note"><Wallet size={18}/><span><strong>Hourly and monthly wage configuration</strong> — approved hourly attendance is calculated separately from permanent employee monthly compensation. This does not generate payslips, process statutory deductions or record payments.</span></div>
    {message && <div className="onboarding-success" role="status"><CheckCircle2 size={16}/>{message}</div>}
    {error && <div className="auth-error" role="alert">{error}</div>}

    <div className="panel mt-4"><div className="panel-head"><div><span className="t-h3">Compensation by employment type</span><p className="t-caption text-tertiary">Permanent monthly compensation and effective-dated hourly or daily rates.</p></div><Wallet size={18}/></div><div className="panel-body wage-form">
<div className="row gap-2" role="tablist" aria-label="Wage type">{(["permanent","hourly","daily"] as const).map(tab=><button key={tab} type="button" role="tab" aria-selected={wageTab===tab} className={wageTab===tab?"btn btn-primary":"btn btn-outline"} onClick={()=>setWageTab(tab)}>{tab[0].toUpperCase()+tab.slice(1)}</button>)}</div>
{wageTab==="permanent"?<div className="wage-scope-note"><UserRound size={18}/><span><strong>Permanent monthly compensation</strong> — configure fixed amounts and salary components below.</span></div>:<div className="wage-form">
<div className="grid-2-equal"><label className="policy-field">{wageTab==="hourly"?"Hourly employee":"Daily wage employee"}<select className="input" value={rateEmployeeId} onChange={e=>setRateEmployeeId(e.target.value)}><option value="">Select employee</option>{(wageTab==="hourly"?rateData.hourlyEmployees:rateData.dailyEmployees).map(e=><option key={e._id} value={e._id}>{e.employeeCode} · {e.name}</option>)}</select></label>
<label className="policy-field">{wageTab==="hourly"?"Hourly rate (₹)":"Daily rate (₹)"}<input className="input" type="number" min="0.01" step="0.01" value={rateAmount} onChange={e=>setRateAmount(e.target.value)}/></label>
{wageTab==="hourly"&&<label className="policy-field">Overtime multiplier<input className="input" type="number" min="1" max="10" step="0.01" value={overtimeMultiplier} onChange={e=>setOvertimeMultiplier(e.target.value)}/></label>}
<label className="policy-field">Effective from<input className="input" type="date" value={rateEffectiveFrom} onChange={e=>setRateEffectiveFrom(e.target.value)}/></label></div>
<button className="btn btn-primary" type="button" disabled={rateSaving||!rateEmployeeId||!rateAmount||(wageTab==="hourly"&&!overtimeMultiplier)} onClick={async()=>{setRateSaving(true);setError("");setMessage("");try{const amountPaise=Math.round(Number(rateAmount)*100);if(!Number.isSafeInteger(amountPaise)||amountPaise<=0)throw new Error("Enter a valid positive rate.");if(wageTab==="hourly")await saveHourlyRate({employeeId:rateEmployeeId as any,amountPaise,overtimeMultiplier:Number(overtimeMultiplier),effectiveFrom:rateEffectiveFrom});else await saveDailyRate({employeeId:rateEmployeeId as any,amountPaise,effectiveFrom:rateEffectiveFrom});setMessage("Rate saved as a new effective-dated record.");setRateAmount("");setOvertimeMultiplier("");}catch(e){setError(e instanceof Error?e.message:"Could not save wage rate.");}finally{setRateSaving(false);}}}>{rateSaving?"Saving…":"Save rate"}</button>
<p className="t-caption text-tertiary">Daily rates are configuration only. Payable-day rules and partial-day treatment are not inferred.</p>
<div className="wage-record-list">{(wageTab==="hourly"?rateData.hourlyEmployees:rateData.dailyEmployees).map(e=><div className="wage-employee-record" key={e._id}><div className="wage-employee-heading"><div><strong>{e.name}</strong><small>{e.employeeCode} · {e.departmentName}</small></div><span className={e.rates.length?"badge badge-success":"badge badge-warning"}>{e.rates.length?"Rate configured":"Rate missing"}</span></div>{e.rates.map(r=><div className="wage-history-row" key={r._id}><span>Effective {r.effectiveFrom}</span><strong>{money(r.amountPaise)} / {wageTab==="hourly"?"hour":"day"}</strong><span>{r.overtimeMultiplier===undefined?"":"OT ×"+r.overtimeMultiplier}</span></div>)}</div>)}</div></div>}
</div></div>
    {wageTab==="permanent" && <>
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
    </>}
  </section>;
}
