"use client";
import {useState} from "react";
import {useMutation,useQuery} from "convex/react";
import {api} from "@/../convex/_generated/api";
import type {Id} from "@/../convex/_generated/dataModel";
import {Check,Eye,FileText,X} from "lucide-react";
export function EmployeeDocumentReview(){
 const documents=useQuery(api.employeeDocuments.listPendingForAdmin,{}),account=useQuery(api.account.getMyAccountStatus,{}),review=useMutation(api.employeeDocuments.reviewDocument),recommend=useMutation(api.employeeDocuments.recommendDocument);
 const [notes,setNotes]=useState<Record<string,string>>({}),[busy,setBusy]=useState<string|null>(null),[message,setMessage]=useState("");
 async function decide(id:Id<"employeeDocuments">,decision:"verified"|"rejected"){
  const note=notes[id]??"";if(decision==="rejected"&&!note.trim()){setMessage("Enter a rejection reason before rejecting a document.");return;}
  setBusy(String(id));setMessage("");
  try{if(account?.role==="supervisor")await recommend({documentId:id,decision,note:note.trim()||undefined});else await review({documentId:id,decision,note:note.trim()||undefined});setMessage(account?.role==="supervisor"?"Recommendation submitted to Superadmin.":decision==="verified"?"Document verified. The previous file, if any, was deleted from storage.":"Document rejected. The previous verified document remains active.");}
  catch(error){setMessage(error instanceof Error?error.message:"Unable to review document.");}finally{setBusy(null);}
 }
 if(documents===undefined||account===undefined)return <section className="sec"><p className="sub">Loading employee document reviews…</p></section>;
 return <section className="sec"><div className="page-head"><div><h2 className="t-h1" style={{fontSize:22}}>Employee document review</h2><p className="sub">Review employee uploads. Existing verified files remain active until a replacement is approved.</p></div><span className="badge badge-neutral">{documents.length} pending</span></div>
 {message&&<p className="sub" role="status" style={{marginBottom:12}}>{message}</p>}
 <div className="panel"><div className="panel-body" style={{display:"grid",gap:14}}>{!documents.length&&<p className="sub">No employee documents are awaiting review.</p>}
 {documents.map(doc=><article key={doc._id} className="policy-row" style={{alignItems:"flex-start",flexWrap:"wrap"}}><div className="policy-file-icon"><FileText size={20}/></div><div className="policy-row-main"><strong>{doc.employeeName} · {doc.employeeCode}</strong><span>{doc.documentCategory} / {doc.documentType} · {doc.originalFileName}</span><small>{doc.replacingFileName?"Replacement for: "+doc.replacingFileName:"First submission"} · {new Date(doc.uploadedAt).toLocaleString("en-IN")}</small>{doc.supervisorRecommendation&&<small>Supervisor recommendation: {doc.supervisorRecommendation} · {doc.supervisorNote??""}</small>}{doc.url&&<a className="policy-open-link" href={doc.url} target="_blank" rel="noreferrer"><Eye size={14}/> View uploaded file</a>}<textarea className="input" rows={2} style={{marginTop:10}} placeholder="Rejection reason (required only when rejecting)" value={notes[doc._id]??""} onChange={event=>setNotes(current=>({...current,[doc._id]:event.target.value}))}/></div><div className="row gap-2">{account.role==="supervisor"?<><button className="btn btn-primary btn-sm" disabled={busy===String(doc._id)} onClick={()=>decide(doc._id,"verified")}><Check size={15}/> Recommend verify</button><button className="btn btn-outline btn-sm" disabled={busy===String(doc._id)||!(notes[doc._id]??"").trim()} onClick={()=>decide(doc._id,"rejected")}><X size={15}/> Recommend reject</button></>:doc.supervisorRecommendation?<><button className="btn btn-primary btn-sm" disabled={busy===String(doc._id)} onClick={()=>decide(doc._id,"verified")}><Check size={15}/> Final verify</button><button className="btn btn-outline btn-sm" disabled={busy===String(doc._id)||!(notes[doc._id]??"").trim()} onClick={()=>decide(doc._id,"rejected")}><X size={15}/> Final reject</button></>:<span className="t-caption text-tertiary">Awaiting supervisor recommendation</span>}</div></article>)}</div></div></section>;
}
