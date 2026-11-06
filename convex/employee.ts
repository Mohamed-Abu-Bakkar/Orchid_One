import { query } from "./_generated/server";
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
