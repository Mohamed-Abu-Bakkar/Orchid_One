/* ORCHID ONE — Realistic sample data (Orchid Flowers workforce) */

const DEPARTMENTS = [
  { id: "prod", name: "Production", head: "R. Vasanth" },
  { id: "pack", name: "Packing", head: "Kavitha R" },
  { id: "sales", name: "Sales", head: "Mohamed Faizal" },
  { id: "proc", name: "Procurement", head: "Suresh Kumar" },
  { id: "logi", name: "Logistics", head: "Meena S" },
  { id: "admin", name: "Administration", head: "Arun Kumar" },
  { id: "hr", name: "HR", head: "Priya Devi" },
];

const EMP_TYPES = ["Permanent", "Contract", "Hourly Wage"];

const SHIFTS = [
  { id: "morning", name: "Morning", start: "06:00", end: "14:00", break: "30 min", grace: 10, short: "06:00 – 14:00" },
  { id: "general", name: "General", start: "09:00", end: "17:30", break: "45 min", grace: 10, short: "09:00 – 17:30" },
  { id: "evening", name: "Evening", start: "14:00", end: "22:00", break: "30 min", grace: 10, short: "14:00 – 22:00" },
  { id: "night", name: "Night", start: "22:00", end: "06:00", break: "45 min", grace: 15, short: "22:00 – 06:00" },
];

const AVATAR_COLORS = ["#B89BD9", "#8FBFAA", "#E9C46A", "#A7C7E7", "#D8A9A9", "#C5B3E0", "#9CCFA8", "#EFC3A6"];

const INITIALS = (name) => name.split(" ").filter(w => /^[A-Z]/.test(w)).slice(0, 2).join("").toUpperCase() || name.slice(0, 2).toUpperCase();

