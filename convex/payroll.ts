import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity, requireOrganizationAdmin } from "./lib/auth";
import { canDeletePayrollPeriod, isEmployeeEligibleForPayrollPeriod } from "./lib/rolePolicy";
import { calculateRegularMinutes, calculateVerifiedWorkIntervals, localDateTimeUtc } from "./payrollCalculations";

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + "T00:00:00.000Z");
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
function money(value: number) { return Math.round(value); }

export const listPeriods = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireIdentity(ctx);
    if (!["superadmin","admin","supervisor"].includes(user.role)) throw new Error("FORBIDDEN");
    const periods = await ctx.db.query("wagePeriods").withIndex("by_org_dates", q => q.eq("organizationId", user.organizationId)).order("desc").take(60);
    return await Promise.all(periods.map(async period => {
      const wageRecords = await ctx.db.query("wageRecords")
        .withIndex("by_period", q => q.eq("wagePeriodId", period._id))
        .collect();
      return {
        ...period,
        canDelete: canDeletePayrollPeriod(user.role, user.isPrimarySuperadmin === true, period.status, wageRecords.map(record => record.status)),
        records: await Promise.all(wageRecords.map(async record => {
          const employee = await ctx.db.get(record.employeeId);
          return {
            ...record,
            employeeName: employee ? [employee.firstName, employee.lastName].filter(Boolean).join(" ") : "Former employee",
            employeeCode: employee?.employeeCode ?? "—",
          };
        })),
      };
    }));
  },
});


/**
 * Permanently removes a payroll period under role-based deletion rules.
 * Admins may delete drafts only; the claimed Primary Super Admin may delete
 * draft, approved, and locked periods. All related wage records are removed
 * atomically, while audit history is retained.
 */
export const deletePeriod = mutation({
  args: { periodId: v.id("wagePeriods"), confirmation: v.literal("DELETE PAYROLL") },
  handler: async (ctx, args) => {
    const actor = await requireOrganizationAdmin(ctx);
    if (actor.role === "superadmin" && actor.isPrimarySuperadmin !== true) {
      throw new Error("PRIMARY_SUPERADMIN_REQUIRED");
    }

    const period = await ctx.db.get(args.periodId);
    if (!period || period.organizationId !== actor.organizationId) {
      throw new Error("PAYROLL_PERIOD_NOT_FOUND");
    }

    const records = await ctx.db.query("wageRecords")
      .withIndex("by_period", q => q.eq("wagePeriodId", period._id))
      .collect();

    if (records.some(record => record.organizationId !== period.organizationId)) {
      throw new Error("PAYROLL_RECORD_ORGANIZATION_MISMATCH");
    }
    if (!canDeletePayrollPeriod(
      actor.role,
      actor.isPrimarySuperadmin === true,
      period.status,
      records.map(record => record.status),
    )) {
      throw new Error("PAYROLL_DELETE_NOT_ALLOWED_FOR_ROLE_OR_STATUS");
    }

    const now = Date.now();
    await ctx.db.insert("auditLogs", {
      organizationId: period.organizationId,
      actorUserId: actor._id,
      action: "payroll.period_deleted",
      entityType: "wagePeriod",
      entityId: String(period._id),
      metadata: {
        fromDate: period.fromDate,
        toDate: period.toDate,
        previousStatus: period.status,
        deletedRecordCount: records.length,
        recordStatuses: records.map(record => record.status),
        totalNetPaise: period.totalNetPaise ?? 0,
        performedByPrimarySuperadmin: actor.role === "superadmin",
      },
      createdAt: now,
    });

    for (const record of records) await ctx.db.delete(record._id);
    await ctx.db.delete(period._id);

    return { deleted: true, deletedRecordCount: records.length };
  },
});

