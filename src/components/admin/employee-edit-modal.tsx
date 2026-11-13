"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Save, X } from "lucide-react";

type EmployeeRecord = {
  _id: any;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  employmentType: "permanent" | "hourly" | "daily" | "contract";
  status: "active" | "inactive" | "pending" | "archived";
  joiningDate: string;
  departmentId: any;
  locationId: any;
  defaultShiftId: any;
};

const employmentTypes = [
  ["permanent", "Permanent"],
  ["hourly", "Hourly"],
  ["daily", "Daily"],
  ["contract", "Contract"],
] as const;

const employeeStatuses = [
  ["active", "Active"],
  ["pending", "Pending"],
  ["inactive", "Inactive"],
  ["archived", "Archived"],
] as const;

export function EmployeeEditModal({
  employee,
  onClose,
  onSaved,
}: {
  employee: EmployeeRecord;
  onClose: () => void;
  onSaved: () => void;
}) {
  const options = useQuery(api.employee.listOnboardingOptions, {});
  const updateEmployee = useMutation(api.adminCrud.updateEmployee);
  const [firstName, setFirstName] = useState(employee.firstName);
  const [lastName, setLastName] = useState(employee.lastName ?? "");
  const [email, setEmail] = useState(employee.email ?? "");
  const [phone, setPhone] = useState(employee.phone);
  const [designation, setDesignation] = useState(employee.designation);
  const [employmentType, setEmploymentType] = useState<EmployeeRecord["employmentType"]>(employee.employmentType);
  const [status, setStatus] = useState<EmployeeRecord["status"]>(employee.status);
  const [joiningDate, setJoiningDate] = useState(employee.joiningDate);
  const [departmentId, setDepartmentId] = useState(String(employee.departmentId));
  const [locationId, setLocationId] = useState(String(employee.locationId));
  const [defaultShiftId, setDefaultShiftId] = useState(employee.defaultShiftId ? String(employee.defaultShiftId) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await updateEmployee({
        employeeId: employee._id,
        firstName,
        lastName: lastName.trim() || undefined,
        email: email.trim() || undefined,
        phone,
        designation,
        employmentType,
        status,
        joiningDate,
        departmentId: departmentId as any,
        locationId: locationId as any,
        defaultShiftId: defaultShiftId ? defaultShiftId as any : null,
      });
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message.replaceAll("_", " ").toLowerCase() : "Unable to update employee. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15, 23, 42, .62)", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(8px, 2vw, 24px)" }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-edit-title"
        style={{ width: "min(100%, 980px)", maxHeight: "min(94vh, 900px)", overflow: "auto", background: "var(--surface, #fff)", color: "var(--text-primary, #172033)", borderRadius: 18, boxShadow: "0 24px 80px rgba(0,0,0,.28)" }}
      >
        <div style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "20px 24px", background: "var(--surface, #fff)", borderBottom: "1px solid var(--border, #e5e7eb)" }}>
          <div>
            <p className="t-caption text-tertiary" style={{ margin: 0 }}>EMPLOYEE PROFILE · {employee.employeeCode}</p>
            <h2 id="employee-edit-title" className="t-h2" style={{ margin: "4px 0 0" }}>Edit employee</h2>
            <p className="t-caption text-tertiary" style={{ margin: "4px 0 0" }}>Update employment and contact information.</p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} disabled={saving} aria-label="Close employee editor"><X size={19}/></button>
        </div>

        <form onSubmit={submit}>
          <div style={{ padding: 24 }}>
            {options === undefined ? <p className="sub">Loading departments, locations and shifts…</p> : (
              <>
                <div style={{ marginBottom: 22 }}>
                  <h3 className="t-h3" style={{ margin: "0 0 14px" }}>Personal information</h3>
                  <div className="policy-form-grid" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
                    <label className="policy-field">First name *<input className="input" required maxLength={80} value={firstName} onChange={event => setFirstName(event.target.value)} /></label>
                    <label className="policy-field">Last name<input className="input" maxLength={80} value={lastName} onChange={event => setLastName(event.target.value)} /></label>
                    <label className="policy-field">Email address<input className="input" type="email" maxLength={254} value={email} onChange={event => setEmail(event.target.value)} /></label>
                    <label className="policy-field">Phone number *<input className="input" required maxLength={20} value={phone} onChange={event => setPhone(event.target.value)} /></label>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border, #e5e7eb)", paddingTop: 22, marginBottom: 22 }}>
                  <h3 className="t-h3" style={{ margin: "0 0 14px" }}>Employment details</h3>
                  <div className="policy-form-grid" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
                    <label className="policy-field">Designation *<input className="input" required maxLength={100} value={designation} onChange={event => setDesignation(event.target.value)} /></label>
                    <label className="policy-field">Employment type *<select className="input" value={employmentType} onChange={event => setEmploymentType(event.target.value as EmployeeRecord["employmentType"])}>{employmentTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label className="policy-field">Joining date *<input className="input" type="date" required value={joiningDate} onChange={event => setJoiningDate(event.target.value)} /></label>
                    <label className="policy-field">Employee status *<select className="input" value={status} onChange={event => setStatus(event.target.value as EmployeeRecord["status"])}>{employeeStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label className="policy-field">Department *<select className="input" required value={departmentId} onChange={event => setDepartmentId(event.target.value)}><option value="" disabled>Select department</option>{options.departments.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>
                    <label className="policy-field">Work location *<select className="input" required value={locationId} onChange={event => setLocationId(event.target.value)}><option value="" disabled>Select location</option>{options.locations.map(item => <option key={item._id} value={item._id}>{item.name}{item.locationType === "remote" ? " · Remote" : " · Physical"}</option>)}</select></label>
                    <label className="policy-field">Default shift<select className="input" value={defaultShiftId} onChange={event => setDefaultShiftId(event.target.value)}><option value="">No default shift</option>{options.shifts.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border, #e5e7eb)", paddingTop: 18 }}>
                  <p className="t-caption text-tertiary" style={{ margin: 0 }}>Employee code and historical records are read-only and will not be changed.</p>
                </div>
              </>
            )}
            {error && <p className="auth-error" role="alert" style={{ marginTop: 16 }}>{error}</p>}
          </div>

          <div style={{ position: "sticky", bottom: 0, display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px", background: "var(--surface, #fff)", borderTop: "1px solid var(--border, #e5e7eb)" }}>
            <button className="btn btn-outline" type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={saving || options === undefined || !departmentId || !locationId || !firstName.trim() || !phone.trim() || !designation.trim() || !joiningDate}><Save size={16}/>{saving ? "Saving…" : "Save changes"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
