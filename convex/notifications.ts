import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./lib/auth";

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireIdentity(ctx);
    const rows = await ctx.db.query("notifications")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .order("desc")
      .take(50);
    return {
      items: rows,
      unreadCount: rows.filter(row => row.readAt === undefined).length,
    };
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    const user = await requireIdentity(ctx);
    const row = await ctx.db.get(notificationId);
    if (!row || row.userId !== user._id || row.organizationId !== user.organizationId) {
      throw new Error("NOTIFICATION_NOT_FOUND");
    }
    if (row.readAt === undefined) await ctx.db.patch(row._id, { readAt: Date.now() });
    return { markedRead: true };
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireIdentity(ctx);
    const rows = await ctx.db.query("notifications")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .order("desc")
      .take(500);
    const now = Date.now();
    let updated = 0;
    for (const row of rows) {
      if (row.organizationId === user.organizationId && row.readAt === undefined) {
        await ctx.db.patch(row._id, { readAt: now });
        updated++;
      }
    }
    return { updated, truncated: rows.length === 500 };
  },
});