export const generatePeriod = mutation({
  args: { fromDate: v.string(), toDate: v.string(), periodType: v.union(v.literal("weekly"),v.literal("monthly"),v.literal("custom")) },
  handler: async (ctx, args) => {
    const user = await requireIdentity(ctx);
    if (!["superadmin","admin","supervisor"].includes(user.role)) throw new Error("FORBIDDEN");
    if (!validDate(args.fromDate) || !validDate(args.toDate) || args.fromDate > args.toDate) throw new Error("INVALID_PAYROLL_PERIOD");
    const overlap = await ctx.db.query("wagePeriods").withIndex("by_org_dates", q => q.eq("organizationId", user.organizationId)).collect();
    if (overlap.some(p => p.fromDate <= args.toDate && p.toDate >= args.fromDate)) throw new Error("PAYROLL_PERIOD_OVERLAPS_FINALIZED_PERIOD");
    if (overlap.some(p => p.fromDate === args.fromDate && p.toDate === args.toDate)) throw new Error("PAYROLL_PERIOD_ALREADY_EXISTS");
    const organization = await ctx.db.get(user.organizationId);
    if (!organization) throw new Error("ORGANIZATION_NOT_FOUND");
    const periodStart = localDateTimeUtc(args.fromDate, 0, organization.timezone);
    const dayAfterEnd = new Date(Date.parse(args.toDate + "T00:00:00.000Z") + 86400000).toISOString().slice(0, 10);
    const periodEnd = localDateTimeUtc(dayAfterEnd, 0, organization.timezone);
    const [employees, days, overtime, components, attendanceEvents, shiftAssignments, shifts] = await Promise.all([
      ctx.db.query("employees").withIndex("by_org_status", q => q.eq("organizationId", user.organizationId).eq("status", "active")).collect(),
      ctx.db.query("attendanceDays").withIndex("by_org_date", q => q.eq("organizationId", user.organizationId).gte("workDate", args.fromDate).lte("workDate", args.toDate)).collect(),
      ctx.db.query("overtimeRequests").withIndex("by_org_date", q => q.eq("organizationId", user.organizationId).gte("workDate", args.fromDate).lte("workDate", args.toDate)).collect(),
      ctx.db.query("salaryComponents").withIndex("by_org", q => q.eq("organizationId", user.organizationId)).collect(),
      ctx.db.query("attendanceEvents").withIndex("by_org_time", q => q.eq("organizationId", user.organizationId).gte("receivedAt", periodStart).lt("receivedAt", periodEnd)).collect(),
      ctx.db.query("shiftAssignments").withIndex("by_org_date", q => q.eq("organizationId", user.organizationId).gte("workDate", args.fromDate).lte("workDate", args.toDate)).collect(),
      ctx.db.query("shifts").withIndex("by_org", q => q.eq("organizationId", user.organizationId)).collect(),
    ]);
    const componentMap = new Map(components.map(c => [String(c._id), c]));
    const eventGroups = new Map<string, any[]>();
    for (const event of attendanceEvents) {
      const workDate = new Intl.DateTimeFormat("en-CA", { timeZone: organization.timezone }).format(new Date(event.receivedAt));
      const key = String(event.employeeId) + ":" + workDate;
      const group = eventGroups.get(key) ?? [];
      group.push(event);
      eventGroups.set(key, group);
    }
    const assignmentMap = new Map<string, any[]>();
    for (const assignment of shiftAssignments) {
      const key = String(assignment.employeeId) + ":" + assignment.workDate;
      const group = assignmentMap.get(key) ?? [];
      group.push(assignment);
      assignmentMap.set(key, group);
    }
    const shiftMap = new Map(shifts.map(shift => [String(shift._id), shift]));
    const periodId = await ctx.db.insert("wagePeriods", { organizationId: user.organizationId, periodType: args.periodType, fromDate: args.fromDate, toDate: args.toDate, status: "draft", createdBy: user._id, createdAt: Date.now() });
    let totalGross = 0, totalDeductions = 0, totalNet = 0, employeeCount = 0;
    const eligible = employees.filter(e =>
      ["permanent", "hourly", "daily"].includes(e.employmentType) &&
      isEmployeeEligibleForPayrollPeriod(args.periodType, e.employmentType as "permanent" | "hourly" | "daily")
    );
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
        const rates = await ctx.db.query("wageRates").withIndex("by_employee_effective", q => q.eq("employeeId", employee._id).lte("effectiveFrom", args.toDate)).order("desc").collect();
        const employeeDays = days.filter(day => String(day.employeeId) === String(employee._id) && (day.status === "present" || day.status === "late") && day.payableMinutes > 0);
        for (const day of employeeDays) {
          const key = String(employee._id) + ":" + day.workDate;
          const dayEvents = eventGroups.get(key) ?? [];
          const intervals = calculateVerifiedWorkIntervals(dayEvents);
          if (!intervals) continue;
          const assignments = assignmentMap.get(key) ?? [];
          if (assignments.length > 1) throw new Error("MULTIPLE_SHIFTS_CONFIGURED_FOR_HOURLY_PAYROLL:" + employee.employeeCode + ":" + day.workDate);
          const shiftId = assignments[0]?.shiftId ?? employee.defaultShiftId;
          const shift = shiftId ? shiftMap.get(String(shiftId)) : undefined;
          let shiftStartAt: number | undefined;
          let shiftEndAt: number | undefined;
          const dayOvertimeRequests = overtime.filter(request => String(request.employeeId) === String(employee._id) && request.workDate === day.workDate);
          if (!shiftId) {
            const recordedShiftEnd = dayOvertimeRequests.map(request => request.shiftEndAt).filter((value): value is number => typeof value === "number").sort((a, b) => a - b)[0];
            if (recordedShiftEnd !== undefined) shiftEndAt = recordedShiftEnd;
          }
          if (shiftId && (!shift || shift.organizationId !== user.organizationId || !shift.isActive)) {
            throw new Error("INVALID_SHIFT_CONFIGURATION:" + employee.employeeCode + ":" + day.workDate);
          }
          if (shift) {
            if (shift.endMinute <= shift.startMinute || shift.startMinute < 0 || shift.endMinute > 1440) {
              throw new Error("OVERNIGHT_OR_INVALID_SHIFT_UNSUPPORTED:" + employee.employeeCode + ":" + day.workDate);
            }
            shiftStartAt = localDateTimeUtc(day.workDate, shift.startMinute, organization.timezone);
            shiftEndAt = localDateTimeUtc(day.workDate, shift.endMinute, organization.timezone);
          }
          const mins = calculateRegularMinutes(intervals, shiftStartAt, shiftEndAt);
          if (!mins) continue;
          const rate = rates.find(r => r.organizationId === user.organizationId && r.employmentType === "hourly" && r.effectiveFrom <= day.workDate && (!r.effectiveTo || r.effectiveTo >= day.workDate));
          if (!rate) throw new Error("HOURLY_RATE_NOT_CONFIGURED:" + employee.employeeCode + ":" + day.workDate);
          payableMinutes += mins;
          const regularAmount = money(mins * rate.amountPaise / 60);
          gross += regularAmount;
          if (regularAmount > 0) earnings.push({ label: "Regular hours · " + day.workDate, amountPaise: regularAmount });
          ratePaise = rate.amountPaise;
        }
        const approvedOvertime = overtime.filter(r => String(r.employeeId) === String(employee._id) && r.status === "approved");
        for (const request of approvedOvertime) {
          const mins = request.approvedMinutes ?? 0;
          if (!mins) continue;
          const applicableRate = rates.find(r => r.organizationId === user.organizationId && r.employmentType === "hourly" && r.effectiveFrom <= request.workDate && (!r.effectiveTo || r.effectiveTo >= request.workDate));
          const overtimeRate = request.rateSnapshotPaise ?? applicableRate?.amountPaise;
          if (!overtimeRate || overtimeRate <= 0) throw new Error("HOURLY_OVERTIME_RATE_NOT_CONFIGURED:" + employee.employeeCode + ":" + request.workDate);
          const amount = money(mins * overtimeRate / 60 * (request.appliedMultiplier ?? 1));
          overtimePaise += amount;
          if (amount > 0) earnings.push({ label: "Approved overtime · " + request.workDate, amountPaise: amount });
          payableMinutes += mins;
        }
        payableUnits = payableMinutes / 60;
        gross += overtimePaise;
      }
      const deductionTotal = deductions.reduce((s,x)=>s+x.amountPaise,0);
      const net = gross - deductionTotal;
      if (net < 0) throw new Error("PAYROLL_DEDUCTIONS_EXCEED_GROSS:" + employee.employeeCode);
      if (gross === 0 && deductionTotal === 0) continue;
      const wageEmploymentType = employee.employmentType === "permanent" ? "monthly" : employee.employmentType === "hourly" || employee.employmentType === "daily" ? employee.employmentType : null;
      if (!wageEmploymentType) continue;
      const payslipNumber = "ORC-" + args.toDate.replaceAll("-","") + "-" + employee.employeeCode;
      const snapshot = { employeeCode: employee.employeeCode, employeeName: [employee.firstName,employee.lastName].filter(Boolean).join(" "), departmentId: employee.departmentId, employmentType: employee.employmentType, period: { fromDate: args.fromDate, toDate: args.toDate }, earnings, deductions, grossPaise: gross, overtimePaise, deductionTotalPaise: deductionTotal, netPaise: net, payableUnits, payableMinutes, payableDays, generatedAt: Date.now(), ruleVersion: "orchid-payroll-v2", notes: employee.employmentType === "daily" ? "Each completed verified attendance day with payable minutes is counted as one daily unit. Partial-day proration is not applied." : employee.employmentType === "permanent" ? "Monthly salary is not prorated for joining, exit, unpaid leave or absence in this release." : "Regular hours are calculated from verified attendance, excluding breaks and capped at the scheduled shift end; post-shift time is paid only through approved overtime requests." };
      await ctx.db.insert("wageRecords", { organizationId: user.organizationId, wagePeriodId: periodId, employeeId: employee._id, employmentType: wageEmploymentType, payableUnits, ratePaise, grossPaise: gross, overtimePaise, adjustmentPaise: 0, totalPaise: net, earnings, deductions, payableMinutes, payableDays, payslipNumber, calculationSnapshot: snapshot, calculationVersion: "orchid-payroll-v2", status: "draft", createdAt: Date.now() });
            totalGross += gross; totalDeductions += deductionTotal; totalNet += net; employeeCount++;
    }
    await ctx.db.patch(periodId, { employeeCount, totalGrossPaise: totalGross, totalDeductionsPaise: totalDeductions, totalNetPaise: totalNet });
    await ctx.db.insert("auditLogs", { organizationId: user.organizationId, actorUserId: user._id, action: "payroll.period_generated", entityType: "wagePeriod", entityId: String(periodId), metadata: { fromDate: args.fromDate, toDate: args.toDate, employeeCount, totalNetPaise: totalNet }, createdAt: Date.now() });
    return { periodId, employeeCount, totalGrossPaise: totalGross, totalDeductionsPaise: totalDeductions, totalNetPaise: totalNet };
  },
});


