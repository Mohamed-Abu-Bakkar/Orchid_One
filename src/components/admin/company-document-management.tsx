"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Archive, FileText, Upload } from "lucide-react";

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const categories = ["General", "HR", "Attendance", "Leave", "Safety", "Wages", "Training", "Other"];

export function CompanyDocumentManagement() {
  const documents = useQuery(api.companyDocuments.listForAdmin, {});
  const generateUploadUrl = useMutation(api.companyDocuments.generateUploadUrl);
  const createDocument = useMutation(api.companyDocuments.create);
  const archiveDocument = useMutation(api.companyDocuments.archive);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !file) {
      setMessage("Enter a document title and choose a file.");
      return;
    }
    if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
      setMessage("Only PDF, JPG and PNG files are supported.");
      return;
    }
    if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
      setMessage("The file must be smaller than or equal to 15 MB.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const url = await generateUploadUrl({});
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      if (!response.ok) throw new Error("The file upload failed. Please try again.");
      const result = await response.json() as { storageId: string };
      await createDocument({
        title: title.trim(),
        category,
        description: description.trim() || undefined,
        storageId: result.storageId as Id<"_storage">,
        originalFileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      });
      setTitle("");
      setCategory("General");
      setDescription("");
      setFile(null);
      const input = document.getElementById("company-document-file") as HTMLInputElement | null;
      if (input) input.value = "";
      setMessage("Document uploaded and published to all active employees.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to upload the document.");
    } finally {
      setBusy(false);
    }
  }

  if (documents === undefined) return <section className="sec"><p className="sub">Loading company documents…</p></section>;

  return <section className="sec">
    <div className="page-head"><div><h2 className="t-h1" style={{ fontSize: 22 }}>Company documents</h2><p className="sub">Publish shared documents for all active employees.</p></div></div>
    <div className="panel">
      <div className="panel-head"><span className="t-h3">Upload a document</span><span className="badge badge-neutral">PDF, JPG, PNG · Max 15 MB</span></div>
      <form className="panel-body" onSubmit={upload} style={{ display: "grid", gap: 14 }}>
        <label className="policy-field">Document title<input className="input" value={title} maxLength={160} onChange={event => setTitle(event.target.value)} placeholder="e.g. Employee handbook" required /></label>
        <label className="policy-field">Category<select className="input" value={category} onChange={event => setCategory(event.target.value)}>{categories.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="policy-field">Description (optional)<textarea className="input" rows={2} value={description} onChange={event => setDescription(event.target.value)} placeholder="Briefly describe this document" /></label>
        <label className="policy-upload"><Upload size={19} /><span>{file ? file.name : "Choose a document"}</span><input id="company-document-file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={event => setFile(event.target.files?.[0] ?? null)} required /></label>
        <div><button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Uploading…" : "Upload and publish"}</button></div>
        {message && <p className="sub" role="status">{message}</p>}
      </form>
    </div>
    <div className="panel" style={{ marginTop: 20 }}>
      <div className="panel-head"><span className="t-h3">Uploaded documents</span><span className="t-caption text-tertiary">{documents.length} records</span></div>
      <div className="panel-body" style={{ display: "grid", gap: 12 }}>
        {documents.length === 0 && <p className="sub">No company documents uploaded yet.</p>}
        {documents.map(item => <div className="policy-row" key={item._id}>
          <div className="policy-file-icon"><FileText size={20} /></div>
          <div className="policy-row-main"><strong>{item.title}</strong><span>{item.category} · {item.originalFileName} · {(item.fileSize / 1024 / 1024).toFixed(2)} MB</span>{item.description && <small>{item.description}</small>}</div>
          <span className={"badge " + (item.status === "published" ? "badge-success" : "badge-neutral")}>{item.status}</span>
          {item.status === "published" && <button className="icon-btn" title="Archive document" aria-label={"Archive " + item.title} onClick={async () => { try { await archiveDocument({ documentId: item._id }); setMessage("Document archived and hidden from employees."); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to archive document."); } }}><Archive size={16} /></button>}
        </div>)}
      </div>
    </div>
  </section>;
}
