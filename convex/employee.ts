import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./lib/auth";

export const myWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireIdentity(ctx);
    if (user.role !== "employee" || !user.employeeId) throw new Error("EMPLOYEE_ACCESS_REQUIRED");
    const emptyWorkspace = { linked: false as const, profile: null, department: null, location: null, shift: null, shifts: [], attendance: [], attendanceSummary: null, todayAttendance: null, upcoming: [], leaveBalances: [], leaveRequests: [], overtimeRequests: [], documents: [], wageRecords: [], weeklyWage: null, notifications: [] };
    if (!user.employeeId) return emptyWorkspace;
    const employee = await ctx.db.get(user.employeeId);
    if (!employee || employee.organizationId !== user.organizationId || employee.status !== "active") return emptyWorkspace;
    const organization = await ctx.db.get(user.organizationId);
    const timeZone = organization?.timezone ?? "Asia/Kolkata";
    const now = new Date();
    const dateKey = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
    const today = dateKey(now), monthStart = today.slice(0, 7) + "-01";
    const dayOffset = (value: string, days: number) => { const date = new Date(value + "T00:00:00Z"); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10); };
    const weekStartDate = new Date(today + "T00:00:00Z"), weekday = (weekStartDate.getUTCDay() + 6) % 7;
    weekStartDate.setUTCDate(weekStartDate.getUTCDate() - weekday);
    const weekStart = dateKey(weekStartDate), weekEnd = dayOffset(weekStart, 6), upcomingEnd = dayOffset(today, 29);
    const monthStartAt = new Date(monthStart + "T00:00:00+05:30");
    const nextMonthDate = new Date(monthStart + "T00:00:00Z");
    nextMonthDate.setUTCMonth(nextMonthDate.getUTCMonth() + 1);
    const monthEnd = dayOffset(nextMonthDate.toISOString().slice(0, 10), -1);
    const nextMonthStartAt = new Date(nextMonthDate.toISOString().slice(0, 10) + "T00:00:00+05:30");
    const [department, location, attendance, leaveBalances, leaveTypes, leaveRequests, overtimeRequests, documents, wageRecords, notifications, monthEvents, monthShifts, todayShiftAssignments, upcomingShifts, holidays, organizationEmployees, monthAttendanceDays, workCalendars] = await Promise.all([
      ctx.db.get(employee.departmentId), ctx.db.get(employee.locationId),
      ctx.db.query("attendanceEvents").withIndex("by_employee_time", q => q.eq("employeeId", employee._id)).order("desc").take(500),
      ctx.db.query("leaveBalances").withIndex("by_employee_year", q => q.eq("employeeId", employee._id).eq("periodYear", Number(today.slice(0, 4)))).collect(),
      ctx.db.query("leaveTypes").withIndex("by_org", q => q.eq("organizationId", user.organizationId)).collect(),
      ctx.db.query("leaveRequests").withIndex("by_employee", q => q.eq("employeeId", employee._id)).order("desc").take(30),
      ctx.db.query("overtimeRequests").withIndex("by_employee", q => q.eq("employeeId", employee._id)).order("desc").take(30),
      ctx.db.query("employeeDocuments").withIndex("by_employee", q => q.eq("employeeId", employee._id)).order("desc").take(30),
      ctx.db.query("wageRecords").withIndex("by_employee", q => q.eq("employeeId", employee._id)).order("desc").take(12),
      ctx.db.query("notifications").withIndex("by_user", q => q.eq("userId", user._id)).order("desc").take(30),
      ctx.db.query("attendanceEvents").withIndex("by_employee_time", q => q.eq("employeeId", employee._id).gte("receivedAt", monthStartAt.getTime()).lt("receivedAt", nextMonthStartAt.getTime())).collect(),
      ctx.db.query("shiftAssignments").withIndex("by_employee_date", q => q.eq("employeeId", employee._id).gte("workDate", monthStart).lte("workDate", monthEnd)).collect(),
      ctx.db.query("shiftAssignments").withIndex("by_employee_date", q => q.eq("employeeId", employee._id).eq("workDate", today)).collect(),
      ctx.db.query("shiftAssignments").withIndex("by_employee_date", q => q.eq("employeeId", employee._id).gte("workDate", today).lte("workDate", upcomingEnd)).collect(),
      ctx.db.query("holidays").withIndex("by_org_date", q => q.eq("organizationId", user.organizationId)).collect(),
      ctx.db.query("employees").withIndex("by_org_code", q => q.eq("organizationId", user.organizationId)).collect(),
      ctx.db.query("attendanceDays").withIndex("by_employee_date", q => q.eq("employeeId", employee._id).gte("workDate", monthStart).lte("workDate", monthEnd)).collect(),
      ctx.db.query("workCalendars").withIndex("by_org", q => q.eq("organizationId", user.organizationId)).collect(),
    ]);
    const currentShiftRows = todayShiftAssignments.length ? todayShiftAssignments : (employee.defaultShiftId ? [{ shiftId: employee.defaultShiftId, workDate: today }] : []);
    const currentShifts = await Promise.all(currentShiftRows.map(async assignment => {
      const shift = await ctx.db.get(assignment.shiftId);
      return shift ? { name: shift.name, startMinute: shift.startMinute, endMinute: shift.endMinute, breakMinutes: shift.breakMinutes, workDate: today } : null;
    }));
    const validCurrentShifts = currentShifts.filter((shift): shift is NonNullable<typeof shift> => Boolean(shift));
    const currentShift = validCurrentShifts[0] ?? null;
    const defaultScheduleShift = employee.defaultShiftId ? await ctx.db.get(employee.defaultShiftId) : null;
    const hasDefaultScheduleShift = Boolean(defaultScheduleShift && defaultScheduleShift.organizationId === user.organizationId && defaultScheduleShift.isActive);
    const employeeCalendar = workCalendars.find(calendar => calendar.locationId === employee.locationId)
      ?? workCalendars.find(calendar => !calendar.locationId);
    const weeklyOffDays = employeeCalendar?.weeklyOffDays ?? [];
    const applicableHolidayRows = holidays.filter(holiday => !holiday.locationId || holiday.locationId === employee.locationId);
    const holidayRows = applicableHolidayRows.filter(holiday => holiday.date <= monthEnd && (holiday.toDate ?? holiday.date) >= monthStart);
    const scheduleDays = [];
    for (let cursor = new Date(monthStart + "T00:00:00Z"); cursor <= new Date(monthEnd + "T00:00:00Z"); cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      const workDate = cursor.toISOString().slice(0, 10);
      const datedAssignments = monthShifts.filter(assignment => assignment.workDate === workDate);
      const isWeeklyOff = weeklyOffDays.includes(cursor.getUTCDay());
      const effectiveShiftIds = datedAssignments.length
        ? datedAssignments.map(assignment => assignment.shiftId)
        : (!isWeeklyOff && hasDefaultScheduleShift ? [defaultScheduleShift!._id] : []);
      const shiftsForDate = await Promise.all(effectiveShiftIds.map(async shiftId => {
        const shift = await ctx.db.get(shiftId);
        return shift && shift.organizationId === user.organizationId
          ? { id: shift._id, name: shift.name, startMinute: shift.startMinute, endMinute: shift.endMinute, breakMinutes: shift.breakMinutes }
          : null;
      }));
      const dayHolidays = holidayRows.filter(holiday => holiday.date <= workDate && (holiday.toDate ?? holiday.date) >= workDate).map(holiday => holiday.name);
      scheduleDays.push({
        date: workDate,
        shifts: shiftsForDate.filter((shift): shift is NonNullable<typeof shift> => Boolean(shift)),
        weeklyOff: isWeeklyOff && datedAssignments.length === 0,
        holidays: dayHolidays,
      });
    }
    // Count only effective scheduled working dates. Date-specific assignments override
    // the default shift; weekly offs and applicable holidays are not attendance days.
    const scheduledDateKeys = new Set(
      scheduleDays
        .filter(day => day.date <= today && day.shifts.length > 0 && day.holidays.length === 0)
        .map(day => day.date)
    );
    const attendedDateKeys = new Set(
      monthEvents
        .filter(event => event.eventType === "check_in" && (event.locationType === "remote" || event.geofencePassed === true || event.reviewStatus === "approved"))
        .map(event => dateKey(new Date(event.receivedAt)))
        .filter(workDate => scheduledDateKeys.has(workDate))
    );
    const attendedDays = attendedDateKeys.size;
    const scheduledDays = scheduledDateKeys.size;
    const todayAttendance = attendedDateKeys.has(today) ? { workDate: today } : null;
    const docsWithUrls = documents.map(doc => ({ ...doc, url: null }));
    const visibleWageRecords = wageRecords.filter(record => record.status === "approved" || record.status === "locked");
    const wagePeriods = await Promise.all(visibleWageRecords.map(record => ctx.db.get(record.wagePeriodId)));
    const leaveDefaults = await ctx.db.query("leaveDefaults").withIndex("by_org_year", q => q.eq("organizationId", user.organizationId).eq("periodYear", Number(today.slice(0, 4)))).collect();
    const effectiveLeaveBalances = [...leaveBalances];
    for (const entitlement of leaveDefaults) {
      if (!effectiveLeaveBalances.some(balance => balance.leaveTypeId === entitlement.leaveTypeId)) {
        effectiveLeaveBalances.push({ _id: `default-${entitlement._id}` as any, organizationId: user.organizationId, employeeId: employee._id, leaveTypeId: entitlement.leaveTypeId, periodYear: Number(today.slice(0, 4)), allocated: entitlement.allocated, used: 0, pending: 0, isOverride: false } as any);
      }
    }
    const leaveBalancesWithTypes = await Promise.all(effectiveLeaveBalances.map(async balance => ({ ...balance, leaveTypeName: (await ctx.db.get(balance.leaveTypeId))?.name ?? "Leave" })));
    const leaveRequestsWithTypes = await Promise.all(leaveRequests.map(async request => ({ ...request, leaveTypeName: (await ctx.db.get(request.leaveTypeId))?.name ?? "Leave" })));
    const weeklyWage = visibleWageRecords.map((record, index) => ({ ...record, period: wagePeriods[index] }))
      .find(record => record.period?.periodType === "weekly" && (record.status === "approved" || record.status === "locked") && record.period.fromDate <= weekEnd && record.period.toDate >= weekStart) ?? null;
    const upcoming: { type: string; title: string; date: string; endDate?: string; subtitle: string }[] = [];
    for (const holiday of applicableHolidayRows) { const holidayEnd = holiday.toDate ?? holiday.date; if (holiday.date <= upcomingEnd && holidayEnd >= today) upcoming.push({ type: "holiday", title: holiday.name, date: holiday.date < today ? today : holiday.date, endDate: holidayEnd, subtitle: "Company holiday" }); }
    for (const colleague of organizationEmployees) {
      if (colleague.status !== "active" || !colleague.dateOfBirth) continue;
      const birthday = colleague.dateOfBirth.slice(5, 10);
      for (let offset = 0; offset < 30; offset++) {
        const date = dayOffset(today, offset);
        if (date.slice(5, 10) === birthday) { upcoming.push({ type: "birthday", title: "Birthday · " + [colleague.firstName, colleague.lastName].filter(Boolean).join(" "), date, subtitle: colleague.departmentId === employee.departmentId ? "Your department" : "Orchid Flowers" }); break; }
      }
    }
    for (const assignment of upcomingShifts) {
      const shift = await ctx.db.get(assignment.shiftId);
      if (shift) upcoming.push({ type: "shift", title: shift.name, date: assignment.workDate, subtitle: "Scheduled shift · " + String(Math.floor(shift.startMinute / 60)).padStart(2, "0") + ":" + String(shift.startMinute % 60).padStart(2, "0") });
    }
    upcoming.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
    return {
      linked: true as const,
      timeZone,
      profile: { id: employee._id, employeeCode: employee.employeeCode, firstName: employee.firstName, lastName: employee.lastName ?? "", email: employee.email ?? user.email ?? "", phone: employee.phone, designation: employee.designation, employmentType: employee.employmentType, status: employee.status, joiningDate: employee.joiningDate },
      department: department ? { name: department.name } : null,
      location: location ? { name: location.name, address: location.address, locationType: location.locationType ?? "physical" } : null,
      shift: currentShift, shifts: validCurrentShifts, schedule: { month: monthStart.slice(0, 7), days: scheduleDays },
      attendance: attendance.map(event => ({ _id: event._id, eventType: event.eventType, receivedAt: event.receivedAt, clientTimestamp: event.clientTimestamp, accuracyM: event.accuracyM, geofencePassed: event.geofencePassed, locationType: event.locationType ?? "physical", reviewStatus: event.reviewStatus })), attendanceSummary: { attendedDays, scheduledDays, percentage: scheduledDays ? Math.round(attendedDays / scheduledDays * 100) : null }, performance: { attendanceDays: monthAttendanceDays.map(day => ({ workDate: day.workDate, payableMinutes: day.payableMinutes, breakMinutes: day.breakMinutes, firstCheckInAt: day.firstCheckInAt ?? null, lastCheckOutAt: day.lastCheckOutAt ?? null, status: day.status })), scheduledShifts: scheduledDays, scheduledWorkDates: [...scheduledDateKeys] }, todayAttendance, upcoming,
      leaveBalances: leaveBalancesWithTypes, leaveTypes: leaveTypes.filter(type => type.isActive).map(type => ({ id: type._id, name: type.name, code: type.code })), leaveRequests: leaveRequestsWithTypes, overtimeRequests: overtimeRequests.map(request => ({ _id: request._id, workDate: request.workDate, requestedMinutes: request.requestedMinutes, detectedMinutes: request.detectedMinutes, approvedMinutes: request.approvedMinutes, reason: request.reason, status: request.status, reviewerNote: request.reviewerNote, createdAt: request.createdAt, reviewedAt: request.reviewedAt, employeeConfirmedAt: request.employeeConfirmedAt, appliedMultiplier: request.appliedMultiplier })), documents: docsWithUrls,
      wageRecords: visibleWageRecords.map((record, index) => ({ ...record, period: wagePeriods[index] ? { fromDate: wagePeriods[index]!.fromDate, toDate: wagePeriods[index]!.toDate, status: wagePeriods[index]!.status, periodType: wagePeriods[index]!.periodType } : null })),
      weeklyWage: weeklyWage ? { totalPaise: weeklyWage.totalPaise, payableUnits: weeklyWage.payableUnits, employmentType: weeklyWage.employmentType, status: weeklyWage.status, period: weeklyWage.period ? { fromDate: weeklyWage.period.fromDate, toDate: weeklyWage.period.toDate } : null } : null,
      notifications,
    };
  },
});



function isValidRequestDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00.000Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

async function getActiveEmployeeForRequest(ctx: MutationCtx) {
  const user = await requireIdentity(ctx);
  if (!user.employeeId) throw new Error("EMPLOYEE_PROFILE_REQUIRED");
  const employee = await ctx.db.get(user.employeeId);
  if (!employee || employee.organizationId !== user.organizationId || employee.status !== "active") {
    throw new Error("EMPLOYEE_INACTIVE");
  }
  return { user, employee };
}

export const submitMyLeaveRequest = mutation({
  args: {
    leaveTypeId: v.id("leaveTypes"),
    fromDate: v.string(),
    toDate: v.string(),
    daySelections: v.array(v.object({
      date: v.string(),
      portion: v.union(v.literal("full"), v.literal("first_half"), v.literal("second_half")),
    })),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, employee } = await getActiveEmployeeForRequest(ctx);
    if (!isValidRequestDate(args.fromDate) || !isValidRequestDate(args.toDate) || args.fromDate > args.toDate) throw new Error("INVALID_LEAVE_DATE_RANGE");
    if (args.fromDate.slice(0, 4) !== args.toDate.slice(0, 4)) throw new Error("CROSS_YEAR_LEAVE_REQUIRES_SPLIT_REQUEST");
    const reason = args.reason.trim();
    if (!reason || reason.length > 1000) throw new Error("INVALID_LEAVE_REASON");
    if (!args.daySelections.length || args.daySelections.length > 62) throw new Error("INVALID_LEAVE_SELECTION");
    const leaveType = await ctx.db.get(args.leaveTypeId);
    if (!leaveType || leaveType.organizationId !== user.organizationId || !leaveType.isActive) throw new Error("INVALID_LEAVE_TYPE");
    const dates = args.daySelections.map(selection => selection.date);
    if (new Set(dates).size !== dates.length || dates.some(date => !isValidRequestDate(date) || date < args.fromDate || date > args.toDate)) throw new Error("INVALID_LEAVE_SELECTION");
    const [assignments, holidays, balances, existing] = await Promise.all([
      ctx.db.query("shiftAssignments").withIndex("by_employee_date", q => q.eq("employeeId", employee._id).gte("workDate", args.fromDate).lte("workDate", args.toDate)).collect(),
      ctx.db.query("holidays").withIndex("by_org_date", q => q.eq("organizationId", user.organizationId)).collect(),
      ctx.db.query("leaveBalances").withIndex("by_employee_year", q => q.eq("employeeId", employee._id).eq("periodYear", Number(args.fromDate.slice(0, 4)))).collect(),
      ctx.db.query("leaveRequests").withIndex("by_employee", q => q.eq("employeeId", employee._id)).collect(),
    ]);
    if (existing.some(r => r.status === "pending" && r.fromDate <= args.toDate && r.toDate >= args.fromDate)) throw new Error("OVERLAPPING_PENDING_LEAVE_REQUEST");
    const applicableHolidays = holidays.filter(h => !h.locationId || h.locationId === employee.locationId);
    const isHoliday = (date: string) => applicableHolidays.some(h => h.date <= date && (h.toDate ?? h.date) >= date);
    const scheduledDates = new Set(assignments.map(assignment => assignment.workDate));
    const defaultShift = employee.defaultShiftId ? await ctx.db.get(employee.defaultShiftId) : null;
    const hasValidDefaultShift = Boolean(defaultShift && defaultShift.organizationId === user.organizationId && defaultShift.isActive);
    for (const date of dates) {
      if (!scheduledDates.has(date) && !hasValidDefaultShift) throw new Error("LEAVE_DATE_NOT_SCHEDULED");
      if (isHoliday(date)) throw new Error("LEAVE_DATE_IS_HOLIDAY");
    }
    const requestedDays = args.daySelections.reduce((total, selection) => total + (selection.portion === "full" ? 1 : 0.5), 0);
    let balance = balances.find(b => b.leaveTypeId === leaveType._id);
    if (!balance) {
      const defaults = await ctx.db.query("leaveDefaults").withIndex("by_org_year", q => q.eq("organizationId", user.organizationId).eq("periodYear", Number(args.fromDate.slice(0, 4)))).collect();
      const entitlement = defaults.find(item => item.leaveTypeId === leaveType._id);
      if (!entitlement) throw new Error("LEAVE_BALANCE_NOT_CONFIGURED");
      const balanceId = await ctx.db.insert("leaveBalances", { organizationId: user.organizationId, employeeId: employee._id, leaveTypeId: leaveType._id, periodYear: Number(args.fromDate.slice(0, 4)), allocated: entitlement.allocated, used: 0, pending: 0, isOverride: false });
      const createdBalance = await ctx.db.get(balanceId);
      if (!createdBalance) throw new Error("LEAVE_BALANCE_CREATION_FAILED");
      balance = createdBalance;
    }
    if (balance.used + balance.pending + requestedDays > balance.allocated) throw new Error("INSUFFICIENT_LEAVE_BALANCE");
    await ctx.db.patch(balance._id, { pending: balance.pending + requestedDays });
    const now = Date.now();
    const requestId = await ctx.db.insert("leaveRequests", {
      organizationId: user.organizationId, employeeId: employee._id, leaveTypeId: leaveType._id,
      fromDate: args.fromDate, toDate: args.toDate, requestedDays,
      daySelections: args.daySelections.slice().sort((a, b) => a.date.localeCompare(b.date)),
      reason, status: "pending", createdAt: now,
    });
    await ctx.db.insert("auditLogs", {
      organizationId: user.organizationId, actorUserId: user._id, action: "leave.submitted",
      entityType: "leaveRequest", entityId: String(requestId),
      metadata: { employeeCode: employee.employeeCode, leaveType: leaveType.code, fromDate: args.fromDate, toDate: args.toDate, requestedDays, daySelections: args.daySelections },
      createdAt: now,
    });
    return { requestId, requestedDays };
  },
});

