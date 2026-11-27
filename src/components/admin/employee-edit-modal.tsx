"use client";


import { getAdminErrorMessage } from "@/lib/admin-errors";
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
  dateOfBirth?: string;
  address?: { line1: string; line2?: string; city: string; district?: string; state: string; postalCode: string; country: string } | null;
  emergencyContact?: { name: string; relationship: string; phone: string } | null;
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
  const [dateOfBirth, setDateOfBirth] = useState(employee.dateOfBirth ?? "");
  const [addressLine1, setAddressLine1] = useState(employee.address?.line1 ?? "");
  const [addressLine2, setAddressLine2] = useState(employee.address?.line2 ?? "");
  const [addressCity, setAddressCity] = useState(employee.address?.city ?? "");
  const [addressDistrict, setAddressDistrict] = useState(employee.address?.district ?? "");
  const [addressState, setAddressState] = useState(employee.address?.state ?? "");
  const [addressPostalCode, setAddressPostalCode] = useState(employee.address?.postalCode ?? "");
  const [addressCountry, setAddressCountry] = useState(employee.address?.country ?? "India");
  const [emergencyName, setEmergencyName] = useState(employee.emergencyContact?.name ?? "");
  const [emergencyRelationship, setEmergencyRelationship] = useState(employee.emergencyContact?.relationship ?? "");
  const [emergencyPhone, setEmergencyPhone] = useState(employee.emergencyContact?.phone ?? "");
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
        dateOfBirth: dateOfBirth || undefined,
        address: [addressLine1, addressLine2, addressCity, addressDistrict, addressState, addressPostalCode].some(value => value.trim())
          ? { line1: addressLine1, line2: addressLine2, city: addressCity, district: addressDistrict, state: addressState, postalCode: addressPostalCode, country: addressCountry }
          : null,
        emergencyContact: [emergencyName, emergencyRelationship, emergencyPhone].some(value => value.trim())
          ? { name: emergencyName, relationship: emergencyRelationship, phone: emergencyPhone }
          : null,
        departmentId: departmentId as any,
        locationId: locationId as any,
        defaultShiftId: defaultShiftId ? defaultShiftId as any : null,
      });
      onSaved();
    } catch (cause) {
      setError(getAdminErrorMessage(cause, "Unable to update employee. Please try again."));
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
                    <label className="policy-field">Date of birth *<input className="input" type="date" required min="1900-01-01" max={new Date().toISOString().slice(0, 10)} value={dateOfBirth} onChange={event => setDateOfBirth(event.target.value)} /></label>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border, #e5e7eb)", paddingTop: 22, marginBottom: 22 }}>
                  <h3 className="t-h3" style={{ margin: "0 0 14px" }}>Residential address</h3>
                  <div className="policy-form-grid" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
                    <label className="policy-field">Address line 1<input className="input" maxLength={160} value={addressLine1} onChange={event => setAddressLine1(event.target.value)} /></label>
                    <label className="policy-field">Address line 2<input className="input" maxLength={160} value={addressLine2} onChange={event => setAddressLine2(event.target.value)} /></label>
                    <label className="policy-field">City<input className="input" maxLength={80} value={addressCity} onChange={event => setAddressCity(event.target.value)} /></label>
                    <label className="policy-field">District<input className="input" maxLength={80} value={addressDistrict} onChange={event => setAddressDistrict(event.target.value)} /></label>
                    <label className="policy-field">State<input className="input" maxLength={80} value={addressState} onChange={event => setAddressState(event.target.value)} /></label>
                    <label className="policy-field">Postal code<input className="input" maxLength={10} value={addressPostalCode} onChange={event => setAddressPostalCode(event.target.value)} /></label>
                    <label className="policy-field">Country<input className="input" maxLength={80} value={addressCountry} onChange={event => setAddressCountry(event.target.value)} /></label>
                  </div>
                  <p className="t-caption text-tertiary" style={{ marginTop: 8 }}>Leave every address field blank to clear the residential address. Partial addresses are rejected.</p>
                </div>

                <div style={{ borderTop: "1px solid var(--border, #e5e7eb)", paddingTop: 22, marginBottom: 22 }}>
                  <h3 className="t-h3" style={{ margin: "0 0 14px" }}>Emergency contact</h3>
                  <div className="policy-form-grid" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
                    <label className="policy-field">Contact name<input className="input" maxLength={100} value={emergencyName} onChange={event => setEmergencyName(event.target.value)} /></label>
                    <label className="policy-field">Relationship<input className="input" maxLength={60} value={emergencyRelationship} onChange={event => setEmergencyRelationship(event.target.value)} /></label>
                    <label className="policy-field">Phone number<input className="input" maxLength={20} value={emergencyPhone} onChange={event => setEmergencyPhone(event.target.value)} /></label>
                  </div>
                  <p className="t-caption text-tertiary" style={{ marginTop: 8 }}>Leave all emergency-contact fields blank to clear the contact. If supplied, all three fields are required.</p>
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
