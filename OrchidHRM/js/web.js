/* ============================================================
   ORCHID HRM — ADMIN WEB DASHBOARD LOGIC
   ============================================================ */

const el = id => document.getElementById(id);
let current = "dashboard";
let empDrawer = "OH-1005";
let candDrawer = "CAN-301";

function toast(msg, type = "success") {
  const icon = type === "error" ? ICON("alert", 16) : ICON("checkCircle", 16);
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  el("toasts").appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity .3s"; }, 2600);
  setTimeout(() => t.remove(), 3000);
}
window.toast = toast;

/* ---------- Sidebar ---------- */
const NAV = [
  { group: "Overview", items: [["dashboard", "grid", "Dashboard", null]] },
  { group: "People", items: [
    ["employees", "people", "Employees", null],
    ["recruitment", "user", "Recruitment", "2"],
    ["onboarding", "graduation", "Onboarding", "1"],
    ["documents", "folder", "Documents", null],
  ]},
  { group: "Workforce", items: [
    ["attendance", "attendance", "Attendance", null],
    ["hourly", "clock", "Hourly Workforce", null],
    ["overtime", "zap", "Overtime", "2"],
    ["wages", "wallet", "Wage Management", "2"],
    ["shifts", "calendar", "Shifts & Schedules", null],
  ]},
  { group: "Employee Experience", items: [
    ["leave", "calendar", "Leave", "2"],
    ["performance", "star", "Performance", null],
  ]},
  { group: "Organization", items: [
    ["organization", "building", "Departments", null],
    ["policies", "book", "Policies", null],
    ["holidays", "calendar", "Holidays", null],
    ["events", "megaphone", "Events", null],
  ]},
  { group: "Reports", items: [
    ["reports", "chart", "Reports", null],
  ]},
  { group: "Settings", items: [
    ["roles", "shield", "Roles & Permissions", null],
    ["users", "users", "User Management", null],
    ["settings", "settings", "Organization Settings", null],
  ]},
];

const TITLES = {
  dashboard: ["Dashboard", "Overview"],
  employees: ["People", "Employees"],
  recruitment: ["People", "Recruitment"],
  candidates: ["People", "Candidates"],
  onboarding: ["People", "Onboarding"],
  documents: ["People", "Documents"],
  attendance: ["Workforce", "Attendance"],
  hourly: ["Workforce", "Hourly Workforce"],
  overtime: ["Workforce", "Overtime"],
  wages: ["Workforce", "Wage Management"],
  leave: ["Employee Experience", "Leave"],
  shifts: ["Workforce", "Shifts & Schedules"],
  performance: ["Employee Experience", "Performance"],
  organization: ["Organization", "Departments"],
  policies: ["Organization", "Policies"],
  holidays: ["Organization", "Holidays"],
  events: ["Organization", "Events"],
  reports: ["Reports", "Reports"],
  roles: ["Settings", "Roles & Permissions"],
  users: ["Settings", "User Management"],
  settings: ["Settings", "Organization Settings"],
  notifications: ["Dashboard", "Notifications"],
};

function buildNav() {
  el("sbNav").innerHTML = NAV.map(g => `
    <div class="sb-group">
      <div class="sb-group-title">${g.group}</div>
      ${g.items.map(([id, icon, label, cnt]) => `
        <div class="sb-item ${current === id ? "active" : ""}" data-nav="${id}" onclick="navigate('${id}')">
          <span class="sb-ic">${ICON(icon, 18)}</span><span>${label}</span>
          ${cnt ? `<span class="sb-cnt">${cnt}</span>` : ""}
        </div>`).join("")}
    </div>`).join("");
}

function navigate(id) {
  current = id;
  document.querySelectorAll(".sec").forEach(s => s.classList.add("hidden"));
  const sec = el("sec-" + id);
  if (!sec) return;
  sec.classList.remove("hidden");
  document.querySelectorAll(".sb-item").forEach(i => i.classList.toggle("active", i.dataset.nav === id));
  el("pageTitle").textContent = TITLES[id][1];
  el("crumb").textContent = TITLES[id][0];
  el("content").scrollTop = 0;
  closeDrawer();
  renderer(id)();
  if (window.innerWidth <= 1024) el("sidebar").classList.remove("open");
}
window.navigate = navigate;

const RENDER = {
  dashboard: renderDashboard, employees: renderEmployees, recruitment: renderRecruitment,
  candidates: renderCandidates, onboarding: renderOnboarding, documents: renderDocuments,
  attendance: renderAttendance, hourly: renderHourly, overtime: renderOvertime,
  wages: renderWages, leave: renderLeave, shifts: renderShifts, performance: renderPerformance,
  organization: renderOrganization, policies: renderPolicies, holidays: renderHolidays,
  events: renderEvents, reports: renderReports, settings: renderSettings,
  roles: renderRoles, users: renderUsers, notifications: renderNotifications,
};
function renderer(id) { return RENDER[id] || (() => {}); }

/* ============================================================
   DASHBOARD
   ============================================================ */
function renderDashboard() {
  el("sec-dashboard").innerHTML = `
  <div class="page-head">
    <div><h2 class="t-h1" style="font-size:22px">Good morning, Priya</h2><p class="sub">Here's what's happening at Orchid Flowers today — Thursday, 14 August 2026.</p></div>
    <div class="page-actions">
      <button class="btn btn-outline" onclick="toast('Report exported')">${ICON("download",16)} Export</button>
      <button class="btn btn-primary" onclick="toast('Quick add menu')">${ICON("plus",16)} Quick add</button>
    </div>
  </div>

  <div class="kpi-grid">
    ${kpi("Total employees", "16", "8 permanent · 5 hourly · 3 contract", "people", "var(--primary-light)", "var(--primary)")}
    ${kpi("Present today", "12", "75% attendance", "attendance", "var(--success-bg)", "var(--success-dark)")}
    ${kpi("On leave", "2", "1 late · 1 absent", "calendar", "var(--warning-bg)", "var(--warning)")}
    ${kpi("Hours today", "112.4", "incl. 8.5 OT", "clock", "var(--info-bg)", "var(--info)")}
    ${kpi("Pending approvals", "4", "leave · OT · wages", "checkCircle", "var(--error-bg)", "var(--error)")}
    ${kpi("Week wage est.", "₹26,700", "Week 33 · 5 hourly", "wallet", "var(--success-bg)", "var(--success-dark)")}
  </div>

  <div class="grid-2 mt-6">
    <div class="panel">
      <div class="panel-head"><span class="t-h3">Attendance trend</span><span class="t-caption text-tertiary">Last 14 days</span></div>
      <div class="panel-body">
        <div class="bars lg" id="dashTrend"></div>
        <div class="legend">
          <div class="item"><span class="sw" style="background:var(--primary)"></span>Present</div>
          <div class="item"><span class="sw" style="background:var(--warning)"></span>Leave</div>
          <div class="item"><span class="sw" style="background:var(--error)"></span>Absent</div>
        </div>
      </div>
    </div>
    <div class="panel">
      <div class="panel-head"><span class="t-h3">Workforce mix</span><span class="t-caption text-tertiary">16 employees</span></div>
      <div class="panel-body" style="display:flex;align-items:center;gap:24px">
        <div class="donut" style="width:132px;height:132px;background:conic-gradient(#6E3FA8 0 50%, #3E72B8 50% 68.75%, #A98BCB 68.75% 100%)"><div class="donut-center" style="inset:20px"><span class="t-h2">16</span><span class="t-caption text-tertiary">people</span></div></div>
        <div class="col" style="gap:10px">
          <div class="legend-row"><span class="dot" style="background:var(--primary)"></span><span class="t-body-sm">Permanent · 8</span></div>
          <div class="legend-row"><span class="dot" style="background:var(--info)"></span><span class="t-body-sm">Contract · 3</span></div>
          <div class="legend-row"><span class="dot" style="background:var(--lavender)"></span><span class="t-body-sm">Hourly · 5</span></div>
        </div>
      </div>
    </div>
  </div>

  <div class="grid-2-equal mt-6">
    <div class="panel">
      <div class="panel-head"><span class="t-h3">Pending approvals</span><span class="section-link" onclick="navigate('leave')">Review</span></div>
      <div class="panel-body flush" id="dashApprovals"></div>
    </div>
    <div class="panel">
      <div class="panel-head"><span class="t-h3">Hiring pipeline</span><span class="section-link" onclick="navigate('recruitment')">Open</span></div>
      <div class="panel-body">
        <div class="funnel" id="dashFunnel"></div>
      </div>
    </div>
  </div>

  <div class="grid-3 mt-6">
    <div class="panel">
      <div class="panel-head"><span class="t-h3">Recent activity</span></div>
      <div class="panel-body flush" id="dashActivity"></div>
    </div>
    <div class="panel">
      <div class="panel-head"><span class="t-h3">Birthdays &amp; anniversaries</span></div>
      <div class="panel-body flush" id="dashCelebrations"></div>
    </div>
    <div class="panel">
      <div class="panel-head"><span class="t-h3">Overtime this week</span><span class="t-caption text-tertiary">Week 33</span></div>
      <div class="panel-body">
        <p class="t-metric" style="color:var(--warning)">10.0 hrs</p>
        <p class="t-caption text-tertiary" style="margin-top:2px">Estimated cost ₹1,430 · 2 pending</p>
        <div class="progress" style="margin-top:12px"><div class="progress-bar warning" style="width:62%"></div></div>
        <div class="row between" style="margin-top:6px"><span class="t-caption text-tertiary">used of 16 hrs cap</span><span class="t-caption text-tertiary">62%</span></div>
        <button class="btn btn-outline btn-block btn-sm" style="margin-top:14px" onclick="navigate('overtime')">Manage overtime</button>
      </div>
    </div>
  </div>`;
  dashTrend();
  dashApprovals();
  dashFunnel();
  dashActivity();
  dashCelebrations();
}

function kpi(label, val, sub, icon, bg, fg) {
  return `<div class="card kpi"><span class="kpi-icon" style="background:${bg};color:${fg}">${ICON(icon, 18)}</span>
    <span class="kpi-label">${label}</span><span class="kpi-val">${val}</span><span class="kpi-sub">${sub}</span></div>`;
}

function dashTrend() {
  const data = [13,12,14,13,12,11,14,13,12,13,14,12,12,12];
  const max = 14;
  el("dashTrend").innerHTML = data.map(d => `<div class="bar ${d >= 14 ? "main" : ""}" style="height:${(d/max)*100}%"></div>`).join("");
}
function dashApprovals() {
  const pend = LEAVES.filter(l => l.status === "pending");
  el("dashApprovals").innerHTML = pend.map(l => {
    const e = empOf(l.emp);
    return `<div class="milestone"><div class="avatar" style="background:var(--warning-bg);color:var(--warning)">${INITIALS(e.name)}</div>
      <div class="col flex-1"><p class="list-title" style="font-size:13.5px">${e.name} · ${l.type.replace(" Leave","")}</p><p class="list-sub">${l.from} – ${l.to} · ${l.days} day</p></div>
      <button class="btn btn-success btn-sm" onclick="toast('Leave approved')">${ICON("check",14)} Approve</button></div>`;
  }).join("") + `
    <div class="milestone"><div class="avatar" style="background:var(--info-bg);color:var(--info)">₹</div>
      <div class="col flex-1"><p class="list-title" style="font-size:13.5px">2 weekly wages</p><p class="list-sub">Week 33 · ₹10,875</p></div>
      <button class="btn btn-outline btn-sm" onclick="navigate('wages')">Review</button></div>`;
}
function dashFunnel() {
  const stages = ["Applied","Screening","Interview","Selected","Offer","Joined"];
  const counts = [1,1,2,1,1,0];
  const max = 2;
  el("dashFunnel").innerHTML = stages.map((s,i) => `
    <div class="funnel-item"><span class="t-caption text-secondary" style="width:64px">${s}</span>
      <div class="funnel-bar ${counts[i]===0?"zero":""}" style="width:${(counts[i]/max)*100}%">${counts[i]} ${counts[i]===1?"candidate":"candidates"}</div></div>`).join("");
}
function dashActivity() {
  el("dashActivity").innerHTML = `
    <div class="milestone"><span style="color:var(--success-dark)">${ICON("checkCircle",18)}</span><div class="col flex-1"><p class="list-title" style="font-size:13px">Leave approved</p><p class="list-sub">Deepa R · 12:04</p></div></div>
    <div class="milestone"><span style="color:var(--info)">${ICON("user",18)}</span><div class="col flex-1"><p class="list-title" style="font-size:13px">Candidate → Offer</p><p class="list-sub">Janani V · 11:40</p></div></div>
    <div class="milestone"><span style="color:var(--warning)">${ICON("zap",18)}</span><div class="col flex-1"><p class="list-title" style="font-size:13px">Overtime submitted</p><p class="list-sub">Divya Lakshmi · 2 hrs · 11:02</p></div></div>
    <div class="milestone"><span style="color:var(--primary)">${ICON("checkCircle",18)}</span><div class="col flex-1"><p class="list-title" style="font-size:13px">Wages approved</p><p class="list-sub">Week 32 · 09:30</p></div></div>`;
}
function dashCelebrations() {
  el("dashCelebrations").innerHTML = `
    <div class="milestone"><div class="avatar" style="background:var(--error-bg);color:var(--error)">MS</div><div class="col flex-1"><p class="list-title" style="font-size:13.5px">Meena S · Birthday</p><p class="list-sub">Logistics · today</p></div><span class="badge badge-primary">Today</span></div>
    <div class="milestone"><div class="avatar" style="background:var(--success-bg);color:var(--success-dark)">VA</div><div class="col flex-1"><p class="list-title" style="font-size:13.5px">Vijay Anand · 2 yrs</p><p class="list-sub">HR · anniversary</p></div></div>
    <div class="milestone"><div class="avatar" style="background:var(--warning-bg);color:var(--warning)">KR</div><div class="col flex-1"><p class="list-title" style="font-size:13.5px">Karthik Raj · Birthday</p><p class="list-sub">Production · 18 Aug</p></div></div>`;
}