export const submitMyOvertimeRequest = mutation({
  args: { workDate: v.string(), requestedMinutes: v.number(), reason: v.string() },
  handler: async () => {
    throw new Error("OVERTIME_AUTOMATICALLY_DETECTED");
  },
});

export const confirmMyOvertimeRequest = mutation({
  args: { requestId: v.id("overtimeRequests"), confirmed: v.boolean() },
  handler: async (ctx, args) => {
    const { user, employee } = await getActiveEmployeeForRequest(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request || request.organizationId !== user.organizationId || request.employeeId !== employee._id) throw new Error("OVERTIME_REQUEST_NOT_FOUND");
    if (request.status !== "awaiting_employee_confirmation") {
      // A repeated tap or retry should return the recorded employee decision.
      if (request.status === "pending" && request.employeeConfirmedBy === user._id) {
        return { confirmed: true, alreadyConfirmed: true };
      }
      if (request.status === "rejected" && request.reviewedBy === user._id &&
          request.reviewerNote === "Employee declined the automatically detected overtime.") {
        return { confirmed: false, alreadyConfirmed: true };
      }
      throw new Error("OVERTIME_REQUEST_NOT_AWAITING_CONFIRMATION");
    }
    const now = Date.now();
    if (!args.confirmed) {
      await ctx.db.patch(request._id, { status: "rejected", reviewerNote: "Employee declined the automatically detected overtime.", reviewedAt: now, reviewedBy: user._id });
      await ctx.db.insert("auditLogs", { organizationId: user.organizationId, actorUserId: user._id, action: "overtime.employee_declined", entityType: "overtimeRequest", entityId: String(request._id), metadata: { workDate: request.workDate, detectedMinutes: request.detectedMinutes ?? request.requestedMinutes }, createdAt: now });
      return { confirmed: false };
    }
    await ctx.db.patch(request._id, { status: "pending", employeeConfirmedAt: now, employeeConfirmedBy: user._id, submittedBy: user._id });
    await ctx.db.insert("auditLogs", { organizationId: user.organizationId, actorUserId: user._id, action: "overtime.employee_confirmed", entityType: "overtimeRequest", entityId: String(request._id), metadata: { workDate: request.workDate, requestedMinutes: request.requestedMinutes }, createdAt: now });
    return { confirmed: true };
  },
});