export const addDraftAdjustment = mutation({
  args: { recordId: v.id("wageRecords"), category: v.union(v.literal("earning"),v.literal("deduction")), label: v.string(), amountPaise: v.number(), reason: v.string() },
  handler: async (ctx, args) => {
    const user = await requireIdentity(ctx);
    if (!["superadmin","admin","supervisor"].includes(user.role)) throw new Error("FORBIDDEN");
    const record = await ctx.db.get(args.recordId);
    if (!record || record.organizationId !== user.organizationId || record.status !== "draft") throw new Error("DRAFT_PAYROLL_RECORD_REQUIRED");
    const period = await ctx.db.get(record.wagePeriodId);
    if (!period || period.organizationId !== user.organizationId || period.status !== "draft") throw new Error("DRAFT_PAYROLL_PERIOD_REQUIRED");
    const label = args.label.trim(), reason = args.reason.trim();
    if (!label || label.length > 80 || !Number.isSafeInteger(args.amountPaise) || args.amountPaise <= 0 || !reason || reason.length > 500) throw new Error("INVALID_PAYROLL_ADJUSTMENT");
    const earnings = [...(record.earnings ?? [])], deductions = [...(record.deductions ?? [])];
    if (args.category === "earning") earnings.push({ label, amountPaise: args.amountPaise });
    else deductions.push({ label, amountPaise: args.amountPaise, reason });
    const grossPaise = record.grossPaise + (args.category === "earning" ? args.amountPaise : 0);
    const deductionTotal = deductions.reduce((sum, item) => sum + item.amountPaise, 0);
    const totalPaise = grossPaise - deductionTotal;
    if (totalPaise < 0) throw new Error("PAYROLL_DEDUCTIONS_EXCEED_GROSS");
    const adjustmentPaise = (record.adjustmentPaise ?? 0) + (args.category === "earning" ? args.amountPaise : -args.amountPaise);
    await ctx.db.patch(record._id, { earnings, deductions, grossPaise, totalPaise, adjustmentPaise, calculationSnapshot: { ...(record.calculationSnapshot ?? {}), earnings, deductions, grossPaise, deductionTotalPaise: deductionTotal, netPaise: totalPaise, adjustmentPaise } });
    await ctx.db.patch(period._id, { totalGrossPaise: (period.totalGrossPaise ?? 0) + (args.category === "earning" ? args.amountPaise : 0), totalDeductionsPaise: (period.totalDeductionsPaise ?? 0) + (args.category === "deduction" ? args.amountPaise : 0), totalNetPaise: (period.totalNetPaise ?? 0) + (args.category === "earning" ? args.amountPaise : -args.amountPaise) });
    await ctx.db.insert("auditLogs", { organizationId: user.organizationId, actorUserId: user._id, action: "payroll.adjustment_added", entityType: "wageRecord", entityId: String(record._id), metadata: { category: args.category, label, amountPaise: args.amountPaise, reason }, createdAt: Date.now() });
    return { totalPaise };
  },
});