/* ============================================================
   EMPLOYEES
   ============================================================ */
function renderEmployees() {
  el("sec-employees").innerHTML = `
  <div class="page-head">
    <div><h2 class="t-h1" style="font-size:22px">Employees</h2><p class="sub">16 people across 7 departments · 12 present today</p></div>
    <div class="page-actions">
      <button class="btn btn-outline" onclick="toast('Import template downloaded')">${ICON("upload",16)} Import</button>
      <button class="btn btn-primary" onclick="openAddEmployee()">${ICON("plus",16)} Add employee</button>
    </div>
  </div>
  <div class="panel">
    <div class="toolbar">
      <div class="input-icon-wrap"><span class="input-prefix" style="color:var(--text-tertiary)">${ICON("search",16)}</span><input class="input search" id="empSearch" placeholder="Search employees..." oninput="renderEmpTable()" /></div>
      <select class="select" id="empDept" onchange="renderEmpTable()">${deptOptions("all")}</select>
      <select class="select" id="empType" onchange="renderEmpTable()">${["All types","Permanent","Contract","Hourly Wage"].map(t=>`<option>${t}</option>`).join("")}</select>
      <select class="select" id="empStatus" onchange="renderEmpTable()">${["All status","Present","Absent","On Leave","Late","Working"].map(s=>`<option>${s}</option>`).join("")}</select>
      <div class="spacer"></div>
      <button class="btn btn-outline btn-sm" onclick="toast('Exporting employee list')">${ICON("download",14)} Export</button>
    </div>
    <div class="table-wrap" style="border:none;border-radius:0">
      <table class="data-table" id="empTable"></table>
    </div>
  </div>`;
  renderEmpTable();
}
function deptOptions(allLabel) {
  return `<option>${allLabel}</option>` + DEPARTMENTS.map(d => `<option>${d.name}</option>`).join("");
}
function renderEmpTable() {
  const q = (el("empSearch").value || "").toLowerCase();
  const dept = el("empDept").value;
  const type = el("empType").value;
  const status = el("empStatus").value;
  let rows = EMPLOYEES.filter(e =>
    (!q || e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q)) &&
    (dept === "All departments" || deptName(e.dept) === dept) &&
    (type === "All types" || e.type === type) &&
    (status === "All status" || e.status === status.toLowerCase().replace(" ",""))
  );
  const stc = { present: "success", absent: "error", leave: "warning", late: "info", working: "success" };
  el("empTable").innerHTML = `
    <thead><tr><th>Employee</th><th>Department</th><th>Type</th><th>Shift</th><th>Joining</th><th>Rating</th><th>Status</th><th></th></tr></thead>
    <tbody>
      ${rows.map(e => `<tr class="selectable" onclick="openEmployeeDrawer('${e.id}')">
        <td><div class="emp-cell"><div class="avatar" style="background:${AVATAR_COLORS[e.avatar]}">${INITIALS(e.name)}</div><div><div class="nm">${e.name}</div><div class="id">${e.id}</div></div></div></td>
        <td><div class="cell-main">${deptName(e.dept)}</div><div class="cell-sub">${e.role}</div></td>
        <td><span class="badge badge-${e.type === "Permanent" ? "primary" : e.type === "Contract" ? "info" : "neutral"}">${e.type}</span></td>
        <td>${shiftOf(e.shift).name}<div class="cell-sub">${shiftOf(e.shift).short}</div></td>
        <td>${e.joined}</td>
        <td><span class="row gap-1"><span style="color:var(--warning)">${ICON("star",14)}</span><span class="cell-main">${e.rating}</span></span></td>
        <td><span class="badge badge-${stc[e.status]}"><span class="dot"></span>${e.status[0].toUpperCase()+e.status.slice(1)}</span></td>
        <td><button class="icon-btn icon-btn-sm">${ICON("chevronRight",16)}</button></td>
      </tr>`).join("") || `<tr><td colspan="8"><div class="state-view"><div class="state-icon">${ICON("users",28)}</div><p class="state-title">No employees found</p><p class="state-sub">Try adjusting your search or filters.</p></div></td></tr>`}
    </tbody>`;
}

function openEmployeeDrawer(id) {
  empDrawer = id;
  const e = empOf(id);
  const stc = { present: "success", absent: "error", leave: "warning", late: "info", working: "success" };
  el("drawer").innerHTML = `
    <div class="drawer-head"><span class="t-h3">Employee profile</span><button class="icon-btn" onclick="closeDrawer()">${ICON("close",20)}</button></div>
    <div class="drawer-body">
      <div class="profile-hero" style="display:flex;flex-direction:column;align-items:center;text-align:center">
        <div class="avatar avatar-xl" style="width:76px;height:76px;font-size:26px;background:${AVATAR_COLORS[e.avatar]}">${INITIALS(e.name)}</div>
        <h2 class="t-h2" style="margin-top:10px">${e.name}</h2>
        <p class="t-body-sm text-secondary">${e.id} · ${e.role}</p>
        <div class="row gap-2" style="margin-top:10px"><span class="badge badge-${e.type==="Permanent"?"primary":e.type==="Contract"?"info":"neutral"}">${e.type}</span><span class="badge badge-${stc[e.status]}"><span class="dot"></span>${e.status[0].toUpperCase()+e.status.slice(1)}</span></div>
      </div>
      <div class="tabs tab-scroll" style="background:transparent;padding:0;margin-top:18px">
        <div class="tab active" onclick="empTab(this,'overview')">Overview</div>
        <div class="tab" onclick="empTab(this,'attendance')">Attendance</div>
        <div class="tab" onclick="empTab(this,'leave')">Leave</div>
        <div class="tab" onclick="empTab(this,'wages')">Wages</div>
        <div class="tab" onclick="empTab(this,'docs')">Documents</div>
      </div>
      <div id="empDrawerContent" style="margin-top:16px"></div>
    </div>`;
  empTab(null, "overview", e);
  el("drawerBackdrop").classList.add("open");
}
function empTab(tab, key) {
  document.querySelectorAll("#drawer .tab").forEach(t => t.classList.remove("active"));
  if (tab) tab.classList.add("active");
  const e = empOf(empDrawer);
  const c = el("empDrawerContent");
  if (key === "overview") c.innerHTML = `
    <div class="card card-pad"><p class="t-h3" style="margin-bottom:4px">Contact &amp; employment</p>
      <div class="kv"><span class="kv-key">Phone</span><span class="kv-val">${e.phone}</span></div>
      <div class="kv"><span class="kv-key">Email</span><span class="kv-val">${e.name.toLowerCase().replace(/ /g,".")}@orchidflowers.in</span></div>
      <div class="kv"><span class="kv-key">Department</span><span class="kv-val">${deptName(e.dept)}</span></div>
      <div class="kv"><span class="kv-key">Designation</span><span class="kv-val">${e.role}</span></div>
      <div class="kv"><span class="kv-key">Shift</span><span class="kv-val">${shiftOf(e.shift).name} · ${shiftOf(e.shift).short}</span></div>
      <div class="kv"><span class="kv-key">Joining date</span><span class="kv-val">${e.joined}</span></div>
      <div class="kv"><span class="kv-key">Reporting manager</span><span class="kv-val">${e.manager === "—" ? "Head Office" : e.manager}</span></div>
      <div class="kv"><span class="kv-key">Hourly rate</span><span class="kv-val">₹${e.wage.rate} / hr</span></div>
    </div>
    <div class="row gap-2" style="margin-top:14px">
      <button class="btn btn-outline flex-1" onclick="toast('Edit form opens here')">${ICON("edit",16)} Edit</button>
      <button class="btn btn-primary flex-1" onclick="toast('Assignments opened')">${ICON("briefcase",16)} Assign work</button>
    </div>`;
  else if (key === "attendance") c.innerHTML = `
    <div class="card card-pad"><p class="t-h3">This month</p>
      <div class="kpi-grid cols-3" style="margin-top:12px">
        <div class="card kpi"><span class="kpi-label">Present</span><span class="kpi-val" style="color:var(--success-dark)">18</span></div>
        <div class="card kpi"><span class="kpi-label">Late</span><span class="kpi-val" style="color:var(--info)">2</span></div>
        <div class="card kpi"><span class="kpi-label">Absent</span><span class="kpi-val" style="color:var(--error)">1</span></div>
      </div>
      <div class="bars" style="margin-top:16px;height:90px">${[8,8,8,7,8,0,0].map((b,i)=>`<div class="bar ${i<5?"main":""}" style="height:${(b/8)*100}%"></div>`).join("")}</div>
      <p class="t-caption text-tertiary text-center">Last 7 days</p>
    </div>
    <div class="card card-pad" style="margin-top:12px"><p class="t-h3" style="margin-bottom:4px">Today</p>
      <div class="kv"><span class="kv-key">Check-in</span><span class="kv-val">05:58</span></div>
      <div class="kv"><span class="kv-key">Check-out</span><span class="kv-val">14:02</span></div>
      <div class="kv"><span class="kv-key">Working hours</span><span class="kv-val">8.1 hrs</span></div>
    </div>`;
  else if (key === "leave") c.innerHTML = `
    <div class="card card-pad"><p class="t-h3" style="margin-bottom:4px">Balance</p>
      <div class="kv"><span class="kv-key">Casual Leave</span><span class="kv-val">8 / 10</span></div>
      <div class="kv"><span class="kv-key">Sick Leave</span><span class="kv-val">10 / 10</span></div>
      <div class="kv"><span class="kv-key">Earned Leave</span><span class="kv-val">12 / 12</span></div>
    </div>`;
  else if (key === "wages") c.innerHTML = `
    <div class="card card-pad"><p class="t-h3" style="margin-bottom:4px">Wage info</p>
      <div class="kv"><span class="kv-key">Hourly rate</span><span class="kv-val">₹${e.wage.rate}</span></div>
      <div class="kv"><span class="kv-key">Overtime rate</span><span class="kv-val">₹${Math.round(e.wage.rate*1.25)} (1.25×)</span></div>
      <div class="kv"><span class="kv-key">Effective from</span><span class="kv-val">${e.wage.eff}</span></div>
      <div class="kv"><span class="kv-key">Week 33 est.</span><span class="kv-val" style="color:var(--success-dark)">₹5,475</span></div>
    </div>`;
  else if (key === "docs") c.innerHTML = `
    <div class="card">
      <div class="doc-card"><div class="doc-icon id">${ICON("fingerprint",20)}</div><div class="col flex-1"><p class="list-title">Aadhaar Card</p><p class="list-sub">12 Aug 2024</p></div><span class="badge badge-success">Verified</span></div>
      <div class="doc-card"><div class="doc-icon id">${ICON("fingerprint",20)}</div><div class="col flex-1"><p class="list-title">PAN Card</p><p class="list-sub">12 Aug 2024</p></div><span class="badge badge-success">Verified</span></div>
      <div class="doc-card"><div class="doc-icon edu">${ICON("graduation",20)}</div><div class="col flex-1"><p class="list-title">SSLC Certificate</p><p class="list-sub">15 Aug 2024</p></div><span class="badge badge-success">Verified</span></div>
    </div>`;
}
function closeDrawer() { el("drawerBackdrop").classList.remove("open"); }
window.closeDrawer = closeDrawer;

