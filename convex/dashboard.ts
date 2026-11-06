import { query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

function dateInTimeZone(timestamp: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(timestamp);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(date: string, amount: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

export const getOverview = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const organization = await ctx.db.get(admin.organizationId);
    const now = Date.now();
    const today = dateInTimeZone(now, organization?.timezone || "Asia/Kolkata");
    const trendStart = addDays(today, -13);

    const [
      employees, departments, locations, shifts, attendanceToday, attendanceTrend,
      leaveRequests, approvedLeaveRequests, overtimeRequests, approvalRequests, attendanceExceptions,
      candidates, holidays, assignments, policies, companyDocuments,
      wagePeriods, notifications, recentAuditLogs,
    ] = await Promise.all([
      ctx.db.query("employees").withIndex("by_org_code", q => q.eq("organizationId", admin.organizationId)).collect(),
      ctx.db.query("departments").withIndex("by_org_code", q => q.eq("organizationId", admin.organizationId)).collect(),
      ctx.db.query("locations").withIndex("by_org", q => q.eq("organizationId", admin.organizationId)).collect(),
      ctx.db.query("shifts").withIndex("by_org", q => q.eq("organizationId", admin.organizationId)).collect(),
      ctx.db.query("attendanceDays").withIndex("by_org_date", q => q.eq("organizationId", admin.organizationId).eq("workDate", today)).collect(),
      ctx.db.query("attendanceDays").withIndex("by_org_date", q => q.eq("organizationId", admin.organizationId).gte("workDate", trendStart).lte("workDate", today)).collect(),
      ctx.db.query("leaveRequests").withIndex("by_org_status", q => q.eq("organizationId", admin.organizationId).eq("status", "pending")).collect(),
      ctx.db.query("leaveRequests").withIndex("by_org_status", q => q.eq("organizationId", admin.organizationId).eq("status", "approved")).collect(),
      ctx.db.query("overtimeRequests").withIndex("by_org_status", q => q.eq("organizationId", admin.organizationId).eq("status", "pending")).collect(),
      ctx.db.query("approvalRequests").withIndex("by_org_status", q => q.eq("organizationId", admin.organizationId).eq("status", "pending")).collect(),
      ctx.db.query("attendanceEvents").withIndex("by_org_review_time", q => q.eq("organizationId", admin.organizationId).eq("reviewStatus", "pending")).collect(),
      ctx.db.query("candidates").withIndex("by_org_status", q => q.eq("organizationId", admin.organizationId)).collect(),
      ctx.db.query("holidays").withIndex("by_org_date", q => q.eq("organizationId", admin.organizationId).gte("date", today)).order("asc").take(10),
      ctx.db.query("workAssignments").withIndex("by_org_date", q => q.eq("organizationId", admin.organizationId).eq("workDate", today)).collect(),
      ctx.db.query("policies").withIndex("by_org_status", q => q.eq("organizationId", admin.organizationId)).collect(),
      ctx.db.query("companyDocuments").withIndex("by_org_uploaded", q => q.eq("organizationId", admin.organizationId)).collect(),
      ctx.db.query("wagePeriods").withIndex("by_org_dates", q => q.eq("organizationId", admin.organizationId)).collect(),
      ctx.db.query("notifications").withIndex("by_user", q => q.eq("userId", admin._id)).order("desc").take(8),
      ctx.db.query("auditLogs").withIndex("by_org_time", q => q.eq("organizationId", admin.organizationId)).order("desc").take(8),
    ]);

    const orgEmployeeIds = new Set(employees.map(employee => String(employee._id)));
    const activeEmployees = employees.filter(employee => employee.status === "active");
    const employmentMix = ["permanent", "hourly", "daily", "contract"].map(type => ({
      type,
      count: activeEmployees.filter(employee => employee.employmentType === type).length,
    }));
    const attendanceCounts = {
      present: attendanceToday.filter(row => row.status === "present").length,
      late: attendanceToday.filter(row => row.status === "late").length,
      absent: attendanceToday.filter(row => row.status === "absent").length,
      exception: attendanceToday.filter(row => row.status === "exception" || row.status === "pending_review").length,
    };
    const approvedLeaveToday = approvedLeaveRequests.filter(request => request.fromDate <= today && request.toDate >= today);
    const dayMinutes = attendanceToday.reduce((sum, row) => sum + Math.max(0, row.payableMinutes), 0);
    const trend = Array.from({ length: 14 }, (_, index) => {
      const date = addDays(trendStart, index);
      const rows = attendanceTrend.filter(row => row.workDate === date);
      return {
        date,
        present: rows.filter(row => row.status === "present").length,
        late: rows.filter(row => row.status === "late").length,
        absent: rows.filter(row => row.status === "absent").length,
        exception: rows.filter(row => row.status === "exception" || row.status === "pending_review").length,
      };
    });
    const orgInterviews = (await Promise.all(candidates.map(candidate =>
      ctx.db.query("interviews").withIndex("by_candidate", q => q.eq("candidateId", candidate._id)).collect()
    ))).flat();
    const orgWageRecords = (await Promise.all(wagePeriods.map(period =>
      ctx.db.query("wageRecords").withIndex("by_period", q => q.eq("wagePeriodId", period._id)).collect()
    ))).flat().filter(record => orgEmployeeIds.has(String(record.employeeId)));
    const todayAssignments = assignments.filter(assignment => assignment.isActive);
    const assignmentProgress = (await Promise.all(todayAssignments.map(assignment =>
      ctx.db.query("workAssignmentProgress").withIndex("by_assignment", q => q.eq("assignmentId", assignment._id)).collect()
    ))).flat();

    return {
      generatedAt: now,
      today,
      employee: {
        total: employees.length,
        active: activeEmployees.length,
        pending: employees.filter(employee => employee.status === "pending").length,
        inactive: employees.filter(employee => employee.status === "inactive").length,
        archived: employees.filter(employee => employee.status === "archived").length,
        employmentMix,
      },
      attendance: {
        recordedEmployees: attendanceToday.length,
        ...attendanceCounts,
        payableMinutes: dayMinutes,
        trend,
      },
      leave: {
        pendingRequests: leaveRequests.length,
        approvedToday: approvedLeaveToday.length,
      },
      overtime: { pendingRequests: overtimeRequests.length },
      approvals: {
        workflowRequests: approvalRequests.length,
        geofenceExceptions: attendanceExceptions.filter(event => event.exceptionCode === "OUTSIDE_GEOFENCE").length,
      },
      recruitment: {
        candidates: candidates.length,
        interviews: orgInterviews.length,
      },
      organization: {
        departments: departments.filter(item => item.isActive).length,
        locations: locations.filter(item => item.isActive).length,
        shifts: shifts.filter(item => item.isActive).length,
      },
      work: {
        assignments: todayAssignments.length,
        completed: assignmentProgress.filter(progress => progress.status === "completed").length,
        inProgress: assignmentProgress.filter(progress => progress.status === "in_progress").length,
        notStarted: assignmentProgress.filter(progress => progress.status === "not_started").length,
      },
      policies: {
        published: policies.filter(policy => policy.status === "published").length,
        drafts: policies.filter(policy => policy.status === "draft").length,
        archived: policies.filter(policy => policy.status === "archived").length,
      },
      documents: {
        published: companyDocuments.filter(document => document.status === "published").length,
        archived: companyDocuments.filter(document => document.status === "archived").length,
      },
      wages: {
        periods: wagePeriods.length,
        records: orgWageRecords.length,
        pendingApproval: orgWageRecords.filter(record => record.status === "pending_approval").length,
        approved: orgWageRecords.filter(record => record.status === "approved").length,
      },
      holidays: holidays.map(holiday => ({ name: holiday.name, date: holiday.date })),
      notifications: notifications.map(notification => ({
        _id: notification._id, title: notification.title, body: notification.body,
        createdAt: notification.createdAt, read: Boolean(notification.readAt),
      })),
      recentActivity: recentAuditLogs.map(log => ({
        _id: log._id, action: log.action, entityType: log.entityType,
        createdAt: log.createdAt,
      })),
    };
  },
});
