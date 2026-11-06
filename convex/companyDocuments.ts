import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireIdentity } from "./lib/auth";

const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    category: v.string(),
    description: v.optional(v.string()),
    storageId: v.id("_storage"),
    originalFileName: v.string(),
    mimeType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const title = args.title.trim();
    const category = args.category.trim();
    const fileName = args.originalFileName.trim();
    if (!title || title.length > 160) throw new Error("DOCUMENT_TITLE_INVALID");
    if (!category || category.length > 80) throw new Error("DOCUMENT_CATEGORY_INVALID");
    if (!fileName || fileName.length > 255) throw new Error("DOCUMENT_FILE_INVALID");
    if (!ALLOWED_MIME_TYPES.includes(args.mimeType)) throw new Error("UNSUPPORTED_DOCUMENT_TYPE");
    if (!Number.isInteger(args.fileSize) || args.fileSize <= 0 || args.fileSize > MAX_DOCUMENT_BYTES) {
      throw new Error("DOCUMENT_FILE_TOO_LARGE");
    }
    const metadata = await ctx.storage.getMetadata(args.storageId);
    if (!metadata || metadata.size !== args.fileSize || metadata.contentType !== args.mimeType) {
      throw new Error("DOCUMENT_UPLOAD_INVALID");
    }
    const now = Date.now();
    const documentId = await ctx.db.insert("companyDocuments", {
      organizationId: admin.organizationId,
      title,
      category,
      description: args.description?.trim() || undefined,
      storageId: args.storageId,
      originalFileName: fileName,
      mimeType: args.mimeType,
      fileSize: args.fileSize,
      uploadedBy: admin._id,
      uploadedAt: now,
      status: "published",
    });
    await ctx.db.insert("auditLogs", {
      organizationId: admin.organizationId,
      actorUserId: admin._id,
      action: "company_document.published",
      entityType: "companyDocument",
      entityId: String(documentId),
      metadata: { title, category, originalFileName: fileName },
      createdAt: now,
    });
    return documentId;
  },
});

export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    return ctx.db.query("companyDocuments")
      .withIndex("by_org_uploaded", q => q.eq("organizationId", admin.organizationId))
      .order("desc")
      .collect();
  },
});

export const archive = mutation({
  args: { documentId: v.id("companyDocuments") },
  handler: async (ctx, { documentId }) => {
    const admin = await requireAdmin(ctx);
    const document = await ctx.db.get(documentId);
    if (!document || document.organizationId !== admin.organizationId) throw new Error("DOCUMENT_NOT_FOUND");
    if (document.status === "archived") return { success: true };
    await ctx.db.patch(documentId, { status: "archived" });
    await ctx.db.insert("auditLogs", {
      organizationId: admin.organizationId,
      actorUserId: admin._id,
      action: "company_document.archived",
      entityType: "companyDocument",
      entityId: String(documentId),
      metadata: { title: document.title },
      createdAt: Date.now(),
    });
    return { success: true };
  },
});

export const listPublishedForEmployee = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireIdentity(ctx);
    if (user.role !== "employee" && user.role !== "superadmin") return [];
    if (!user.employeeId) return [];
    const employee = await ctx.db.get(user.employeeId);
    if (!employee || employee.organizationId !== user.organizationId || employee.status !== "active") return [];
    const documents = await ctx.db.query("companyDocuments")
      .withIndex("by_org_status", q => q.eq("organizationId", user.organizationId).eq("status", "published"))
      .order("desc")
      .collect();
    return Promise.all(documents.map(async document => ({
      _id: document._id,
      title: document.title,
      category: document.category,
      description: document.description,
      originalFileName: document.originalFileName,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      uploadedAt: document.uploadedAt,
      url: await ctx.storage.getUrl(document.storageId),
    })));
  },
});
