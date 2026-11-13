import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity, requireRole } from "./lib/auth";

function localDate(timestamp: number, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(timestamp));
}
function afterDeadline(timestamp: number, timeZone: string, deadline: string) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return Number(values.hour) * 60 + Number(values.minute) >= Number(deadline.slice(0, 2)) * 60 + Number(deadline.slice(3, 5));
}
async function isWorkingDay(ctx: any, organizationId: any, employee: any, date: string) {
  const calendars = await ctx.db.query("workCalendars").withIndex("by_org", (q: any) => q.eq("organizationId", organizationId)).collect();
  const calendar = calendars.find((item: any) => item.locationId === employee.locationId) ?? calendars.find((item: any) => !item.locationId);
  if ((calendar?.weeklyOffDays ?? []).includes(new Date(date + "T00:00:00Z").getUTCDay())) return false;
  const holidays = await ctx.db.query("holidays").withIndex("by_org_date", (q: any) => q.eq("organizationId", organizationId)).collect();
  return !holidays.some((holiday: any) => (!holiday.locationId || holiday.locationId === employee.locationId) && holiday.date <= date && (holiday.toDate ?? holiday.date) >= date);
}

export const myDailyFeedback = query({
  args: { workDate: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireIdentity(ctx);
    if (user.role !== "employee" || !user.employeeId) throw new Error("EMPLOYEE_ACCESS_REQUIRED");
    const employee = await ctx.db.get(user.employeeId);
    if (!employee || employee.organizationId !== user.organizationId || employee.status !== "active") throw new Error("EMPLOYEE_INACTIVE");
    const organization = await ctx.db.get(user.organizationId);
    if (!organization) throw new Error("ORGANIZATION_NOT_FOUND");
    const timeZone = organization.timezone || "Asia/Kolkata";
    const now = Date.now(), workDate = args.workDate ?? localDate(now, timeZone);
    const deadline = organization.feedbackDeadlineTime ?? "20:00";
    const record = await ctx.db.query("dailyEmployeeFeedback").withIndex("by_employee_date", q => q.eq("employeeId", employee._id).eq("workDate", workDate)).unique();
    const workingDay = await isWorkingDay(ctx, user.organizationId, employee, workDate);
    const reopen = await ctx.db.query("dailyFeedbackReopens").withIndex("by_employee_date", q => q.eq("employeeId", employee._id).eq("workDate", workDate)).unique();
    return { workDate, deadline, workingDay, locked: afterDeadline(now, timeZone, deadline) && !record?.reopenedAt && !reopen, record };
  },
});

export const submitDailyFeedback = mutation({
  args: { workDate: v.string(), completedWork: v.string(), achievements: v.string(), challenges: v.string(), selfRating: v.number(), nextDayPlan: v.string(), additionalFeedback: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireIdentity(ctx);
    if (user.role !== "employee" || !user.employeeId) throw new Error("EMPLOYEE_ACCESS_REQUIRED");
    const employee = await ctx.db.get(user.employeeId);
    if (!employee || employee.organizationId !== user.organizationId || employee.status !== "active") throw new Error("EMPLOYEE_INACTIVE");
    for (const [field, value] of Object.entries({ completedWork: args.completedWork, achievements: args.achievements, challenges: args.challenges, nextDayPlan: args.nextDayPlan })) {
      if (!value.trim()) throw new Error("FEEDBACK_FIELD_REQUIRED:" + field);
      if (value.trim().length > 3000) throw new Error("FEEDBACK_FIELD_TOO_LONG:" + field);
    }
    if (!Number.isInteger(args.selfRating) || args.selfRating < 1 || args.selfRating > 5) throw new Error("INVALID_SELF_RATING");
    const organization = await ctx.db.get(user.organizationId);
    if (!organization) throw new Error("ORGANIZATION_NOT_FOUND");
    const timeZone = organization.timezone || "Asia/Kolkata", today = localDate(Date.now(), timeZone);
    if (args.workDate !== today) throw new Error("FEEDBACK_DATE_MUST_BE_TODAY");
    if (!await isWorkingDay(ctx, user.organizationId, employee, today)) throw new Error("FEEDBACK_NOT_REQUIRED_NON_WORKING_DAY");
    const existing = await ctx.db.query("dailyEmployeeFeedback").withIndex("by_employee_date", q => q.eq("employeeId", employee._id).eq("workDate", today)).unique();
    const reopen = await ctx.db.query("dailyFeedbackReopens").withIndex("by_employee_date", q => q.eq("employeeId", employee._id).eq("workDate", today)).unique();
    if (existing && !existing.reopenedAt && !reopen) throw new Error("FEEDBACK_ALREADY_SUBMITTED_OR_LOCKED");
    const now = Date.now();
    if (afterDeadline(now, timeZone, organization.feedbackDeadlineTime ?? "20:00") && !existing?.reopenedAt && !reopen) throw new Error("FEEDBACK_DEADLINE_PASSED");
    const values = { completedWork: args.completedWork.trim(), achievements: args.achievements.trim(), challenges: args.challenges.trim(), selfRating: args.selfRating, nextDayPlan: args.nextDayPlan.trim(), additionalFeedback: args.additionalFeedback?.trim() || undefined, submittedAt: now, reopenedAt: undefined, reopenedBy: undefined, updatedAt: now };
    if (existing) await ctx.db.patch(existing._id, values);
    else await ctx.db.insert("dailyEmployeeFeedback", { organizationId: user.organizationId, employeeId: employee._id, workDate: today, ...values });
    if (reopen) await ctx.db.delete(reopen._id);
    await ctx.db.insert("auditLogs", { organizationId: user.organizationId, actorUserId: user._id, action: existing ? "performance.daily_feedback.resubmitted" : "performance.daily_feedback.submitted", entityType: "dailyEmployeeFeedback", entityId: existing ? String(existing._id) : String(employee._id) + ":" + today, metadata: { workDate: today, selfRating: args.selfRating }, createdAt: now });
    return { submitted: true };
  },
});

