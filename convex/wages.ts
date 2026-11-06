import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

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