export const generateDocumentUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireIdentity(ctx);
    if (!user.employeeId) throw new Error("EMPLOYEE_PROFILE_REQUIRED");
    const employee = await ctx.db.get(user.employeeId);
    if (!employee || employee.organizationId !== user.organizationId || employee.status !== "active") {
      throw new Error("EMPLOYEE_INACTIVE");
    }
    return ctx.storage.generateUploadUrl();
  },
});

export const saveMyDocument = mutation({
  args: {
    storageId: v.id("_storage"),
    documentType: v.string(),
    originalFileName: v.string(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireIdentity(ctx);
    if (!user.employeeId) throw new Error("EMPLOYEE_PROFILE_REQUIRED");
    const employee = await ctx.db.get(user.employeeId);
    if (!employee || employee.organizationId !== user.organizationId || employee.status !== "active") {
      throw new Error("EMPLOYEE_INACTIVE");
    }
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(args.mimeType)) throw new Error("UNSUPPORTED_DOCUMENT_TYPE");
    if (!args.documentType.trim() || !args.originalFileName.trim()) throw new Error("DOCUMENT_DETAILS_REQUIRED");
    const metadata = await ctx.storage.getMetadata(args.storageId);
    if (!metadata || metadata.contentType !== args.mimeType) throw new Error("DOCUMENT_UPLOAD_INVALID");
    const documentId = await ctx.db.insert("employeeDocuments", {
      organizationId: user.organizationId,
      employeeId: employee._id,
      documentType: args.documentType.trim(),
      storageId: args.storageId,
      originalFileName: args.originalFileName.trim(),
      mimeType: args.mimeType,
      uploadedBy: user._id,
      uploadedAt: Date.now(),
      reviewStatus: "pending",
    });
    await ctx.db.insert("auditLogs", {
      organizationId: user.organizationId,
      actorUserId: user._id,
      action: "employee.document.uploaded",
      entityType: "employeeDocument",
      entityId: String(documentId),
      metadata: { documentType: args.documentType.trim(), originalFileName: args.originalFileName.trim() },
      createdAt: Date.now(),
    });
    return documentId;
  },
});


