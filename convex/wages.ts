import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireRole } from "./lib/auth";

const componentCategory = v.union(v.literal("earning"), v.literal("deduction"));
const compensationLine = v.object({
  componentId: v.id("salaryComponents"),
  amountPaise: v.number(),
  reason: v.optional(v.string()),
});

export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAdmin(ctx);
    const [employees, components] = await Promise.all([
      ctx.db.query("employees").withIndex("by_org_status", q => q.eq("organizationId", user.organizationId).eq("status", "active")).collect(),
      ctx.db.query("salaryComponents").withIndex("by_org", q => q.eq("organizationId", user.organizationId)).collect(),
    ]);
    const permanentEmployees = employees.filter(employee => employee.employmentType === "permanent");
    const compensation = await Promise.all(permanentEmployees.map(employee =>
      ctx.db.query("employeeCompensation").withIndex("by_employee_effective", q => q.eq("employeeId", employee._id)).order("desc").collect()
    ));
    const departments = await Promise.all([...new Set(permanentEmployees.map(e => e.departmentId))].map(id => ctx.db.get(id)));
    const departmentNames = new Map(departments.filter(Boolean).map(d => [d!._id, d!.name]));
    return {
      employees: permanentEmployees.map(employee => ({
        _id: employee._id,
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName ?? "",
        departmentName: departmentNames.get(employee.departmentId) ?? "—",
        compensation: compensation[permanentEmployees.indexOf(employee)].map(record => ({
          _id: record._id,
          effectiveFrom: record.effectiveFrom,
          fixedMonthlyAmountPaise: record.fixedMonthlyAmountPaise,
          components: record.components,
          createdAt: record.createdAt,
        })),
      })),
      components: components.sort((a,b) => a.name.localeCompare(b.name)),
    };
  },
});

export const createSalaryComponent = mutation({
  args: { name: v.string(), code: v.string(), category: componentCategory },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx);
    const name = args.name.trim();
    const code = args.code.trim().toUpperCase().replace(/\s+/g, "_");
    if (!name || name.length > 80) throw new Error("INVALID_COMPONENT_NAME");
    if (!/^[A-Z0-9_]{2,24}$/.test(code)) throw new Error("INVALID_COMPONENT_CODE");
    const existing = await ctx.db.query("salaryComponents").withIndex("by_org", q => q.eq("organizationId", user.organizationId)).collect();
    if (existing.some(item => item.code === code || item.name.toLowerCase() === name.toLowerCase())) throw new Error("DUPLICATE_COMPONENT");
    const now = Date.now();
    const id = await ctx.db.insert("salaryComponents", { organizationId: user.organizationId, name, code, category: args.category, isActive: true, createdBy: user._id, createdAt: now, updatedAt: now });
    await ctx.db.insert("auditLogs", { organizationId: user.organizationId, actorUserId: user._id, action: "salary_component.created", entityType: "salaryComponent", entityId: id, metadata: { name, code, category: args.category }, createdAt: now });
    return id;
  },
});

export const setSalaryComponentActive = mutation({
  args: { componentId: v.id("salaryComponents"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx);
    const component = await ctx.db.get(args.componentId);
    if (!component || component.organizationId !== user.organizationId) throw new Error("COMPONENT_NOT_FOUND");
    if (component.isActive === args.isActive) return;
    const now = Date.now();
    await ctx.db.patch(component._id, { isActive: args.isActive, updatedAt: now });
    await ctx.db.insert("auditLogs", { organizationId: user.organizationId, actorUserId: user._id, action: args.isActive ? "salary_component.activated" : "salary_component.archived", entityType: "salaryComponent", entityId: component._id, metadata: { name: component.name }, createdAt: now });
  },
});

