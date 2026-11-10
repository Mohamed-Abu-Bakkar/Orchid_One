"use client";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { FileText, Upload, Eye, Archive, CheckCircle2, Clock3 } from "lucide-react";

const categories = [
  ["hr_employment","HR & Employment"],["attendance","Attendance"],["leave","Leave"],
  ["working_hours","Working Hours"],["conduct","Code of Conduct"],["safety","Health & Safety"],
  ["wages_compensation","Wages & Compensation"],["other","Other"],
] as const;

export function PolicyManagement() {
  const policies = useQuery(api.policies.listForAdmin, {});
  const account = useQuery(api.account.getMyAccountStatus, {});
  const uploadUrl = useMutation(api.policies.generateUploadUrl);
  const createDraft = useMutation(api.policies.createDraft);
  const publish = useMutation(api.policies.publish);
  const archive = useMutation(api.policies.archive);
  const [title,setTitle]=useState("");
  const [category,setCategory]=useState<(typeof categories)[number][0]>("hr_employment");
  const [description,setDescription]=useState("");
  const [effectiveFrom,setEffectiveFrom]=useState("");
  const [file,setFile]=useState<File|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [reportId,setReportId]=useState<string|null>(null);
  const [reportPolicy,setReportPolicy]=useState<any>(null);

  async function saveDraft(event:React.FormEvent) {
    event.preventDefault();
    if(!file || !title.trim()) {setMessage("Enter a policy title and choose a PDF.");return;}
    if(file.type!=="application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {setMessage("Only PDF policy files are supported.");return;}
    if(file.size>15*1024*1024) {setMessage("The PDF must be 15 MB or smaller.");return;}
    setBusy(true);setMessage("");
    try {
      const url=await uploadUrl({});
      const response=await fetch(url,{method:"POST",headers:{"Content-Type":"application/pdf"},body:file});
      if(!response.ok) throw new Error("The PDF upload failed.");
      const {storageId}=await response.json();
      await createDraft({title:title.trim(),category,description:description.trim()||undefined,effectiveFrom:effectiveFrom||undefined,storageId,originalFileName:file.name,mimeType:"application/pdf",fileSize:file.size});
      setTitle("");setDescription("");setEffectiveFrom("");setFile(null);
      const input=document.getElementById("policy-pdf") as HTMLInputElement|null;if(input)input.value="";
      setMessage("Policy saved as a draft. Publish it when it is ready for employees.");
    } catch(error) {setMessage(error instanceof Error?error.message:"Unable to save policy.");}
    finally {setBusy(false);}
  }

  if(policies===undefined||account===undefined) return <section className="sec"><p className="sub">Loading policies…</p></section>;
  return <section className="sec">
    <div className="page-head"><div><h2 className="t-h1" style={{fontSize:22}}>Policy management</h2><p className="sub">Upload, publish and track company policy acknowledgements.</p></div></div>
    {account.role==="superadmin"&&<div className="panel"><div className="panel-head"><span className="t-h3">Upload a policy</span><span className="badge badge-neutral">PDF · Max 15 MB</span></div>
      <form className="panel-body" onSubmit={saveDraft} style={{display:"grid",gap:14}}>
        <label className="policy-field">Policy title<input className="input" value={title} maxLength={160} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Attendance and Punctuality Policy" required /></label>
        <div className="policy-form-grid">
          <label className="policy-field">Category<select className="input" value={category} onChange={e=>setCategory(e.target.value as typeof category)}>{categories.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
          <label className="policy-field">Effective from<input className="input" type="date" value={effectiveFrom} onChange={e=>setEffectiveFrom(e.target.value)} /></label>
        </div>
        <label className="policy-field">Description (optional)<textarea className="input" rows={2} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Short summary for employees" /></label>
        <label className="policy-field policy-upload"><Upload size={19}/><span>{file?file.name:"Choose policy PDF"}</span><input id="policy-pdf" type="file" accept="application/pdf,.pdf" onChange={e=>setFile(e.target.files?.[0]??null)} required /></label>
        <div><button className="btn btn-primary" type="submit" disabled={busy}>{busy?"Uploading…":"Save as draft"}</button></div>
        {message&&<p className="sub" role="status">{message}</p>}
      </form>
    </div>}
    <div className="panel" style={{marginTop:20}}><div className="panel-head"><span className="t-h3">Policies</span><span className="t-caption text-tertiary">{policies.length} versions</span></div>
      <div className="panel-body" style={{display:"grid",gap:12}}>
        {policies.length===0&&<p className="sub">No policies uploaded yet.</p>}
        {policies.map(policy=><div className="policy-row" key={policy._id}>
          <div className="policy-file-icon"><FileText size={20}/></div><div className="policy-row-main"><strong>{policy.title}</strong><span>Version {policy.version} · {categories.find(c=>c[0]===policy.category)?.[1]??policy.category} · {policy.originalFileName}</span>{policy.description&&<small>{policy.description}</small>}</div>
          <span className={"badge "+(policy.status==="published"?"badge-success":policy.status==="draft"?"badge-warning":"badge-neutral")}>{policy.status}</span>
          {account.role==="superadmin"&&policy.status==="draft"&&<button className="btn btn-primary btn-sm" onClick={async()=>{try{await publish({policyId:policy._id});setMessage("Policy published to all active employees.");}catch(e){setMessage(e instanceof Error?e.message:"Unable to publish.");}}}>Publish</button>}
          {policy.status==="published"&&<button className="btn btn-outline btn-sm" onClick={()=>{setReportId(String(policy._id));setReportPolicy(policy);}}>Acknowledgements</button>}
          {account.role==="superadmin"&&policy.status!=="archived"&&<button className="icon-btn" title="Archive version" onClick={()=>archive({policyId:policy._id})}><Archive size={16}/></button>}
        </div>)}
      </div>
    </div>
    {reportId&&reportPolicy&&<PolicyAcknowledgementReport policyId={reportPolicy._id} title={reportPolicy.title} version={reportPolicy.version} onClose={()=>{setReportId(null);setReportPolicy(null);}}/>}
  </section>;
}

function PolicyAcknowledgementReport({policyId,title,version,onClose}:{policyId:any;title:string;version:number;onClose:()=>void}) {
 const rows=useQuery(api.policies.acknowledgementReport,{policyId});
 if(rows===undefined)return <div className="panel" style={{marginTop:20}}><div className="panel-body">Loading acknowledgement report…</div></div>;
 const done=rows.filter(r=>r.acknowledgedAt!==null).length;
 return <div className="panel" style={{marginTop:20}}><div className="panel-head"><div><span className="t-h3">{title} · v{version}</span><p className="sub">{done} of {rows.length} active employees acknowledged</p></div><button className="btn btn-outline btn-sm" onClick={onClose}>Close</button></div><div className="panel-body" style={{display:"grid",gap:10}}>
 {rows.map(row=><div className="policy-report-row" key={row.employeeId}><span><strong>{row.name||row.employeeCode}</strong><small>{row.employeeCode}</small></span>{row.acknowledgedAt?<span className="policy-ack-done"><CheckCircle2 size={15}/> {new Date(row.acknowledgedAt).toLocaleString()}</span>:<span className="policy-ack-pending"><Clock3 size={15}/> Pending</span>}</div>)}
 </div></div>;
}