function openAddEmployee() {
  el("modal").innerHTML = `
    <div class="row between"><span class="t-h2">Add employee</span><button class="icon-btn" onclick="closeModal()">${ICON("close",20)}</button></div>
    <p class="t-body-sm text-secondary" style="margin-top:4px">Create a new employee record. Required fields are marked.</p>
    <div class="form-grid" style="margin-top:20px;grid-template-columns:1fr 1fr">
      <div class="field" style="grid-column:1/-1"><label class="field-label">Full name *</label><input class="input" placeholder="Enter full name" /></div>
      <div class="field"><label class="field-label">Mobile number *</label><div class="input-icon-wrap"><span class="input-prefix">+91</span><input class="input" placeholder="98450 00000" /></div></div>
      <div class="field"><label class="field-label">Email</label><input class="input" placeholder="name@orchidflowers.in" /></div>
      <div class="field"><label class="field-label">Department</label><select class="select">${DEPARTMENTS.map(d=>`<option>${d.name}</option>`).join("")}</select></div>
      <div class="field"><label class="field-label">Designation</label><select class="select"><option>Gardening Staff</option><option>Packing Staff</option><option>Driver</option><option>Supervisor</option><option>Sales Associate</option><option>HR Executive</option></select></div>
      <div class="field"><label class="field-label">Employment type</label><select class="select"><option>Hourly Wage</option><option>Permanent</option><option>Contract</option></select></div>
      <div class="field"><label class="field-label">Hourly rate (₹)</label><input class="input" value="120" /></div>
      <div class="field"><label class="field-label">Shift</label><select class="select">${SHIFTS.map(s=>`<option>${s.name}</option>`).join("")}</select></div>
      <div class="field"><label class="field-label">Joining date</label><input class="input" value="14 Aug 2026" /></div>
      <div class="field"><label class="field-label">Reporting manager</label><select class="select"><option>Arun Kumar</option><option>Priya Devi</option><option>R. Vasanth</option><option>Kavitha R</option><option>Meena S</option></select></div>
    </div>
    <div class="row gap-2" style="margin-top:24px"><button class="btn btn-outline flex-1" onclick="closeModal()">Cancel</button><button class="btn btn-primary flex-1" onclick="closeModal();toast('Employee created · invite sent via SMS')">Create employee</button></div>`;
  el("modalBackdrop").classList.add("open");
}
function closeModal() { el("modalBackdrop").classList.remove("open"); }
window.closeModal = closeModal;

/* ============================================================
   RECRUITMENT
   ============================================================ */
function renderRecruitment() {
  const st = ["Applied","Screening","Interview","Selected","Offer","Joined","Rejected"];
  const counts = { Applied:1, Screening:1, Interview:2, Selected:1, Offer:1, Joined:0, Rejected:1 };
  el("sec-recruitment").innerHTML = `
  <div class="page-head">
    <div><h2 class="t-h1" style="font-size:22px">Recruitment</h2><p class="sub">7 candidates this month · 4 interviews this week · 5 open positions</p></div>
    <div class="page-actions"><button class="btn btn-outline" onclick="navigate('candidates')">${ICON("list",16)} All candidates</button><button class="btn btn-primary" onclick="toast('New position form opens')">${ICON("plus",16)} New position</button></div>
  </div>
  <div class="kpi-grid cols-6">
    ${kpi("Open positions","5","3 urgent","briefcase","var(--primary-light)","var(--primary)")}
    ${kpi("Candidates","7","this month","user","var(--info-bg)","var(--info)")}
    ${kpi("Interviews","4","this week","video","var(--primary-light)","var(--primary)")}
    ${kpi("Selected","2","awaiting offer","checkCircle","var(--warning-bg)","var(--warning)")}
    ${kpi("Offers","1","in review","mail","var(--info-bg)","var(--info)")}
    ${kpi("Joined","2","this quarter","handshake","var(--success-bg)","var(--success-dark)")}
  </div>
  <div class="panel mt-6"><div class="panel-head"><span class="t-h3">Pipeline by stage</span></div>
    <div class="panel-body"><div class="funnel">${st.map(s=>`<div class="funnel-item"><span class="t-caption text-secondary" style="width:76px">${s}</span><div class="funnel-bar ${counts[s]===0?"zero":""}" style="width:${(counts[s]/2)*100}%">${counts[s]} ${counts[s]===1?"candidate":"candidates"}</div></div>`).join("")}</div></div></div>
  <div class="grid-2-equal mt-6">
    <div class="panel"><div class="panel-head"><span class="t-h3">Open positions</span></div><div class="panel-body flush" id="recPositions"></div></div>
    <div class="panel"><div class="panel-head"><span class="t-h3">Upcoming interviews</span><span class="section-link" onclick="toast('Schedule form opens')">+ Schedule</span></div><div class="panel-body flush" id="recInterviews"></div></div>
  </div>`;
  el("recPositions").innerHTML = `<div class="milestone"><div class="col flex-1"><p class="list-title">Gardening Staff</p><p class="list-sub">Production · 3 positions</p></div><span class="badge badge-error">Urgent</span><button class="icon-btn icon-btn-sm">${ICON("chevronRight",16)}</button></div>
    <div class="milestone"><div class="col flex-1"><p class="list-title">Packing Supervisor</p><p class="list-sub">Packing · 1 position</p></div><span class="badge badge-warning">Active</span><button class="icon-btn icon-btn-sm">${ICON("chevronRight",16)}</button></div>
    <div class="milestone"><div class="col flex-1"><p class="list-title">HR Executive</p><p class="list-sub">HR · offer out</p></div><span class="badge badge-success">Offer</span><button class="icon-btn icon-btn-sm">${ICON("chevronRight",16)}</button></div>
    <div class="milestone"><div class="col flex-1"><p class="list-title">Driver</p><p class="list-sub">Logistics · 1 position</p></div><span class="badge badge-info">Screening</span><button class="icon-btn icon-btn-sm">${ICON("chevronRight",16)}</button></div>`;
  el("recInterviews").innerHTML = `<div class="milestone"><div class="avatar" style="background:${AVATAR_COLORS[1]}">AS</div><div class="col flex-1"><p class="list-title">Aarthi S · Packing Supervisor</p><p class="list-sub">Today · 11:30 AM · In person</p></div><span class="badge badge-primary">Today</span></div>
    <div class="milestone"><div class="avatar" style="background:${AVATAR_COLORS[5]}">SM</div><div class="col flex-1"><p class="list-title">Selvi M · Packing Staff</p><p class="list-sub">17 Aug · 10:00 AM · In person</p></div><button class="btn btn-outline btn-sm" onclick="toast('Evaluation opened')">Evaluate</button></div>
    <div class="milestone"><div class="avatar" style="background:${AVATAR_COLORS[0]}">NR</div><div class="col flex-1"><p class="list-title">Naveen R · Gardening Staff</p><p class="list-sub">18 Aug · 09:30 AM · Phone</p></div></div>`;
}

/* ============================================================
   CANDIDATES (kanban)
   ============================================================ */
function renderCandidates() {
  const st = ["Applied","Screening","Interview","Selected","Offer","Joined","Rejected"];
  el("sec-candidates").innerHTML = `
  <div class="page-head">
    <div><h2 class="t-h1" style="font-size:22px">Candidates</h2><p class="sub">Drag cards between stages in the full build</p></div>
    <div class="page-actions"><button class="btn btn-primary" onclick="toast('New candidate form opens')">${ICON("plus",16)} Add candidate</button></div>
  </div>
  <div class="pipeline">${st.map(s => `
    <div class="kan-col"><div class="kan-head"><span>${s}</span><span>${CANDIDATES.filter(c=>c.stage===s).length}</span></div>
      ${CANDIDATES.filter(c=>c.stage===s).map(c=>`<div class="kan-card" onclick="openCandidateDrawer('${c.id}')">
        <div class="row gap-2"><div class="avatar avatar-sm" style="background:${AVATAR_COLORS[c.avatar]}">${INITIALS(c.name)}</div>
        <div><div class="k-name">${c.name}</div><div class="k-sub">${c.pos}</div></div></div>
        <div class="row between" style="margin-top:8px"><span class="t-caption text-tertiary">${c.exp}</span><span class="t-caption text-tertiary">₹${c.expected.toLocaleString('en-IN')}</span></div>
      </div>`).join("") || `<p class="t-caption text-tertiary text-center" style="padding:14px 0">Empty</p>`}
    </div>`).join("")}</div>`;
}

function openCandidateDrawer(id) {
  candDrawer = id;
  const c = CANDIDATES.find(x => x.id === id);
  el("drawer").innerHTML = `
    <div class="drawer-head"><span class="t-h3">Candidate</span><button class="icon-btn" onclick="closeDrawer()">${ICON("close",20)}</button></div>
    <div class="drawer-body">
      <div style="display:flex;align-items:center;gap:14px">
        <div class="avatar avatar-lg" style="width:56px;height:56px;font-size:20px;background:${AVATAR_COLORS[c.avatar]}">${INITIALS(c.name)}</div>
        <div class="col flex-1"><h2 class="t-h2">${c.name}</h2><p class="t-body-sm text-secondary">${c.id} · ${c.pos}</p>
        <div class="row gap-2" style="margin-top:6px"><span class="badge badge-${STAGE_COLORS[c.stage]}">${c.stage}</span><span class="badge badge-neutral">${c.exp}</span></div></div>
      </div>
      <div class="card card-pad" style="margin-top:16px"><p class="t-h3" style="margin-bottom:4px">Details</p>
        <div class="kv"><span class="kv-key">Phone</span><span class="kv-val">${c.phone}</span></div>
        <div class="kv"><span class="kv-key">Applied</span><span class="kv-val">${c.applied}</span></div>
        <div class="kv"><span class="kv-key">Expected salary</span><span class="kv-val">₹${c.expected.toLocaleString('en-IN')} / mo</span></div>
        <div class="kv"><span class="kv-key">Interview score</span><span class="kv-val">${c.score || "—"}</span></div>
      </div>
      <div class="row gap-2" style="margin-top:14px">
        <button class="btn btn-outline flex-1" onclick="toast('Interview scheduled')">${ICON("calendar",16)} Schedule</button>
        <button class="btn btn-primary flex-1" onclick="toast('Evaluation opened')">${ICON("edit",16)} Evaluate</button>
        <button class="btn btn-success flex-1" onclick="toast('Offer draft generated')">${ICON("briefcase",16)} Offer</button>
      </div>
      <div class="card card-pad" style="margin-top:14px"><p class="t-h3" style="margin-bottom:4px">Timeline</p>
        <div class="timeline" style="margin-top:10px">
          <div class="timeline-item done"><p class="t-body-sm" style="font-weight:600">Applied</p><p class="t-caption text-tertiary">${c.applied}</p></div>
          <div class="timeline-item ${c.stage==="Screening"||c.stage==="Interview"||c.stage==="Selected"||c.stage==="Offer"?"current":c.stage==="Joined"?"done":""}"><p class="t-body-sm" style="font-weight:600">Screening</p><p class="t-caption text-tertiary">Phone screen · 12 Aug</p></div>
          <div class="timeline-item ${c.stage==="Interview"||c.stage==="Selected"||c.stage==="Offer"?"current":c.stage==="Joined"?"done":""}"><p class="t-body-sm" style="font-weight:600">Interview</p><p class="t-caption text-tertiary">17 Aug · 11:30</p></div>
          <div class="timeline-item ${c.stage==="Selected"||c.stage==="Offer"?"current":c.stage==="Joined"?"done":""}"><p class="t-body-sm" style="font-weight:600">Selection</p><p class="t-caption text-tertiary">—</p></div>
          <div class="timeline-item ${c.stage==="Offer"?"current":c.stage==="Joined"?"done":""}"><p class="t-body-sm" style="font-weight:600">Offer</p><p class="t-caption text-tertiary">—</p></div>
        </div>
      </div>
    </div>`;
  el("drawerBackdrop").classList.add("open");
}

/* ============================================================
   ONBOARDING
   ============================================================ */
