"use client";
import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { CheckCircle2, UserPlus } from "lucide-react";

export function EmployeeOnboarding() {
  const options = useQuery(api.employee.listOnboardingOptions, {});
  const accounts = useQuery(api.employee.listAccountsForLinking, {});
  const createEmployee = useMutation(api.employee.createForAdmin);
  const [firstName,setFirstName]=useState("");
  const [lastName,setLastName]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [designation,setDesignation]=useState("");
  const [employmentType,setEmploymentType]=useState("permanent");
  const [status,setStatus]=useState("pending");
  const [joiningDate,setJoiningDate]=useState("");
  const [departmentId,setDepartmentId]=useState("");
  const [locationId,setLocationId]=useState("");
  const [userId,setUserId]=useState("");
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const unlinked=useMemo(()=>accounts?.filter(a=>!a.employeeId&&a.role==="employee")??[],[accounts]);
  const reset=()=>{setFirstName("");setLastName("");setEmail("");setPhone("");setDesignation("");setEmploymentType("permanent");setStatus("pending");setJoiningDate("");setDepartmentId("");setLocationId("");setUserId("");};
  const submit=async(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault();setSaving(true);setError("");setMessage("");
    try {
      const result=await createEmployee({
        firstName,lastName:lastName||undefined,email:email||undefined,phone,designation,
        employmentType:employmentType as "permanent"|"hourly"|"daily"|"contract",
        status:status as "active"|"inactive"|"pending"|"archived",joiningDate,
        departmentId:departmentId as any,locationId:locationId as any,userId:userId?userId as any:undefined
      });
      setMessage(`Employee ${result.employeeCode} created${result.linked?" and account linked":". Account can be linked later from User Management."}`);
      reset();
    } catch(err) {setError(err instanceof Error?err.message:"Unable to create employee.");}
    finally {setSaving(false);}
  };
  if(options===undefined||accounts===undefined)return <section className="sec"><p className="sub">Loading onboarding options…</p></section>;
  return <section className="sec">
    <div className="page-head"><div><h2 className="t-h1" style={{fontSize:22}}>Employee onboarding</h2><p className="sub">Create the employee record first. Linking an existing login account is optional.</p></div><span className="badge badge-neutral">Automatic code · ORC-0001</span></div>
    <form className="panel onboarding-panel" onSubmit={submit}>
      <div className="panel-head"><span className="t-h3">Employee details</span><span className="t-caption text-tertiary">Required fields marked *</span></div>
      <div className="panel-body">
        <div className="policy-form-grid">
          <label className="policy-field">First name *<input className="input" required value={firstName} onChange={e=>setFirstName(e.target.value)} /></label>
          <label className="policy-field">Last name<input className="input" value={lastName} onChange={e=>setLastName(e.target.value)} /></label>
          <label className="policy-field">Email<input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} /></label>
          <label className="policy-field">Phone number *<input className="input" required value={phone} onChange={e=>setPhone(e.target.value)} /></label>
          <label className="policy-field">Designation *<input className="input" required value={designation} onChange={e=>setDesignation(e.target.value)} /></label>
          <label className="policy-field">Joining date *<input className="input" type="date" required value={joiningDate} onChange={e=>setJoiningDate(e.target.value)} /></label>
          <label className="policy-field">Department *<select className="input" required value={departmentId} onChange={e=>setDepartmentId(e.target.value)}><option value="">Select department</option>{options.departments.map(d=><option key={d._id} value={d._id}>{d.name}</option>)}</select></label>
          <label className="policy-field">Work location *<select className="input" required value={locationId} onChange={e=>setLocationId(e.target.value)}><option value="">Select location</option>{options.locations.map(l=><option key={l._id} value={l._id}>{l.name}</option>)}</select></label>
          <label className="policy-field">Employment type *<select className="input" value={employmentType} onChange={e=>setEmploymentType(e.target.value)}><option value="permanent">Permanent</option><option value="hourly">Hourly</option><option value="daily">Daily</option><option value="contract">Contract</option></select></label>
          <label className="policy-field">Employee status *<select className="input" value={status} onChange={e=>setStatus(e.target.value)}><option value="pending">Pending</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
        </div>
        <div className="onboarding-link-box">
          <div><strong>Link an existing login account (optional)</strong><p className="t-caption text-tertiary">You can skip this and link the account later in User Management.</p></div>
          <label className="policy-field">Registered account<select className="input" value={userId} onChange={e=>setUserId(e.target.value)}><option value="">Leave unlinked</option>{unlinked.map(a=><option key={a._id} value={a._id}>{a.fullName||"Unnamed account"} · {a.email||"No email"}</option>)}</select></label>
        </div>
        {options.departments.length===0||options.locations.length===0?<p className="auth-error">Create at least one active department and work location before onboarding an employee.</p>:null}
        {error&&<p className="auth-error" role="alert">{error}</p>}
        {message&&<p className="onboarding-success" role="status"><CheckCircle2 size={16}/>{message}</p>}
        <div className="page-actions"><button className="btn btn-primary" type="submit" disabled={saving||!options.departments.length||!options.locations.length}><UserPlus size={16}/>{saving?"Creating…":"Create employee"}</button></div>
      </div>
    </form>
  </section>;
}