/**
 * Admin directory: returns every employee status for the caller's organization.
 * Personal and compensation-sensitive fields are intentionally excluded.
 */
export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireIdentity(ctx);
    if (user.role !== "superadmin" && user.role !== "supervisor") {
      throw new Error("FORBIDDEN");
    }

    const employees = await ctx.db
      .query("employees")
      .withIndex("by_org_code", (q) => q.eq("organizationId", user.organizationId))
      .order("asc")
      .collect();

    return await Promise.all(employees.map(async (employee) => {
      const [department, location, defaultShift] = await Promise.all([
        ctx.db.get(employee.departmentId),
        ctx.db.get(employee.locationId),
        employee.defaultShiftId ? ctx.db.get(employee.defaultShiftId) : null,
      ]);
      return {
        _id: employee._id,
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName ?? "",
        email: employee.email ?? "",
        phone: employee.phone,
        designation: employee.designation,
        employmentType: employee.employmentType,
        status: employee.status,
        joiningDate: employee.joiningDate,
        departmentId: employee.departmentId,
        locationId: employee.locationId,
        defaultShiftId: employee.defaultShiftId ?? null,
        departmentName: department?.name ?? "Unassigned",
        locationName: location?.name ?? "Unassigned",
        defaultShiftName: defaultShift?.name ?? "Not assigned",
      };
    }));
  },
});