export const submitPeriodForApproval = mutation({
 args:{periodId:v.id("wagePeriods")},
 handler:async(ctx,{periodId})=>{const actor=await requireIdentity(ctx);if(actor.role!=="supervisor")throw new Error("SUPERVISOR_SUBMISSION_REQUIRED");const period=await ctx.db.get(periodId);if(!period||period.organizationId!==actor.organizationId)throw new Error("PAYROLL_PERIOD_NOT_FOUND");if(period.status!=="draft")throw new Error("PAYROLL_PERIOD_NOT_DRAFT");const records=await ctx.db.query("wageRecords").withIndex("by_period",q=>q.eq("wagePeriodId",period._id)).collect();if(!records.length)throw new Error("PAYROLL_HAS_NO_RECORDS");const now=Date.now();for(const record of records)await ctx.db.patch(record._id,{status:"pending_approval"});await ctx.db.patch(period._id,{status:"pending_approval"});await ctx.db.insert("auditLogs",{organizationId:actor.organizationId,actorUserId:actor._id,action:"payroll.period_submitted_for_approval",entityType:"wagePeriod",entityId:String(period._id),metadata:{employeeCount:records.length,totalNetPaise:period.totalNetPaise??0},createdAt:now});return {submitted:records.length};}
});
export const approvePeriod = mutation({
  args: { periodId: v.id("wagePeriods") },
  handler: async (ctx, args) => {
    const user = await requireOrganizationAdmin(ctx);
    const period = await ctx.db.get(args.periodId);
    if (!period || period.organizationId !== user.organizationId) throw new Error("PAYROLL_PERIOD_NOT_FOUND");
    if (period.status !== "draft" && period.status !== "pending_approval") throw new Error("PAYROLL_PERIOD_NOT_PENDING_APPROVAL");
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
    const user = await requireOrganizationAdmin(ctx);
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