export const saveEmployeeCompensation = mutation({
  args: {
    employeeId: v.id("employees"),
    effectiveFrom: v.string(),
    fixedMonthlyAmountPaise: v.optional(v.number()),
    components: v.array(compensationLine),
  },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx);
    const effectiveDate = new Date(args.effectiveFrom + "T00:00:00.000Z");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.effectiveFrom) || Number.isNaN(effectiveDate.getTime()) || effectiveDate.toISOString().slice(0, 10) !== args.effectiveFrom) throw new Error("INVALID_EFFECTIVE_DATE");
    const employee = await ctx.db.get(args.employeeId);
    if (!employee || employee.organizationId !== user.organizationId || employee.employmentType !== "permanent") throw new Error("PERMANENT_EMPLOYEE_REQUIRED");
    if (employee.status !== "active") throw new Error("EMPLOYEE_NOT_ACTIVE");
    if (args.fixedMonthlyAmountPaise !== undefined && (!Number.isSafeInteger(args.fixedMonthlyAmountPaise) || args.fixedMonthlyAmountPaise < 0)) throw new Error("INVALID_FIXED_AMOUNT");
    if (args.fixedMonthlyAmountPaise === undefined && args.components.length === 0) throw new Error("COMPENSATION_REQUIRED");
    const seen = new Set<string>();
    for (const line of args.components) {
      if (!Number.isSafeInteger(line.amountPaise) || line.amountPaise < 0) throw new Error("INVALID_COMPONENT_AMOUNT");
      if (seen.has(line.componentId)) throw new Error("DUPLICATE_COMPONENT_LINE");
      seen.add(line.componentId);
      const component = await ctx.db.get(line.componentId);
      if (!component || component.organizationId !== user.organizationId || !component.isActive) throw new Error("INVALID_SALARY_COMPONENT");
      if (component.category === "deduction" && !line.reason?.trim()) throw new Error("DEDUCTION_REASON_REQUIRED");
    }
    const prior = await ctx.db.query("employeeCompensation").withIndex("by_employee_effective", q => q.eq("employeeId", employee._id).eq("effectiveFrom", args.effectiveFrom)).first();
    if (prior) throw new Error("COMPENSATION_EFFECTIVE_DATE_EXISTS");
    const now = Date.now();
    const id = await ctx.db.insert("employeeCompensation", {
      organizationId: user.organizationId,
      employeeId: employee._id,
      effectiveFrom: args.effectiveFrom,
      fixedMonthlyAmountPaise: args.fixedMonthlyAmountPaise,
      components: args.components,
      createdBy: user._id,
      createdAt: now,
    });
    await ctx.db.insert("auditLogs", { organizationId: user.organizationId, actorUserId: user._id, action: "employee_compensation.created", entityType: "employeeCompensation", entityId: id, metadata: { employeeCode: employee.employeeCode, effectiveFrom: args.effectiveFrom, componentCount: args.components.length }, createdAt: now });
    return id;
  },
});


// Hourly wage configuration and daily payable-hours review.
function validDate(value: string) {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00.000Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function dateStartUtc(value: string, timeZone: string) {
  const [year, month, day] = value.split("-").map(Number);
  let guess = Date.UTC(year, month - 1, day);
  for (let attempt = 0; attempt < 4; attempt++) {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", second:"2-digit", hourCycle:"h23" }).formatToParts(new Date(guess));
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const represented = Date.UTC(Number(values.year), Number(values.month)-1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second));
    const diff = represented - Date.UTC(year, month-1, day);
    if (!diff) break;
    guess -= diff;
  }
  return guess;
}