function renderOnboarding() {
  const rows = [
    { name: "Janani V", pos: "HR Executive", stage: "Offer accepted", pct: 38, bar: "38", d: "3/8", avatar: 3 },
    { name: "Bharath K", pos: "Driver", stage: "Offer sent", pct: 25, bar: "25", d: "2/8", avatar: 2 },
    { name: "Aarthi S", pos: "Packing Supervisor", stage: "In interview", pct: 12, bar: "12", d: "1/8", avatar: 1 },
  ];
  el("sec-onboarding").innerHTML = `
  <div class="page-head"><div><h2 class="t-h1" style="font-size:22px">Onboarding</h2><p class="sub">Guided setup for new joiners · 1 active onboarding</p></div></div>
  <div class="panel">
    <div class="table-wrap" style="border:none;border-radius:0"><table class="data-table">
      <thead><tr><th>Candidate</th><th>Position</th><th>Stage</th><th>Progress</th><th>Steps</th><th></th></tr></thead>
      <tbody>${rows.map(r => `<tr class="selectable" onclick="toast('Opening onboarding: ${r.name}')">
        <td><div class="emp-cell"><div class="avatar" style="background:${AVATAR_COLORS[r.avatar]}">${INITIALS(r.name)}</div><div class="nm">${r.name}</div></div></td>
        <td>${r.pos}</td><td><span class="badge badge-primary">${r.stage}</span></td>
        <td><div style="width:180px"><div class="progress"><div class="progress-bar" style="width:${r.bar}%"></div></div><span class="t-caption text-tertiary">${r.pct}% complete</span></div></td>
        <td>${r.d} steps</td><td><button class="icon-btn icon-btn-sm">${ICON("chevronRight",16)}</button></td></tr>`).join("")}</tbody>
    </table></div>
  </div>
  <div class="grid-2-equal mt-6">
    <div class="panel"><div class="panel-head"><span class="t-h3">Onboarding checklist</span></div><div class="panel-body flush">
      <div class="milestone"><span class="onb-step-num done">${ICON("check",14)}</span><div class="col flex-1"><p class="list-title" style="font-size:13.5px">Personal information</p></div><span class="badge badge-success">Done</span></div>
      <div class="milestone"><span class="onb-step-num done">${ICON("check",14)}</span><div class="col flex-1"><p class="list-title" style="font-size:13.5px">Employment details</p></div><span class="badge badge-success">Done</span></div>
      <div class="milestone"><span class="onb-step-num current">3</span><div class="col flex-1"><p class="list-title" style="font-size:13.5px">Documents</p><p class="list-sub">3 uploaded · 1 pending</p></div><span class="badge badge-warning">In progress</span></div>
      <div class="milestone"><span class="onb-step-num">4</span><div class="col flex-1"><p class="list-title" style="font-size:13.5px">Reporting</p></div></div>
      <div class="milestone"><span class="onb-step-num">5</span><div class="col flex-1"><p class="list-title" style="font-size:13.5px">Benefits</p></div></div>
    </div></div>
    <div class="panel"><div class="panel-head"><span class="t-h3">Document verification</span></div><div class="panel-body flush">
      <div class="milestone"><div class="doc-icon id">${ICON("fingerprint",18)}</div><div class="col flex-1"><p class="list-title" style="font-size:13.5px">Aadhaar Card</p><p class="list-sub">Janani V · 12 Aug</p></div><span class="badge badge-success">Verified</span></div>
      <div class="milestone"><div class="doc-icon id">${ICON("fingerprint",18)}</div><div class="col flex-1"><p class="list-title" style="font-size:13.5px">PAN Card</p><p class="list-sub">Janani V · 12 Aug</p></div><span class="badge badge-success">Verified</span></div>
      <div class="milestone"><div class="doc-icon emp">${ICON("briefcase",18)}</div><div class="col flex-1"><p class="list-title" style="font-size:13.5px">Bank Account Proof</p><p class="list-sub">Janani V · 12 Aug</p></div><span class="badge badge-warning">Pending</span><button class="btn btn-outline btn-sm" onclick="toast('Verification flow opened')">Verify</button></div>
    </div></div>
  </div>`;
}

/* ============================================================
   DOCUMENTS
   ============================================================ */
function renderDocuments() {
  el("sec-documents").innerHTML = `
  <div class="page-head"><div><h2 class="t-h1" style="font-size:22px">Documents</h2><p class="sub">Secure document center · 2 awaiting verification</p></div>
    <div class="page-actions"><button class="btn btn-outline" onclick="toast('Verification report exported')">${ICON("download",16)} Export</button></div></div>
  <div class="panel">
    <div class="toolbar">
      <div class="input-icon-wrap"><span class="input-prefix" style="color:var(--text-tertiary)">${ICON("search",16)}</span><input class="input search" placeholder="Search documents..." /></div>
      <select class="select"><option>All categories</option><option>Identity</option><option>Education</option><option>Employment</option><option>Other</option></select>
      <select class="select"><option>All status</option><option>Verified</option><option>Pending</option><option>Requires attention</option></select>
      <div class="spacer"></div>
    </div>
    <div class="table-wrap" style="border:none;border-radius:0"><table class="data-table">
      <thead><tr><th>Document</th><th>Category</th><th>Employee</th><th>Uploaded</th><th>Status</th><th></th></tr></thead>
      <tbody>
        ${docRow("Aadhaar Card","Identity","Divya Lakshmi","12 Aug 2024","Verified","success")}
        ${docRow("PAN Card","Identity","Divya Lakshmi","12 Aug 2024","Verified","success")}
        ${docRow("SSLC Certificate","Education","Divya Lakshmi","15 Aug 2024","Verified","success")}
        ${docRow("Bank Account Proof","Employment","Janani V","12 Aug 2026","Pending","warning")}
        ${docRow("Driving License","Other","Ganesh K","02 Jan 2026","Pending","warning")}
        ${docRow("Degree Certificate","Education","Janani V","12 Aug 2026","Pending","warning")}
      </tbody></table></div>
  </div>`;
}
function docRow(n, cat, emp, d, s, c) {
  return `<tr class="selectable" onclick="toast('Preview: ${n}')"><td><div class="emp-cell"><div class="doc-icon ${cat==="Identity"?"id":cat==="Education"?"edu":cat==="Employment"?"emp":"other"}">${ICON(cat==="Identity"?"fingerprint":cat==="Education"?"graduation":cat==="Employment"?"briefcase":"folder",18)}</div><div class="nm">${n}</div></div></td><td>${cat}</td><td>${emp}</td><td>${d}</td><td><span class="badge badge-${c}">${s}</span></td><td><button class="btn btn-outline btn-sm" onclick="event.stopPropagation();toast('Verification opened')">Verify</button></td></tr>`;
}

/* ============================================================
   ATTENDANCE
   ============================================================ */
function renderAttendance() {
  el("sec-attendance").innerHTML = `
  <div class="page-head"><div><h2 class="t-h1" style="font-size:22px">Today's Attendance</h2><p class="sub">Thursday, 14 August 2026 · live</p></div>
    <div class="page-actions"><button class="btn btn-outline" onclick="toast('Attendance exported')">${ICON("download",16)} Export</button><button class="btn btn-primary" onclick="toast('Geofence config opened')">${ICON("mapPin",16)} Geofence</button></div></div>
  <div class="kpi-grid cols-6">
    ${kpi("Present","12","75%","checkCircle","var(--success-bg)","var(--success-dark)")}
    ${kpi("Late","1","Meena S","clock","var(--info-bg)","var(--info)")}
    ${kpi("Absent","1","Santhosh K","alert","var(--error-bg)","var(--error)")}
    ${kpi("On leave","2","approved","calendar","var(--warning-bg)","var(--warning)")}
    ${kpi("Working now","12","live","zap","var(--primary-light)","var(--primary)")}
    ${kpi("Hours today","112.4","incl. OT","timer","var(--primary-light)","var(--primary)")}
  </div>
  <div class="panel mt-6">
    <div class="toolbar">
      <select class="select"><option>14 Aug 2026</option><option>13 Aug 2026</option><option>12 Aug 2026</option></select>
      <select class="select" id="aaDept">${deptOptions("All departments")}</select>
      <select class="select" id="aaStatus"><option>All status</option><option>Present</option><option>Late</option><option>Absent</option><option>On Leave</option><option>Working</option></select>
      <div class="spacer"></div>
    </div>
    <div class="table-wrap" style="border:none;border-radius:0"><table class="data-table" id="aaTable"></table></div>
  </div>`;
  renderAaTable();
}
function renderAaTable() {
  const dept = el("aaDept").value;
  const status = el("aaStatus").value;
  let rows = ATTENDANCE_TODAY.filter(r => (dept === "All departments" || deptName(empOf(r.emp).dept) === dept) && (status === "All status" || r.status === status));
  const stc = { Present: "success", Late: "info", Absent: "error", "On Leave": "warning", Working: "success" };
  el("aaTable").innerHTML = `
    <thead><tr><th>Employee</th><th>Department</th><th>Shift</th><th>Check-in</th><th>Check-out</th><th>Hours</th><th>Status</th><th></th></tr></thead>
    <tbody>${rows.map(r => { const e = empOf(r.emp); return `<tr class="selectable" onclick="openEmployeeDrawer('${r.emp}')">
      <td><div class="emp-cell"><div class="avatar" style="background:${AVATAR_COLORS[e.avatar]}">${INITIALS(e.name)}</div><div class="nm">${e.name}</div></div></td>
      <td>${deptName(e.dept)}</td><td>${shiftOf(e.shift).name}</td><td>${r.in}</td><td>${r.out}</td><td>${r.hrs} hrs</td>
      <td><span class="badge badge-${stc[r.status]}"><span class="dot"></span>${r.status}</span></td>
      <td><button class="icon-btn icon-btn-sm">${ICON("chevronRight",16)}</button></td></tr>`; }).join("")}</tbody>`;
}

/* ============================================================
   HOURLY WORKFORCE
   ============================================================ */
function renderHourly() {
  const hourly = EMPLOYEES.filter(e => e.type === "Hourly Wage");
  el("sec-hourly").innerHTML = `
  <div class="page-head"><div><h2 class="t-h1" style="font-size:22px">Hourly Workforce</h2><p class="sub">5 hourly employees · GPS-verified hours flow into weekly wage runs</p></div>
    <div class="page-actions"><button class="btn btn-outline" onclick="toast('Timesheet exported')">${ICON("download",16)} Export timesheet</button><button class="btn btn-primary" onclick="toast('Rate rule opens')">${ICON("settings",16)} Wage rules</button></div></div>
  <div class="kpi-grid cols-6">
    ${kpi("Hourly employees","5","of 16 total","users","var(--primary-light)","var(--primary)")}
    ${kpi("Hours today","36.8","6 working","clock","var(--info-bg)","var(--info)")}
    ${kpi("Hours this week","198","of 200 target","timer","var(--info-bg)","var(--info)")}
    ${kpi("Overtime","10.0","hrs this week","zap","var(--warning-bg)","var(--warning)")}
    ${kpi("Est. week wage","₹26,700","Week 33","wallet","var(--success-bg)","var(--success-dark)")}
    ${kpi("Pending approval","2","₹10,875","checkCircle","var(--error-bg)","var(--error)")}
  </div>
  <div class="panel mt-6">
    <div class="panel-head"><span class="t-h3">Hourly employees</span><span class="section-link" onclick="navigate('wages')">Review wages</span></div>
    <div class="table-wrap" style="border:none;border-radius:0"><table class="data-table">
      <thead><tr><th>Employee</th><th>Role</th><th>Rate</th><th>OT rate</th><th>Hrs (week)</th><th>OT (week)</th><th>Est. wage</th><th></th></tr></thead>
      <tbody>${hourly.map(e => `<tr class="selectable" onclick="openEmployeeDrawer('${e.id}')">
        <td><div class="emp-cell"><div class="avatar" style="background:${AVATAR_COLORS[e.avatar]}">${INITIALS(e.name)}</div><div class="nm">${e.name}</div></div></td>
        <td>${e.role}</td><td><span class="cell-main">₹${e.wage.rate}</span><div class="cell-sub">eff ${e.wage.eff}</div></td>
        <td>₹${Math.round(e.wage.rate*1.25)}</td><td>40.0</td><td>4.5</td>
        <td><span class="cell-main" style="color:var(--success-dark)">₹${((40*e.wage.rate)+(4.5*Math.round(e.wage.rate*1.25))).toLocaleString('en-IN')}</span></td>
        <td><button class="icon-btn icon-btn-sm">${ICON("chevronRight",16)}</button></td></tr>`).join("")}</tbody>
    </table></div>
  </div>
  <div class="grid-2 mt-6">
    <div class="panel"><div class="panel-head"><span class="t-h3">Hours this week</span><span class="t-caption text-tertiary">198 / 200 target</span></div>
      <div class="panel-body"><div class="bars lg">${[42,38,40,44,34,0,0].map((b,i)=>`<div class="bar ${i<5?"main":""}" style="height:${(b/44)*100}%"></div>`).join("")}</div>
      <div class="row between" style="margin-top:8px"><span class="t-caption text-tertiary">Mon</span><span class="t-caption text-tertiary">Tue</span><span class="t-caption text-tertiary">Wed</span><span class="t-caption text-tertiary">Thu</span><span class="t-caption text-tertiary">Fri</span><span class="t-caption text-tertiary">Sat</span><span class="t-caption text-tertiary">Sun</span></div></div></div>
    <div class="panel"><div class="panel-head"><span class="t-h3">Wage breakdown · Week 33</span></div>
      <div class="panel-body">
        <div class="kv"><span class="kv-key">Regular hours</span><span class="kv-val">198 hrs</span></div>
        <div class="kv"><span class="kv-key">Regular wage</span><span class="kv-val">₹25,270</span></div>
        <div class="kv"><span class="kv-key">Overtime hours</span><span class="kv-val">10.0 hrs</span></div>
        <div class="kv"><span class="kv-key">Overtime wage</span><span class="kv-val">₹1,430</span></div>
        <div class="divider" style="margin:8px 0"></div>
        <div class="row between"><span class="t-body" style="font-weight:700">Estimated total</span><span class="t-h2" style="color:var(--success-dark)">₹26,700</span></div>
      </div></div>
  </div>`;
}

