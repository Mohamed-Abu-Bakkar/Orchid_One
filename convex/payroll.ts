import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity, requireSuperadmin } from "./lib/auth";

function validDate(value: string) {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return false;
  const d = new Date(value + "T00:00:00.000Z");
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
function money(value: number) { return Math.round(value); }

export const listPeriods = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireSuperadmin(ctx);
    const periods = await ctx.db.query("wagePeriods").withIndex("by_org_dates", q => q.eq("organizationId", user.organizationId)).order("desc").take(60);
    return await Promise.all(periods.map(async period => ({
      ...period,
      records: await ctx.db.query("wageRecords").withIndex("by_period", q => q.eq("wagePeriodId", period._id)).collect(),
    })));
  },
});

export const generatePeriod = mutation({
  args: { fromDate: v.string(), toDate: v.string(), periodType: v.union(v.literal("weekly"),v.literal("monthly"),v.literal("custom")) },
  handler: async (ctx, args) => {
    const user = await requireSuperadmin(ctx);
    if (!validDate(args.fromDate) || !validDate(args.toDate) || args.fromDate > args.toDate) throw new Error("INVALID_PAYROLL_PERIOD");
    const overlap = await ctx.db.query("wagePeriods").withIndex("by_org_dates", q => q.eq("organizationId", user.organizationId)).collect();
    if (overlap.some(p => p.fromDate <= args.toDate && p.toDate >= args.fromDate && p.status !== "draft")) throw new Error("PAYROLL_PERIOD_OVERLAPS_FINALIZED_PERIOD");
    if (overlap.some(p => p.fromDate === args.fromDate && p.toDate === args.toDate)) throw new Error("PAYROLL_PERIOD_ALREADY_EXISTS");
    const [employees, days, reviews, overtime, components] = await Promise.all([
      ctx.db.query("employees").withIndex("by_org_status", q => q.eq("organizationId", user.organizationId).eq("status", "active")).collect(),
      ctx.db.query("attendanceDays").withIndex("by_org_date", q => q.eq("organizationId", user.organizationId).gte("workDate", args.fromDate).lte("workDate", args.toDate)).collect(),
      ctx.db.query("hourlyWageReviews").withIndex("by_org_date", q => q.eq("organizationId", user.organizationId).gte("workDate", args.fromDate).lte("workDate", args.toDate)).collect(),
      ctx.db.query("overtimeRequests").withIndex("by_org_date", q => q.eq("organizationId", user.organizationId).gte("workDate", args.fromDate).lte("workDate", args.toDate)).collect(),
      ctx.db.query("salaryComponents").withIndex("by_org", q => q.eq("organizationId", user.organizationId)).collect(),
    ]);
    const componentMap = new Map(components.map(c => [String(c._id), c]));
    const periodId = await ctx.db.insert("wagePeriods", { organizationId: user.organizationId, periodType: args.periodType, fromDate: args.fromDate, toDate: args.toDate, status: "draft", createdBy: user._id, createdAt: Date.now() });
    let totalGross = 0, totalDeductions = 0, totalNet = 0, employeeCount = 0;
    const eligible = employees.filter(e => ["permanent","hourly","daily"].includes(e.employmentType));
    for (const employee of eligible) {
      const employeeDays = days.filter(d => String(d.employeeId) === String(employee._id) && d.status !== "exception" && d.status !== "pending_review");
      const earnings: {label:string;amountPaise:number}[] = [];
      const deductions: {label:string;amountPaise:number;reason?:string}[] = [];
      let gross = 0, overtimePaise = 0, ratePaise = 0, payableUnits = 0, payableMinutes = 0, payableDays = 0;
      if (employee.employmentType === "permanent") {
        const configs = await ctx.db.query("employeeCompensation").withIndex("by_employee_effective", q => q.eq("employeeId", employee._id).lte("effectiveFrom", args.toDate)).order("desc").collect();
        const config = configs.find(c => c.organizationId === user.organizationId);
        if (!config) continue;
        if ((config.fixedMonthlyAmountPaise ?? 0) > 0) earnings.push({ label: "Fixed monthly salary", amountPaise: config.fixedMonthlyAmountPaise! });
        for (const line of config.components) {
          const component = componentMap.get(String(line.componentId));
          if (!component) continue;
          if (component.category === "earning") earnings.push({ label: component.name, amountPaise: line.amountPaise });
          else deductions.push({ label: component.name, amountPaise: line.amountPaise, reason: line.reason });
        }
        gross = earnings.reduce((s,x)=>s+x.amountPaise,0);
        ratePaise = config.fixedMonthlyAmountPaise ?? gross;
        payableUnits = 1;
      } else if (employee.employmentType === "daily") {
        const validDays = employeeDays.filter(d => (d.status === "present" || d.status === "late") && d.lastCheckOutAt && d.payableMinutes > 0);
        const rates = await ctx.db.query("wageRates").withIndex("by_employee_effective", q => q.eq("employeeId", employee._id).lte("effectiveFrom", args.toDate)).order("desc").collect();
        const dayTotals = new Map<string,number>();
        for (const day of validDays) {
          const rate = rates.find(r => r.organizationId === user.organizationId && r.employmentType === "daily" && r.effectiveFrom <= day.workDate && (!r.effectiveTo || r.effectiveTo >= day.workDate));
          if (!rate) continue;
          dayTotals.set(rate.effectiveFrom, (dayTotals.get(rate.effectiveFrom) ?? 0) + rate.amountPaise);
          ratePaise = rate.amountPaise;
          payableDays++;
        }
        gross = [...dayTotals.values()].reduce((s,n)=>s+n,0);
        payableUnits = payableDays;
        if (gross > 0) earnings.push({ label: "Daily wages (" + payableDays + " payable days)", amountPaise: gross });
      } else if (employee.employmentType === "hourly") {
        const approvedReviews = reviews.filter(r => String(r.employeeId) === String(employee._id) && r.status === "approved");
        const rates = await ctx.db.query("wageRates").withIndex("by_employee_effective", q => q.eq("employeeId", employee._id).lte("effectiveFrom", args.toDate)).order("desc").collect();
        for (const review of approvedReviews) {
          const rate = rates.find(r => r.organizationId === user.organizationId && r.employmentType === "hourly" && r.effectiveFrom <= review.workDate && (!r.effectiveTo || r.effectiveTo >= review.workDate));
          if (!rate) continue;
          const mins = review.approvedRegularMinutes ?? 0;
          payableMinutes += mins;
          gross += money(mins * rate.amountPaise / 60);
          ratePaise = rate.amountPaise;
        }
        const approvedOvertime = overtime.filter(r => String(r.employeeId) === String(employee._id) && r.status === "approved");
        for (const request of approvedOvertime) {
          const mins = request.approvedMinutes ?? 0;
          const amount = money(mins * (request.rateSnapshotPaise ?? 0) / 60 * (request.appliedMultiplier ?? 1));
          overtimePaise += amount;
          payableMinutes += mins;
        }
        payableUnits = payableMinutes / 60;
        if (gross > 0) earnings.push({ label: "Approved regular hours", amountPaise: gross });
        if (overtimePaise > 0) earnings.push({ label: "Approved overtime", amountPaise: overtimePaise });
        gross += overtimePaise;
      }
      const deductionTotal = deductions.reduce((s,x)=>s+x.amountPaise,0);
      const net = gross - deductionTotal;
      if (gross === 0 && deductionTotal === 0) continue;
      const payslipNumber = "ORC-" + args.toDate.replaceAll("-","") + "-" + employee.employeeCode;
      const snapshot = { employeeCode: employee.employeeCode, employeeName: [employee.firstName,employee.lastName].filter(Boolean).join(" "), departmentId: employee.departmentId, employmentType: employee.employmentType, period: { fromDate: args.fromDate, toDate: args.toDate }, earnings, deductions, grossPaise: gross, overtimePaise, deductionTotalPaise: deductionTotal, netPaise: net, payableUnits, payableMinutes, payableDays, generatedAt: Date.now(), ruleVersion: "orchid-payroll-v1", notes: employee.employmentType === "daily" ? "Each completed verified attendance day with payable minutes is counted as one daily unit. Partial-day proration is not applied." : employee.employmentType === "permanent" ? "Monthly salary is not prorated for joining, exit, unpaid leave or absence in this release." : "Only approved regular-hour reviews and approved overtime requests are included." };
      await ctx.db.insert("wageRecords", { organizationId: user.organizationId, wagePeriodId: periodId, employeeId: employee._id, employmentType: employee.employmentType === "permanent" ? "monthly" : employee.employmentType, payableUnits, ratePaise, grossPaise: gross, overtimePaise, adjustmentPaise: 0, totalPaise: net, earnings, deductions, payableMinutes, payableDays, payslipNumber, calculationSnapshot: snapshot, calculationVersion: "orchid-payroll-v1", status: "draft", createdAt: Date.now() });
      totalGross += gross; totalDeductions += deductionTotal; totalNet += net; employeeCount++;
    }
    await ctx.db.patch(periodId, { employeeCount, totalGrossPaise: totalGross, totalDeductionsPaise: totalDeductions, totalNetPaise: totalNet });
    await ctx.db.insert("auditLogs", { organizationId: user.organizationId, actorUserId: user._id, action: "payroll.period_generated", entityType: "wagePeriod", entityId: String(periodId), metadata: { fromDate: args.fromDate, toDate: args.toDate, employeeCount, totalNetPaise: totalNet }, createdAt: Date.now() });
    return { periodId, employeeCount, totalGrossPaise: totalGross, totalDeductionsPaise: totalDeductions, totalNetPaise: totalNet };
  },
});