export const hourlyAdminData = query({
  args: { fromDate: v.string(), toDate: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx);
    if (!validDate(args.fromDate) || !validDate(args.toDate) || args.fromDate > args.toDate) throw new Error("INVALID_WAGE_DATE_RANGE");
    if ((Date.parse(args.toDate + "T00:00:00Z") - Date.parse(args.fromDate + "T00:00:00Z")) / 86400000 > 30) throw new Error("WAGE_RANGE_LIMIT_31_DAYS");
    const org = await ctx.db.get(user.organizationId);
    if (!org) throw new Error("ORGANIZATION_NOT_FOUND");
    const hourlyEmployees = await ctx.db.query("employees").withIndex("by_org_status", q => q.eq("organizationId", user.organizationId).eq("status", "active")).collect();
    const employees = hourlyEmployees.filter(e => e.employmentType === "hourly");
    const [rates, reviews, events] = await Promise.all([
      ctx.db.query("wageRates").collect(),
      ctx.db.query("hourlyWageReviews").withIndex("by_org_date", q => q.eq("organizationId", user.organizationId).gte("workDate", args.fromDate).lte("workDate", args.toDate)).take(5001),
      ctx.db.query("attendanceEvents").withIndex("by_org_time", q => q.eq("organizationId", user.organizationId).gte("receivedAt", dateStartUtc(args.fromDate, org.timezone)).lt("receivedAt", dateStartUtc(new Date(Date.parse(args.toDate + "T00:00:00Z") + 86400000).toISOString().slice(0,10), org.timezone))).take(5001),
    ]);
    const employeeMap = new Map(employees.map(e => [String(e._id), e]));
    const employeeRates = rates.filter(rate => rate.organizationId === user.organizationId && rate.employmentType === "hourly" && rate.employeeId && employeeMap.has(String(rate.employeeId)));
    const latestRates = new Map<string, typeof employeeRates[number]>();
    for (const rate of employeeRates) {
      const key = String(rate.employeeId);
      const current = latestRates.get(key);
      if ((!current || rate.effectiveFrom > current.effectiveFrom) && rate.effectiveFrom <= args.toDate && (!rate.effectiveTo || rate.effectiveTo >= args.fromDate)) latestRates.set(key, rate);
    }
    const eventGroups = new Map<string, any[]>();
    for (const event of events) {
      if (!employeeMap.has(String(event.employeeId))) continue;
      const date = new Intl.DateTimeFormat("en-CA", { timeZone: org.timezone }).format(new Date(event.receivedAt));
      if (date < args.fromDate || date > args.toDate) continue;
      const key = String(event.employeeId) + ":" + date;
      const group = eventGroups.get(key) ?? [];
      group.push(event);
      eventGroups.set(key, group);
    }
    const reviewMap = new Map(reviews.map(review => [String(review.employeeId) + ":" + review.workDate, review]));
    const rows: any[] = [];
    for (const [key, dayEvents] of eventGroups) {
      const [employeeId, workDate] = key.split(":");
      const employee = employeeMap.get(employeeId);
      if (!employee) continue;
      dayEvents.sort((a,b) => a.receivedAt - b.receivedAt);
      let openIn: number | null = null, openBreak: number | null = null;
      let attendanceMs = 0, breakMs = 0, incomplete = false, pendingPunchReview = false;
      for (const event of dayEvents) {
        if (event.reviewStatus === "pending") pendingPunchReview = true;
        if (event.eventType === "check_in") {
          if (openIn !== null) incomplete = true;
          else openIn = event.receivedAt;
        } else if (event.eventType === "check_out") {
          if (openIn === null) incomplete = true;
          else { attendanceMs += Math.max(0, event.receivedAt - openIn); openIn = null; }
        } else if (event.eventType === "break_start") {
          if (openBreak !== null) incomplete = true;
          else openBreak = event.receivedAt;
        } else if (event.eventType === "break_end") {
          if (openBreak === null) incomplete = true;
          else { breakMs += Math.max(0, event.receivedAt - openBreak); openBreak = null; }
        }
      }
      if (openIn !== null || openBreak !== null) incomplete = true;
      const attendanceMinutes = Math.floor(attendanceMs / 60000);
      const breakMinutes = Math.floor(breakMs / 60000);
      const review = reviewMap.get(key);
      const rate = latestRates.get(employeeId);
      const regularMinutes = review?.status === "approved" ? review.approvedRegularMinutes ?? 0 : 0;
      const overtimeMinutes = review?.status === "approved" ? review.approvedOvertimeMinutes ?? 0 : 0;
      rows.push({
        employeeId: employee._id, employeeCode: employee.employeeCode,
        employeeName: [employee.firstName, employee.lastName].filter(Boolean).join(" "),
        departmentId: employee.departmentId, workDate, attendanceMinutes, breakMinutes,
        recordedWorkMinutes: Math.max(0, attendanceMinutes - breakMinutes),
        incomplete, pendingPunchReview,
        review: review ? { _id: review._id, status: review.status, suggestedRegularMinutes: review.suggestedRegularMinutes, suggestedOvertimeMinutes: review.suggestedOvertimeMinutes, supervisorReason: review.supervisorReason, approvedRegularMinutes: review.approvedRegularMinutes, approvedOvertimeMinutes: review.approvedOvertimeMinutes, reviewerNote: review.reviewerNote } : null,
        ratePaise: rate?.amountPaise ?? null, overtimeMultiplier: rate?.overtimeMultiplier ?? null,
        regularEarningsPaise: rate && review?.status === "approved" ? Math.round(regularMinutes * rate.amountPaise / 60) : null,
        overtimeEarningsPaise: rate && rate.overtimeMultiplier !== undefined && review?.status === "approved" ? Math.round(overtimeMinutes * rate.amountPaise / 60 * rate.overtimeMultiplier) : null,
      });
    }
    const departments = await Promise.all([...new Set(employees.map(e => e.departmentId))].map(id => ctx.db.get(id)));
    const names = new Map(departments.filter(Boolean).map(d => [String(d!._id), d!.name]));
    return {
      employees: employees.map(employee => ({ _id: employee._id, employeeCode: employee.employeeCode, name: [employee.firstName, employee.lastName].filter(Boolean).join(" "), departmentName: names.get(String(employee.departmentId)) ?? "—", rate: latestRates.get(String(employee._id)) ? { amountPaise: latestRates.get(String(employee._id))!.amountPaise, overtimeMultiplier: latestRates.get(String(employee._id))!.overtimeMultiplier, effectiveFrom: latestRates.get(String(employee._id))!.effectiveFrom } : null })),
      rows: rows.sort((a,b) => b.workDate.localeCompare(a.workDate) || a.employeeName.localeCompare(b.employeeName)),
      truncated: events.length > 5000 || reviews.length > 5000,
      timezone: org.timezone,
    };
  },
});