const EMPLOYEES = [
  { id: "OH-1001", name: "Arun Kumar", dept: "admin", role: "Administration Manager", type: "Permanent", shift: "general", status: "present", phone: "+91 98450 12345", joined: "12 Mar 2019", rating: 4.6, manager: "—", avatar: 0, wage: { rate: 420, eff: "01 Apr 2026" } },
  { id: "OH-1002", name: "Priya Devi", dept: "hr", role: "HR Manager", type: "Permanent", shift: "general", status: "present", phone: "+91 98450 22341", joined: "02 Jan 2020", rating: 4.5, manager: "Arun Kumar", avatar: 1, wage: { rate: 400, eff: "01 Apr 2026" } },
  { id: "OH-1003", name: "Suresh Kumar", dept: "proc", role: "Procurement Head", type: "Permanent", shift: "general", status: "leave", phone: "+91 98450 33452", joined: "18 Jun 2018", rating: 4.2, manager: "Arun Kumar", avatar: 2, wage: { rate: 395, eff: "01 Jan 2026" } },
  { id: "OH-1004", name: "Kavitha R", dept: "pack", role: "Packing Supervisor", type: "Permanent", shift: "morning", status: "present", phone: "+91 98450 44563", joined: "25 Sep 2021", rating: 4.4, manager: "Arun Kumar", avatar: 3, wage: { rate: 260, eff: "01 Apr 2026" } },
  { id: "OH-1005", name: "Mohamed Faizal", dept: "sales", role: "Sales Executive", type: "Permanent", shift: "general", status: "present", phone: "+91 98450 55674", joined: "07 Nov 2020", rating: 4.1, manager: "Arun Kumar", avatar: 4, wage: { rate: 320, eff: "01 Apr 2026" } },
  { id: "OH-1006", name: "Meena S", dept: "logi", role: "Logistics Coordinator", type: "Permanent", shift: "general", status: "late", phone: "+91 98450 66785", joined: "14 Feb 2022", rating: 4.0, manager: "Arun Kumar", avatar: 5, wage: { rate: 290, eff: "01 Apr 2026" } },
  { id: "OH-1007", name: "R. Vasanth", dept: "prod", role: "Production Supervisor", type: "Contract", shift: "morning", status: "present", phone: "+91 98450 77896", joined: "03 May 2023", rating: 3.9, manager: "Arun Kumar", avatar: 6, wage: { rate: 220, eff: "01 Feb 2026" } },
  { id: "OH-1008", name: "Divya Lakshmi", dept: "prod", role: "Gardening Staff", type: "Hourly Wage", shift: "morning", status: "present", phone: "+91 98450 88907", joined: "11 Aug 2024", rating: 3.8, manager: "R. Vasanth", avatar: 7, wage: { rate: 120, eff: "01 Jan 2026" } },
  { id: "OH-1009", name: "Karthik Raj", dept: "prod", role: "Gardening Staff", type: "Hourly Wage", shift: "morning", status: "present", phone: "+91 98450 99018", joined: "21 Apr 2025", rating: 3.6, manager: "R. Vasanth", avatar: 0, wage: { rate: 120, eff: "01 Jan 2026" } },
  { id: "OH-1010", name: "Lakshmi Narayanan", dept: "prod", role: "Gardening Staff", type: "Hourly Wage", shift: "morning", status: "present", phone: "+91 98451 11229", joined: "02 Jul 2025", rating: 3.5, manager: "R. Vasanth", avatar: 1, wage: { rate: 120, eff: "01 Jan 2026" } },
  { id: "OH-1011", name: "Santhosh Kumar", dept: "pack", role: "Packing Staff", type: "Hourly Wage", shift: "morning", status: "absent", phone: "+91 98451 22340", joined: "15 Sep 2025", rating: 3.4, manager: "Kavitha R", avatar: 2, wage: { rate: 110, eff: "01 Feb 2026" } },
  { id: "OH-1012", name: "Revathi S", dept: "pack", role: "Packing Staff", type: "Hourly Wage", shift: "evening", status: "present", phone: "+91 98451 33451", joined: "28 Oct 2025", rating: 3.7, manager: "Kavitha R", avatar: 3, wage: { rate: 110, eff: "01 Feb 2026" } },
  { id: "OH-1013", name: "Ganesh K", dept: "logi", role: "Driver", type: "Contract", shift: "evening", status: "working", phone: "+91 98451 44562", joined: "09 Dec 2023", rating: 3.8, manager: "Meena S", avatar: 4, wage: { rate: 150, eff: "01 Jan 2026" } },
  { id: "OH-1014", name: "Anitha M", dept: "sales", role: "Sales Associate", type: "Hourly Wage", shift: "general", status: "present", phone: "+91 98451 55673", joined: "19 Jan 2026", rating: 3.3, manager: "Mohamed Faizal", avatar: 5, wage: { rate: 100, eff: "01 Jan 2026" } },
  { id: "OH-1015", name: "Vijay Anand", dept: "hr", role: "HR Executive", type: "Permanent", shift: "general", status: "present", phone: "+91 98451 66784", joined: "01 Aug 2024", rating: 4.0, manager: "Priya Devi", avatar: 6, wage: { rate: 240, eff: "01 Apr 2026" } },
  { id: "OH-1016", name: "Deepa R", dept: "admin", role: "Admin Assistant", type: "Contract", shift: "general", status: "leave", phone: "+91 98451 77895", joined: "05 Mar 2025", rating: 3.9, manager: "Arun Kumar", avatar: 7, wage: { rate: 210, eff: "01 Jan 2026" } },
];

const deptName = id => (DEPARTMENTS.find(d => d.id === id) || {}).name || id;
const shiftOf = id => SHIFTS.find(s => s.id === id) || SHIFTS[0];
const empOf = id => EMPLOYEES.find(e => e.id === id);

const LEAVE_TYPES = [
  { id: "casual", name: "Casual Leave", balance: 8, color: "success" },
  { id: "sick", name: "Sick Leave", balance: 10, color: "info" },
  { id: "earned", name: "Earned Leave", balance: 12, color: "primary" },
  { id: "maternity", name: "Maternity Leave", balance: 90, color: "warning" },
  { id: "unpaid", name: "Leave Without Pay", balance: 0, color: "neutral" },
];

