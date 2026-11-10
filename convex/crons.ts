import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
crons.daily(
  "generate due recurring work",
  { hourUTC: 0, minuteUTC: 15 },
  internal.teamsWork.generateDueRecurringWork,
  {},
);

export default crons;