export const saveHourlyRate = mutation({
  args: { employeeId: v.id("employees"), amountPaise: v.number(), overtimeMultiplier: v.number(), effectiveFrom: v.string() },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["superadmin"]);
    if (!validDate(args.effectiveFrom) || !Number.isSafeInteger(args.amountPaise) || args.amountPaise <= 0 || !Number.isFinite(args.overtimeMultiplier) || args.overtimeMultiplier < 1 || args.overtimeMultiplier > 10) throw new Error("INVALID_HOURLY_RATE");
    const employee = await ctx.db.get(args.employeeId);
    if (!employee || employee.organizationId !== user.organizationId || employee.employmentType !== "hourly" || employee.status !== "active") throw new Error("ACTIVE_HOURLY_EMPLOYEE_REQUIRED");
    const existing = await ctx.db.query("wageRates").withIndex("by_employee_effective", q => q.eq("employeeId", employee._id).eq("effectiveFrom", args.effectiveFrom)).first();
    if (existing) throw new Error("WAGE_RATE_EFFECTIVE_DATE_EXISTS");
    const now = Date.now();
    const id = await ctx.db.insert("wageRates", { organizationId: user.organizationId, employeeId: employee._id, employmentType: "hourly", amountPaise: args.amountPaise, overtimeMultiplier: args.overtimeMultiplier, effectiveFrom: args.effectiveFrom, approvedBy: user._id, createdAt: now });
    await ctx.db.insert("auditLogs", { organizationId: user.organizationId, actorUserId: user._id, action: "hourly_wage_rate.created", entityType: "wageRate", entityId: String(id), metadata: { employeeCode: employee.employeeCode, amountPaise: args.amountPaise, overtimeMultiplier: args.overtimeMultiplier, effectiveFrom: args.effectiveFrom }, createdAt: now });
    return id;
  },
});