const CANDIDATES = [
  { id: "CAN-302", name: "Naveen R", pos: "Gardening Staff", stage: "Screening", exp: "2 yrs", dept: "prod", expected: 14000, phone: "+91 96554 11223", applied: "09 Aug 2026", score: 4.0, avatar: 0 },
  { id: "CAN-301", name: "Aarthi S", pos: "Packing Supervisor", stage: "Interview", exp: "5 yrs", dept: "pack", expected: 26000, phone: "+91 96554 22334", applied: "06 Aug 2026", score: 4.2, avatar: 1 },
  { id: "CAN-300", name: "Bharath K", pos: "Driver", stage: "Selected", exp: "8 yrs", dept: "logi", expected: 22000, phone: "+91 96554 33445", applied: "01 Aug 2026", score: 3.8, avatar: 2 },
  { id: "CAN-299", name: "Janani V", pos: "HR Executive", stage: "Offer", exp: "4 yrs", dept: "hr", expected: 30000, phone: "+91 96554 44556", applied: "28 Jul 2026", score: 4.5, avatar: 3 },
  { id: "CAN-298", name: "Ramesh P", pos: "Sales Associate", stage: "Applied", exp: "3 yrs", dept: "sales", expected: 18000, phone: "+91 96554 55667", applied: "12 Aug 2026", score: null, avatar: 4 },
  { id: "CAN-297", name: "Selvi M", pos: "Packing Staff", stage: "Interview", exp: "1 yr", dept: "pack", expected: 11000, phone: "+91 96554 66778", applied: "10 Aug 2026", score: 3.7, avatar: 5 },
  { id: "CAN-296", name: "Kumaravel T", pos: "Gardening Staff", stage: "Rejected", exp: "6 yrs", dept: "prod", expected: 15000, phone: "+91 96554 77889", applied: "04 Aug 2026", score: 2.9, avatar: 6 },
];

const STAGE_COLORS = { "Applied": "neutral", "Screening": "info", "Interview": "primary", "Selected": "warning", "Offer": "info", "Joined": "success", "Rejected": "error" };

const LEAVES = [
  { id: "LV-2201", emp: "OH-1003", type: "casual", from: "14 Aug", to: "16 Aug", days: 3, reason: "Family function in Tirunelveli", status: "pending", balance: 8, applied: "12 Aug 2026" },
  { id: "LV-2200", emp: "OH-1007", type: "sick", from: "13 Aug", to: "13 Aug", days: 1, reason: "Fever and body pain", status: "pending", balance: 10, applied: "12 Aug 2026" },
  { id: "LV-2198", emp: "OH-1016", type: "casual", from: "18 Aug", to: "19 Aug", days: 2, reason: "Personal work at home town", status: "approved", balance: 6, applied: "10 Aug 2026" },
  { id: "LV-2197", emp: "OH-1010", type: "sick", from: "09 Aug", to: "10 Aug", days: 2, reason: "Viral fever", status: "approved", balance: 8, applied: "08 Aug 2026" },
  { id: "LV-2195", emp: "OH-1011", type: "unpaid", from: "22 Aug", to: "24 Aug", days: 3, reason: "Medical treatment", status: "rejected", balance: 0, applied: "20 Jul 2026" },
];

const OVERTIME_REQUESTS = [
  { id: "OT-118", emp: "OH-1008", date: "13 Aug 2026", reg: 8, ot: 2, rate: 150, status: "pending", note: "Flock export order completion" },
  { id: "OT-117", emp: "OH-1009", date: "13 Aug 2026", reg: 8, ot: 2.5, rate: 150, status: "pending", note: "Flock export order completion" },
  { id: "OT-116", emp: "OH-1013", date: "12 Aug 2026", reg: 8, ot: 3, rate: 185, status: "approved", note: "Late delivery to Coimbatore market" },
  { id: "OT-115", emp: "OH-1012", date: "12 Aug 2026", reg: 8, ot: 1.5, rate: 138, status: "approved", note: "Wedding order packing" },
  { id: "OT-114", emp: "OH-1011", date: "11 Aug 2026", reg: 8, ot: 2, rate: 138, status: "rejected", note: "—" },
];

const WAGE_RUNS = [
  { id: "W-304", emp: "OH-1008", week: "10 – 16 Aug 2026", hours: 40, ot: 4.5, regAmt: 4800, otAmt: 675, total: 5475, status: "Submitted", period: "Week 33" },
  { id: "W-303", emp: "OH-1009", week: "10 – 16 Aug 2026", hours: 40, ot: 4, regAmt: 4800, otAmt: 600, total: 5400, status: "Draft", period: "Week 33" },
  { id: "W-302", emp: "OH-1010", week: "10 – 16 Aug 2026", hours: 44, ot: 0, regAmt: 5280, otAmt: 0, total: 5280, status: "Approved", period: "Week 33" },
  { id: "W-301", emp: "OH-1011", week: "03 – 09 Aug 2026", hours: 32, ot: 2, regAmt: 3520, otAmt: 275, total: 3795, status: "Approved", period: "Week 32" },
  { id: "W-300", emp: "OH-1012", week: "03 – 09 Aug 2026", hours: 40, ot: 1.5, regAmt: 4400, otAmt: 207, total: 4607, status: "Approved", period: "Week 32" },
];

