"use client";

import { getAdminErrorMessage } from "@/lib/admin-errors";
import {useMemo,useState} from "react";
import {useMutation,useQuery} from "convex/react";
import {api} from "@/../convex/_generated/api";
import type {Id} from "@/../convex/_generated/dataModel";
import {Check,Eye,ExternalLink,FileText,Search,X,ShieldCheck,Clock3,AlertCircle,Archive} from "lucide-react";
type Status="all"|"pending"|"verified"|"rejected"|"replaced";
const statusMeta:Record<Exclude<Status,"all">,{label:string;className:string}>={pending:{label:"Pending review",className:"badge-warning"},verified:{label:"Verified",className:"badge-success"},rejected:{label:"Rejected",className:"badge-danger"},replaced:{label:"Replaced",className:"badge-neutral"}};
export function EmployeeDocumentReview(){
 const documents=useQuery(api.employeeDocuments.listOrganizationDocuments,{});
 const account=useQuery(api.account.getMyAccountStatus,{});
 const review=useMutation(api.employeeDocuments.reviewDocument),recommend=useMutation(api.employeeDocuments.recommendDocument);
 const [notes,setNotes]=useState<Record<string,string>>({}),[busy,setBusy]=useState<string|null>(null),[message,setMessage]=useState("");
 const [previewId,setPreviewId]=useState<Id<"employeeDocuments">|null>(null),[filter,setFilter]=useState<Status>("all"),[search,setSearch]=useState(""),[department,setDepartment]=useState("all"),[category,setCategory]=useState("all");
 const departments=useMemo(()=>[...new Set((documents??[]).map(d=>d.departmentName).filter(Boolean))].sort(),[documents]);
 const categories=useMemo(()=>[...new Set((documents??[]).map(d=>d.documentCategory||"Other"))].sort(),[documents]);
 const counts=useMemo(()=>({all:documents?.length??0,pending:documents?.filter(d=>d.reviewStatus==="pending").length??0,verified:documents?.filter(d=>d.reviewStatus==="verified").length??0,rejected:documents?.filter(d=>d.reviewStatus==="rejected").length??0,replaced:documents?.filter(d=>d.reviewStatus==="replaced").length??0}),[documents]);
 const filtered=useMemo(()=>(documents??[]).filter(doc=>{const term=search.trim().toLowerCase(),haystack=[doc.employeeName,doc.employeeCode,doc.departmentName,doc.documentCategory,doc.documentType,doc.originalFileName].join(" ").toLowerCase();return(filter==="all"||doc.reviewStatus===filter)&&(!term||haystack.includes(term))&&(department==="all"||doc.departmentName===department)&&(category==="all"||(doc.documentCategory||"Other")===category);}),[documents,search,filter,department,category]);
 const preview=documents?.find(doc=>doc._id===previewId);
 async function decide(id:Id<"employeeDocuments">,decision:"verified"|"rejected"){
  const note=notes[id]??"";if(decision==="rejected"&&!note.trim()){setMessage("Enter a rejection reason before rejecting a document.");return;}
  setBusy(String(id));setMessage("");
  try{if(account?.role==="supervisor")await recommend({documentId:id,decision,note:note.trim()||undefined});else await review({documentId:id,decision,note:note.trim()||undefined});setMessage(account?.role==="supervisor"?"Recommendation submitted to Superadmin.":decision==="verified"?"Document verified.":"Document rejected.");setNotes(n=>({...n,[id]:""}));}
  catch(error){setMessage(getAdminErrorMessage(error, "Unable to review document."));}finally{setBusy(null);}
 }
 if(documents===undefined||account===undefined||account===null)return <section className="sec"><p className="sub">Loading organization documents…</p></section>;
 const tabs:[Status,string,any][]=[["all","All documents",FileText],["pending","Pending",Clock3],["verified","Verified",ShieldCheck],["rejected","Rejected",AlertCircle],["replaced","Replaced",Archive]];
 return <section className="sec">
  <div className="page-head"><div><h2 className="t-h1" style={{fontSize:22}}>Employee documents</h2><p className="sub">Organization-wide document register · Search, review and securely preview employee files.</p></div><span className="badge badge-neutral">{counts.all} records</span></div>
  <div className="kpi-grid" style={{gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",marginBottom:18}}>{([["All documents",counts.all,FileText],["Pending review",counts.pending,Clock3],["Verified",counts.verified,ShieldCheck],["Rejected",counts.rejected,AlertCircle]] as const).map(([label,value,Icon])=><div className="kpi card" key={label}><span className="kpi-icon"><Icon size={18}/></span><span className="kpi-label">{label}</span><span className="kpi-val">{value}</span></div>)}</div>
  <div className="panel"><div className="panel-body" style={{display:"grid",gap:14}}>
   <div className="employee-directory-toolbar"><div className="input-icon-wrap employee-directory-search"><span className="input-prefix"><Search size={16}/></span><input className="input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employee, ID, document name…" aria-label="Search employee documents"/></div>
    <label className="employee-status-filter"><span className="t-caption text-tertiary">Department</span><select className="input" value={department} onChange={e=>setDepartment(e.target.value)}><option value="all">All departments</option>{departments.map(d=><option key={d} value={d}>{d}</option>)}</select></label>
    <label className="employee-status-filter"><span className="t-caption text-tertiary">Category</span><select className="input" value={category} onChange={e=>setCategory(e.target.value)}><option value="all">All categories</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
   </div>
   <div className="row gap-2" style={{flexWrap:"wrap"}} role="tablist" aria-label="Document status">{tabs.map(([key,label,Icon])=><button key={key} type="button" role="tab" aria-selected={filter===key} className={"btn btn-sm "+(filter===key?"btn-primary":"btn-outline")} onClick={()=>setFilter(key)}><Icon size={14}/>{label}<span className="tabular-nums">{counts[key]}</span></button>)}</div>
   {message&&<p className="sub" role="status">{message}</p>}
   <div className="employee-directory-table-wrap"><table className="employee-directory-table"><thead><tr><th>Employee</th><th>Document</th><th>Department</th><th>Uploaded</th><th>Status</th><th>Review</th><th>File</th></tr></thead><tbody>
    {filtered.map(doc=><tr key={doc._id}><td><div className="employee-directory-person"><span className="employee-directory-avatar">{doc.employeeName.split(/\s+/).map(x=>x[0]).slice(0,2).join("")}</span><span><strong>{doc.employeeName}</strong><small>{doc.employeeCode}</small></span></div></td>
     <td><strong>{doc.documentType}</strong><small>{doc.documentCategory||"Other"} · {doc.originalFileName}</small></td><td>{doc.departmentName||"—"}</td>
     <td>{new Date(doc.uploadedAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}<small>{doc.uploaderName}</small></td>
     <td><span className={"badge "+statusMeta[doc.reviewStatus].className}>{statusMeta[doc.reviewStatus].label}</span></td>
     <td>{doc.reviewStatus==="pending"?account.role==="supervisor"?<div className="col gap-2"><small>{doc.supervisorRecommendation?("Recommended: "+doc.supervisorRecommendation):"Awaiting your recommendation"}</small><textarea className="input" rows={2} placeholder="Rejection reason (required to reject)" value={notes[doc._id]??""} onChange={e=>setNotes(n=>({...n,[doc._id]:e.target.value}))}/><div className="row gap-2"><button className="btn btn-primary btn-sm" disabled={busy===String(doc._id)||!!doc.supervisorRecommendation} onClick={()=>decide(doc._id,"verified")}><Check size={14}/> Recommend</button><button className="btn btn-outline btn-sm" disabled={busy===String(doc._id)||!!doc.supervisorRecommendation||!(notes[doc._id]??"").trim()} onClick={()=>decide(doc._id,"rejected")}><X size={14}/> Reject</button></div></div>:doc.supervisorRecommendation?<div className="col gap-2"><small>Supervisor: {doc.supervisorRecommendation}{doc.supervisorNote?" · "+doc.supervisorNote:""}</small><textarea className="input" rows={2} placeholder="Rejection reason (required to reject)" value={notes[doc._id]??""} onChange={e=>setNotes(n=>({...n,[doc._id]:e.target.value}))}/><div className="row gap-2"><button className="btn btn-primary btn-sm" disabled={busy===String(doc._id)} onClick={()=>decide(doc._id,"verified")}><Check size={14}/> Verify</button><button className="btn btn-outline btn-sm" disabled={busy===String(doc._id)||!(notes[doc._id]??"").trim()} onClick={()=>decide(doc._id,"rejected")}><X size={14}/> Reject</button></div></div>:<span className="t-caption text-tertiary">Awaiting supervisor recommendation</span>:<div className="col"><small>{doc.reviewerName?"Reviewed by "+doc.reviewerName:"—"}</small><small>{doc.reviewNote||""}</small></div>}</td>
     <td>{doc.url?<button className="policy-open-link" type="button" onClick={()=>setPreviewId(doc._id)}><Eye size={14}/> View</button>:<span className="t-caption text-tertiary">File unavailable</span>}</td>
    </tr>)}</tbody></table>
    {filtered.length===0&&<div className="empty-state"><FileText size={26}/><strong>No matching documents</strong><p>Try another status, department, category or search term.</p></div>}</div>
   <div className="employee-directory-footer">Showing {filtered.length} of {documents.length} organization documents</div>
  </div></div>
  {preview&&preview.url&&<div className="panel" style={{marginTop:20}}><div className="panel-head"><div><span className="t-h3">Document preview</span><p className="sub" style={{margin:"4px 0 0"}}>{preview.employeeName} · {preview.documentType} · {preview.originalFileName}</p></div><div className="row gap-2"><a className="policy-open-link" href={preview.url} target="_blank" rel="noreferrer"><ExternalLink size={14}/> Open in new tab</a><button type="button" className="icon-btn" aria-label="Close preview" onClick={()=>setPreviewId(null)}><X size={17}/></button></div></div><div className="panel-body">{preview.mimeType==="application/pdf"?<iframe title={preview.originalFileName} src={preview.url} className="company-doc-preview-frame"/>:<div className="company-doc-image-preview"><img src={preview.url} alt={preview.originalFileName}/></div>}</div></div>}
 </section>;
}
