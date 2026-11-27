import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "automatic midnight attendance checkout",
  { minutes: 5 },
  internal.attendance.autoCheckoutAtDayEnd,
  {},
);
crons.daily(
  "generate due recurring work",
  { hourUTC: 0, minuteUTC: 15 },
  internal.teamsWork.generateDueRecurringWork,
  {},
);
crons.daily(
  "monthly leave accrual catch-up",
  { hourUTC: 1, minuteUTC: 0 },
  internal.leave.runMonthlyLeaveAccrual,
  {},
);

export default crons;