const ATTENDANCE_TODAY = [
  { emp: "OH-1001", shift: "general", in: "08:52", out: "—", hrs: "6.4", status: "Present" },
  { emp: "OH-1002", shift: "general", in: "08:55", out: "—", hrs: "6.4", status: "Present" },
  { emp: "OH-1003", shift: "general", in: "—", out: "—", hrs: "0", status: "On Leave" },
  { emp: "OH-1004", shift: "morning", in: "05:48", out: "—", hrs: "7.4", status: "Present" },
  { emp: "OH-1005", shift: "general", in: "08:47", out: "—", hrs: "6.5", status: "Present" },
  { emp: "OH-1006", shift: "general", in: "09:32", out: "—", hrs: "5.8", status: "Late" },
  { emp: "OH-1007", shift: "morning", in: "05:55", out: "—", hrs: "7.3", status: "Present" },
  { emp: "OH-1008", shift: "morning", in: "05:50", out: "—", hrs: "7.4", status: "Present" },
  { emp: "OH-1009", shift: "morning", in: "05:52", out: "—", hrs: "7.3", status: "Present" },
  { emp: "OH-1010", shift: "morning", in: "05:58", out: "—", hrs: "7.2", status: "Present" },
  { emp: "OH-1011", shift: "morning", in: "—", out: "—", hrs: "0", status: "Absent" },
  { emp: "OH-1012", shift: "evening", in: "13:46", out: "—", hrs: "2.6", status: "Present" },
  { emp: "OH-1013", shift: "evening", in: "13:55", out: "—", hrs: "2.5", status: "Working" },
  { emp: "OH-1014", shift: "general", in: "08:50", out: "—", hrs: "6.4", status: "Present" },
  { emp: "OH-1015", shift: "general", in: "08:57", out: "—", hrs: "6.3", status: "Present" },
  { emp: "OH-1016", shift: "general", in: "—", out: "—", hrs: "0", status: "On Leave" },
];

const NOTIFICATIONS = [
  { id: 1, type: "leave", title: "Leave request needs approval", body: "Suresh Kumar requested Casual Leave (3 days, 14–16 Aug).", time: "10 min ago", action: "Review Request" },
  { id: 2, type: "wage", title: "Weekly wages ready for review", body: "5 hourly employees have wages submitted for Week 33.", time: "1 hr ago", action: "Review Wages" },
  { id: 3, type: "overtime", title: "Overtime pending approval", body: "2 overtime requests from Production await your approval.", time: "2 hrs ago", action: "Review Overtime" },
  { id: 4, type: "recruitment", title: "New candidate applied", body: "Ramesh P applied for Sales Associate (CAN-298).", time: "3 hrs ago", action: "View Candidate" },
  { id: 5, type: "attendance", title: "Attendance alert", body: "3 employees were late to work today.", time: "Yesterday", action: "View Attendance" },
  { id: 6, type: "announcement", title: "Independence Day holiday", body: "Office closed on 15 August (Saturday) on account of Independence Day.", time: "Yesterday", action: "View Calendar" },
  { id: 7, type: "system", title: "Geofence updated", body: "The attendance area for the main campus was widened by 200 m.", time: "2 days ago" },
  { id: 8, type: "birthday", title: "Birthday wishes", body: "Meena S turns 31 today. Send your wishes!", time: "Today" },
];

const HOLIDAYS_2026 = [
  { date: 15, month: 8, name: "Independence Day", tag: "Public Holiday" },
  { date: 2, month: 9, name: "Vinayaka Chaturthi", tag: "Festival" },
  { date: 22, month: 9, name: "Ayudha Pooja", tag: "Festival" },
  { date: 14, month: 11, name: "Deepavali", tag: "Festival" },
  { date: 25, month: 12, name: "Christmas", tag: "Public Holiday" },
  { date: 26, month: 1, name: "Republic Day", tag: "Public Holiday" },
];

