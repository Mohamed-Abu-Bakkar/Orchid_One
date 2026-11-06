import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

const employmentType = v.union(v.literal("permanent"), v.literal("hourly"), v.literal("daily"), v.literal("contract"));
const employeeStatus = v.union(v.literal("active"), v.literal("inactive"), v.literal("pending"), v.literal("archived"));
const priority = v.union(v.literal("low"), v.literal("normal"), v.literal("high"));

async function audit(ctx: any, admin: any, action: string, entityType: string, entityId: string, metadata?: Record<string, unknown>) {
  await ctx.db.insert("auditLogs", {
    organizationId: admin.organizationId,
    actorUserId: admin._id,
    action,
    entityType,
    entityId,
    metadata,
    createdAt: Date.now(),
  });
}

export const updateEmployee = mutation({
  args: {
    employeeId: v.id("employees"),
    firstName: v.string(),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.string(),
    designation: v.string(),
    employmentType,
    status: employeeStatus,
    joiningDate: v.string(),
    departmentId: v.id("departments"),
    locationId: v.id("locations"),
    defaultShiftId: v.union(v.id("shifts"), v.null()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const employee = await ctx.db.get(args.employeeId);
    if (!employee || employee.organizationId !== admin.organizationId) throw new Error("EMPLOYEE_NOT_FOUND");
    const firstName = args.firstName.trim();
    const phone = args.phone.trim();
    const designation = args.designation.trim();
    const email = args.email?.trim().toLowerCase();
    if (!firstName || !phone || !designation || !/^\\d{4}-\\d{2}-\\d{2}$/.test(args.joiningDate)) throw new Error("INVALID_EMPLOYEE_DETAILS");
    const [department, location, shift] = await Promise.all([
      ctx.db.get(args.departmentId), ctx.db.get(args.locationId),
      args.defaultShiftId ? ctx.db.get(args.defaultShiftId) : null,
    ]);
    if (!department || department.organizationId !== admin.organizationId || !department.isActive) throw new Error("INVALID_DEPARTMENT");
    if (!location || location.organizationId !== admin.organizationId || !location.isActive) throw new Error("INVALID_LOCATION");
    if (args.defaultShiftId && (!shift || shift.organizationId !== admin.organizationId || !shift.isActive)) throw new Error("INVALID_SHIFT");
    await ctx.db.patch(employee._id, {
      firstName, lastName: args.lastName?.trim() || undefined, email: email || undefined,
      phone, designation, employmentType: args.employmentType, status: args.status,
      joiningDate: args.joiningDate, departmentId: args.departmentId, locationId: args.locationId,
      defaultShiftId: args.defaultShiftId ?? undefined, updatedAt: Date.now(),
    });
    await audit(ctx, admin, "employee.updated", "employee", String(employee._id), { status: args.status });
    return true;
  },
});

export const archiveEmployee = mutation({
  args: { employeeId: v.id("employees") },
  handler: async (ctx, { employeeId }) => {
    const admin = await requireAdmin(ctx);
    const employee = await ctx.db.get(employeeId);
    if (!employee || employee.organizationId !== admin.organizationId) throw new Error("EMPLOYEE_NOT_FOUND");
    if (employee.status === "archived") return true;
    await ctx.db.patch(employeeId, { status: "archived", updatedAt: Date.now() });
    const memberships = await ctx.db.query("teamMemberships").withIndex("by_employee_date", q => q.eq("employeeId", employeeId)).collect();
    for (const membership of memberships) if (membership.isActive) await ctx.db.patch(membership._id, { isActive: false });
    await audit(ctx, admin, "employee.archived", "employee", String(employeeId), { employeeCode: employee.employeeCode });
    return true;
  },
});

export const updateDepartment = mutation({
  args: { departmentId: v.id("departments"), name: v.string(), managerEmployeeId: v.union(v.id("employees"), v.null()) },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const department = await ctx.db.get(args.departmentId);
    if (!department || department.organizationId !== admin.organizationId) throw new Error("DEPARTMENT_NOT_FOUND");
    const name = args.name.trim().replace(/\\s+/g, " ");
    if (!name || name.length > 80) throw new Error("INVALID_DEPARTMENT_NAME");
    if (args.managerEmployeeId) {
      const manager = await ctx.db.get(args.managerEmployeeId);
      if (!manager || manager.organizationId !== admin.organizationId || manager.status !== "active") throw new Error("INVALID_MANAGER");
    }
    const rows = await ctx.db.query("departments").withIndex("by_org_code", q => q.eq("organizationId", admin.organizationId)).collect();
    if (rows.some(row => row._id !== department._id && row.name.toLowerCase() === name.toLowerCase())) throw new Error("DEPARTMENT_ALREADY_EXISTS");
    await ctx.db.patch(department._id, { name, managerEmployeeId: args.managerEmployeeId ?? undefined });
    await audit(ctx, admin, "department.updated", "department", String(department._id), { name });
    return true;
  },
});

