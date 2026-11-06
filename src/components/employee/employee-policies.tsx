"use client";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { FileText, CheckCircle2, Clock3, ExternalLink } from "lucide-react";

export function EmployeePolicies() {
 const policies=useQuery(api.policies.listPublishedForEmployee,{});
 if(policies===undefined)return <div className="employee-card"><p className="employee-card-title">Company policies</p><p className="employee-muted">Loading policies…</p></div>;
 const pending=policies.filter(p=>!p.acknowledged).length;
 return <div className="employee-card"><div className="policy-employee-heading"><div><p className="employee-card-title">Company policies</p><p className="employee-muted">Policies published by Orchid Flowers</p></div>{pending>0&&<span className="employee-status">{pending} to acknowledge</span>}</div>
 {policies.length===0?<p className="employee-muted">There are no published policies at the moment.</p>:policies.map(policy=><EmployeePolicyItem key={policy._id} policy={policy}/>)}
 </div>;
}
function EmployeePolicyItem({policy}:{policy:any}) {
 const fileUrl=useQuery(api.policies.getPolicyFileUrl,{policyId:policy._id});
 const acknowledge=useMutation(api.policies.acknowledge);
 const [busy,setBusy]=React.useState(false);
 const [message,setMessage]=React.useState("");
 async function confirm(){setBusy(true);setMessage("");try{await acknowledge({policyId:policy._id});setMessage("Acknowledged");}catch(e){setMessage(e instanceof Error?e.message:"Unable to acknowledge.");}finally{setBusy(false);}}
 return <div className="policy-employee-row"><div className="policy-file-icon"><FileText size={18}/></div><div className="policy-row-main"><strong>{policy.title}</strong><span>Version {policy.version}{policy.effectiveFrom? " · Effective "+policy.effectiveFrom:""}</span>{policy.description&&<small>{policy.description}</small>}<div className="policy-employee-actions">{fileUrl&&<a className="policy-open-link" href={fileUrl} target="_blank" rel="noreferrer"><ExternalLink size={14}/> Read PDF</a>}{policy.acknowledged?<span className="policy-ack-done"><CheckCircle2 size={14}/> Acknowledged</span>:<button className="btn btn-primary btn-sm" disabled={busy} onClick={confirm}>{busy?"Saving…":"I acknowledge"}</button>}</div>{message&&<small role="status">{message}</small>}</div></div>;
}