const POLICY_CATEGORIES = [
  { id: "attendance", name: "Attendance Policy", version: "v3.1", eff: "01 Apr 2026", summary: "Working hours, check-in window, grace period and late marking for all employment types." },
  { id: "leave", name: "Leave Policy", version: "v2.4", eff: "01 Jan 2026", summary: "Eligibility, accrual, approval flow and documentation for every leave category." },
  { id: "hours", name: "Working Hours", version: "v1.8", eff: "01 Apr 2026", summary: "Shift definitions, break policy and daily hour limits for hourly workforce." },
  { id: "overtime", name: "Overtime Policy", version: "v2.1", eff: "01 Jan 2026", summary: "When overtime is applicable, prior approval rules and premium pay rates." },
  { id: "conduct", name: "Employee Conduct", version: "v1.5", eff: "15 Mar 2026", summary: "Professional standards, safety in production areas and disciplinary process." },
  { id: "benefits", name: "Benefits", version: "v1.2", eff: "01 Apr 2026", summary: "Health coverage, annual leave encashment and festival advances." },
];

const TASKS = [
  { id: "TA-88", emp: "OH-1008", task: "Watering — Green House A", area: "Production", loc: "Main Campus", priority: "High", start: "06:30", end: "09:30", status: "In Progress" },
  { id: "TA-87", emp: "OH-1009", task: "Fertilizer spray — Block C", area: "Production", loc: "Main Campus", priority: "Medium", start: "07:00", end: "10:00", status: "In Progress" },
  { id: "TA-86", emp: "OH-1010", task: "Pruning — Rose beds", area: "Production", loc: "Main Campus", priority: "Medium", start: "06:30", end: "11:30", status: "Assigned" },
  { id: "TA-85", emp: "OH-1012", task: "Order packing — Wedding batch", area: "Packing", loc: "Packing Shed", priority: "High", start: "14:00", end: "17:00", status: "Completed" },
  { id: "TA-84", emp: "OH-1013", task: "Dispatch — Coimbatore route", area: "Logistics", loc: "Outbound Yard", priority: "High", start: "15:00", end: "19:00", status: "Assigned" },
];

const EVENTS = [
  { name: "Independence Day", date: "15 Aug 2026", time: "Holiday", type: "Holiday" },
  { name: "Team Lunch — Production", date: "22 Aug 2026", time: "13:00", type: "Team" },
  { name: "Vinayaka Chaturthi", date: "02 Sep 2026", time: "Holiday", type: "Holiday" },
  { name: "Ayudha Pooja", date: "22 Sep 2026", time: "Holiday", type: "Holiday" },
  { name: "Safety Training", date: "05 Sep 2026", time: "10:00", type: "Training" },
  { name: "Deepavali", date: "14 Nov 2026", time: "Holiday", type: "Holiday" },
];

const BIRTHDAYS = [
  { name: "Meena S", dept: "Logistics", day: "Today, 14 Aug", avatar: 5 },
  { name: "Karthik Raj", dept: "Production", day: "18 Aug", avatar: 0 },
  { name: "Revathi S", dept: "Packing", day: "21 Aug", avatar: 3 },
  { name: "Priya Devi", dept: "HR", day: "27 Aug", avatar: 1 },
];

const ANNIVERSARIES = [
  { name: "Vijay Anand", dept: "HR", day: "2 yrs on 01 Aug", avatar: 6 },
  { name: "Divya Lakshmi", dept: "Production", day: "2 yrs on 11 Aug", avatar: 7 },
  { name: "Suresh Kumar", dept: "Procurement", day: "8 yrs on 18 Jun", avatar: 2 },
];

const CURRENT_USER = {
  id: "OH-1008", name: "Divya Lakshmi", role: "Gardening Staff", dept: "prod",
  type: "Hourly Wage", shift: "morning", avatar: 7,
};

const ME = {
  id: "OH-1002", name: "Priya Devi", role: "HR Manager", dept: "hr",
  type: "Permanent", shift: "general", avatar: 1, email: "priya.devi@orchidflowers.in",
};

const BIRTHDAY_TODAY = { name: "Meena S", dept: "logi", avatar: 5 };