export const adminFeedbackWorkspace = query({
  args: { workDate: v.string() },
  handler: async (ctx, args) => {
    const viewer = await requireRole(ctx, ["superadmin", "supervisor"]);
    const organization = await ctx.db.get(viewer.organizationId);
    if (!organization) throw new Error("ORGANIZATION_NOT_FOUND");
    const employees = await ctx.db.query("employees").withIndex("by_org_status", q => q.eq("organizationId", viewer.organizationId).eq("status", "active")).collect();
    const visible = viewer.role === "superadmin" ? employees : employees.filter(employee => employee.reportingEmployeeId === viewer.employeeId || employee.approverEmployeeId === viewer.employeeId);
    const workingEmployees = await Promise.all(visible.map(async employee => ({ employee, workingDay: await isWorkingDay(ctx, viewer.organizationId, employee, args.workDate) })));
    const feedback = await ctx.db.query("dailyEmployeeFeedback").withIndex("by_org_date", q => q.eq("organizationId", viewer.organizationId).eq("workDate", args.workDate)).collect();
    const byEmployee = new Map(feedback.map(item => [String(item.employeeId), item]));
    const reopened = await ctx.db.query("dailyFeedbackReopens").withIndex("by_org_date", q => q.eq("organizationId", viewer.organizationId).eq("workDate", args.workDate)).collect();
    const reopenedEmployees = new Set(reopened.map(item => String(item.employeeId)));
    const deadline = organization.feedbackDeadlineTime ?? "20:00";
    const now = Date.now();
    return { deadline, employees: workingEmployees.filter(item => item.workingDay).map(({ employee }) => {
      const record = byEmployee.get(String(employee._id));
      return { employeeId: employee._id, employeeName: [employee.firstName, employee.lastName].filter(Boolean).join(" "), employeeCode: employee.employeeCode, departmentId: employee.departmentId, submitted: !!record, record: record ?? null, locked: afterDeadline(now, organization.timezone || "Asia/Kolkata", deadline) && !record?.reopenedAt && !reopenedEmployees.has(String(employee._id)) };
    }) };
  },
});

export const configureFeedbackDeadline = mutation({
  args: { deadline: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireRole(ctx, ["superadmin"]);
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(args.deadline)) throw new Error("INVALID_FEEDBACK_DEADLINE");
    await ctx.db.patch(admin.organizationId, { feedbackDeadlineTime: args.deadline, updatedAt: Date.now() });
    await ctx.db.insert("auditLogs", { organizationId: admin.organizationId, actorUserId: admin._id, action: "performance.feedback_deadline.updated", entityType: "organization", entityId: String(admin.organizationId), metadata: { deadline: args.deadline }, createdAt: Date.now() });
    return { saved: true };
  },
});

export const reopenDailyFeedback = mutation({
  args: { employeeId: v.id("employees"), workDate: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireRole(ctx, ["superadmin"]);
    const employee = await ctx.db.get(args.employeeId);
    if (!employee || employee.organizationId !== admin.organizationId) throw new Error("EMPLOYEE_NOT_FOUND");
    const record = await ctx.db.query("dailyEmployeeFeedback").withIndex("by_employee_date", q => q.eq("employeeId", employee._id).eq("workDate", args.workDate)).unique();
    const now = Date.now();
    if (record) {
      await ctx.db.patch(record._id, { reopenedAt: now, reopenedBy: admin._id, updatedAt: now });
    } else {
      const prior = await ctx.db.query("dailyFeedbackReopens").withIndex("by_employee_date", q => q.eq("employeeId", employee._id).eq("workDate", args.workDate)).unique();
      if (prior) await ctx.db.patch(prior._id, { reopenedAt: now, reopenedBy: admin._id });
      else await ctx.db.insert("dailyFeedbackReopens", { organizationId: admin.organizationId, employeeId: employee._id, workDate: args.workDate, reopenedAt: now, reopenedBy: admin._id });
    }
    await ctx.db.insert("auditLogs", { organizationId: admin.organizationId, actorUserId: admin._id, action: "performance.daily_feedback.reopened", entityType: "dailyEmployeeFeedback", entityId: String(record._id), metadata: { employeeId: String(employee._id), workDate: args.workDate }, createdAt: now });
    return { reopened: true };
  },
});