export const submitHourlyReview = mutation({
  args: { employeeId: v.id("employees"), workDate: v.string(), regularMinutes: v.number(), overtimeMinutes: v.number(), reason: v.string() },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["supervisor"]);
    if (!validDate(args.workDate) || !Number.isSafeInteger(args.regularMinutes) || args.regularMinutes < 0 || !Number.isSafeInteger(args.overtimeMinutes) || args.overtimeMinutes < 0 || !args.reason.trim()) throw new Error("INVALID_HOURLY_REVIEW");
    const employee = await ctx.db.get(args.employeeId);
    if (!employee || employee.organizationId !== user.organizationId || employee.employmentType !== "hourly" || employee.status !== "active") throw new Error("ACTIVE_HOURLY_EMPLOYEE_REQUIRED");
    const org = await ctx.db.get(user.organizationId);
    if (!org) throw new Error("ORGANIZATION_NOT_FOUND");
    const start = dateStartUtc(args.workDate, org.timezone);
    const next = dateStartUtc(new Date(Date.parse(args.workDate + "T00:00:00Z") + 86400000).toISOString().slice(0,10), org.timezone);
    const events = await ctx.db.query("attendanceEvents").withIndex("by_employee_time", q => q.eq("employeeId", employee._id).gte("receivedAt", start).lt("receivedAt", next)).collect();
    if (!events.length || events.some(event => event.reviewStatus === "pending")) throw new Error("ATTENDANCE_MISSING_OR_PENDING_REVIEW");
    const prior = await ctx.db.query("hourlyWageReviews").withIndex("by_employee_date", q => q.eq("employeeId", employee._id).eq("workDate", args.workDate)).first();
    if (prior?.status === "approved") throw new Error("HOURLY_REVIEW_ALREADY_APPROVED");
    if (prior) throw new Error("HOURLY_REVIEW_ALREADY_SUBMITTED");
    const now = Date.now();
    const id = await ctx.db.insert("hourlyWageReviews", { organizationId: user.organizationId, employeeId: employee._id, workDate: args.workDate, recordedWorkMinutes: 0, recordedBreakMinutes: 0, suggestedRegularMinutes: args.regularMinutes, suggestedOvertimeMinutes: args.overtimeMinutes, supervisorReason: args.reason.trim(), status: "pending", submittedBy: user._id, submittedAt: now });
    await ctx.db.insert("auditLogs", { organizationId: user.organizationId, actorUserId: user._id, action: "hourly_wage_review.submitted", entityType: "hourlyWageReview", entityId: String(id), metadata: { employeeCode: employee.employeeCode, workDate: args.workDate, regularMinutes: args.regularMinutes, overtimeMinutes: args.overtimeMinutes }, createdAt: now });
    return id;
  },
});

export const decideHourlyReview = mutation({
  args: { reviewId: v.id("hourlyWageReviews"), decision: v.union(v.literal("approved"), v.literal("rejected")), note: v.optional(v.string()), approvedRegularMinutes: v.optional(v.number()), approvedOvertimeMinutes: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["superadmin"]);
    const review = await ctx.db.get(args.reviewId);
    if (!review || review.organizationId !== user.organizationId) throw new Error("HOURLY_REVIEW_NOT_FOUND");
    if (review.status !== "pending") throw new Error("HOURLY_REVIEW_ALREADY_DECIDED");
    if (args.decision === "approved") {
      const regular = args.approvedRegularMinutes ?? review.suggestedRegularMinutes;
      const overtime = args.approvedOvertimeMinutes ?? review.suggestedOvertimeMinutes;
      if (!Number.isSafeInteger(regular) || regular < 0 || !Number.isSafeInteger(overtime) || overtime < 0) throw new Error("INVALID_APPROVED_HOURS");
      const employee = await ctx.db.get(review.employeeId);
      if (!employee || employee.organizationId !== user.organizationId || employee.employmentType !== "hourly") throw new Error("HOURLY_EMPLOYEE_NOT_FOUND");
      await ctx.db.patch(review._id, { status: "approved", approvedRegularMinutes: regular, approvedOvertimeMinutes: overtime, reviewerNote: args.note?.trim() || undefined, reviewedBy: user._id, reviewedAt: Date.now() });
    } else {
      if (!args.note?.trim()) throw new Error("REJECTION_REASON_REQUIRED");
      await ctx.db.patch(review._id, { status: "rejected", reviewerNote: args.note.trim(), reviewedBy: user._id, reviewedAt: Date.now() });
    }
    await ctx.db.insert("auditLogs", { organizationId: user.organizationId, actorUserId: user._id, action: args.decision === "approved" ? "hourly_wage_review.approved" : "hourly_wage_review.rejected", entityType: "hourlyWageReview", entityId: String(review._id), metadata: { approvedRegularMinutes: args.approvedRegularMinutes ?? review.suggestedRegularMinutes, approvedOvertimeMinutes: args.approvedOvertimeMinutes ?? review.suggestedOvertimeMinutes, note: args.note?.trim() || null }, createdAt: Date.now() });
    return { reviewed: true, decision: args.decision };
  },
});
