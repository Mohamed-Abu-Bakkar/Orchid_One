import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireIdentity } from "./lib/auth";

const MAX_POLICY_BYTES = 15 * 1024 * 1024;
const policyCategory = v.union(
  v.literal("hr_employment"), v.literal("attendance"), v.literal("leave"),
  v.literal("working_hours"), v.literal("conduct"), v.literal("safety"),
  v.literal("wages_compensation"), v.literal("other")
);

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireSuperadmin(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

export const createDraft = mutation({
  args: {
    title: v.string(),
    category: policyCategory,
    description: v.optional(v.string()),
    effectiveFrom: v.optional(v.string()),
    storageId: v.id("_storage"),
    originalFileName: v.string(),
    mimeType: v.literal("application/pdf"),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const admin = await requireSuperadmin(ctx);
    const title = args.title.trim();
    const fileName = args.originalFileName.trim();
    if (!title || title.length > 160) throw new Error("POLICY_TITLE_INVALID");
    if (!fileName || fileName.length > 255 || !fileName.toLowerCase().endsWith(".pdf")) throw new Error("POLICY_FILE_INVALID");
    if (args.fileSize <= 0 || args.fileSize > MAX_POLICY_BYTES) throw new Error("POLICY_FILE_TOO_LARGE");
    const stored = await ctx.db.system.get(args.storageId);
    if (!stored || stored.size !== args.fileSize || stored.contentType !== "application/pdf") throw new Error("POLICY_UPLOAD_INVALID");
    const latest = await ctx.db.query("policies")
      .withIndex("by_org_title_version", q => q.eq("organizationId", admin.organizationId).eq("title", title))
      .order("desc").first();
    const now = Date.now();
    return ctx.db.insert("policies", {
      organizationId: admin.organizationId, title, category: args.category,
      description: args.description?.trim() || undefined, version: (latest?.version ?? 0) + 1,
      status: "draft", effectiveFrom: args.effectiveFrom, createdBy: admin._id,
      storageId: args.storageId, originalFileName: fileName, mimeType: "application/pdf",
      fileSize: args.fileSize, createdAt: now,
    });
  },
});

export const publish = mutation({
  args: { policyId: v.id("policies") },
  handler: async (ctx, { policyId }) => {
    const admin = await requireSuperadmin(ctx);
    const policy = await ctx.db.get(policyId);
    if (!policy || policy.organizationId !== admin.organizationId) throw new Error("POLICY_NOT_FOUND");
    if (policy.status !== "draft") throw new Error("POLICY_NOT_DRAFT");
    const now = Date.now();
    await ctx.db.patch(policyId, { status: "published", publishedAt: now });
    await ctx.db.insert("auditLogs", {
      organizationId: admin.organizationId, actorUserId: admin._id,
      action: "policy.published", entityType: "policy", entityId: String(policyId),
      metadata: { title: policy.title, version: policy.version }, createdAt: now,
    });
    return { success: true };
  },
});

export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    return ctx.db.query("policies").withIndex("by_org_status", q => q.eq("organizationId", admin.organizationId))
      .order("desc").collect();
  },
});

export const getPolicyFileUrl = query({
  args: { policyId: v.id("policies") },
  handler: async (ctx, { policyId }) => {
    const user = await requireIdentity(ctx);
    const policy = await ctx.db.get(policyId);
    if (!policy || policy.organizationId !== user.organizationId) return null;
    if (policy.status !== "published" && user.role === "employee") return null;
    return ctx.storage.getUrl(policy.storageId);
  },
});

