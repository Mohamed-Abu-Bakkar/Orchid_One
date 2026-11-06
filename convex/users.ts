import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

const statusValidator = v.union(
  v.literal("active"),
  v.literal("rejected"),
  v.literal("suspended"),
);

export const listPendingUsers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 100);
    const users = await ctx.db
      .query("users")
      .withIndex("by_org", (q) => q.eq("organizationId", actor.organizationId))
      .filter((q) => q.eq(q.field("accountStatus"), "pending"))
      .order("desc")
      .take(limit);
    return users.map((user) => ({
      _id: user._id,
      fullName: user.fullName ?? "New user",
      email: user.email ?? "",
      createdAt: user.createdAt,
      role: user.role,
    }));
  },
});

export const reviewAccount = mutation({
  args: {
    userId: v.id("users"),
    status: statusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);
    if (actor._id === args.userId) throw new Error("SELF_APPROVAL_NOT_ALLOWED");

    const target = await ctx.db.get(args.userId);
    if (!target || target.organizationId !== actor.organizationId) {
      throw new Error("USER_NOT_FOUND");
    }
    if (target.accountStatus !== "pending") {
      throw new Error("ACCOUNT_NOT_PENDING");
    }

    const now = Date.now();
    await ctx.db.patch(target._id, {
      accountStatus: args.status,
      isActive: args.status === "active",
    });
    await ctx.db.insert("auditLogs", {
      organizationId: actor.organizationId,
      actorUserId: actor._id,
      action: "user.account_reviewed",
      entityType: "user",
      entityId: String(target._id),
      metadata: { previousStatus: target.accountStatus, newStatus: args.status },
      createdAt: now,
    });
    return null;
  },
});

export const getMyAccount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", identity.subject))
      .unique();
    if (!user) return null;
    const status = user.accountStatus ?? (user.isActive ? "active" : "pending");
    return { status, role: user.role, employeeId: user.employeeId };
  },
});