/* ============================================================
   OVERTIME
   ============================================================ */
function renderOvertime() {
  el("sec-overtime").innerHTML = `
  <div class="page-head"><div><h2 class="t-h1" style="font-size:22px">Overtime</h2><p class="sub">2 requests pending approval · 16 hrs weekly cap</p></div>
    <div class="page-actions"><button class="btn btn-primary" onclick="toast('Overtime rule opens')">${ICON("settings",16)} Overtime rules</button></div></div>
  <div class="kpi-grid cols-4">
    ${kpi("Pending approval","2","4.5 hrs","clock","var(--warning-bg)","var(--warning)")}
    ${kpi("Approved","6","this week","checkCircle","var(--success-bg)","var(--success-dark)")}
    ${kpi("Total OT hours","10.0","of 16 cap","zap","var(--info-bg)","var(--info)")}
    ${kpi("Estimated cost","₹1,430","this week","wallet","var(--error-bg)","var(--error)")}
  </div>
  <div class="panel mt-6"><div class="panel-head"><span class="t-h3">Pending approval</span></div><div class="panel-body">
    <div class="appr-grid" id="otPendGrid"></div></div></div>
  <div class="panel mt-6"><div class="panel-head"><span class="t-h3">Recent requests</span></div>
    <div class="table-wrap" style="border:none;border-radius:0"><table class="data-table">
      <thead><tr><th>Employee</th><th>Date</th><th>Regular</th><th>Overtime</th><th>Rate</th><th>Amount</th><th>Status</th></tr></thead>
      <tbody>${OVERTIME_REQUESTS.map(o => { const e = empOf(o.emp); return `<tr>
        <td><div class="emp-cell"><div class="avatar avatar-sm" style="background:${AVATAR_COLORS[e.avatar]}">${INITIALS(e.name)}</div><div class="nm">${e.name}</div></div></td>
        <td>${o.date}</td><td>${o.reg} hrs</td><td><span style="color:var(--warning);font-weight:600">${o.ot} hrs</span></td><td>₹${o.rate}</td><td><span class="cell-main">₹${(o.ot*o.rate).toLocaleString('en-IN')}</span></td>
        <td><span class="badge badge-${o.status==="approved"?"success":o.status==="rejected"?"error":"warning"}">${o.status[0].toUpperCase()+o.status.slice(1)}</span></td></tr>`; }).join("")}</tbody>
    </table></div></div>`;
  const pend = OVERTIME_REQUESTS.filter(o => o.status === "pending");
  el("otPendGrid").innerHTML = pend.map(o => {
    const e = empOf(o.emp);
    return `<div class="card appr-card-w"><div class="row gap-3"><div class="avatar" style="background:${AVATAR_COLORS[e.avatar]}">${INITIALS(e.name)}</div>
      <div class="col flex-1"><p class="list-title">${e.name}</p><p class="list-sub">${e.role} · ${o.date}</p></div></div>
      <div class="kv"><span class="kv-key">Regular hours</span><span class="kv-val">${o.reg} hrs</span></div>
      <div class="kv"><span class="kv-key">Overtime hours</span><span class="kv-val" style="color:var(--warning)">${o.ot} hrs</span></div>
      <div class="kv"><span class="kv-key">Overtime rate</span><span class="kv-val">₹${o.rate}</span></div>
      <div class="kv"><span class="kv-key">Estimated amount</span><span class="kv-val">₹${(o.ot*o.rate).toLocaleString('en-IN')}</span></div>
      <div class="row gap-2" style="margin-top:12px"><button class="btn btn-success flex-1" onclick="toast('Overtime approved')">${ICON("check",16)} Approve</button><button class="btn btn-outline flex-1" onclick="toast('Rejected','error')">Reject</button></div></div>`;
  }).join("");
}

/* ============================================================
   WAGES
   ============================================================ */
function renderWages() {
  el("sec-wages").innerHTML = `
  <div class="page-head"><div><h2 class="t-h1" style="font-size:22px">Wage Management</h2><p class="sub">Weekly wage runs for hourly workforce · 2 awaiting approval</p></div>
    <div class="page-actions"><button class="btn btn-outline" onclick="toast('Wage report exported')">${ICON("download",16)} Export</button><button class="btn btn-primary" onclick="toast('New wage run created')">${ICON("plus",16)} Create run</button></div></div>
  <div class="kpi-grid cols-4">
    ${kpi("Today's wage","₹4,440","36.8 hrs","wallet","var(--success-bg)","var(--success-dark)")}
    ${kpi("This week","₹26,700","Week 33","wallet","var(--info-bg)","var(--info)")}
    ${kpi("This month","₹1,02,400","Aug 2026","chart","var(--primary-light)","var(--primary)")}
    ${kpi("Pending approval","2","₹10,875","checkCircle","var(--error-bg)","var(--error)")}
  </div>
  <div class="panel mt-6"><div class="panel-head"><span class="t-h3">Weekly wage runs</span><span class="t-caption text-tertiary">Draft → Submitted → Reviewed → Approved</span></div>
    <div class="table-wrap" style="border:none;border-radius:0"><table class="data-table">
      <thead><tr><th>Employee</th><th>Period</th><th>Hours</th><th>OT</th><th>Regular</th><th>Overtime wage</th><th>Total</th><th>Status</th><th></th></tr></thead>
      <tbody>${WAGE_RUNS.map(r => { const e = empOf(r.emp); const sc = { Draft:"neutral", Submitted:"info", Reviewed:"warning", Approved:"success" };
        return `<tr class="selectable" onclick="openWageDrawer('${e.id}')">
        <td><div class="emp-cell"><div class="avatar avatar-sm" style="background:${AVATAR_COLORS[e.avatar]}">${INITIALS(e.name)}</div><div class="nm">${e.name}</div></div></td>
        <td>${r.period}</td><td>${r.hours}</td><td>${r.ot}</td><td>₹${r.regAmt.toLocaleString('en-IN')}</td><td>₹${r.otAmt.toLocaleString('en-IN')}</td>
        <td><span class="cell-main" style="color:var(--success-dark)">₹${r.total.toLocaleString('en-IN')}</span></td>
        <td><span class="badge badge-${sc[r.status]}">${r.status}</span></td>
        <td>${r.status === "Submitted" ? `<button class="btn btn-success btn-sm" onclick="event.stopPropagation();toast('Wage approved · moved to Reviewed')">${ICON("check",14)} Approve</button>` : `<button class="icon-btn icon-btn-sm">${ICON("chevronRight",16)}</button>`}</td></tr>`; }).join("")}</tbody>
    </table></div></div>
  <div class="grid-2-equal mt-6">
    <div class="panel"><div class="panel-head"><span class="t-h3">Wage trend</span><span class="t-caption text-tertiary">Last 8 weeks</span></div>
      <div class="panel-body"><div class="bars lg">${[22,24,23,25,24,26,25,26.7].map(b=>`<div class="bar ${b>=26?"main":""}" style="height:${(b/26.7)*100}%"></div>`).join("")}</div>
      <div class="row between" style="margin-top:8px"><span class="t-caption text-tertiary">W27</span><span class="t-caption text-tertiary">W29</span><span class="t-caption text-tertiary">W31</span><span class="t-caption text-tertiary">W33</span></div></div></div>
    <div class="panel"><div class="panel-head"><span class="t-h3">Approval flow</span></div><div class="panel-body">
      <div class="timeline"><div class="timeline-item done"><p class="t-body-sm" style="font-weight:600">Draft</p><p class="t-caption text-tertiary">Auto-generated on Sunday</p></div>
      <div class="timeline-item done"><p class="t-body-sm" style="font-weight:600">Submitted</p><p class="t-caption text-tertiary">System sends to HR</p></div>
      <div class="timeline-item current"><p class="t-body-sm" style="font-weight:600">Reviewed</p><p class="t-caption text-tertiary">HR checks hours &amp; rates</p></div>
      <div class="timeline-item"><p class="t-body-sm" style="font-weight:600">Approved</p><p class="t-caption text-tertiary">Ready for payment (Payroll, Phase 2)</p></div></div></div></div>
  </div>`;
}
function openWageDrawer(id) {
  const e = empOf(id);
  const r = WAGE_RUNS.find(x => x.emp === id) || WAGE_RUNS[0];
  el("drawer").innerHTML = `
    <div class="drawer-head"><span class="t-h3">Wage calculation</span><button class="icon-btn" onclick="closeDrawer()">${ICON("close",20)}</button></div>
    <div class="drawer-body">
      <div class="row gap-3"><div class="avatar avatar-lg" style="background:${AVATAR_COLORS[e.avatar]}">${INITIALS(e.name)}</div>
        <div class="col flex-1"><h2 class="t-h2">${e.name}</h2><p class="t-body-sm text-secondary">${e.id} · ${e.role}</p></div>
        <span class="badge badge-${r.status==="Submitted"?"info":r.status==="Approved"?"success":"neutral"}">${r.status}</span></div>
      <div class="card card-pad" style="margin-top:16px"><p class="t-h3" style="margin-bottom:4px">Breakdown · ${r.period}</p>
        <div class="kv"><span class="kv-key">Regular hours</span><span class="kv-val">${r.hours} × ₹${e.wage.rate}</span></div>
        <div class="kv"><span class="kv-key">Regular wage</span><span class="kv-val">₹${r.regAmt.toLocaleString('en-IN')}</span></div>
        <div class="kv"><span class="kv-key">Overtime hours</span><span class="kv-val">${r.ot} × ₹${Math.round(e.wage.rate*1.25)}</span></div>
        <div class="kv"><span class="kv-key">Overtime wage</span><span class="kv-val">₹${r.otAmt.toLocaleString('en-IN')}</span></div>
        <div class="kv"><span class="kv-key">Deductions</span><span class="kv-val">₹0</span></div>
        <div class="divider" style="margin:8px 0"></div>
        <div class="row between"><span class="t-body" style="font-weight:700">Total</span><span class="t-h2" style="color:var(--success-dark)">₹${r.total.toLocaleString('en-IN')}</span></div>
      </div>
      <div class="card card-pad" style="margin-top:12px"><p class="t-h3" style="margin-bottom:4px">Approval</p>
        <div class="timeline"><div class="timeline-item done"><p class="t-body-sm" style="font-weight:600">Draft</p></div>
        <div class="timeline-item ${r.status==="Submitted"?"current":r.status==="Reviewed"||r.status==="Approved"?"done":""}"><p class="t-body-sm" style="font-weight:600">Submitted</p><p class="t-caption text-tertiary">13 Aug · system</p></div>
        <div class="timeline-item ${r.status==="Reviewed"?"current":r.status==="Approved"?"done":""}"><p class="t-body-sm" style="font-weight:600">Reviewed</p></div>
        <div class="timeline-item ${r.status==="Approved"?"done":""}"><p class="t-body-sm" style="font-weight:600">Approved</p></div></div></div>
      <div class="row gap-2" style="margin-top:16px"><button class="btn btn-outline flex-1" onclick="closeDrawer()">Close</button><button class="btn btn-success flex-1" onclick="toast('Wage approved');closeDrawer()">${ICON("check",16)} Approve</button></div>
    </div>`;
  el("drawerBackdrop").classList.add("open");
}