/** HR lookup data for the onboarding form. */
export const listOnboardingOptions = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireIdentity(ctx);
    if (user.role !== "superadmin" && user.role !== "supervisor") throw new Error("FORBIDDEN");
    const [departments, locations, shifts] = await Promise.all([
      ctx.db.query("departments").withIndex("by_org_code", q => q.eq("organizationId", user.organizationId)).collect(),
      ctx.db.query("locations").withIndex("by_org", q => q.eq("organizationId", user.organizationId)).collect(),
      ctx.db.query("shifts").withIndex("by_org", q => q.eq("organizationId", user.organizationId)).collect(),
    ]);
    return {
      departments: departments.filter(item => item.isActive).map(item => ({ _id: item._id, name: item.name })),
      locations: locations.filter(item => item.isActive).map(item => ({ _id: item._id, name: item.name, locationType: item.locationType ?? "physical" })),
      shifts: shifts.filter(item => item.isActive).map(item => ({ _id: item._id, name: item.name })),
    };
  },
});


/** Creates an active department for the caller's organization. */
export const createDepartmentForAdmin = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireIdentity(ctx);
    if (admin.role !== "superadmin") throw new Error("FORBIDDEN");
    const name = args.name.trim().replace(/\s+/g, " ");
    if (!name || name.length > 80) throw new Error("INVALID_DEPARTMENT_NAME");
    const existing = await ctx.db.query("departments").withIndex("by_org_code", q => q.eq("organizationId", admin.organizationId)).collect();
    if (existing.some(item => item.name.trim().toLowerCase() === name.toLowerCase())) throw new Error("DEPARTMENT_ALREADY_EXISTS");
    const baseCode = name.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "DEPT";
    const used = new Set(existing.map(item => item.code.toUpperCase()));
    let code = baseCode, suffix = 2;
    while (used.has(code)) code = `${baseCode.slice(0, 20)}-${suffix++}`;
    const departmentId = await ctx.db.insert("departments", { organizationId: admin.organizationId, name, code, isActive: true });
    await ctx.db.insert("auditLogs", { organizationId: admin.organizationId, actorUserId: admin._id, action: "department.created", entityType: "department", entityId: String(departmentId), metadata: { name, code, source: "employee-onboarding" }, createdAt: Date.now() });
    return { departmentId, name };
  },
});

/** Creates an inactive location draft until address and GPS geofence setup is completed. */
export const createLocationDraftForAdmin = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireIdentity(ctx);
    if (admin.role !== "superadmin") throw new Error("FORBIDDEN");
    const name = args.name.trim().replace(/\s+/g, " ");
    if (!name || name.length > 80) throw new Error("INVALID_LOCATION_NAME");
    const existing = await ctx.db.query("locations").withIndex("by_org", q => q.eq("organizationId", admin.organizationId)).collect();
    if (existing.some(item => item.name.trim().toLowerCase() === name.toLowerCase())) throw new Error("LOCATION_ALREADY_EXISTS");
    const baseCode = name.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "LOC";
    const used = new Set(existing.map(item => item.code.toUpperCase()));
    let code = baseCode, suffix = 2;
    while (used.has(code)) code = `${baseCode.slice(0, 20)}-${suffix++}`;
    const locationId = await ctx.db.insert("locations", { organizationId: admin.organizationId, name, code, address: "", latitude: 0, longitude: 0, geofenceRadiusM: 0, isActive: false, createdAt: Date.now() });
    await ctx.db.insert("auditLogs", { organizationId: admin.organizationId, actorUserId: admin._id, action: "location.draft_created", entityType: "location", entityId: String(locationId), metadata: { name, code, requiresAddressAndGeofenceSetup: true, source: "employee-onboarding" }, createdAt: Date.now() });
    return { locationId, name, isActive: false };
  },
});

/** Registered employee-role accounts and their current employee link. */
export const listAccountsForLinking = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireIdentity(ctx);
    if (admin.role !== "superadmin") throw new Error("FORBIDDEN");
    const users = await ctx.db.query("users")
      .withIndex("by_org", q => q.eq("organizationId", admin.organizationId))
      .order("desc")
      .collect();
    return await Promise.all(users.map(async account => {
      const employee = account.employeeId ? await ctx.db.get(account.employeeId) : null;
      return {
        _id: account._id,
        fullName: account.fullName ?? "",
        email: account.email ?? "",
        role: account.role,
        accountStatus: account.accountStatus ?? "active",
        createdAt: account.createdAt,
        employeeId: account.employeeId ?? null,
        employeeName: employee && employee.organizationId === admin.organizationId
          ? `${employee.firstName} ${employee.lastName ?? ""}`.trim()
          : null,
        employeeCode: employee && employee.organizationId === admin.organizationId ? employee.employeeCode : null,
      };
    }));
  },
});

