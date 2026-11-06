"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Archive, FileText, Eye, Upload, X } from "lucide-react";
import { CreatableSelect } from "@/components/admin/creatable-select";

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const categories = ["General", "HR", "Attendance", "Leave", "Safety", "Wages", "Training", "Other"];
const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];

export function CompanyDocumentManagement() {
  const documents = useQuery(api.companyDocuments.listForAdmin, {});
  const generateUploadUrl = useMutation(api.companyDocuments.generateUploadUrl);
  const createDocument = useMutation(api.companyDocuments.create);
  const archiveDocument = useMutation(api.companyDocuments.archive);
  const customCategories = useQuery(api.adminOptions.listOptions, { fieldKey: "document_category" });
  const createCategory = useMutation(api.adminOptions.createOption);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState("");
  const [previewId, setPreviewId] = useState<Id<"companyDocuments"> | null>(null);

  function selectFile(candidate?: File) {
    if (!candidate) return;
    if (!allowedTypes.includes(candidate.type)) {
      setFile(null);
      setMessage("Only PDF, JPG and PNG files are supported.");
      return;
    }
    if (candidate.size <= 0 || candidate.size > MAX_FILE_BYTES) {
      setFile(null);
      setMessage("The file must be smaller than or equal to 15 MB.");
      return;
    }
    setMessage("");
    setFile(candidate);
  }

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !file) {
      setMessage("Enter a document title and choose a file.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const url = await generateUploadUrl({});
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      if (!response.ok) throw new Error("The file upload failed. Please try again.");
      const result = await response.json() as { storageId: string };
      const newId = await createDocument({
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
      setPreviewId(newId);
      setMessage("Document uploaded and published to all active employees.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to upload the document.");
    } finally {
      setBusy(false);
    }
  }

  if (documents === undefined) return <section className="sec"><p className="sub">Loading company documents…</p></section>;
  const preview = documents.find(item => item._id === previewId);

  return <section className="sec">
    <div className="page-head"><div><h2 className="t-h1" style={{ fontSize: 22 }}>Company documents</h2><p className="sub">Publish shared documents for all active employees.</p></div></div>
    <div className="panel">
      <div className="panel-head"><span className="t-h3">Upload a document</span><span className="badge badge-neutral">PDF, JPG, PNG · Max 15 MB</span></div>
      <form className="panel-body" onSubmit={upload} style={{ display: "grid", gap: 14 }}>
        <label className="policy-field">Document title<input className="input" value={title} maxLength={160} onChange={event => setTitle(event.target.value)} placeholder="e.g. Employee handbook" required /></label>
        <CreatableSelect label="Category" value={category} options={[...new Set([...categories,...(customCategories??[]).map(item=>item.label)])].map(item=>({value:item,label:item}))} placeholder="Select category" onChange={setCategory} createLabel="Create document category" onCreate={async name=>createCategory({fieldKey:"document_category",name})}/>
        <label className="policy-field">Description (optional)<textarea className="input" rows={2} value={description} onChange={event => setDescription(event.target.value)} placeholder="Briefly describe this document" /></label>
        <div
          role="button"
          tabIndex={0}
          onClick={event => { if ((event.target as HTMLElement).closest("button,input")) return; (document.getElementById("company-document-file") as HTMLInputElement | null)?.click(); }}
          onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); (document.getElementById("company-document-file") as HTMLInputElement | null)?.click(); } }}
          className={"company-doc-dropzone" + (dragging ? " is-dragging" : "") + (file ? " has-file" : "")}
          onDragEnter={event => { event.preventDefault(); setDragging(true); }}
          onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; setDragging(true); }}
          onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
          onDrop={event => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files?.[0]); }}
        >
          <input id="company-document-file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={event => selectFile(event.target.files?.[0])} />
          <Upload size={24} />
          <strong>{file ? file.name : "Drag and drop a document here"}</strong>
          <span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · Ready to upload` : "or click to browse · PDF, JPG or PNG · up to 15 MB"}</span>
          {file && <button type="button" className="btn btn-outline btn-sm" onClick={event => { event.stopPropagation(); setFile(null); const input = document.getElementById("company-document-file") as HTMLInputElement | null; if (input) input.value = ""; }}>Remove file</button>}
        </div>
        <div><button className="btn btn-primary" type="submit" disabled={busy || !file}>{busy ? "Uploading…" : "Upload and publish"}</button></div>
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
          <button className="icon-btn" title="Preview document" aria-label={"Preview " + item.title} onClick={() => setPreviewId(item._id)}><Eye size={16} /></button>
          {item.status === "published" && <button className="icon-btn" title="Archive document" aria-label={"Archive " + item.title} onClick={async () => { try { await archiveDocument({ documentId: item._id }); setMessage("Document archived and hidden from employees."); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to archive document."); } }}><Archive size={16} /></button>}
        </div>)}
      </div>
    </div>
    {preview && preview.url && <div className="panel" style={{ marginTop: 20 }}>
      <div className="panel-head"><div><span className="t-h3">Document preview</span><p className="sub" style={{ margin: "4px 0 0" }}>{preview.title} · {preview.originalFileName}</p></div><button className="icon-btn" aria-label="Close preview" title="Close preview" onClick={() => setPreviewId(null)}><X size={17} /></button></div>
      <div className="panel-body">
        {preview.mimeType === "application/pdf"
          ? <iframe title={preview.title} src={preview.url} className="company-doc-preview-frame" />
          : <div className="company-doc-image-preview"><img src={preview.url} alt={preview.title} /></div>}
        <a className="policy-open-link" href={preview.url} target="_blank" rel="noreferrer" style={{ marginTop: 12 }}>Open in new tab</a>
      </div>
    </div>}
  </section>;
}