export const archiveDepartment = mutation({
  args: { departmentId: v.id("departments") },
  handler: async (ctx, { departmentId }) => {
    const admin = await requireAdmin(ctx);
    const department = await ctx.db.get(departmentId);
    if (!department || department.organizationId !== admin.organizationId) throw new Error("DEPARTMENT_NOT_FOUND");
    const employees = await ctx.db.query("employees").withIndex("by_department", q => q.eq("departmentId", departmentId)).collect();
    if (employees.some(employee => employee.status === "active" || employee.status === "pending")) throw new Error("DEPARTMENT_HAS_ACTIVE_EMPLOYEES");
    await ctx.db.patch(departmentId, { isActive: false, managerEmployeeId: undefined });
    await audit(ctx, admin, "department.archived", "department", String(departmentId));
    return true;
  },
});

export const archiveLocation = mutation({
  args: { locationId: v.id("locations") },
  handler: async (ctx, { locationId }) => {
    const admin = await requireAdmin(ctx);
    const location = await ctx.db.get(locationId);
    if (!location || location.organizationId !== admin.organizationId) throw new Error("LOCATION_NOT_FOUND");
    const employees = await ctx.db.query("employees").withIndex("by_org_code", q => q.eq("organizationId", admin.organizationId)).collect();
    if (employees.some(employee => employee.locationId === locationId && (employee.status === "active" || employee.status === "pending"))) throw new Error("LOCATION_HAS_ACTIVE_EMPLOYEES");
    await ctx.db.patch(locationId, { isActive: false });
    await audit(ctx, admin, "location.archived", "location", String(locationId));
    return true;
  },
});

export const updateShift = mutation({
  args: { shiftId: v.id("shifts"), name: v.string(), startMinute: v.number(), endMinute: v.number(), breakMinutes: v.number() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const shift = await ctx.db.get(args.shiftId);
    if (!shift || shift.organizationId !== admin.organizationId) throw new Error("SHIFT_NOT_FOUND");
    const name = args.name.trim();
    if (!name || name.length > 80 || !Number.isInteger(args.startMinute) || args.startMinute < 0 || args.startMinute >= 1440 || !Number.isInteger(args.endMinute) || args.endMinute < 0 || args.endMinute >= 1440 || args.startMinute === args.endMinute || !Number.isInteger(args.breakMinutes) || args.breakMinutes < 0 || args.breakMinutes > 720) throw new Error("INVALID_SHIFT");
    const rows = await ctx.db.query("shifts").withIndex("by_org", q => q.eq("organizationId", admin.organizationId)).collect();
    if (rows.some(row => row._id !== shift._id && row.name.toLowerCase() === name.toLowerCase())) throw new Error("SHIFT_ALREADY_EXISTS");
    await ctx.db.patch(shift._id, { name, startMinute: args.startMinute, endMinute: args.endMinute, breakMinutes: args.breakMinutes });
    await audit(ctx, admin, "shift.updated", "shift", String(shift._id), { name });
    return true;
  },
});

export const archiveShift = mutation({
  args: { shiftId: v.id("shifts") },
  handler: async (ctx, { shiftId }) => {
    const admin = await requireAdmin(ctx);
    const shift = await ctx.db.get(shiftId);
    if (!shift || shift.organizationId !== admin.organizationId) throw new Error("SHIFT_NOT_FOUND");
    const [employees, assignments, teams] = await Promise.all([
      ctx.db.query("employees").withIndex("by_org_code", q => q.eq("organizationId", admin.organizationId)).collect(),
      ctx.db.query("shiftAssignments").withIndex("by_org_date", q => q.eq("organizationId", admin.organizationId)).collect(),
      ctx.db.query("teams").withIndex("by_org", q => q.eq("organizationId", admin.organizationId)).collect(),
    ]);
    if (employees.some(employee => employee.defaultShiftId === shiftId && employee.status === "active") || assignments.some(row => row.shiftId === shiftId && row.workDate >= new Date().toISOString().slice(0, 10)) || teams.some(team => team.shiftId === shiftId && team.isActive)) throw new Error("SHIFT_HAS_ACTIVE_DEPENDENCIES");
    await ctx.db.patch(shiftId, { isActive: false });
    await audit(ctx, admin, "shift.archived", "shift", String(shiftId));
    return true;
  },
});