export const listPublishedForEmployee = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireIdentity(ctx);
    if ((user.role !== "employee" && user.role !== "superadmin") || !user.employeeId) return [];
    const employee = await ctx.db.get(user.employeeId);
    if (!employee || employee.organizationId !== user.organizationId || employee.status !== "active") return [];
    const policies = await ctx.db.query("policies")
      .withIndex("by_org_status", q => q.eq("organizationId", user.organizationId).eq("status", "published"))
      .order("desc").collect();
    const acknowledgements = await ctx.db.query("policyAcknowledgements")
      .withIndex("by_employee_policy", q => q.eq("employeeId", employee._id)).collect();
    const acknowledged = new Set(acknowledgements.map(item => String(item.policyId)));
    return policies.map(policy => ({
      _id: policy._id, title: policy.title, category: policy.category,
      description: policy.description, version: policy.version,
      effectiveFrom: policy.effectiveFrom, publishedAt: policy.publishedAt,
      acknowledged: acknowledged.has(String(policy._id)),
      originalFileName: policy.originalFileName,
      fileSize: policy.fileSize,
    }));
  },
});

export const acknowledge = mutation({
  args: { policyId: v.id("policies") },
  handler: async (ctx, { policyId }) => {
    const user = await requireIdentity(ctx);
    if ((user.role !== "employee" && user.role !== "superadmin") || !user.employeeId) throw new Error("EMPLOYEE_PROFILE_REQUIRED");
    const employee = await ctx.db.get(user.employeeId);
    if (!employee || employee.organizationId !== user.organizationId || employee.status !== "active") throw new Error("EMPLOYEE_INACTIVE");
    const policy = await ctx.db.get(policyId);
    if (!policy || policy.organizationId !== user.organizationId || policy.status !== "published") throw new Error("POLICY_UNAVAILABLE");
    const existing = await ctx.db.query("policyAcknowledgements")
      .withIndex("by_employee_policy", q => q.eq("employeeId", employee._id).eq("policyId", policyId)).unique();
    if (existing) return { acknowledged: true, alreadyAcknowledged: true, acknowledgedAt: existing.acknowledgedAt };
    const acknowledgedAt = Date.now();
    await ctx.db.insert("policyAcknowledgements", {
      organizationId: user.organizationId, policyId, policyVersion: policy.version,
      employeeId: employee._id, userId: user._id, acknowledgedAt,
    });
    await ctx.db.insert("auditLogs", {
      organizationId: user.organizationId, actorUserId: user._id,
      action: "policy.acknowledged", entityType: "policy", entityId: String(policyId),
      metadata: { title: policy.title, version: policy.version }, createdAt: acknowledgedAt,
    });
    return { acknowledged: true, alreadyAcknowledged: false, acknowledgedAt };
  },
});

export const acknowledgementReport = query({
  args: { policyId: v.id("policies") },
  handler: async (ctx, { policyId }) => {
    const admin = await requireAdmin(ctx);
    const policy = await ctx.db.get(policyId);
    if (!policy || policy.organizationId !== admin.organizationId) throw new Error("POLICY_NOT_FOUND");
    const employees = await ctx.db.query("employees")
      .withIndex("by_org_status", q => q.eq("organizationId", admin.organizationId).eq("status", "active"))
      .collect();
    const acknowledgements = await ctx.db.query("policyAcknowledgements")
      .withIndex("by_policy", q => q.eq("policyId", policyId)).collect();
    const byEmployee = new Map(acknowledgements.map(item => [String(item.employeeId), item]));
    return employees.map(employee => {
      const acknowledgement = byEmployee.get(String(employee._id));
      return {
        employeeId: employee._id, employeeCode: employee.employeeCode,
        name: [employee.firstName, employee.lastName].filter(Boolean).join(" "),
        acknowledgedAt: acknowledgement?.acknowledgedAt ?? null,
      };
    });
  },
});

export const archive = mutation({
  args: { policyId: v.id("policies") },
  handler: async (ctx, { policyId }) => {
    const admin = await requireSuperadmin(ctx);
    const policy = await ctx.db.get(policyId);
    if (!policy || policy.organizationId !== admin.organizationId) throw new Error("POLICY_NOT_FOUND");
    if (policy.status === "archived") return { success: true };
    await ctx.db.patch(policyId, { status: "archived" });
    await ctx.db.insert("auditLogs", {
      organizationId: admin.organizationId, actorUserId: admin._id,
      action: "policy.archived", entityType: "policy", entityId: String(policyId),
      metadata: { title: policy.title, version: policy.version }, createdAt: Date.now(),
    });
    return { success: true };
  },
});