export const approvePeriod = mutation({
  args: { periodId: v.id("wagePeriods") },
  handler: async (ctx, args) => {
    const user = await requireSuperadmin(ctx);
    const period = await ctx.db.get(args.periodId);
    if (!period || period.organizationId !== user.organizationId) throw new Error("PAYROLL_PERIOD_NOT_FOUND");
    if (period.status !== "draft") throw new Error("PAYROLL_PERIOD_NOT_DRAFT");
    const records = await ctx.db.query("wageRecords").withIndex("by_period", q => q.eq("wagePeriodId", period._id)).collect();
    if (!records.length) throw new Error("PAYROLL_HAS_NO_PAYSLIPS");
    const now = Date.now();
    for (const record of records) await ctx.db.patch(record._id, { status: "approved", approvedAt: now });
    await ctx.db.patch(period._id, { status: "approved", approvedBy: user._id, approvedAt: now });
    await ctx.db.insert("auditLogs", { organizationId: user.organizationId, actorUserId: user._id, action: "payroll.period_approved", entityType: "wagePeriod", entityId: String(period._id), metadata: { employeeCount: records.length, totalNetPaise: period.totalNetPaise ?? 0 }, createdAt: now });
    return { approved: records.length };
  },
});

export const lockPeriod = mutation({
  args: { periodId: v.id("wagePeriods") },
  handler: async (ctx, args) => {
    const user = await requireSuperadmin(ctx);
    const period = await ctx.db.get(args.periodId);
    if (!period || period.organizationId !== user.organizationId) throw new Error("PAYROLL_PERIOD_NOT_FOUND");
    if (period.status !== "approved") throw new Error("PAYROLL_PERIOD_NOT_APPROVED");
    const records = await ctx.db.query("wageRecords").withIndex("by_period", q => q.eq("wagePeriodId", period._id)).collect();
    const now = Date.now();
    for (const record of records) await ctx.db.patch(record._id, { status: "locked" });
    await ctx.db.patch(period._id, { status: "locked", lockedBy: user._id, lockedAt: now });
    await ctx.db.insert("auditLogs", { organizationId: user.organizationId, actorUserId: user._id, action: "payroll.period_locked", entityType: "wagePeriod", entityId: String(period._id), metadata: { employeeCount: records.length }, createdAt: now });
    return { locked: records.length };
  },
});

export const myPayslips = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireIdentity(ctx);
    if (user.role !== "employee" || !user.employeeId) throw new Error("EMPLOYEE_ACCESS_REQUIRED");
    const employee = await ctx.db.get(user.employeeId);
    if (!employee || employee.organizationId !== user.organizationId || employee.status !== "active") return [];
    const records = await ctx.db.query("wageRecords").withIndex("by_employee", q => q.eq("employeeId", employee._id)).order("desc").take(36);
    const visible = [];
    for (const record of records) {
      if (record.organizationId !== user.organizationId || (record.status !== "approved" && record.status !== "locked")) continue;
      const period = await ctx.db.get(record.wagePeriodId);
      if (!period || period.organizationId !== user.organizationId || (period.status !== "approved" && period.status !== "locked")) continue;
      visible.push({ ...record, period: { fromDate: period.fromDate, toDate: period.toDate, status: period.status, periodType: period.periodType }, snapshot: record.calculationSnapshot ?? null });
    }
    return visible;
  },
});