/** Creates an employee and optionally links an already registered account atomically. */
export const createForAdmin = mutation({
  args: {
    firstName: v.string(),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.string(),
    designation: v.string(),
    employmentType: v.union(v.literal("permanent"), v.literal("hourly"), v.literal("daily"), v.literal("contract")),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("pending"), v.literal("archived")),
    joiningDate: v.string(),
    departmentId: v.id("departments"),
    locationId: v.id("locations"),
    defaultShiftId: v.optional(v.id("shifts")),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const admin = await requireIdentity(ctx);
    if (admin.role !== "superadmin") throw new Error("FORBIDDEN");
    const firstName = args.firstName.trim();
    const lastName = args.lastName?.trim();
    const phone = args.phone.trim();
    const designation = args.designation.trim();
    const email = args.email?.trim().toLowerCase();
    if (!firstName || !phone || !designation || !args.joiningDate) throw new Error("REQUIRED_EMPLOYEE_FIELDS");
    const [department, location, defaultShift] = await Promise.all([
      ctx.db.get(args.departmentId),
      ctx.db.get(args.locationId),
      args.defaultShiftId ? ctx.db.get(args.defaultShiftId) : null,
    ]);
    if (!department || department.organizationId !== admin.organizationId || !department.isActive) throw new Error("INVALID_DEPARTMENT");
    if (!location || location.organizationId !== admin.organizationId || !location.isActive) throw new Error("INVALID_LOCATION");
    if (args.defaultShiftId && (!defaultShift || defaultShift.organizationId !== admin.organizationId || !defaultShift.isActive)) throw new Error("INVALID_DEFAULT_SHIFT");

    // Scan the organization's retained records so archived codes are never reused.
    const existingEmployees = await ctx.db.query("employees")
      .withIndex("by_org_code", q => q.eq("organizationId", admin.organizationId))
      .collect();
    const highest = existingEmployees.reduce((max, employee) => {
      const match = /^ORC-(\d+)$/.exec(employee.employeeCode);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    const employeeCode = `ORC-${String(highest + 1).padStart(4, "0")}`;
    if (existingEmployees.some(employee => employee.employeeCode === employeeCode)) throw new Error("EMPLOYEE_CODE_CONFLICT");

    const linkedUser = args.userId ? await ctx.db.get(args.userId) : null;
    if (args.userId) {
      if (!linkedUser || linkedUser.organizationId !== admin.organizationId) throw new Error("ACCOUNT_NOT_FOUND");
      if (linkedUser.role !== "employee") throw new Error("ONLY_EMPLOYEE_ACCOUNTS_CAN_BE_LINKED");
      if (linkedUser.employeeId) throw new Error("ACCOUNT_ALREADY_LINKED");
    }

    const now = Date.now();
    const employeeId = await ctx.db.insert("employees", {
      organizationId: admin.organizationId,
      locationId: args.locationId,
      employeeCode,
      firstName,
      lastName: lastName || undefined,
      email: email || undefined,
      phone,
      departmentId: args.departmentId,
      designation,
      defaultShiftId: args.defaultShiftId,
      employmentType: args.employmentType,
      status: args.status,
      joiningDate: args.joiningDate,
      createdAt: now,
      updatedAt: now,
    });

    if (linkedUser) {
      await ctx.db.patch(linkedUser._id, { employeeId });
      await ctx.db.insert("auditLogs", {
        organizationId: admin.organizationId,
        actorUserId: admin._id,
        action: "user.employee.linked",
        entityType: "user",
        entityId: String(linkedUser._id),
        metadata: { employeeId: String(employeeId), employeeCode, source: "onboarding" },
        createdAt: now,
      });
    }
    await ctx.db.insert("auditLogs", {
      organizationId: admin.organizationId,
      actorUserId: admin._id,
      action: "employee.created",
      entityType: "employee",
      entityId: String(employeeId),
      metadata: { employeeCode, linkedUserId: linkedUser ? String(linkedUser._id) : null },
      createdAt: now,
    });
    return { employeeId, employeeCode, linked: Boolean(linkedUser) };
  },
});

/** Links an existing account to an existing employee without changing login status or role. */
export const linkAccount = mutation({
  args: { userId: v.id("users"), employeeId: v.id("employees") },
  handler: async (ctx, args) => {
    const admin = await requireIdentity(ctx);
    if (admin.role !== "superadmin") throw new Error("FORBIDDEN");
    const [account, employee] = await Promise.all([ctx.db.get(args.userId), ctx.db.get(args.employeeId)]);
    if (!account || account.organizationId !== admin.organizationId) throw new Error("ACCOUNT_NOT_FOUND");
    if (!employee || employee.organizationId !== admin.organizationId) throw new Error("EMPLOYEE_NOT_FOUND");
    if (account.role !== "employee") throw new Error("ONLY_EMPLOYEE_ACCOUNTS_CAN_BE_LINKED");
    if (account.employeeId) throw new Error("ACCOUNT_ALREADY_LINKED");
    const linkedUsers = await ctx.db.query("users")
      .withIndex("by_org_employee", q => q.eq("organizationId", admin.organizationId).eq("employeeId", employee._id))
      .collect();
    if (linkedUsers.length) throw new Error("EMPLOYEE_ALREADY_LINKED");
    const now = Date.now();
    await ctx.db.patch(account._id, { employeeId: employee._id });
    await ctx.db.insert("auditLogs", {
      organizationId: admin.organizationId,
      actorUserId: admin._id,
      action: "user.employee.linked",
      entityType: "user",
      entityId: String(account._id),
      metadata: { employeeId: String(employee._id), employeeCode: employee.employeeCode, source: "user-management" },
      createdAt: now,
    });
    return { linked: true };
  },
});


/** Unlinks an employee record while preserving both account and employee history. */
export const unlinkAccount = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const admin = await requireIdentity(ctx);
    if (admin.role !== "superadmin") throw new Error("FORBIDDEN");
    const account = await ctx.db.get(userId);
    if (!account || account.organizationId !== admin.organizationId) throw new Error("ACCOUNT_NOT_FOUND");
    if (account.role !== "employee") throw new Error("ONLY_EMPLOYEE_ACCOUNTS_CAN_BE_UNLINKED");
    if (!account.employeeId) return true;
    const employee = await ctx.db.get(account.employeeId);
    await ctx.db.patch(account._id, { employeeId: undefined });
    await ctx.db.insert("auditLogs", {
      organizationId: admin.organizationId, actorUserId: admin._id,
      action: "user.employee.unlinked", entityType: "user", entityId: String(account._id),
      metadata: { employeeId: String(account.employeeId), employeeCode: employee?.employeeCode ?? null },
      createdAt: Date.now(),
    });
    return true;
  },
});