/* ============================================================
   LEAVE
   ============================================================ */
function renderLeave() {
  el("sec-leave").innerHTML = `
  <div class="page-head"><div><h2 class="t-h1" style="font-size:22px">Leave Management</h2><p class="sub">2 requests pending approval · August</p></div>
    <div class="page-actions"><button class="btn btn-outline" onclick="toast('Leave balance exported')">${ICON("download",16)} Export</button><button class="btn btn-primary" onclick="toast('Leave type opens')">${ICON("settings",16)} Leave types</button></div></div>
  <div class="kpi-grid cols-4">
    ${kpi("Pending approval","2","requests","clock","var(--warning-bg)","var(--warning)")}
    ${kpi("Approved","2","this month","checkCircle","var(--success-bg)","var(--success-dark)")}
    ${kpi("On leave today","2","approved","calendar","var(--info-bg)","var(--info)")}
    ${kpi("Avg days / emp","2.4","Aug 2026","chart","var(--primary-light)","var(--primary)")}
  </div>
  <div class="panel mt-6"><div class="panel-head"><span class="t-h3">Pending approval</span></div><div class="panel-body">
    <div class="appr-grid" id="leavePend"></div></div></div>
  <div class="panel mt-6"><div class="panel-head"><span class="t-h3">All requests · August</span></div>
    <div class="table-wrap" style="border:none;border-radius:0"><table class="data-table">
      <thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th></th></tr></thead>
      <tbody>${LEAVES.map(l => { const e = empOf(l.emp); const sc = { pending:"warning", approved:"success", rejected:"error" };
        return `<tr class="selectable" onclick="openEmployeeDrawer('${l.emp}')">
        <td><div class="emp-cell"><div class="avatar avatar-sm" style="background:${AVATAR_COLORS[e.avatar]}">${INITIALS(e.name)}</div><div class="nm">${e.name}</div></div></td>
        <td>${l.type.replace(" Leave","")}</td><td>${l.from}</td><td>${l.to}</td><td>${l.days}</td>
        <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.reason}</td>
        <td><span class="badge badge-${sc[l.status]}">${l.status[0].toUpperCase()+l.status.slice(1)}</span></td>
        <td>${l.status==="pending"?`<button class="btn btn-success btn-sm" onclick="event.stopPropagation();toast('Leave approved')">${ICON("check",14)} Approve</button>`:`<button class="icon-btn icon-btn-sm">${ICON("chevronRight",16)}</button>`}</td></tr>`; }).join("")}</tbody>
    </table></div></div>`;
  const pend = LEAVES.filter(l => l.status === "pending");
  el("leavePend").innerHTML = pend.map(l => {
    const e = empOf(l.emp);
    return `<div class="card appr-card-w"><div class="row gap-3"><div class="avatar" style="background:${AVATAR_COLORS[e.avatar]}">${INITIALS(e.name)}</div>
      <div class="col flex-1"><p class="list-title">${e.name}</p><p class="list-sub">${e.role} · ${e.id}</p></div><span class="badge badge-primary">${l.type.replace(" Leave","")}</span></div>
      <div class="kv"><span class="kv-key">Dates</span><span class="kv-val">${l.from} – ${l.to}</span></div>
      <div class="kv"><span class="kv-key">Days</span><span class="kv-val">${l.days}</span></div>
      <div class="kv"><span class="kv-key">Balance</span><span class="kv-val">${l.balance} days</span></div>
      <p class="t-body-sm text-secondary" style="margin-top:10px">${l.reason}</p>
      <div class="row gap-2" style="margin-top:12px"><button class="btn btn-success flex-1" onclick="toast('Leave approved')">${ICON("check",16)} Approve</button><button class="btn btn-outline flex-1" onclick="toast('Leave rejected','error')">Reject</button></div></div>`;
  }).join("");
}

/* ============================================================
   SHIFTS
   ============================================================ */
function renderShifts() {
  el("sec-shifts").innerHTML = `
  <div class="page-head"><div><h2 class="t-h1" style="font-size:22px">Shifts &amp; Schedules</h2><p class="sub">Shift master · assignments · change requests</p></div>
    <div class="page-actions"><button class="btn btn-primary" onclick="toast('New shift opens')">${ICON("plus",16)} New shift</button></div></div>
  <div class="kpi-grid cols-4">
    ${SHIFTS.map((s,i) => `<div class="card kpi"><span class="kpi-icon" style="background:${i===0?"var(--primary-light)":"var(--surface-2)"};color:${i===0?"var(--primary)":"var(--text-secondary)"}">${ICON(i===0?"sun":"moon",18)}</span><span class="kpi-label">${s.name}</span><span class="kpi-val" style="font-size:19px">${s.start} – ${s.end}</span><span class="kpi-sub">Break ${s.break} · grace ${s.grace} min</span></div>`).join("")}
  </div>
  <div class="grid-2-equal mt-6">
    <div class="panel"><div class="panel-head"><span class="t-h3">Assignments · 14 Aug</span></div><div class="panel-body flush" id="shiftAssign"></div></div>
    <div class="panel"><div class="panel-head"><span class="t-h3">Shift change requests</span></div><div class="panel-body flush" id="shiftReqs"></div></div>
  </div>
  <div class="panel mt-6"><div class="panel-head"><span class="t-h3">Shift calendar · August 2026</span></div>
    <div class="panel-body"><div class="wcal-grid">${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>`<div class="t-caption" style="font-weight:600;color:var(--text-tertiary);padding:4px">${d}</div>`).join("")}
      ${[31,1,2,3,4,5,6].map(n=>`<div class="wcal-day other"><span class="t-caption text-tertiary">${n}</span></div>`).join("")}
      ${[7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31].map(n => `<div class="wcal-day ${n===14?"today":""}"><span>${n}</span>${n===11||n===12?`<span class="chip">Night</span>`:n===14?`<span class="chip">Morning</span>`:n%7===0||n%7===6?`<span class="chip" style="background:var(--surface-2)">Off</span>`:""}</div>`).join("")}
    </div></div></div>`;
  el("shiftAssign").innerHTML = EMPLOYEES.slice(0, 6).map(e => `<div class="milestone"><div class="avatar avatar-sm" style="background:${AVATAR_COLORS[e.avatar]}">${INITIALS(e.name)}</div><div class="col flex-1"><p class="list-title" style="font-size:13.5px">${e.name}</p><p class="list-sub">${deptName(e.dept)}</p></div><span class="badge badge-${e.shift==="morning"?"success":e.shift==="evening"?"info":"neutral"}">${shiftOf(e.shift).name}</span></div>`).join("");
  el("shiftReqs").innerHTML = `
    <div class="milestone"><div class="col flex-1"><p class="list-title" style="font-size:13.5px">Divya Lakshmi</p><p class="list-sub">Morning → Evening · 15 Aug</p></div><span class="badge badge-warning">Pending</span></div>
    <div class="milestone"><div class="col flex-1"><p class="list-title" style="font-size:13.5px">Ganesh K</p><p class="list-sub">Evening → Night · 20 Aug</p></div><span class="badge badge-warning">Pending</span></div>`;
}

/* ============================================================
   PERFORMANCE
   ============================================================ */
function renderPerformance() {
  el("sec-performance").innerHTML = `
  <div class="page-head"><div><h2 class="t-h1" style="font-size:22px">Performance</h2><p class="sub">Review cycle · April – June 2026 · 3 pending reviews</p></div>
    <div class="page-actions"><button class="btn btn-primary" onclick="toast('Review cycle opens')">${ICON("plus",16)} New review</button></div></div>
  <div class="kpi-grid cols-4">
    ${kpi("Pending reviews","3","due this month","clock","var(--warning-bg)","var(--warning)")}
    ${kpi("Completed","10","this cycle","checkCircle","var(--success-bg)","var(--success-dark)")}
    ${kpi("Avg performance","4.1","of 5.0","star","var(--primary-light)","var(--primary)")}
    ${kpi("Cycle","Apr–Jun","2026","calendar","var(--info-bg)","var(--info)")}
  </div>
  <div class="panel mt-6"><div class="panel-head"><span class="t-h3">Recent reviews</span></div>
    <div class="table-wrap" style="border:none;border-radius:0"><table class="data-table">
      <thead><tr><th>Employee</th><th>Reviewer</th><th>Cycle</th><th>Self rating</th><th>Manager rating</th><th>Overall</th><th>Status</th></tr></thead>
      <tbody>${EMPLOYEES.slice(0, 8).map(e => `<tr class="selectable" onclick="openEmployeeDrawer('${e.id}')">
        <td><div class="emp-cell"><div class="avatar avatar-sm" style="background:${AVATAR_COLORS[e.avatar]}">${INITIALS(e.name)}</div><div class="nm">${e.name}</div></div></td>
        <td>${e.manager === "—" ? "Head Office" : e.manager}</td><td>Apr–Jun 26</td><td>${(e.rating - 0.3).toFixed(1)}</td><td>${e.rating}</td>
        <td><span class="row gap-1"><span style="color:var(--warning)">${ICON("star",14)}</span><span class="cell-main">${e.rating}</span></span></td>
        <td><span class="badge badge-${e.rating >= 4.2 ? "success" : e.rating >= 3.6 ? "info" : "warning"}">${e.rating >= 4.2 ? "Excellent" : e.rating >= 3.6 ? "Good" : "Needs focus"}</span></td></tr>`).join("")}</tbody>
    </table></div></div>`;
}

/* ============================================================
   ORGANIZATION
   ============================================================ */
function renderOrganization() {
  el("sec-organization").innerHTML = `
  <div class="page-head"><div><h2 class="t-h1" style="font-size:22px">Departments</h2><p class="sub">7 departments · 16 employees</p></div>
    <div class="page-actions"><button class="btn btn-primary" onclick="toast('New department opens')">${ICON("plus",16)} New department</button></div></div>
  <div class="kpi-grid cols-6">
    ${DEPARTMENTS.map((d,i) => `<div class="card kpi"><span class="kpi-label">${d.name}</span><span class="kpi-val">${EMPLOYEES.filter(e=>e.dept===d.id).length}</span><span class="kpi-sub">Head · ${d.head}</span></div>`).join("")}
  </div>
  <div class="panel mt-6"><div class="panel-head"><span class="t-h3">Organization chart</span><span class="t-caption text-tertiary">Company → Department → Team</span></div>
    <div class="panel-body">
      <div class="org-chart">
        <div class="org-node root"><div class="avatar" style="background:var(--primary-light);color:var(--primary-dark)">${ICON("building",20)}</div><p class="t-body" style="font-weight:700">Orchid Flowers</p><p class="t-caption">Managing Director · S. Rajendran</p></div>
        <div class="org-line"></div>
        <div class="org-row">${DEPARTMENTS.map(d => {
          const head = EMPLOYEES.find(e => e.name === d.head);
          return `<div class="org-node"><div class="avatar" style="background:${AVATAR_COLORS[head ? head.avatar : 0]}">${INITIALS(d.head)}</div><p class="t-body-sm" style="font-weight:700">${d.name}</p><p class="t-caption">${d.head} · ${EMPLOYEES.filter(e=>e.dept===d.id).length} members</p></div>`;
        }).join("")}</div>
      </div>
    </div></div>`;
}

/* ============================================================
   POLICIES / HOLIDAYS / EVENTS
   ============================================================ */
