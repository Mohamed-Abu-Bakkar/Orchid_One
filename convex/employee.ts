import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./lib/auth";

export const myWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireIdentity(ctx);
    const emptyWorkspace = { linked: false as const, profile: null, department: null, location: null, shift: null, shifts: [], attendance: [], attendanceSummary: null, todayAttendance: null, upcoming: [], leaveBalances: [], leaveRequests: [], documents: [], wageRecords: [], weeklyWage: null, notifications: [] };
    if (!user.employeeId) return emptyWorkspace;
    const employee = await ctx.db.get(user.employeeId);
    if (!employee || employee.organizationId !== user.organizationId || employee.status !== "active") return emptyWorkspace;
    const now = new Date();
    const dateKey = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date);
    const today = dateKey(now), monthStart = today.slice(0, 7) + "-01";
    const dayOffset = (value: string, days: number) => { const date = new Date(value + "T00:00:00Z"); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10); };
    const weekStartDate = new Date(today + "T00:00:00Z"), weekday = (weekStartDate.getUTCDay() + 6) % 7;
    weekStartDate.setUTCDate(weekStartDate.getUTCDate() - weekday);
    const weekStart = dateKey(weekStartDate), weekEnd = dayOffset(weekStart, 6), upcomingEnd = dayOffset(today, 14);
    const monthStartAt = new Date(monthStart + "T00:00:00+05:30");
    const nextMonthDate = new Date(monthStart + "T00:00:00Z");
    nextMonthDate.setUTCMonth(nextMonthDate.getUTCMonth() + 1);
    const monthEnd = dayOffset(nextMonthDate.toISOString().slice(0, 10), -1);
    const nextMonthStartAt = new Date(nextMonthDate.toISOString().slice(0, 10) + "T00:00:00+05:30");
    const [department, location, attendance, leaveBalances, leaveRequests, documents, wageRecords, notifications, monthEvents, monthShifts, todayShiftAssignments, upcomingShifts, holidays, organizationEmployees] = await Promise.all([
      ctx.db.get(employee.departmentId), ctx.db.get(employee.locationId),
      ctx.db.query("attendanceEvents").withIndex("by_employee_time", q => q.eq("employeeId", employee._id)).order("desc").take(500),
      ctx.db.query("leaveBalances").withIndex("by_employee_year", q => q.eq("employeeId", employee._id).eq("periodYear", Number(today.slice(0, 4)))).collect(),
      ctx.db.query("leaveRequests").withIndex("by_employee", q => q.eq("employeeId", employee._id)).order("desc").take(30),
      ctx.db.query("employeeDocuments").withIndex("by_employee", q => q.eq("employeeId", employee._id)).order("desc").take(30),
      ctx.db.query("wageRecords").withIndex("by_employee", q => q.eq("employeeId", employee._id)).order("desc").take(12),
      ctx.db.query("notifications").withIndex("by_user", q => q.eq("userId", user._id)).order("desc").take(30),
      ctx.db.query("attendanceEvents").withIndex("by_employee_time", q => q.eq("employeeId", employee._id).gte("receivedAt", monthStartAt.getTime()).lt("receivedAt", nextMonthStartAt.getTime())).collect(),
      ctx.db.query("shiftAssignments").withIndex("by_employee_date", q => q.eq("employeeId", employee._id).gte("workDate", monthStart).lte("workDate", monthEnd)).collect(),
      ctx.db.query("shiftAssignments").withIndex("by_employee_date", q => q.eq("employeeId", employee._id).eq("workDate", today)).collect(),
      ctx.db.query("shiftAssignments").withIndex("by_employee_date", q => q.eq("employeeId", employee._id).gt("workDate", today).lte("workDate", upcomingEnd)).collect(),
      ctx.db.query("holidays").withIndex("by_org_date", q => q.eq("organizationId", user.organizationId).gte("date", today).lte("date", upcomingEnd)).collect(),
      ctx.db.query("employees").withIndex("by_org_code", q => q.eq("organizationId", user.organizationId)).collect(),
    ]);
    const currentShiftRows = todayShiftAssignments.length ? todayShiftAssignments : (employee.defaultShiftId ? [{ shiftId: employee.defaultShiftId, workDate: today }] : []);
    const currentShifts = await Promise.all(currentShiftRows.map(async assignment => {
      const shift = await ctx.db.get(assignment.shiftId);
      return shift ? { name: shift.name, startMinute: shift.startMinute, endMinute: shift.endMinute, breakMinutes: shift.breakMinutes, workDate: today } : null;
    }));
    const validCurrentShifts = currentShifts.filter((shift): shift is NonNullable<typeof shift> => Boolean(shift));
    const currentShift = validCurrentShifts[0] ?? null;
    const docsWithUrls = documents.map(doc => ({ ...doc, url: null }));
    const wagePeriods = await Promise.all(wageRecords.map(record => ctx.db.get(record.wagePeriodId)));
    const leaveBalancesWithTypes = await Promise.all(leaveBalances.map(async balance => ({ ...balance, leaveTypeName: (await ctx.db.get(balance.leaveTypeId))?.name ?? "Leave" })));
    const attendedDateKeys = new Set(monthEvents.filter(event => event.geofencePassed || event.reviewStatus === "approved").filter(event => event.eventType === "check_in").map(event => dateKey(new Date(event.receivedAt))));
    const attendedDays = attendedDateKeys.size;
    const scheduledDays = new Set(monthShifts.map(assignment => assignment.workDate)).size;
    const todayAttendance = monthEvents.some(event => dateKey(new Date(event.receivedAt)) === today && (event.geofencePassed || event.reviewStatus === "approved")) ? { workDate: today } : null;
    const weeklyWage = wageRecords.map((record, index) => ({ ...record, period: wagePeriods[index] }))
      .find(record => record.period?.periodType === "weekly" && (record.status === "approved" || record.status === "locked") && record.period.fromDate <= weekEnd && record.period.toDate >= weekStart) ?? null;
    const upcoming: { type: string; title: string; date: string; subtitle: string }[] = [];
    for (const holiday of holidays) if (!holiday.locationId || holiday.locationId === employee.locationId) upcoming.push({ type: "holiday", title: holiday.name, date: holiday.date, subtitle: "Company holiday" });
    for (const colleague of organizationEmployees) {
      if (colleague.status !== "active" || !colleague.dateOfBirth) continue;
      const birthday = colleague.dateOfBirth.slice(5, 10);
      for (let offset = 0; offset <= 14; offset++) {
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
      profile: { id: employee._id, employeeCode: employee.employeeCode, firstName: employee.firstName, lastName: employee.lastName ?? "", email: employee.email ?? user.email ?? "", phone: employee.phone, designation: employee.designation, employmentType: employee.employmentType, status: employee.status, joiningDate: employee.joiningDate },
      department: department ? { name: department.name } : null,
      location: location ? { name: location.name, address: location.address } : null,
      shift: currentShift, shifts: validCurrentShifts,
      attendance, attendanceSummary: { attendedDays, scheduledDays, percentage: scheduledDays ? Math.round(attendedDays / scheduledDays * 100) : null }, todayAttendance, upcoming,
      leaveBalances: leaveBalancesWithTypes, leaveRequests, documents: docsWithUrls,
      wageRecords: wageRecords.map((record, index) => ({ ...record, period: wagePeriods[index] ? { fromDate: wagePeriods[index]!.fromDate, toDate: wagePeriods[index]!.toDate, status: wagePeriods[index]!.status, periodType: wagePeriods[index]!.periodType } : null })),
      weeklyWage: weeklyWage ? { totalPaise: weeklyWage.totalPaise, payableUnits: weeklyWage.payableUnits, employmentType: weeklyWage.employmentType, status: weeklyWage.status, period: weeklyWage.period ? { fromDate: weeklyWage.period.fromDate, toDate: weeklyWage.period.toDate } : null } : null,
      notifications,
    };
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
      locations: locations.filter(item => item.isActive).map(item => ({ _id: item._id, name: item.name })),
      shifts: shifts.filter(item => item.isActive).map(item => ({ _id: item._id, name: item.name })),
    };
  },
});


/** Creates an active department for the caller's organization. */
export const createDepartmentForAdmin = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireIdentity(ctx);
    if (admin.role !== "superadmin" && admin.role !== "supervisor") throw new Error("FORBIDDEN");
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
    if (admin.role !== "superadmin" && admin.role !== "supervisor") throw new Error("FORBIDDEN");
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
    if (admin.role !== "superadmin" && admin.role !== "supervisor") throw new Error("FORBIDDEN");
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
    if (admin.role !== "superadmin" && admin.role !== "supervisor") throw new Error("FORBIDDEN");
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
    if (admin.role !== "superadmin" && admin.role !== "supervisor") throw new Error("FORBIDDEN");
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
    if (admin.role !== "superadmin" && admin.role !== "supervisor") throw new Error("FORBIDDEN");
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