/** Role changes are restricted to superadmins and never permit self-demotion. */
export const updateAccountRole = mutation({
  args: { userId: v.id("users"), role: v.union(v.literal("superadmin"), v.literal("supervisor"), v.literal("employee")) },
  handler: async (ctx, args) => {
    const admin = await requireIdentity(ctx);
    if (admin.role !== "superadmin") throw new Error("SUPERADMIN_REQUIRED");
    const account = await ctx.db.get(args.userId);
    if (!account || account.organizationId !== admin.organizationId) throw new Error("ACCOUNT_NOT_FOUND");
    if (account._id === admin._id && args.role !== "superadmin") throw new Error("CANNOT_CHANGE_OWN_SUPERADMIN_ROLE");
    if (account.role === "superadmin" && args.role !== "superadmin") {
      const superadmins = await ctx.db.query("users").withIndex("by_org", q => q.eq("organizationId", admin.organizationId)).collect();
      if (superadmins.filter(user => user.role === "superadmin" && user.isActive && user.accountStatus !== "suspended").length <= 1) {
        throw new Error("CANNOT_REMOVE_LAST_ACTIVE_SUPERADMIN");
      }
    }
    const previousRole = account.role;
    if (previousRole === args.role) return true;
    await ctx.db.patch(account._id, { role: args.role });
    await ctx.db.insert("auditLogs", {
      organizationId: admin.organizationId, actorUserId: admin._id,
      action: "user.role_updated", entityType: "user", entityId: String(account._id),
      metadata: { previousRole, newRole: args.role }, createdAt: Date.now(),
    });
    return true;
  },
});

/** Account access lifecycle is restricted to superadmins. */
export const setAccountStatus = mutation({
  args: { userId: v.id("users"), status: v.union(v.literal("active"), v.literal("suspended")) },
  handler: async (ctx, args) => {
    const admin = await requireIdentity(ctx);
    if (admin.role !== "superadmin") throw new Error("SUPERADMIN_REQUIRED");
    const account = await ctx.db.get(args.userId);
    if (!account || account.organizationId !== admin.organizationId) throw new Error("ACCOUNT_NOT_FOUND");
    if (account._id === admin._id && args.status === "suspended") throw new Error("CANNOT_SUSPEND_OWN_ACCOUNT");
    if (account.role === "superadmin" && args.status === "suspended" && account.isActive) {
      const superadmins = await ctx.db.query("users").withIndex("by_org", q => q.eq("organizationId", admin.organizationId)).collect();
      if (superadmins.filter(user => user.role === "superadmin" && user.isActive && user.accountStatus !== "suspended" && user._id !== account._id).length === 0) {
        throw new Error("CANNOT_SUSPEND_LAST_ACTIVE_SUPERADMIN");
      }
    }
    const isActive = args.status === "active";
    if ((account.accountStatus ?? "active") === args.status && account.isActive === isActive) return true;
    const previousStatus = account.accountStatus ?? "active";
    await ctx.db.patch(account._id, { accountStatus: args.status, isActive });
    await ctx.db.insert("auditLogs", {
      organizationId: admin.organizationId, actorUserId: admin._id,
      action: "user.account_status_updated", entityType: "user", entityId: String(account._id),
      metadata: { previousStatus, newStatus: args.status }, createdAt: Date.now(),
    });
    return true;
  },
});
