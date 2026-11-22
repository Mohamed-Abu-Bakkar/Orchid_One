import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity, requireOrganizationAdmin } from "./lib/auth";

const timing = v.object({ startTime: v.string(), endTime: v.string() });
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function validate(args: { date: string; timings: { startTime: string; endTime: string }[]; tamilMonth?: string; tamilDay?: string; notes?: string }) {
  if (!datePattern.test(args.date)) throw new Error("INVALID_DATE");
  const parsed = new Date(args.date + "T00:00:00Z");
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== args.date) throw new Error("INVALID_DATE");
  if (args.timings.length > 8) throw new Error("TOO_MANY_TIMINGS");
  for (const slot of args.timings) {
    if (!timePattern.test(slot.startTime) || !timePattern.test(slot.endTime) || slot.startTime >= slot.endTime) throw new Error("INVALID_TIME_RANGE");
  }
  if ((args.tamilMonth?.length ?? 0) > 40 || (args.tamilDay?.length ?? 0) > 40 || (args.notes?.length ?? 0) > 1000) throw new Error("FIELD_TOO_LONG");
}

export const listForAdmin = query({
  args: { fromDate: v.string(), toDate: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireOrganizationAdmin(ctx);
    if (!datePattern.test(args.fromDate) || !datePattern.test(args.toDate) || args.fromDate > args.toDate) throw new Error("INVALID_DATE_RANGE");
    return ctx.db.query("muhurthamDates")
      .withIndex("by_org_date", q => q.eq("organizationId", admin.organizationId).gte("date", args.fromDate).lte("date", args.toDate))
      .order("asc").collect();
  },
});

export const listPublished = query({
  args: { fromDate: v.string(), toDate: v.string() },
  handler: async (ctx, args) => {
    const user = await requireIdentity(ctx);
    if (!datePattern.test(args.fromDate) || !datePattern.test(args.toDate) || args.fromDate > args.toDate) throw new Error("INVALID_DATE_RANGE");
    if (user.role === "employee") {
      if (!user.employeeId) return [];
      const employee = await ctx.db.get(user.employeeId);
      if (!employee || employee.organizationId !== user.organizationId || employee.status !== "active") return [];
    }
    return ctx.db.query("muhurthamDates")
      .withIndex("by_org_status_date", q => q.eq("organizationId", user.organizationId).eq("status", "published").gte("date", args.fromDate).lte("date", args.toDate))
      .order("asc").collect();
  },
});

export const save = mutation({
  args: {
    date: v.string(), tamilMonth: v.optional(v.string()), tamilDay: v.optional(v.string()),
    timings: v.array(timing), notes: v.optional(v.string()), status: v.union(v.literal("draft"), v.literal("published")),
    dateId: v.optional(v.id("muhurthamDates")),
  },
  handler: async (ctx, args) => {
    const admin = await requireOrganizationAdmin(ctx);
    validate(args);
    const tamilMonth = args.tamilMonth?.trim() || undefined;
    const tamilDay = args.tamilDay?.trim() || undefined;
    const notes = args.notes?.trim() || undefined;
    const now = Date.now();
    if (args.dateId) {
      const existing = await ctx.db.get(args.dateId);
      if (!existing || existing.organizationId !== admin.organizationId) throw new Error("MUHURTHAM_NOT_FOUND");
      const duplicate = await ctx.db.query("muhurthamDates").withIndex("by_org_date", q => q.eq("organizationId", admin.organizationId).eq("date", args.date)).unique();
      if (duplicate && duplicate._id !== args.dateId) throw new Error("DATE_ALREADY_EXISTS");
      await ctx.db.patch(args.dateId, { date: args.date, tamilMonth, tamilDay, timings: args.timings, notes, status: args.status, updatedBy: admin._id, updatedAt: now });
      await ctx.db.insert("auditLogs", { organizationId: admin.organizationId, actorUserId: admin._id, action: "muhurtham.updated", entityType: "muhurthamDate", entityId: String(args.dateId), metadata: { date: args.date, status: args.status }, createdAt: now });
      return args.dateId;
    }
    const duplicate = await ctx.db.query("muhurthamDates").withIndex("by_org_date", q => q.eq("organizationId", admin.organizationId).eq("date", args.date)).unique();
    if (duplicate) throw new Error("DATE_ALREADY_EXISTS");
    const id = await ctx.db.insert("muhurthamDates", { organizationId: admin.organizationId, date: args.date, tamilMonth, tamilDay, timings: args.timings, notes, status: args.status, createdBy: admin._id, updatedBy: admin._id, createdAt: now, updatedAt: now });
    await ctx.db.insert("auditLogs", { organizationId: admin.organizationId, actorUserId: admin._id, action: "muhurtham.created", entityType: "muhurthamDate", entityId: String(id), metadata: { date: args.date, status: args.status }, createdAt: now });
    return id;
  },
});

export const remove = mutation({
  args: { dateId: v.id("muhurthamDates") },
  handler: async (ctx, { dateId }) => {
    const admin = await requireOrganizationAdmin(ctx);
    const record = await ctx.db.get(dateId);
    if (!record || record.organizationId !== admin.organizationId) throw new Error("MUHURTHAM_NOT_FOUND");
    await ctx.db.delete(dateId);
    await ctx.db.insert("auditLogs", { organizationId: admin.organizationId, actorUserId: admin._id, action: "muhurtham.deleted", entityType: "muhurthamDate", entityId: String(dateId), metadata: { date: record.date }, createdAt: Date.now() });
    return { success: true };
  },
});