export const updateTeam = mutation({
  args: { teamId: v.id("teams"), name: v.string(), shiftId: v.id("shifts") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const team = await ctx.db.get(args.teamId);
    const shift = await ctx.db.get(args.shiftId);
    const name = args.name.trim();
    if (!team || team.organizationId !== admin.organizationId) throw new Error("TEAM_NOT_FOUND");
    if (!shift || shift.organizationId !== admin.organizationId || !shift.isActive) throw new Error("INVALID_SHIFT");
    if (!name || name.length > 80) throw new Error("INVALID_TEAM_NAME");
    await ctx.db.patch(team._id, { name, shiftId: args.shiftId });
    await audit(ctx, admin, "team.updated", "team", String(team._id), { name, shiftId: String(args.shiftId) });
    return true;
  },
});

export const archiveTeam = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    const admin = await requireAdmin(ctx);
    const team = await ctx.db.get(teamId);
    if (!team || team.organizationId !== admin.organizationId) throw new Error("TEAM_NOT_FOUND");
    await ctx.db.patch(teamId, { isActive: false });
    const memberships = await ctx.db.query("teamMemberships").withIndex("by_team_date", q => q.eq("teamId", teamId)).collect();
    for (const membership of memberships) if (membership.isActive) await ctx.db.patch(membership._id, { isActive: false });
    await audit(ctx, admin, "team.archived", "team", String(teamId));
    return true;
  },
});

export const updateWorkCategory = mutation({
  args: { categoryId: v.id("workCategories"), name: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const category = await ctx.db.get(args.categoryId);
    const name = args.name.trim().replace(/\\s+/g, " ");
    if (!category || category.organizationId !== admin.organizationId) throw new Error("CATEGORY_NOT_FOUND");
    if (!name || name.length > 60) throw new Error("INVALID_WORK_CATEGORY");
    const rows = await ctx.db.query("workCategories").withIndex("by_org", q => q.eq("organizationId", admin.organizationId)).collect();
    if (rows.some(row => row._id !== category._id && row.name.toLowerCase() === name.toLowerCase())) throw new Error("WORK_CATEGORY_ALREADY_EXISTS");
    await ctx.db.patch(category._id, { name });
    await audit(ctx, admin, "work_category.updated", "workCategory", String(category._id), { name });
    return true;
  },
});

export const archiveWorkCategory = mutation({
  args: { categoryId: v.id("workCategories") },
  handler: async (ctx, { categoryId }) => {
    const admin = await requireAdmin(ctx);
    const category = await ctx.db.get(categoryId);
    if (!category || category.organizationId !== admin.organizationId) throw new Error("CATEGORY_NOT_FOUND");
    await ctx.db.patch(categoryId, { isActive: false });
    await audit(ctx, admin, "work_category.archived", "workCategory", String(categoryId), { name: category.name });
    return true;
  },
});

export const updateWorkAssignment = mutation({
  args: {
    assignmentId: v.id("workAssignments"), title: v.string(), description: v.optional(v.string()),
    category: v.string(), priority, workDate: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.organizationId !== admin.organizationId || !assignment.isActive) throw new Error("WORK_ASSIGNMENT_NOT_FOUND");
    if (!args.title.trim() || args.title.trim().length > 120 || !args.category.trim() || !/^\\d{4}-\\d{2}-\\d{2}$/.test(args.workDate)) throw new Error("INVALID_WORK_ASSIGNMENT");
    await ctx.db.patch(assignment._id, { title: args.title.trim(), description: args.description?.trim() || undefined, category: args.category.trim(), priority: args.priority, workDate: args.workDate });
    await audit(ctx, admin, "work_assignment.updated", "workAssignment", String(assignment._id), { workDate: args.workDate });
    return true;
  },
});

export const archiveWorkAssignment = mutation({
  args: { assignmentId: v.id("workAssignments") },
  handler: async (ctx, { assignmentId }) => {
    const admin = await requireAdmin(ctx);
    const assignment = await ctx.db.get(assignmentId);
    if (!assignment || assignment.organizationId !== admin.organizationId) throw new Error("WORK_ASSIGNMENT_NOT_FOUND");
    if (!assignment.isActive) return true;
    await ctx.db.patch(assignmentId, { isActive: false });
    await audit(ctx, admin, "work_assignment.archived", "workAssignment", String(assignmentId));
    return true;
  },
});