function renderPolicies() {
  el("sec-policies").innerHTML = `
  <div class="page-head"><div><h2 class="t-h1" style="font-size:22px">HR Policies</h2><p class="sub">6 policies · latest update 01 Apr 2026</p></div>
    <div class="page-actions"><button class="btn btn-primary" onclick="toast('New policy opens')">${ICON("plus",16)} New policy</button></div></div>
  <div class="panel"><div class="toolbar">
    <div class="input-icon-wrap"><span class="input-prefix" style="color:var(--text-tertiary)">${ICON("search",16)}</span><input class="input search" placeholder="Search policies..." /></div>
    <div class="spacer"></div><select class="select"><option>All categories</option></select></div>
    <div class="table-wrap" style="border:none;border-radius:0"><table class="data-table">
      <thead><tr><th>Policy</th><th>Version</th><th>Effective</th><th>Summary</th><th>Status</th><th></th></tr></thead>
      <tbody>${POLICY_CATEGORIES.map(p => `<tr class="selectable" onclick="toast('Opening ${p.name}')">
        <td><div class="emp-cell"><div class="doc-icon id">${ICON("book",18)}</div><div class="nm">${p.name}</div></div></td>
        <td>${p.version}</td><td>${p.eff}</td>
        <td style="max-width:360px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.summary}</td>
        <td><span class="badge badge-success">Active</span></td><td><button class="icon-btn icon-btn-sm">${ICON("chevronRight",16)}</button></td></tr>`).join("")}</tbody>
    </table></div></div>`;
}
function renderHolidays() {
  el("sec-holidays").innerHTML = `
  <div class="page-head"><div><h2 class="t-h1" style="font-size:22px">Holiday Calendar</h2><p class="sub">2026 · 6 public holidays &amp; festivals</p></div>
    <div class="page-actions"><button class="btn btn-primary" onclick="toast('New holiday opens')">${ICON("plus",16)} Add holiday</button></div></div>
  <div class="grid-2 mt-6">
    <div class="panel"><div class="panel-head"><span class="t-h3">August 2026</span></div>
      <div class="panel-body"><div class="wcal-grid">${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>`<div class="t-caption" style="font-weight:600;color:var(--text-tertiary);padding:4px">${d}</div>`).join("")}
        ${[6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,1,2,3,4,5,6].map((n,i)=>`<div class="wcal-day ${n===15?"today":""} ${n===15?"":n%7===0||n%7===6?"":"other"}"><span class="${n>=6&&n<=31?"":"t-caption text-tertiary"}">${n}</span>${n===15?`<span class="chip" style="background:var(--primary-light);color:var(--primary-dark)">Independence Day</span>`:""}</div>`).join("")}
      </div></div></div>
    <div class="panel"><div class="panel-head"><span class="t-h3">Holidays 2026</span></div>
      <div class="table-wrap" style="border:none;border-radius:0"><table class="data-table">
        <thead><tr><th>Date</th><th>Name</th><th>Type</th></tr></thead>
        <tbody>${HOLIDAYS_2026.map(h => `<tr><td>${h.date} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][h.month-1]}</td><td><span class="cell-main">${h.name}</span></td><td><span class="badge badge-neutral">${h.tag}</span></td></tr>`).join("")}</tbody>
      </table></div></div>
  </div>`;
}
function renderEvents() {
  el("sec-events").innerHTML = `
  <div class="page-head"><div><h2 class="t-h1" style="font-size:22px">Company Events</h2><p class="sub">Upcoming events &amp; celebrations</p></div>
    <div class="page-actions"><button class="btn btn-primary" onclick="toast('Event creation opens')">${ICON("plus",16)} Create event</button></div></div>
  <div class="grid-2-equal mt-6">
    <div class="panel"><div class="panel-head"><span class="t-h3">Upcoming</span></div><div class="panel-body flush">
      ${EVENTS.map(ev => `<div class="milestone"><div class="more-icon ${ev.type==="Holiday"?"warn":ev.type==="Training"?"alt":""}">${ICON(ev.type==="Holiday"?"calendar":ev.type==="Training"?"graduation":"cake",18)}</div>
        <div class="col flex-1"><p class="list-title" style="font-size:13.5px">${ev.name}</p><p class="list-sub">${ev.date} · ${ev.time}</p></div>
        <span class="badge badge-${ev.type==="Holiday"?"primary":ev.type==="Training"?"info":"neutral"}">${ev.type}</span></div>`).join("")}
    </div></div>
    <div class="panel"><div class="panel-head"><span class="t-h3">Celebrations</span></div><div class="panel-body flush">
      ${BIRTHDAYS.map(b => `<div class="milestone"><div class="avatar avatar-sm" style="background:${AVATAR_COLORS[b.avatar]}">${INITIALS(b.name)}</div><div class="col flex-1"><p class="list-title" style="font-size:13.5px">${b.name} · ${b.dept}</p><p class="list-sub">${b.day}</p></div><span class="badge badge-primary">Birthday</span></div>`).join("")}
      ${ANNIVERSARIES.map(a => `<div class="milestone"><div class="avatar avatar-sm" style="background:${AVATAR_COLORS[a.avatar]}">${INITIALS(a.name)}</div><div class="col flex-1"><p class="list-title" style="font-size:13.5px">${a.name} · ${a.dept}</p><p class="list-sub">${a.day}</p></div><span class="badge badge-neutral">Anniversary</span></div>`).join("")}
    </div></div>
  </div>`;
}

/* ============================================================
   REPORTS
   ============================================================ */
function renderReports() {
  const reports = [
    ["Employee Report", "people", "People master data", "16 rows"],
    ["Attendance Report", "attendance", "Present / absent / leave by period", "Aug 2026"],
    ["Leave Report", "calendar", "Leave usage & balances", "Aug 2026"],
    ["Recruitment Report", "user", "Pipeline & hiring metrics", "Jul–Aug 26"],
    ["Performance Report", "star", "Ratings by employee", "Apr–Jun 26"],
    ["Shift Report", "clock", "Shift coverage & compliance", "Aug 2026"],
    ["Working Hour Report", "timer", "Regular & overtime hours", "Aug 2026"],
    ["Hourly Wage Report", "wallet", "Wage runs & cost", "Week 33"],
    ["Overtime Report", "zap", "OT hours & cost", "Aug 2026"],
    ["Payment Summary", "rupee", "Weekly wage payment status", "Week 33"],
  ];
  el("sec-reports").innerHTML = `
  <div class="page-head"><div><h2 class="t-h1" style="font-size:22px">Reports</h2><p class="sub">10 reports · filter by date range, department &amp; employee</p></div></div>
  <div class="panel">
    <div class="toolbar">
      <div class="input-icon-wrap"><span class="input-prefix" style="color:var(--text-tertiary)">${ICON("search",16)}</span><input class="input search" placeholder="Search reports..." /></div>
      <select class="select"><option>This month</option><option>Last month</option><option>Last 90 days</option><option>Custom</option></select>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="toast('Scheduled report created')">${ICON("calendar",16)} Schedule</button>
    </div>
    <div class="table-wrap" style="border:none;border-radius:0"><table class="data-table">
      <thead><tr><th>Report</th><th>Description</th><th>Period</th><th></th></tr></thead>
      <tbody>${reports.map(([n,ic,desc,period]) => `<tr class="selectable" onclick="openReportDrawer('${n}')">
        <td><div class="emp-cell"><div class="more-icon">${ICON(ic,18)}</div><div class="nm">${n}</div></div></td>
        <td class="text-secondary">${desc}</td><td>${period}</td>
        <td><button class="btn btn-outline btn-sm" onclick="event.stopPropagation();toast('${n} exported as PDF')">${ICON("download",14)} Export</button></td></tr>`).join("")}</tbody>
    </table></div></div>`;
}
function openReportDrawer(name) {
  el("drawer").innerHTML = `
    <div class="drawer-head"><span class="t-h3">${name}</span><button class="icon-btn" onclick="closeDrawer()">${ICON("close",20)}</button></div>
    <div class="drawer-body">
      <div class="card card-pad"><p class="t-h3" style="margin-bottom:4px">Filters</p>
        <div class="field" style="margin-bottom:10px"><label class="field-label">Date range</label><select class="select"><option>This month · Aug 2026</option><option>Last month</option><option>Last 90 days</option><option>Custom range</option></select></div>
        <div class="field" style="margin-bottom:10px"><label class="field-label">Department</label><select class="select">${deptOptions("All departments")}</select></div>
        <div class="field"><label class="field-label">Employee</label><select class="select"><option>All employees</option>${EMPLOYEES.map(e=>`<option>${e.name}</option>`).join("")}</select></div>
      </div>
      <div class="card card-pad" style="margin-top:12px"><p class="t-h3" style="margin-bottom:10px">Summary</p>
        <div class="bars" style="height:90px">${[12,10,13,11,14,12,13].map((b,i)=>`<div class="bar ${i===5?"main":""}" style="height:${(b/14)*100}%"></div>`).join("")}</div>
        <p class="t-caption text-tertiary text-center" style="margin-top:6px">Preview · opens full view in the native reporting module</p>
      </div>
      <div class="row gap-2" style="margin-top:16px"><button class="btn btn-outline flex-1" onclick="closeDrawer()">Close</button><button class="btn btn-primary flex-1" onclick="toast('${name} exported as PDF');closeDrawer()">${ICON("download",16)} Export</button></div>
    </div>`;
  el("drawerBackdrop").classList.add("open");
}

/* ============================================================
   SETTINGS
   ============================================================ */
