import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./lib/auth";

export const myWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireIdentity(ctx);
    if (!user.employeeId) {
      return {
        linked: false as const,
        profile: null,
        department: null,
        location: null,
        shift: null,
        attendance: [],
        leaveBalances: [],
        leaveRequests: [],
        documents: [],
        wageRecords: [],
        notifications: [],
      };
    }

    const employee = await ctx.db.get(user.employeeId);
    if (!employee || employee.organizationId !== user.organizationId) {
      return {
        linked: false as const,
        profile: null,
        department: null,
        location: null,
        shift: null,
        attendance: [],
        leaveBalances: [],
        leaveRequests: [],
        documents: [],
        wageRecords: [],
        notifications: [],
      };
    }

    const [department, location, attendance, leaveBalances, leaveRequests, documents, wageRecords, notifications] =
      await Promise.all([
        ctx.db.get(employee.departmentId),
        ctx.db.get(employee.locationId),
        ctx.db.query("attendanceEvents").withIndex("by_employee_time", q => q.eq("employeeId", employee._id)).order("desc").take(30),
        ctx.db.query("leaveBalances").withIndex("by_employee_year", q => q.eq("employeeId", employee._id)).order("desc").take(20),
        ctx.db.query("leaveRequests").withIndex("by_employee", q => q.eq("employeeId", employee._id)).order("desc").take(30),
        ctx.db.query("employeeDocuments").withIndex("by_employee", q => q.eq("employeeId", employee._id)).order("desc").take(30),
        ctx.db.query("wageRecords").withIndex("by_employee", q => q.eq("employeeId", employee._id)).order("desc").take(12),
        ctx.db.query("notifications").withIndex("by_user", q => q.eq("userId", user._id)).order("desc").take(30),
      ]);

    const latestShiftAssignment = await ctx.db.query("shiftAssignments")
      .withIndex("by_employee_date", q => q.eq("employeeId", employee._id))
      .order("desc")
      .first();
    const shift = latestShiftAssignment ? await ctx.db.get(latestShiftAssignment.shiftId) : null;

    const docsWithUrls = await Promise.all(documents.map(async doc => ({
      ...doc,
      url: await ctx.storage.getUrl(doc.storageId),
    })));

    const wagePeriods = await Promise.all(wageRecords.map(record => ctx.db.get(record.wagePeriodId)));

    return {
      linked: true as const,
      profile: {
        id: employee._id,
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName ?? "",
        email: employee.email ?? user.email ?? "",
        phone: employee.phone,
        designation: employee.designation,
        employmentType: employee.employmentType,
        status: employee.status,
        joiningDate: employee.joiningDate,
      },
      department: department ? { name: department.name } : null,
      location: location ? { name: location.name, address: location.address } : null,
      shift: shift ? { name: shift.name, startMinute: shift.startMinute, endMinute: shift.endMinute, breakMinutes: shift.breakMinutes } : null,
      attendance,
      leaveBalances: await Promise.all(leaveBalances.map(async balance => {
        const leaveType = await ctx.db.get(balance.leaveTypeId);
        return { ...balance, leaveTypeName: leaveType?.name ?? "Leave" };
      })),
      leaveRequests,
      documents: docsWithUrls,
      wageRecords: wageRecords.map((record, index) => ({ ...record, period: wagePeriods[index] ? { fromDate: wagePeriods[index]!.fromDate, toDate: wagePeriods[index]!.toDate, status: wagePeriods[index]!.status } : null })),
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
      const [department, location] = await Promise.all([
        ctx.db.get(employee.departmentId),
        ctx.db.get(employee.locationId),
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
      };
    }));
  },
});