function renderSettings() {
  el("sec-settings").innerHTML = `
  <div class="page-head"><div><h2 class="t-h1" style="font-size:22px">Organization Settings</h2></div></div>
  <div class="settings-layout">
    <div class="settings-nav" id="setNav">${["Organization","Attendance Rules","Geofence","Shift Rules","Overtime Rules","Wage Rules","Leave Types","Holiday Calendar","Notifications"].map((s,i)=>`<div class="nav-item ${i===0?"active":""}" onclick="setTab(this)">${s}</div>`).join("")}</div>
    <div class="settings-content" id="setContent"></div>
  </div>`;
  setTab(null);
}
function setTab(node) {
  document.querySelectorAll("#setNav .nav-item").forEach(n => n.classList.remove("active"));
  if (node) node.classList.add("active");
  const name = node ? node.textContent : "Organization";
  el("setContent").innerHTML = settingsBody(name);
}
function settingsBody(name) {
  if (name === "Organization") return `
    <p class="t-h2" style="margin-bottom:16px">Organization</p>
    <div class="form-grid" style="grid-template-columns:1fr 1fr;max-width:720px">
      <div class="field"><label class="field-label">Company name</label><input class="input" value="Orchid Flowers" /></div>
      <div class="field"><label class="field-label">Headquarters</label><input class="input" value="Kovaipudur, Coimbatore" /></div>
      <div class="field"><label class="field-label">Established</label><input class="input" value="1998" /></div>
      <div class="field"><label class="field-label">Financial year</label><input class="input" value="Apr – Mar" /></div>
      <div class="field" style="grid-column:1/-1"><label class="field-label">Company logo</label><div class="upload-zone" onclick="toast('Logo uploaded')"><div class="upload-icon">${ICON("uploadCloud",24)}</div><p class="t-body-sm">Tap to upload logo</p></div></div>
    </div>
    <button class="btn btn-primary" style="margin-top:20px" onclick="toast('Settings saved')">Save changes</button>`;
  if (name === "Attendance Rules") return `
    <p class="t-h2" style="margin-bottom:16px">Attendance Rules</p>
    <div class="card card-pad" style="max-width:720px">
      <div class="row between" style="padding:8px 0"><div><p class="list-title">GPS required for check-in</p><p class="list-sub">Employees must be inside the geofence</p></div><span class="toggle"><input type="checkbox" checked /><span class="track"></span></span></div>
      <div class="divider"></div>
      <div class="row between" style="padding:8px 0"><div><p class="list-title">Grace period</p><p class="list-sub">Minutes before marking late</p></div><input class="input" style="width:90px" value="10" /></div>
      <div class="divider"></div>
      <div class="row between" style="padding:8px 0"><div><p class="list-title">Late marking</p><p class="list-sub">After grace period elapses</p></div><span class="toggle"><input type="checkbox" checked /><span class="track"></span></span></div>
      <div class="divider"></div>
      <div class="row between" style="padding:8px 0"><div><p class="list-title">Half-day threshold</p><p class="list-sub">Below this hours = half day</p></div><input class="input" style="width:90px" value="4 hrs" /></div>
    </div>
    <button class="btn btn-primary" style="margin-top:16px" onclick="toast('Rules saved')">Save rules</button>`;
  if (name === "Geofence") return `
    <p class="t-h2" style="margin-bottom:16px">Geofence Configuration</p>
    <div class="card card-pad" style="max-width:720px">
      <p class="t-h3" style="margin-bottom:6px">Main Campus — Kovaipudur</p>
      <div class="map-mock" style="height:240px" id="geoMap"></div>
      <div class="form-grid" style="grid-template-columns:1fr 1fr;margin-top:16px">
        <div class="field"><label class="field-label">Latitude</label><input class="input" value="10.9986" /></div>
        <div class="field"><label class="field-label">Longitude</label><input class="input" value="76.9657" /></div>
        <div class="field"><label class="field-label">Radius</label><input class="input" value="500 m" /></div>
        <div class="field"><label class="field-label">Accuracy tolerance</label><input class="input" value="±25 m" /></div>
      </div>
    </div>
    <button class="btn btn-primary" style="margin-top:16px" onclick="toast('Geofence saved')">Save geofence</button>`;
  if (name === "Shift Rules") return `
    <p class="t-h2" style="margin-bottom:16px">Shift Rules</p>
    <div class="card" style="max-width:720px">${SHIFTS.map(s => `<div class="milestone"><div class="col flex-1"><p class="list-title">${s.name}</p><p class="list-sub">${s.short} · break ${s.break} · grace ${s.grace} min</p></div><span class="badge badge-${s.id==="morning"?"success":"neutral"}">${s.id==="morning"?"Active":"—"}</span><button class="icon-btn icon-btn-sm">${ICON("edit",16)}</button></div>`).join("")}</div>
    <button class="btn btn-primary" style="margin-top:16px" onclick="toast('Shift rules saved')">Save shifts</button>`;
  if (name === "Overtime Rules") return `
    <p class="t-h2" style="margin-bottom:16px">Overtime Rules</p>
    <div class="card card-pad" style="max-width:720px">
      <div class="row between" style="padding:8px 0"><div><p class="list-title">Overtime rate</p><p class="list-sub">Multiplier over hourly rate</p></div><input class="input" style="width:90px" value="1.25×" /></div>
      <div class="divider"></div>
      <div class="row between" style="padding:8px 0"><div><p class="list-title">Weekly cap</p><p class="list-sub">Max overtime hours per week</p></div><input class="input" style="width:90px" value="16 hrs" /></div>
      <div class="divider"></div>
      <div class="row between" style="padding:8px 0"><div><p class="list-title">Prior approval required</p><p class="list-sub">OT before supervisor approval</p></div><span class="toggle"><input type="checkbox" checked /><span class="track"></span></span></div>
    </div>
    <button class="btn btn-primary" style="margin-top:16px" onclick="toast('Overtime rules saved')">Save rules</button>`;
  if (name === "Wage Rules") return `
    <p class="t-h2" style="margin-bottom:16px">Wage Rules</p>
    <div class="card card-pad" style="max-width:720px">
      <div class="row between" style="padding:8px 0"><div><p class="list-title">Wage run cycle</p><p class="list-sub">How often wages are calculated</p></div><select class="select" style="width:160px"><option>Weekly (Sunday)</option><option>Bi-weekly</option><option>Monthly</option></select></div>
      <div class="divider"></div>
      <div class="row between" style="padding:8px 0"><div><p class="list-title">Round payable hours</p><p class="list-sub">Nearest</p></div><select class="select" style="width:160px"><option>0.5 hrs</option><option>1 hr</option><option>No rounding</option></select></div>
      <div class="divider"></div>
      <div class="row between" style="padding:8px 0"><div><p class="list-title">Auto-approve eligible runs</p><p class="list-sub">When no overtime &amp; hours verified</p></div><span class="toggle"><input type="checkbox" /><span class="track"></span></span></div>
    </div>
    <button class="btn btn-primary" style="margin-top:16px" onclick="toast('Wage rules saved')">Save rules</button>`;
  if (name === "Leave Types") return `
    <p class="t-h2" style="margin-bottom:16px">Leave Types</p>
    <div class="card" style="max-width:720px">${LEAVE_TYPES.map(l => `<div class="milestone"><div class="col flex-1"><p class="list-title">${l.name}</p><p class="list-sub">Balance ${l.balance} days · carry-over rules apply</p></div><span class="badge badge-primary">${l.balance} days</span><button class="icon-btn icon-btn-sm">${ICON("edit",16)}</button></div>`).join("")}</div>
    <button class="btn btn-primary" style="margin-top:16px" onclick="toast('Leave types saved')">Save types</button>`;
  if (name === "Holiday Calendar") return `
    <p class="t-h2" style="margin-bottom:16px">Holiday Calendar</p>
    <div class="card" style="max-width:720px">${HOLIDAYS_2026.map(h => `<div class="milestone"><div class="col flex-1"><p class="list-title">${h.name}</p><p class="list-sub">${h.date} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][h.month-1]} · ${h.tag}</p></div><span class="badge badge-neutral">Public</span><button class="icon-btn icon-btn-sm">${ICON("trash",16)}</button></div>`).join("")}</div>
    <button class="btn btn-primary" style="margin-top:16px" onclick="toast('Holiday added')">${ICON("plus",16)} Add holiday</button>`;
  if (name === "Notifications") return `
    <p class="t-h2" style="margin-bottom:16px">Notification Settings</p>
    <div class="card card-pad" style="max-width:720px">
      <div class="row between" style="padding:8px 0"><div><p class="list-title">Approval reminders</p><p class="list-sub">Daily digest for pending approvals</p></div><span class="toggle"><input type="checkbox" checked /><span class="track"></span></span></div>
      <div class="divider"></div>
      <div class="row between" style="padding:8px 0"><div><p class="list-title">Wage alerts</p><p class="list-sub">When wage runs are ready</p></div><span class="toggle"><input type="checkbox" checked /><span class="track"></span></span></div>
      <div class="divider"></div>
      <div class="row between" style="padding:8px 0"><div><p class="list-title">Attendance anomalies</p><p class="list-sub">Sudden absentee alerts</p></div><span class="toggle"><input type="checkbox" checked /><span class="track"></span></span></div>
    </div>
    <button class="btn btn-primary" style="margin-top:16px" onclick="toast('Notification settings saved')">Save settings</button>`;
  return "";
}

/* ============================================================
   ROLES / USERS / NOTIFICATIONS
   ============================================================ */
function renderRoles() {
  const roles = [
    ["Administrator","Full access to every module &amp; setting","primary"],
    ["HR Manager","Employees, recruitment, onboarding, leave, wages &amp; reports","info"],
    ["Department Manager","Team attendance, leave, shifts, OT &amp; team reports","warning"],
    ["Supervisor","Daily workforce, assignments, shifts &amp; approvals","success"],
    ["Employee","Profile, attendance, leave, wages &amp; notifications","neutral"],
  ];
  el("sec-roles").innerHTML = `
  <div class="page-head"><div><h2 class="t-h1" style="font-size:22px">Roles &amp; Permissions</h2><p class="sub">5 roles · permission matrix</p></div>
    <div class="page-actions"><button class="btn btn-primary" onclick="toast('New role opens')">${ICON("plus",16)} New role</button></div></div>
  <div class="panel">
    <div class="table-wrap" style="border:none;border-radius:0"><table class="data-table">
      <thead><tr><th>Role</th><th>Permissions</th><th>Users</th><th></th></tr></thead>
      <tbody>${roles.map(([n,d,c],i) => `<tr class="selectable" onclick="toast('Editing role: ${n}')">
        <td><div class="emp-cell"><div class="more-icon ${c==="primary"?"":c==="info"?"alt":c==="success"?"":""}">${ICON(c==="primary"?"shield":c==="info"?"users":c==="warning"?"people":c==="success"?"briefcase":"user",18)}</div><div class="nm">${n}</div></div></td>
        <td class="text-secondary" style="max-width:420px">${d}</td>
        <td>${[1,1,4,6,16][i]}</td>
        <td><button class="icon-btn icon-btn-sm">${ICON("chevronRight",16)}</button></td></tr>`).join("")}</tbody>
    </table></div></div>`;
}
function renderUsers() {
  el("sec-users").innerHTML = `
  <div class="page-head"><div><h2 class="t-h1" style="font-size:22px">User Management</h2><p class="sub">Login accounts &amp; access control</p></div>
    <div class="page-actions"><button class="btn btn-primary" onclick="toast('User invitation sent')">${ICON("plus",16)} Invite user</button></div></div>
  <div class="panel">
    <div class="toolbar"><div class="input-icon-wrap"><span class="input-prefix" style="color:var(--text-tertiary)">${ICON("search",16)}</span><input class="input search" placeholder="Search users..." /></div>
      <div class="spacer"></div><select class="select"><option>All roles</option><option>Administrator</option><option>HR Manager</option><option>Manager</option><option>Supervisor</option></select></div>
    <div class="table-wrap" style="border:none;border-radius:0"><table class="data-table">
      <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Last login</th><th></th></tr></thead>
      <tbody>${[
        ["Arun Kumar","Administrator","Active","Today · 08:41"],
        ["Priya Devi","HR Manager","Active","Today · 08:35"],
        ["R. Vasanth","Department Manager","Active","Today · 06:10"],
        ["Kavitha R","Supervisor","Active","Today · 05:52"],
        ["Vijay Anand","HR Executive","Active","Yesterday"],
        ["Meena S","Department Manager","Active","Yesterday"],
      ].map(([n,r,s,l]) => `<tr class="selectable" onclick="toast('Opening user: ${n}')">
        <td><div class="emp-cell"><div class="avatar avatar-sm">${INITIALS(n)}</div><div class="nm">${n}</div></div></td>
        <td>${r}</td><td><span class="badge badge-success"><span class="dot"></span>${s}</span></td>
        <td class="text-secondary">${l}</td><td><button class="icon-btn icon-btn-sm">${ICON("chevronRight",16)}</button></td></tr>`).join("")}</tbody>
    </table></div></div>`;
}
function renderNotifications() {
  el("sec-notifications").innerHTML = `
  <div class="page-head"><div><h2 class="t-h1" style="font-size:22px">Notifications</h2><p class="sub">Actionable alerts across your workforce</p></div>
    <div class="page-actions"><button class="btn btn-outline" onclick="toast('All marked as read')">Mark all read</button></div></div>
  <div class="panel">
    <div class="table-wrap" style="border:none;border-radius:0">${NOTIFICATIONS.map((n,i) => `
      <div class="notif-w ${i < 5 ? "unread" : "read"}">
        <div class="more-icon ${i%3===1?"alt":i%3===2?"success":""}">${ICON(["calendar","wallet","zap","user","attendance","megaphone","settings","cake"][i],18)}</div>
        <div class="col flex-1"><p class="list-title">${n.title}</p><p class="list-sub">${n.body}</p><p class="t-caption text-tertiary" style="margin-top:4px">${n.time}</p></div>
        ${n.action ? `<button class="btn btn-secondary btn-sm" style="align-self:flex-start" onclick="toast('Opening: ${n.title}')">${n.action}</button>` : ""}
      </div>`).join("")}
    </div>
  </div>`;
}

/* ============================================================
   MISC / BOOT
   ============================================================ */
function injectWebIcons() {
  const m = {
    wlLogo: ["layers", 22], wlUserIcon: ["mail", 18], wlPassIcon: ["lock", 18], wlTogglePass: ["eye", 18],
    wlP1: ["checkCircle", 18], wlP2: ["shield", 18], wlP3: ["chart", 18],
    sbLogo: ["layers", 22], sbAvatar: null, sbLogout: ["logout", 16],
    hbIcon: ["list", 20], tbSearchIcon: ["search", 16], tbSearchBtn: ["search", 18], tbBell: ["bell", 18],
  };
  Object.entries(m).forEach(([id, cfg]) => { const n = el(id); if (n && cfg) n.innerHTML = ICON(cfg[0], cfg[1]); });
  if (el("sbAvatar")) el("sbAvatar").textContent = "PD";
  if (el("tbAvatar")) el("tbAvatar").textContent = "PD";
}
function openGlobalSearch() { toast("Global search · try Employees"); navigate("employees"); }

function logout() { el("webApp").classList.add("hidden"); el("webLogin").style.display = "flex"; }

function boot() {
  injectWebIcons();
  el("webLoginForm").onsubmit = (e) => {
    e.preventDefault();
    el("webLogin").style.display = "none";
    el("webApp").classList.remove("hidden");
    buildNav();
    navigate("dashboard");
    toast("Welcome back, Priya");
  };
  el("wlTogglePass").onclick = () => { const p = document.querySelector("#webLoginForm .input[type='password']"); if (!p) return; p.type = p.type === "password" ? "text" : "password"; };
  el("hamburger").onclick = () => el("sidebar").classList.toggle("open");
  el("globalSearch").addEventListener("keydown", e => { if (e.key === "Enter") openGlobalSearch(); });
}
document.addEventListener("DOMContentLoaded", boot);

window.openEmployeeDrawer = openEmployeeDrawer;
window.empTab = empTab;
window.setTab = setTab;
window.openCandidateDrawer = openCandidateDrawer;
window.openWageDrawer = openWageDrawer;
window.openReportDrawer = openReportDrawer;
window.openAddEmployee = openAddEmployee;
window.logout = logout;
window.openGlobalSearch = openGlobalSearch;
window.renderEmpTable = renderEmpTable;
window.renderAaTable = renderAaTable;
