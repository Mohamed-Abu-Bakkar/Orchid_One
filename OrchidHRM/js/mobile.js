/* ============================================================
   ORCHID HRM — MOBILE APP LOGIC
   ============================================================ */

/* ---------- State ---------- */
const state = {
  role: "employee",          // employee | hr
  loc: "inside",             // inside | outside | off
  net: "online",
  checkedIn: false,
  onBreak: false,
  shiftStart: "05:58",
  screen: "splash",
  from: null,
  pendingCount: 2,
  profileEmp: "OH-1005",
  candId: "CAN-301",
  hourlyEmpId: "OH-1008",
};

const DUR = { single: 1, range: 2 };
let leaveDur = "single";
let onbStep = 0;
let otpTimer = null;

const today = () => "Thursday, 14 August 2026";

/* ---------- Helpers ---------- */
const el = id => document.getElementById(id);
function toast(msg, type = "success") {
  const icon = type === "error" ? ICON("alert", 16) : type === "success" ? ICON("checkCircle", 16) : ICON("info", 16);
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  el("toasts").appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity .3s"; }, 2600);
  setTimeout(() => t.remove(), 3000);
}

function showScreen(id, { push = true } = {}) {
  if (push && state.screen !== id) state.from = state.screen;
  state.screen = id;
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const scr = document.getElementById("scr-" + id);
  if (scr) { scr.classList.add("active"); scr.scrollTop = 0; }
  updateNav();
  closeSheets();
  if (scr && scr.querySelector(".att-scroll")) scr.querySelector(".att-scroll").scrollTop = 0;
}

function back() { if (state.from) { showScreen(state.from, { push: false }); state.from = null; } else go("home"); }

function go(id) {
  if (id === "home") return showScreen(state.role === "hr" ? "hr-home" : "home");
  showScreen(id);
}

/* ---------- Bottom nav ---------- */
const NAV = {
  employee: [
    { id: "home", icon: "home", label: "Home" },
    { id: "attendance", icon: "attendance", label: "Attendance" },
    { id: "requests", icon: "requests", label: "Requests" },
    { id: "more", icon: "more", label: "More" },
  ],
  hr: [
    { id: "hr-home", icon: "home", label: "Home" },
    { id: "requests", icon: "requests", label: "Approvals" },
    { id: "people", icon: "people", label: "People" },
    { id: "more", icon: "more", label: "More" },
  ],
};

function updateNav() {
  const nav = state.role === "hr" ? NAV.hr : NAV.employee;
  const bn = el("bottomnav");
  bn.innerHTML = "";
  bn.classList.toggle("visible", !isAuth(state.screen));
  nav.forEach(n => {
    const d = document.createElement("div");
    d.className = "bn-item";
    d.dataset.nav = n.id;
    let badge = "";
    if (n.id === "requests" && state.role === "employee" && state.pendingCount) badge = `<span class="bn-badge">${state.pendingCount}</span>`;
    d.innerHTML = `<span class="bn-icon">${ICON(n.icon, 22)}</span><span class="bn-label">${n.label}</span>${badge}`;
    d.onclick = () => navGo(n.id);
    bn.appendChild(d);
  });
  setActiveNav();
}

function setActiveNav() {
  const map = { "hr-home": "hr-home", home: "home", attendance: "attendance", people: "people", requests: "requests", more: "more" };
  const key = map[state.screen] || "";
  document.querySelectorAll(".bn-item").forEach(i => i.classList.toggle("active", i.dataset.nav === key));
}

function navGo(id) { go(id); }

function isAuth(s) { return ["splash", "login", "otp", "forgot", "firstlogin"].includes(s); }

/* ---------- Icons injection ---------- */
function injectIcons() {
  const map = {
    loginUserIcon: ["user", 18], loginPassIcon: ["lock", 18], togglePass: ["eye", 18],
    bioIcon: ["fingerprint", 18], bioBtn: null,
    loginLogo: ["layers", 22], splashMark: ["layers", 44], forgotIcon: ["phone", 18],
    otpBack: ["arrowLeft", 20], forgotBack: ["arrowLeft", 20],
    homeBell: ["bell", 22], hrBell: ["bell", 22], reqBell: ["bell", 20],
    homeAvatar: null, hrAvatar: null, moreAvatar: null,
    heroBtnIcon: ["scan", 18],
    attBack: ["arrowLeft", 20], attMore: ["moreH", 20], attHBack: ["arrowLeft", 20], attHFilter: ["filter", 18],
    gpsIcon: ["gps", 20], locIcon: ["building", 22],
    leaveBack: ["arrowLeft", 20], alBack: ["arrowLeft", 20], alCal1: ["calendar", 18], alCal2: ["calendar", 18], alUpIcon: ["uploadCloud", 24],
    shiftBack: ["arrowLeft", 20], hoursBack: ["arrowLeft", 20], hoursFilter: ["filter", 18],
    wageBack: ["arrowLeft", 20], wageHeroIcon: ["wallet", 24], wageChev: ["chevronRight", 18],
    wdBack: ["arrowLeft", 20], docsBack: ["arrowLeft", 20], docsPlus: ["plus", 20],
    polBack: ["arrowLeft", 20], polSearchIcon: ["search", 18], pdBack: ["arrowLeft", 20], pdFileIcon: ["file", 20], pdDownload: ["download", 18], pdCheckIcon: ["check", 18],
    holBack: ["arrowLeft", 20], holPrev: ["chevronLeft", 16], holNext: ["chevronRight", 16],
    notifBack: ["arrowLeft", 20], profBack: ["arrowLeft", 20], profEdit: ["edit", 18],
    profWallet: ["wallet", 20], profDoc: ["folder", 20], profChev1: ["chevronRight", 18], profChev2: ["chevronRight", 18],
    setBack: ["arrowLeft", 20], setChev1: ["chevronRight", 18], setChev2: ["chevronRight", 18],
    qa1: ["plus", 20], qa2: ["user", 20], qa3: ["checkCircle", 20], qa4: ["zap", 20], qa5: ["wallet", 20], qa6: ["attendance", 20], qa7: ["clock", 20], qa8: ["chart", 20],
    pplBack: ["arrowLeft", 20], pplSearchIcon: ["search", 18], epBack: ["arrowLeft", 20], epMore: ["moreH", 20],
    aeBack: ["arrowLeft", 20], aeUploadIcon: ["camera", 16], aeCal: ["calendar", 18],
    recBack: ["arrowLeft", 20], candBack: ["arrowLeft", 20], cpBack: ["arrowLeft", 20], cpMore: ["moreH", 20],
    ivBack: ["arrowLeft", 20], ivCal: ["calendar", 18], ivClock: ["clock", 18],
    evBack: ["arrowLeft", 20], offBack: ["arrowLeft", 20], offCal: ["calendar", 18],
    onbBack: ["arrowLeft", 20], hourlyBack: ["arrowLeft", 20], heBack: ["arrowLeft", 20], heEdit: ["edit", 18],
    aaBack: ["arrowLeft", 20], aaFilter: ["filter", 18], otBack: ["arrowLeft", 20], otFilter: ["filter", 18],
    wagBack: ["arrowLeft", 20], asBack: ["arrowLeft", 20], repBack: ["arrowLeft", 20], repSearchIcon: ["search", 18],
    moreSetIcon: ["settings", 20], moreChev: ["chevronRight", 18], bnHome: null, bnAtt: null, bnReq: null, bnMore: null,
    demoFab: ["settings", 22], offlineIcon: ["wifi", 14], brandMark: null,
  };
  Object.entries(map).forEach(([id, cfg]) => {
    const node = el(id);
    if (!node) return;
    if (cfg && cfg[0]) node.innerHTML = ICON(cfg[0], cfg[1]);
    else if (cfg === null) { /* custom set elsewhere */ }
  });
  if (el("homeAvatar")) el("homeAvatar").textContent = INITIALS(CURRENT_USER.name);
  if (el("hrAvatar")) el("hrAvatar").textContent = INITIALS(ME.name);
  if (el("moreAvatar")) el("moreAvatar").textContent = INITIALS(CURRENT_USER.name);
}

/* ---------- Clock ---------- */
function tickClock() {
  const now = new Date();
  let h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
  const todayHM = `0${h}:${String(m).padStart(2, "0")}`.slice(-2) + ":" + String(s).padStart(2, "0");
  const hm = `0${h}:${String(m).padStart(2, "0")}`.slice(-2);
  const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  if (el("sbTime")) el("sbTime").textContent = time;
  if (el("heroClock")) el("heroClock").textContent = time;
  if (el("attClock")) el("attClock").textContent = hm;
  if (state.checkedIn && el("ringTime")) {
    const start = new Date(); start.setHours(5, 58, 0);
    let ms = now - start; if (state.onBreak) ms = 0;
    const th = Math.floor(ms / 3600000), tm = Math.floor((ms % 3600000) / 60000), ts = Math.floor((ms % 60000) / 1000);
    el("ringTime").textContent = `${th}:${String(tm).padStart(2, "0")}:${String(ts).padStart(2, "0")}`;
  }
  renderHeroState();
}
setInterval(tickClock, 1000);

/* ---------- Hero check-in render ---------- */
function renderHeroState() {
  const ring = el("heroRing");
  if (!ring) return;
  const label = el("heroStateLabel"), sub = el("heroStateSub"), btn = el("heroBtn"), btnIcon = el("heroBtnIcon"), btnLabel = el("heroBtnLabel");
  if (state.loc === "off") {
    label.textContent = "Location unavailable";
    sub.textContent = "Enable GPS to check in";
    btnLabel.textContent = "Enable GPS";
    btnIcon.innerHTML = ICON("gps", 18);
    ring.className = "hero-ring";
    return;
  }
  if (state.loc === "outside") {
    label.textContent = "Outside attendance area";
    sub.textContent = "Move inside the geofence to check in";
    btnLabel.textContent = "View map";
    btnIcon.innerHTML = ICON("mapPin", 18);
    ring.className = "hero-ring";
    return;
  }
  if (state.checkedIn) {
    label.textContent = "Checked in · working";
    sub.textContent = "Location verified · shift active";
    btnLabel.textContent = "Check Out";
    btnIcon.innerHTML = ICON("logout", 18);
    ring.className = "hero-ring done";
    return;
  }
  label.textContent = "You are not checked in yet";
  sub.textContent = "Location verified · inside the attendance area";
  btnLabel.textContent = "Check In";
  btnIcon.innerHTML = ICON("scan", 18);
  ring.className = "hero-ring pulse";
}

/* ---------- GPS render ---------- */
function renderGPS() {
  const card = el("gpsCard"), icon = el("gpsIcon"), title = el("gpsTitle"), sub = el("gpsSub"), badge = el("gpsBadge");
  if (!card) return;
  if (state.loc === "off") {
    card.className = "card gps-card err";
    icon.innerHTML = ICON("gps", 20);
    title.textContent = "GPS is disabled";
    sub.textContent = "Turn on location to verify your attendance area";
    badge.className = "badge badge-error"; badge.innerHTML = `<span class="dot"></span>Off`;
    return;
  }
  if (state.loc === "outside") {
    card.className = "card gps-card warn";
    icon.innerHTML = ICON("mapPin", 20);
    title.textContent = "Outside the attendance area";
    sub.textContent = "2.4 km from office · accuracy ±8 m";
    badge.className = "badge badge-warning"; badge.innerHTML = `<span class="dot"></span>Outside`;
    return;
  }
  card.className = "card gps-card";
  icon.innerHTML = ICON("gps", 20);
  title.textContent = "Inside the attendance area";
  sub.textContent = "120 m from office · accuracy ±8 m";
  badge.className = "badge badge-success"; badge.innerHTML = `<span class="dot"></span>Verified`;
}

/* ---------- Attendance main ---------- */
function renderAttControl() {
  const actions = el("attActions"), ring = el("attRing"), ringLabel = el("ringLabel"), ringSub = el("ringSub");
  if (!actions) return;
  if (state.loc !== "inside") {
    ring.className = "ring";
    ringLabel.textContent = "Working time";
    ringSub.textContent = state.loc === "off" ? "GPS disabled" : "Outside area";
    ringSub.style.color = "var(--error)";
    actions.innerHTML = `<button class="btn btn-outline" onclick="attMap()"><span>${ICON("mapPin", 18)}</span> View location</button>`;
    return;
  }
  if (state.checkedIn) {
    if (state.onBreak) {
      ring.className = "ring break-state";
      ringLabel.textContent = "On break";
      ringSub.textContent = "Break started";
      ringSub.style.color = "var(--warning)";
      actions.innerHTML = `<button class="btn btn-secondary" onclick="endBreak()"><span>${ICON("play", 18)}</span> Resume work</button><button class="btn btn-primary" onclick="checkOut()"><span>${ICON("logout", 18)}</span> Check Out</button>`;
    } else {
      ring.className = "ring done-state";
      ringLabel.textContent = "Working time";
      ringSub.textContent = "Checked in · 05:58";
      ringSub.style.color = "var(--success-dark)";
      actions.innerHTML = `<button class="btn btn-secondary" onclick="startBreak()"><span>${ICON("pause", 18)}</span> Break</button><button class="btn btn-primary" onclick="checkOut()"><span>${ICON("logout", 18)}</span> Check Out</button>`;
    }
  } else {
    ring.className = "ring ready-state";
    ringLabel.textContent = "Working time";
    ringSub.textContent = "Not checked in";
    ringSub.style.color = "var(--text-tertiary)";
    actions.innerHTML = `<button class="btn btn-primary btn-lg btn-block" onclick="doCheckIn()"><span>${ICON("scan", 18)}</span> Check In</button>`;
  }
}

function doCheckIn() {
  if (state.loc === "off") { toast("Turn on location to check in", "error"); return; }
  if (state.loc === "outside") { openModal("outsideModal"); return; }
  state.checkedIn = true; state.onBreak = false;
  renderAttControl(); renderHeroState();
  if (el("ringTime")) el("ringTime").textContent = "0:00:00";
  toast("Checked in successfully · 06:00");
}

function startBreak() { state.onBreak = true; renderAttControl(); toast("Break started · 30 min"); }
function endBreak() { state.onBreak = false; renderAttControl(); toast("Back to work"); }
function checkOut() {
  state.checkedIn = false; state.onBreak = false;
  renderAttControl(); renderHeroState();
  const sum = el("attSummary"); if (sum) { sum.classList.remove("hidden"); sum.scrollIntoView({ behavior: "smooth", block: "center" }); }
  toast("Checked out · 14:02 · have a good day");
}
function attMap() { openModal(state.loc === "off" ? "gpsOffModal" : "outsideModal"); }

/* ---------- Open attendance ---------- */
function openAttendance() {
  if (state.loc === "off") { openModal("gpsOffModal"); return; }
  if (state.loc === "outside") { openModal("outsideModal"); return; }
  go("attendance");
}

/* ---------- Sheets & modals ---------- */
const SHEETS = {
  attHistorySheet: () => `<div class="sheet-grip"></div><p class="sheet-title">Attendance options</p><p class="sheet-sub">Choose how you want to view your attendance</p>
    <div class="list-item clickable" onclick="go('att-history');closeSheets()"><span>${ICON("calendar", 20)}</span><div class="list-main"><p class="list-title">Monthly history</p><p class="list-sub">Calendar &amp; daily records</p></div></div>
    <div class="list-item clickable" onclick="go('hours');closeSheets()"><span>${ICON("clock", 20)}</span><div class="list-main"><p class="list-title">Working hours</p><p class="list-sub">Weekly &amp; monthly totals</p></div></div>
    <div class="list-item clickable" onclick="toast('Report exported as PDF');closeSheets()"><span>${ICON("download", 20)}</span><div class="list-main"><p class="list-title">Export report</p><p class="list-sub">Download August attendance</p></div></div>`,
  filterSheet: () => `<div class="sheet-grip"></div><p class="sheet-title">Filters</p><p class="sheet-sub">Refine the list below</p>
    <div class="field"><label class="field-label">Status</label><div class="chip-row" id="shStatus"></div></div>
    <div class="field" style="margin-top:14px"><label class="field-label">Department</label><div class="chip-row" id="shDept"></div></div>
    <div class="row gap-2" style="margin-top:20px"><button class="btn btn-outline flex-1" onclick="closeSheets()">Clear</button><button class="btn btn-primary flex-1" onclick="toast('Filters applied');closeSheets()">Apply</button></div>`,
  uploadSheet: () => `<div class="sheet-grip"></div><p class="sheet-title">Upload document</p><p class="sheet-sub">Add a new document to your records</p>
    <div class="upload-zone" onclick="simulateUpload(this)"><div style="color:var(--text-tertiary);margin-bottom:6px">${ICON("uploadCloud", 28)}</div><p class="t-body-sm">Tap to choose a document</p><p class="t-caption text-tertiary">Aadhaar, PAN, certificates, etc.</p></div>
    <div class="field" style="margin-top:16px"><label class="field-label">Category</label><select class="select"><option>Identity</option><option>Education</option><option>Employment</option><option>Other</option></select></div>
    <div class="field" style="margin-top:12px"><label class="field-label">Document name</label><input class="input" placeholder="e.g. Aadhaar Card" /></div>
    <button class="btn btn-primary btn-block btn-lg" style="margin-top:18px" onclick="toast('Document uploaded for verification');closeSheets()">Upload</button>`,
  empActionsSheet: () => { const e = empOf(state.profileEmp); return `<div class="sheet-grip"></div><p class="sheet-title">${e.name}</p><p class="sheet-sub">${e.id} · Actions</p>
    <div class="list-item clickable" onclick="toast('Opening edit form');closeSheets()"><span>${ICON("edit", 20)}</span><div class="list-main"><p class="list-title">Edit profile</p></div></div>
    <div class="list-item clickable" onclick="go('hourly-emp');closeSheets()"><span>${ICON("wallet", 20)}</span><div class="list-main"><p class="list-title">Wage &amp; working hours</p></div></div>
    <div class="list-item clickable" onclick="go('assignments');closeSheets()"><span>${ICON("briefcase", 20)}</span><div class="list-main"><p class="list-title">Assign work</p></div></div>
    <div class="list-item clickable" onclick="openModal('confirmDeactivate');closeSheets()"><span style="color:var(--error)">${ICON("trash", 20)}</span><div class="list-main"><p class="list-title" style="color:var(--error)">Deactivate employee</p></div></div>`; },
  candActionsSheet: () => { const c = CANDIDATES.find(x => x.id === state.candId); return `<div class="sheet-grip"></div><p class="sheet-title">${c.name}</p><p class="sheet-sub">${c.id} · ${c.pos}</p>
    <div class="list-item clickable" onclick="go('interview');closeSheets()"><span>${ICON("calendar", 20)}</span><div class="list-main"><p class="list-title">Schedule interview</p></div></div>
    <div class="list-item clickable" onclick="go('evaluation');closeSheets()"><span>${ICON("edit", 20)}</span><div class="list-main"><p class="list-title">Evaluate interview</p></div></div>
    <div class="list-item clickable" onclick="go('offer');closeSheets()"><span>${ICON("briefcase", 20)}</span><div class="list-main"><p class="list-title">Generate offer</p></div></div>
    <div class="list-item clickable" onclick="toast('Candidate archived');closeSheets()"><span style="color:var(--error)">${ICON("trash", 20)}</span><div class="list-main"><p class="list-title" style="color:var(--error)">Archive candidate</p></div></div>`; },
};

const MODALS = {
  outsideModal: `<h3 style="display:flex;align-items:center;gap:10px"><span style="color:var(--warning)">${ICON("mapPin", 22)}</span> Outside attendance area</h3>
    <p class="t-body text-secondary" style="margin-top:12px">You are currently outside the approved attendance area for this shift. Check-in is only allowed when you are inside the geofence around Orchid Flowers — Main Campus.</p>
    <div class="card card-pad" style="margin-top:16px;background:var(--primary-soft);border-color:var(--lavender-soft)"><div class="row gap-3">
      <span style="color:var(--primary)">${ICON("building", 20)}</span><div class="col flex-1"><p class="t-body-sm" style="font-weight:600">Orchid Flowers — Main Campus</p><p class="t-caption text-tertiary">Kovaipudur, Coimbatore</p></div>
      <span class="t-caption text-tertiary">2.4 km</span></div></div>
    <p class="t-caption text-tertiary" style="margin-top:12px">Your location updates automatically. If you believe this is a mistake, contact your supervisor.</p>
    <div class="row gap-2" style="margin-top:20px"><button class="btn btn-outline flex-1" onclick="closeSheets()">Close</button><button class="btn btn-primary flex-1" onclick="closeSheets();toast('Location refreshed · still outside')">Refresh location</button></div>`,
  gpsOffModal: `<h3 style="display:flex;align-items:center;gap:10px"><span style="color:var(--error)">${ICON("gps", 22)}</span> Location unavailable</h3>
    <p class="t-body text-secondary" style="margin-top:12px">GPS is disabled on this device. We need your location to verify you are at the attendance area before you can check in.</p>
    <div class="card card-pad" style="margin-top:16px"><div class="row gap-3"><span>${ICON("settings", 20)}</span><div class="col flex-1"><p class="t-body-sm" style="font-weight:600">How to enable</p><p class="t-caption text-tertiary">Settings → Location → Turn on GPS, then come back here.</p></div></div></div>
    <div class="row gap-2" style="margin-top:20px"><button class="btn btn-outline flex-1" onclick="closeSheets()">Not now</button><button class="btn btn-primary flex-1" onclick="closeSheets();toast('Location permission requested')">Enable GPS</button></div>`,
  confirmDeactivate: `<h3 style="display:flex;align-items:center;gap:10px"><span style="color:var(--error)">${ICON("trash", 22)}</span> Deactivate employee?</h3>
    <p class="t-body text-secondary" style="margin-top:12px">This will revoke access for <b>${empOf(state.profileEmp).name}</b> (${state.profileEmp}). Attendance and historical records will be preserved.</p>
    <div class="row gap-2" style="margin-top:20px"><button class="btn btn-outline flex-1" onclick="closeSheets()">Cancel</button><button class="btn btn-danger flex-1" onclick="closeSheets();toast('Employee deactivated','error')">Deactivate</button></div>`,
  approvalConfirm: (empName) => `<h3 style="display:flex;align-items:center;gap:10px"><span style="color:var(--success-dark)">${ICON("checkCircle", 22)}</span> Approve request?</h3>
    <p class="t-body text-secondary" style="margin-top:12px">Approve the request from <b>${empName}</b>? The employee will be notified.</p>
    <div class="row gap-2" style="margin-top:20px"><button class="btn btn-outline flex-1" onclick="closeSheets()">Cancel</button><button class="btn btn-success flex-1" onclick="closeSheets();toast('Request approved')">Approve</button></div>`,
  policyRead: `<h3 style="display:flex;align-items:center;gap:10px"><span style="color:var(--success-dark)">${ICON("checkCircle", 22)}</span> Confirmation recorded</h3>
    <p class="t-body text-secondary" style="margin-top:12px">You confirmed you have read the <b>Attendance Policy</b>. This is recorded in your HR profile.</p>
    <button class="btn btn-primary btn-block" style="margin-top:20px" onclick="closeSheets()">Done</button>`,
  wageApprove: (name) => `<h3 style="display:flex;align-items:center;gap:10px"><span style="color:var(--success-dark)">${ICON("checkCircle", 22)}</span> Approve weekly wage?</h3>
    <p class="t-body text-secondary" style="margin-top:12px">Approve the Week 33 wage for <b>${name}</b>? This moves it to Reviewed before payment.</p>
    <div class="row gap-2" style="margin-top:20px"><button class="btn btn-outline flex-1" onclick="closeSheets()">Cancel</button><button class="btn btn-success flex-1" onclick="closeSheets();toast('Wage approved · moved to Reviewed')">Approve</button></div>`,
  rejectModal: (name) => `<h3 style="display:flex;align-items:center;gap:10px"><span style="color:var(--error)">${ICON("alert", 22)}</span> Reject request?</h3>
    <p class="t-body text-secondary" style="margin-top:12px">Reject the request from <b>${name}</b>? The employee will be notified of the decision.</p>
    <div class="field" style="margin-top:16px"><label class="field-label">Reason (visible to employee)</label><textarea class="textarea" placeholder="Optional reason for rejection"></textarea></div>
    <div class="row gap-2" style="margin-top:20px"><button class="btn btn-outline flex-1" onclick="closeSheets()">Cancel</button><button class="btn btn-danger flex-1" onclick="closeSheets();toast('Request rejected','error')">Reject</button></div>`,
  leaveConfirm: `<h3 style="display:flex;align-items:center;gap:10px"><span style="color:var(--primary)">${ICON("calendar", 22)}</span> Submit leave request?</h3>
    <p class="t-body text-secondary" style="margin-top:12px"><b>Casual Leave</b> from <b>17 Aug</b> to <b>18 Aug</b> (2 days). Your manager will be notified.</p>
    <div class="row gap-2" style="margin-top:20px"><button class="btn btn-outline flex-1" onclick="closeSheets()">Cancel</button><button class="btn btn-primary flex-1" onclick="closeSheets();openModal('leaveSuccess')">Submit</button></div>`,
  leaveSuccess: `<div style="text-align:center;padding:8px 0"><div style="width:72px;height:72px;border-radius:50%;background:var(--success-bg);color:var(--success-dark);display:flex;align-items:center;justify-content:center;margin:0 auto">${ICON("checkCircle", 36)}</div>
    <h3 style="margin-top:16px">Request submitted</h3>
    <p class="t-body text-secondary" style="margin-top:8px">Your leave request has been sent for approval. You can track its status anytime.</p>
    <button class="btn btn-primary btn-block" style="margin-top:20px" onclick="closeSheets();toast('Tracked in My Requests');go('requests')">Track request</button></div>`,
  otDetail: (id) => { const o = OVERTIME_REQUESTS.find(x => x.id === id); const e = empOf(o.emp); return `<h3 style="display:flex;align-items:center;gap:10px"><span style="color:var(--warning)">${ICON("zap", 22)}</span> Overtime ${o.id}</h3>
    <div class="card card-pad" style="margin-top:14px"><div class="kv"><span class="kv-key">Employee</span><span class="kv-val">${e.name}</span></div>
      <div class="kv"><span class="kv-key">Date</span><span class="kv-val">${o.date}</span></div>
      <div class="kv"><span class="kv-key">Regular hours</span><span class="kv-val">${o.reg} hrs</span></div>
      <div class="kv"><span class="kv-key">Overtime hours</span><span class="kv-val">${o.ot} hrs</span></div>
      <div class="kv"><span class="kv-key">Overtime rate</span><span class="kv-val">₹${o.rate} / hr</span></div>
      <div class="kv"><span class="kv-key">Estimated amount</span><span class="kv-val" style="color:var(--warning)">₹${(o.ot * o.rate).toLocaleString('en-IN')}</span></div>
      <div class="kv"><span class="kv-key">Note</span><span class="kv-val">${o.note}</span></div></div>
    <div class="row gap-2" style="margin-top:20px"><button class="btn btn-success flex-1" onclick="closeSheets();toast('Overtime approved')">Approve</button><button class="btn btn-outline flex-1" onclick="closeSheets()">Close</button></div>`; },
  reportDetail: (name) => `<h3 style="display:flex;align-items:center;gap:10px"><span style="color:var(--primary)">${ICON("chart", 22)}</span> ${name}</h3>
    <p class="t-body text-secondary" style="margin-top:10px">Configure the report below, then export or view in the full dashboard.</p>
    <div class="field" style="margin-top:16px"><label class="field-label">Date range</label><select class="select"><option>This month · Aug 2026</option><option>Last month</option><option>Last 90 days</option><option>Custom range</option></select></div>
    <div class="field" style="margin-top:12px"><label class="field-label">Department</label><select class="select"><option>All departments</option>${DEPARTMENTS.map(d => `<option>${d.name}</option>`).join("")}</select></div>
    <div class="row gap-2" style="margin-top:20px"><button class="btn btn-outline flex-1" onclick="closeSheets()">Cancel</button><button class="btn btn-primary flex-1" onclick="closeSheets();toast('Report preview opened in web dashboard')">Preview</button></div>`,
};

function openSheet(name) {
  const content = SHEETS[name] ? SHEETS[name]() : "";
  el("sheet").innerHTML = content;
  el("sheetBackdrop").classList.add("open");
  if (name === "filterSheet") {
    el("shStatus").innerHTML = ["All", "Present", "Late", "Absent", "On Leave"].map(s => `<span class="chip ${s === "All" ? "active" : ""}" onclick="chipActive(this)">${s}</span>`).join("");
    el("shDept").innerHTML = ["All", "Production", "Packing", "Sales", "Logistics", "HR"].map(s => `<span class="chip ${s === "All" ? "active" : ""}" onclick="chipActive(this)">${s}</span>`).join("");
  }
}
function openModal(name, arg) {
  const content = MODALS[name] ? (typeof MODALS[name] === "function" ? MODALS[name](arg) : MODALS[name]) : "";
  el("modal").innerHTML = content;
  el("modalBackdrop").classList.add("open");
}
function closeSheets() {
  el("sheetBackdrop").classList.remove("open");
  el("modalBackdrop").classList.remove("open");
}
function chipActive(c) { c.parentElement.querySelectorAll(".chip").forEach(x => x.classList.remove("active")); c.classList.add("active"); }

function simulateUpload(zone) {
  zone.innerHTML = `<div style="color:var(--success-dark);margin-bottom:6px">${ICON("checkCircle", 28)}</div><p class="t-body-sm" style="font-weight:600;color:var(--success-dark)">document-1.pdf attached</p><p class="t-caption text-tertiary">Tap to replace</p>`;
  toast("Document attached");
}

/* ============================================================
   ROLE-SPECIFIC RENDERS
   ============================================================ */

/* ---------- Pending list (employee home) ---------- */
function renderPending() {
  el("pendingList").innerHTML = `
    <div class="list-item clickable" onclick="go('requests')"><span class="list-chev" style="color:var(--warning)">${ICON("clock", 20)}</span><div class="list-main"><p class="list-title">Overtime request — pending</p><p class="list-sub">2.0 hrs on 13 Aug · submitted</p></div><span class="badge badge-warning">Pending</span></div>
    <div class="list-item clickable" onclick="go('requests')"><span class="list-chev" style="color:var(--warning)">${ICON("calendar", 20)}</span><div class="list-main"><p class="list-title">Weekly wage — Week 33</p><p class="list-sub">₹5,475 · awaiting HR review</p></div><span class="badge badge-info">Submitted</span></div>`;
}

/* ---------- Glance list ---------- */
function renderGlance() {
  const rows = [
    { icon: "checkCircle", color: "success", t: "Checked in · 05:58", s: "On time · within grace" },
    { icon: "clock", color: "info", t: "Working hours · 7.4 today", s: "Shift ends at 14:00" },
    { icon: "mapPin", color: "success", t: "Location verified", s: "Inside attendance area · 120 m" },
    { icon: "calendar", color: "warning", t: "Independence Day", s: "Holiday · 15 Aug (Sat)" },
  ];
  el("glanceList").innerHTML = rows.map(r => `
    <div class="list-item"><span style="width:34px;height:34px;border-radius:10px;background:var(--${r.color}-bg);color:var(--${r.color});display:flex;align-items:center;justify-content:center">${ICON(r.icon, 18)}</span>
    <div class="list-main"><p class="list-title">${r.t}</p><p class="list-sub">${r.s}</p></div></div>`).join("");
}

/* ---------- Upcoming ---------- */
function renderUpcoming() {
  el("upcomingList").innerHTML = `
    <div class="list-item clickable" onclick="go('holidays')"><div class="col flex-1"><p class="list-title">Independence Day</p><p class="list-sub">Public holiday · Tomorrow</p></div><span class="badge badge-neutral">15 Aug</span></div>
    <div class="list-item clickable" onclick="go('notifications')"><div class="col flex-1"><p class="list-title">Birthday · Meena S</p><p class="list-sub">Logistics · send your wishes</p></div><span class="badge badge-primary">Today</span></div>
    <div class="list-item clickable" onclick="go('shift')"><div class="col flex-1"><p class="list-title">Evening shift · 15 Aug</p><p class="list-sub">Next scheduled shift change</p></div><span class="t-caption text-tertiary">14:00</span></div>`;
}

/* ---------- Attendance history ---------- */
function renderAttHistory() {
  // calendar
  let cal = `<div class="cal-dow">S</div><div class="cal-dow">M</div><div class="cal-dow">T</div><div class="cal-dow">W</div><div class="cal-dow">T</div><div class="cal-dow">F</div><div class="cal-dow">S</div>`;
  const starts = 6; // Aug 2026 starts on Saturday
  const days = [
    null,null,null,null,null,"present","present","present","present","present","present",
    "present","present","present","present","present","weekend","present","present","present","present",
    "present","present","weekend","present","present","present","absent","leave","leave","absent",
  ];
  for (let i = 0; i < starts; i++) cal += `<div class="cal-day other">${7 - starts + i}</div>`;
  days.forEach((d, i) => {
    const cls = d ? `cal-day ${d}` : "cal-day";
    cal += `<div class="${cls}" title="${d || ""}">${i + 1}</div>`;
  });
  el("attCal").innerHTML = cal;
  const history = [
    { d: "13 Aug", in: "05:58", out: "14:02", hrs: "8.1", status: "Present", c: "success" },
    { d: "12 Aug", in: "05:54", out: "14:00", hrs: "8.1", status: "Present", c: "success" },
    { d: "11 Aug", in: "05:50", out: "14:05", hrs: "8.3", status: "Present", c: "success" },
    { d: "10 Aug", in: "06:20", out: "14:00", hrs: "7.6", status: "Late", c: "info" },
    { d: "09 Aug", in: "—", out: "—", hrs: "0", status: "Leave", c: "warning" },
    { d: "08 Aug", in: "—", out: "—", hrs: "0", status: "Leave", c: "warning" },
  ];
  el("attHistoryList").innerHTML = history.map(h => `
    <div class="list-item"><div class="col" style="width:64px"><p class="list-title">${h.d}</p></div>
    <div class="col flex-1"><p class="list-sub">In ${h.in} · Out ${h.out}</p></div>
    <div class="col" style="text-align:right"><p class="list-title">${h.hrs} hrs</p></div>
    <span class="badge badge-${h.c}">${h.status}</span></div>`).join("");
}

/* ---------- Requests ---------- */
function renderRequests() {
  const title = el("reqTitle");
  if (state.role === "hr") {
    title.textContent = "Approvals";
    el("reqTabs").innerHTML = `<div class="tab active" data-rt="pending">Pending (4)</div><div class="tab" data-rt="history">History</div>`;
    el("reqContent").innerHTML = pendingApprovalsHTML();
    bindTabs("reqTabs", t => { if (t.dataset.rt === "history") el("reqContent").innerHTML = approvalsHistoryHTML(); else el("reqContent").innerHTML = pendingApprovalsHTML(); });
  } else {
    title.textContent = "My Requests";
    el("reqTabs").innerHTML = `<div class="tab active" data-rt="pending">Pending (2)</div><div class="tab" data-rt="history">History</div>`;
    el("reqContent").innerHTML = myRequestsPending();
    bindTabs("reqTabs", t => { if (t.dataset.rt === "history") el("reqContent").innerHTML = myRequestsHistory(); else el("reqContent").innerHTML = myRequestsPending(); });
  }
}

function myRequestsPending() {
  return `
  <div class="card">
    <div class="appr-card"><div class="row gap-3"><div class="avatar" style="background:var(--warning-bg);color:var(--warning)">OT</div><div class="col flex-1"><p class="list-title">Overtime request · 13 Aug</p><p class="list-sub">2.0 hrs · estimated ₹300</p></div><span class="badge badge-warning">Pending</span></div></div>
    <div class="appr-card"><div class="row gap-3"><div class="avatar" style="background:var(--info-bg);color:var(--info)">₹</div><div class="col flex-1"><p class="list-title">Weekly wage · Week 33</p><p class="list-sub">₹5,475 · 44.5 hrs</p></div><span class="badge badge-info">Submitted</span></div></div>
  </div>
  <div class="state-view"><div class="state-icon">${ICON("clock", 28)}</div><p class="state-title">No pending leave requests</p><p class="state-sub">You have no leave requests awaiting approval right now.</p></div>`;
}
function myRequestsHistory() {
  return `<div class="card">
    <div class="appr-card"><div class="row gap-3"><div class="avatar" style="background:var(--success-bg);color:var(--success-dark)">LV</div><div class="col flex-1"><p class="list-title">Casual Leave · 09 Aug</p><p class="list-sub">1 day · reason: family function</p></div><span class="badge badge-success">Approved</span></div></div>
    <div class="appr-card"><div class="row gap-3"><div class="avatar" style="background:var(--success-bg);color:var(--success-dark)">LV</div><div class="col flex-1"><p class="list-title">Sick Leave · 02 Aug</p><p class="list-sub">1 day · reason: fever</p></div><span class="badge badge-success">Approved</span></div></div>
    <div class="appr-card"><div class="row gap-3"><div class="avatar" style="background:var(--error-bg);color:var(--error)">OT</div><div class="col flex-1"><p class="list-title">Overtime · 02 Aug</p><p class="list-sub">1.5 hrs · requested late</p></div><span class="badge badge-error">Rejected</span></div></div>
  </div>`;
}

function pendingApprovalsHTML() {
  const leaves = LEAVES.filter(l => l.status === "pending");
  return `<div class="card">` + leaves.map(l => {
    const e = empOf(l.emp);
    return `<div class="appr-card">
      <div class="row gap-3">
        <div class="avatar" style="background:var(--avatarBg)">${INITIALS(e.name)}</div>
        <div class="col flex-1"><p class="list-title">${e.name} · ${l.type.replace(" Leave","")}</p><p class="list-sub">${l.from} – ${l.to} · ${l.days} day${l.days>1?"s":""}</p></div>
        <span class="badge badge-warning">Pending</span>
      </div>
      <p class="t-body-sm text-secondary" style="margin-top:10px">Reason: ${l.reason}</p>
      <div class="approval-actions">
        <button class="btn btn-success" onclick="openModal('approvalConfirm','${e.name}')">${ICON("check", 16)} Approve</button>
        <button class="btn btn-outline" onclick="openModal('rejectModal','${e.name}')">Reject</button>
        <button class="icon-btn" onclick="openEmpProfile('${l.emp}')">${ICON("arrowRight", 18)}</button>
      </div></div>`;
  }).join("") + `</div>`;
}
function approvalsHistoryHTML() {
  const done = LEAVES.filter(l => l.status !== "pending");
  return `<div class="card">` + done.map(l => {
    const e = empOf(l.emp);
    const c = l.status === "approved" ? "success" : "error";
    return `<div class="appr-card"><div class="row gap-3"><div class="avatar">${INITIALS(e.name)}</div><div class="col flex-1"><p class="list-title">${e.name} · ${l.type.replace(" Leave","")}</p><p class="list-sub">${l.from} – ${l.to} · ${l.days} day</p></div><span class="badge badge-${c}">${l.status[0].toUpperCase()+l.status.slice(1)}</span></div></div>`;
  }).join("") + `</div>`;
}

/* ---------- Leave ---------- */
function renderLeave() {
  el("leaveTabs").innerHTML = `<div class="tab active" data-lv="balance">Balance</div><div class="tab" data-lv="history">History</div>`;
  renderLeaveBalance();
  bindTabs("leaveTabs", t => t.dataset.lv === "history" ? renderLeaveHistory() : renderLeaveBalance());
}
function renderLeaveBalance() {
  el("leaveContent").innerHTML = `<div class="card">` + LEAVE_TYPES.map(l => `
    <div class="list-item"><div class="col flex-1"><p class="list-title">${l.name}</p><p class="list-sub">${l.id==="casual"?"Accrued 10 · used 2":l.id==="sick"?"Accrued 10 · used 0":l.id==="earned"?"Accrued 12 · used 0":l.id==="maternity"?"Full benefit":""}</p></div><p class="t-h3">${l.balance} <span class="t-caption text-tertiary">days</span></p></div>`).join("") + `</div>
  <div class="card card-pad" style="margin-top:14px"><div class="row gap-3"><span style="color:var(--primary)">${ICON("info", 20)}</span><p class="t-body-sm text-secondary">Casual leave auto-accrues monthly and lapses on 31 December. Sick leave carries forward up to 20 days.</p></div></div>`;
}
function renderLeaveHistory() {
  const rows = [
    { t: "Casual Leave", s: "09 Aug · approved", c: "success", v: "Approved" },
    { t: "Sick Leave", s: "02 Aug · approved", c: "success", v: "Approved" },
    { t: "Casual Leave", s: "14 Jun · approved", c: "success", v: "Approved" },
  ];
  el("leaveContent").innerHTML = `<div class="card">` + rows.map(r => `
    <div class="list-item"><div class="col flex-1"><p class="list-title">${r.t}</p><p class="list-sub">${r.s}</p></div><span class="badge badge-${r.c}">${r.v}</span></div>`).join("") + `</div>`;
}

/* ---------- Shift ---------- */
function renderShift() {
  el("shiftTabs").innerHTML = `<div class="tab active" data-sh="week">This week</div><div class="tab" data-sh="month">August</div>`;
  renderShiftWeek();
  bindTabs("shiftTabs", t => t.dataset.sh === "month" ? renderShiftMonth() : renderShiftWeek());
}
function renderShiftWeek() {
  el("shiftContent").innerHTML = `
    <div class="card card-pad"><div class="row gap-3"><div class="qa-icon" style="width:44px;height:44px">${ICON("sun", 20)}</div><div class="col flex-1"><p class="list-title">Morning Shift</p><p class="list-sub">06:00 – 14:00 · break 30 min</p></div><span class="badge badge-success"><span class="dot"></span>Active</span></div></div>
    <p class="section-title" style="margin-top:16px">Week of 10 Aug</p>
    <div class="card" style="margin-top:8px">
      <div class="list-item"><div class="col flex-1"><p class="list-title">Mon · 10 Aug</p></div><span class="badge badge-primary">Morning</span></div>
      <div class="list-item"><div class="col flex-1"><p class="list-title">Tue · 11 Aug</p></div><span class="badge badge-primary">Morning</span></div>
      <div class="list-item"><div class="col flex-1"><p class="list-title">Wed · 12 Aug</p></div><span class="badge badge-primary">Morning</span></div>
      <div class="list-item"><div class="col flex-1"><p class="list-title">Thu · 13 Aug</p></div><span class="badge badge-primary">Morning</span></div>
      <div class="list-item"><div class="col flex-1"><p class="list-title">Fri · 14 Aug</p></div><span class="badge badge-primary">Morning</span></div>
      <div class="list-item"><div class="col flex-1"><p class="list-title">Sat · 15 Aug</p><p class="list-sub">Independence Day · Holiday</p></div><span class="badge badge-neutral">Holiday</span></div>
      <div class="list-item"><div class="col flex-1"><p class="list-title">Sun · 16 Aug</p><p class="list-sub">Weekly off</p></div><span class="badge badge-neutral">Off</span></div>
    </div>
    <button class="btn btn-outline btn-block" style="margin-top:14px" onclick="toast('Shift change request form opens here')">${ICON("calendarPlus", 18)} Request shift change</button>`;
}
function renderShiftMonth() {
  const dow0 = 6; // Aug 1 2026 is Saturday
  const daysInMonth = 31;
  let cells = "";
  for (let i = 0; i < dow0; i++) cells += `<div class="cal-day other">${31 - dow0 + 1 + i}</div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = (dow0 + d - 1) % 7;
    const isWeekend = dayOfWeek === 6 || dayOfWeek === 0;
    const isHoliday = HOLIDAYS_2026.some(h => h.month === 8 && h.date === d);
    if (isHoliday) cells += `<div class="cal-day event">${d}<span class="cal-mark"></span></div>`;
    else if (isWeekend) cells += `<div class="cal-day weekend">${d}</div>`;
    else cells += `<div class="cal-day">${d}<span class="cal-mark"></span></div>`;
  }
  el("shiftContent").innerHTML = `
    <div class="card card-pad">
      <div class="row between" style="margin-bottom:10px"><span class="t-h3">August 2026</span><span class="t-caption text-tertiary">Morning (M) · Evening (E)</span></div>
      <div class="cal-grid">${["S","M","T","W","T","F","S"].map(d=>`<div class="cal-dow">${d}</div>`).join("")}${cells}</div>
      <div class="row gap-3" style="margin-top:10px"><div class="mini-legend"><span class="dot" style="background:var(--primary)"></span><span class="t-caption text-secondary">Morning</span></div><div class="mini-legend"><span class="dot" style="background:var(--lavender)"></span><span class="t-caption text-secondary">Evening</span></div><div class="mini-legend"><span class="dot" style="background:var(--warning)"></span><span class="t-caption text-secondary">Holiday</span></div></div>
    </div>`;
}

/* ---------- Working hours ---------- */
function renderHours() {
  // week bars
  const bars = [8.1, 8.1, 8.3, 7.6, 7.4, 0, 0];
  const max = 8.3;
  el("weekBars").innerHTML = bars.map((b, i) => `<div class="bar ${b === 0 ? "" : "main"}" style="height:${(b / max) * 100}%" title="${b} hrs"></div>`).join("");
  const daily = [
    { d: "Mon · 10 Aug", in: "05:58", out: "14:02", hrs: "8.1", reg: "8.0", ot: "0.1", wage: "₹977" },
    { d: "Tue · 11 Aug", in: "05:54", out: "14:00", hrs: "8.1", reg: "8.0", ot: "0.1", wage: "₹977" },
    { d: "Wed · 12 Aug", in: "05:50", out: "14:05", hrs: "8.3", reg: "8.0", ot: "0.3", wage: "₹1005" },
    { d: "Thu · 13 Aug", in: "06:20", out: "14:00", hrs: "7.6", reg: "7.6", ot: "0", wage: "₹912" },
    { d: "Fri · 14 Aug", in: "—", out: "—", hrs: "—", reg: "—", ot: "—", wage: "—" },
  ];
  el("dailyHours").innerHTML = daily.map(d => `
    <div class="list-item clickable" onclick="toast('Day detail opens here')">
      <div class="col flex-1"><p class="list-title">${d.d}</p><p class="list-sub">In ${d.in} · Out ${d.out}</p></div>
      <div class="col" style="text-align:right"><p class="list-title">${d.hrs} hrs</p><p class="t-caption text-tertiary">${d.wage}</p></div>
    </div>`).join("");
  bindSeg("hoursSeg", s => { if (s.dataset.view === "month") toast("Monthly view (same layout as web)"); });
}

/* ---------- Wage history ---------- */
function renderWageHistory() {
  const rows = [
    { p: "Week 33", r: "10 – 16 Aug 2026", t: "₹5,475", s: "Submitted", c: "info" },
    { p: "Week 32", r: "03 – 09 Aug 2026", t: "₹4,760", s: "Approved", c: "success" },
    { p: "Week 31", r: "27 Jul – 02 Aug 2026", t: "₹4,880", s: "Approved", c: "success" },
    { p: "Week 30", r: "20 – 26 Jul 2026", t: "₹5,040", s: "Approved", c: "success" },
  ];
  el("wageHistory").innerHTML = rows.map(r => `
    <div class="list-item clickable" onclick="go('wage-detail')">
      <div class="col flex-1"><p class="list-title">${r.p}</p><p class="list-sub">${r.r}</p></div>
      <div class="col" style="text-align:right"><p class="list-title">${r.t}</p></div>
      <span class="badge badge-${r.c}">${r.s}</span>
    </div>`).join("");
}

/* ---------- Wage timeline ---------- */
function renderWageTimeline() {
  el("wageTimeline").innerHTML = `
    <div class="timeline-item done"><p class="t-body-sm" style="font-weight:600">Draft created</p><p class="t-caption text-tertiary">08 Aug · auto-generated</p></div>
    <div class="timeline-item done"><p class="t-body-sm" style="font-weight:600">Submitted</p><p class="t-caption text-tertiary">13 Aug · by system</p></div>
    <div class="timeline-item current"><p class="t-body-sm" style="font-weight:600">Under review</p><p class="t-caption text-tertiary">Awaiting HR Manager</p></div>
    <div class="timeline-item"><p class="t-body-sm" style="font-weight:600">Approved</p><p class="t-caption text-tertiary">Payment scheduled</p></div>`;
}

/* ---------- Documents ---------- */
function renderDocs() {
  el("docTabs").innerHTML = `<div class="tab active" data-doc="all">All</div><div class="tab" data-doc="identity">Identity</div><div class="tab" data-doc="education">Education</div>`;
  renderDocAll();
  bindTabs("docTabs", t => renderDocList(t.dataset.doc));
}
function renderDocAll() {
  const docs = [
    { n: "Aadhaar Card", cat: "id", t: "Identity", d: "12 Aug 2024", s: "Verified", c: "success" },
    { n: "PAN Card", cat: "id", t: "Identity", d: "12 Aug 2024", s: "Verified", c: "success" },
    { n: "SSLC Certificate", cat: "edu", t: "Education", d: "15 Aug 2024", s: "Verified", c: "success" },
    { n: "HSC Certificate", cat: "edu", t: "Education", d: "15 Aug 2024", s: "Verified", c: "success" },
    { n: "Bank Account Proof", cat: "emp", t: "Employment", d: "20 Aug 2024", s: "Verified", c: "success" },
    { n: "Driving License", cat: "other", t: "Other", d: "02 Jan 2026", s: "Pending", c: "warning" },
  ];
  el("docContent").innerHTML = `<div class="card">` + docs.map(d => `
    <div class="doc-card clickable" onclick="openDoc('${d.n}')">
      <div class="doc-icon ${d.cat}">${ICON(d.cat === "id" ? "fingerprint" : d.cat === "edu" ? "graduation" : d.cat === "emp" ? "briefcase" : "folder", 20)}</div>
      <div class="col flex-1"><p class="list-title">${d.n}</p><p class="list-sub">${d.t} · uploaded ${d.d}</p></div>
      <span class="badge badge-${d.c}">${d.s}</span>
    </div>`).join("") + `</div>`;
}
function renderDocList(cat) {
  const map = { identity: ["Aadhaar Card","PAN Card"], education: ["SSLC Certificate","HSC Certificate"], all: ["Aadhaar Card","PAN Card","SSLC Certificate","HSC Certificate","Bank Account Proof","Driving License"] };
  const names = map[cat];
  const cats = { "Aadhaar Card":["id","Identity"], "PAN Card":["id","Identity"], "SSLC Certificate":["edu","Education"], "HSC Certificate":["edu","Education"], "Bank Account Proof":["emp","Employment"], "Driving License":["other","Other"] };
  el("docContent").innerHTML = `<div class="card">` + names.map(n => {
    const [c, t] = cats[n];
    const s = n === "Driving License" ? ["warning","Pending"] : ["success","Verified"];
    return `<div class="doc-card clickable" onclick="openDoc('${n}')">
      <div class="doc-icon ${c}">${ICON(c === "id" ? "fingerprint" : c === "edu" ? "graduation" : c === "emp" ? "briefcase" : "folder", 20)}</div>
      <div class="col flex-1"><p class="list-title">${n}</p><p class="list-sub">${t} document</p></div>
      <span class="badge badge-${s[0]}">${s[1]}</span></div>`;
  }).join("") + `</div>`;
}
function openDoc(name) {
  openModal("docModal", name);
}

/* ---------- Policies ---------- */
function renderPolicies() {
  el("policyList").innerHTML = POLICY_CATEGORIES.map(p => `
    <div class="card card-pad card-press" style="margin-bottom:10px" onclick="openPolicy('${p.id}')">
      <div class="row gap-3"><div class="more-icon">${ICON("book", 18)}</div>
      <div class="col flex-1"><p class="list-title">${p.name}</p><p class="list-sub">${p.version} · eff. ${p.eff}</p></div>
      <span class="list-chev">${ICON("chevronRight", 18)}</span></div>
    </div>`).join("");
}
function openPolicy(id) {
  state.policy = id;
  go("policy-detail");
}
function renderPolicyDetail() {
  const p = POLICY_CATEGORIES.find(x => x.id === state.policy) || POLICY_CATEGORIES[0];
  el("pdTitle").textContent = p.name;
  el("pdName").textContent = p.name;
  el("pdMeta").textContent = `${p.version} · Effective ${p.eff}`;
  el("pdSummary").textContent = p.summary;
}

/* ---------- Holiday calendar ---------- */
function renderHolidays() {
  let cal = `<div class="cal-dow">S</div><div class="cal-dow">M</div><div class="cal-dow">T</div><div class="cal-dow">W</div><div class="cal-dow">T</div><div class="cal-dow">F</div><div class="cal-dow">S</div>`;
  for (let i = 0; i < 6; i++) cal += `<div class="cal-day other">${7 - 6 + i}</div>`;
  for (let d = 1; d <= 31; d++) {
    const hol = HOLIDAYS_2026.find(h => h.date === d && h.month === 8);
    const cls = hol ? "event" : (d === 15 || d === 22 || d === 29) ? "weekend" : "";
    cal += `<div class="cal-day ${cls} ${hol ? "event" : ""}">${d}${hol ? `<span class="cal-mark"></span>` : ""}</div>`;
  }
  el("holCal").innerHTML = cal;
  el("holList").innerHTML = HOLIDAYS_2026.filter(h => h.month >= 8).map(h => `
    <div class="list-item"><div class="col flex-1"><p class="list-title">${h.name}</p><p class="list-sub">${h.tag}</p></div><span class="badge badge-neutral">${h.date} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][h.month-1]}</span></div>`).join("");
}

/* ---------- Notifications ---------- */
function renderNotifications() {
  el("notifTabs").innerHTML = `<span class="chip active" onclick="chipActive(this)">All</span><span class="chip" onclick="chipActive(this)">Leave</span><span class="chip" onclick="chipActive(this)">Wage</span><span class="chip" onclick="chipActive(this)">Overtime</span><span class="chip" onclick="chipActive(this)">Recruitment</span><span class="chip" onclick="chipActive(this)">Announcements</span>`;
  const colors = { leave: ["primary-dark","primary-light"], wage: ["success-dark","success-bg"], overtime: ["warning","warning-bg"], recruitment: ["info","info-bg"], attendance: ["info","info-bg"], announcement: ["text","surface-2"], system: ["text-secondary","surface-2"], birthday: ["error","error-bg"] };
  const icons = { leave: "calendar", wage: "wallet", overtime: "zap", recruitment: "user", attendance: "attendance", announcement: "megaphone", system: "settings", birthday: "cake" };
  el("notifList").innerHTML = NOTIFICATIONS.map((n, i) => {
    const [fg, bg] = colors[n.type]; 
    const unread = i < 5;
    const action = n.action ? `<button class="btn btn-secondary btn-sm" style="margin-top:10px;align-self:flex-start" onclick="toast('Opening: ${n.title}')">${n.action}</button>` : "";
    return `<div class="notif-row ${unread ? "unread" : "read"}">
      <div class="notif-icon">${ICON(icons[n.type], 20)}</div>
      <div class="col flex-1"><p class="list-title" style="font-size:13.5px">${n.title}</p><p class="list-sub">${n.body}</p>${action}<p class="t-caption text-tertiary" style="margin-top:6px">${n.time}</p></div>
      <span style="width:8px;height:8px;border-radius:50%;background:${unread ? "var(--primary)" : "transparent"};margin-top:6px;flex-shrink:0"></span>
    </div>`;
  }).join("");
}

/* ---------- Profile ---------- */
function renderProfile() {
  el("profName").textContent = CURRENT_USER.name;
  el("profRole").textContent = `${CURRENT_USER.role} · ${deptName(CURRENT_USER.dept)}`;
  el("profAvatar").textContent = INITIALS(CURRENT_USER.name);
}

/* ---------- HR dashboard ---------- */
function renderHR() {
  el("hrGreet").textContent = "Good morning, Priya";
  // trend bars
  const trend = [13, 10, 12, 14, 13, 12, 12];
  const max = 14;
  el("hrTrendBars").innerHTML = trend.map(t => `<div class="bar ${t >= 13 ? "main" : ""}" style="height:${(t / max) * 100}%"></div>`).join("");
  // pending preview
  el("hrPendingPreview").innerHTML = `
    <div class="list-item clickable" onclick="go('requests')"><div class="avatar" style="background:var(--warning-bg);color:var(--warning)">SK</div><div class="col flex-1"><p class="list-title">Suresh Kumar · Casual Leave</p><p class="list-sub">14 – 16 Aug · 3 days</p></div><span class="badge badge-warning">Pending</span></div>
    <div class="list-item clickable" onclick="go('requests')"><div class="avatar" style="background:var(--warning-bg);color:var(--warning)">RV</div><div class="col flex-1"><p class="list-title">R. Vasanth · Sick Leave</p><p class="list-sub">13 Aug · 1 day</p></div><span class="badge badge-warning">Pending</span></div>
    <div class="list-item clickable" onclick="go('overtime')"><div class="avatar" style="background:var(--info-bg);color:var(--info)">OT</div><div class="col flex-1"><p class="list-title">2 overtime requests</p><p class="list-sub">Production · 4.5 hrs</p></div><span class="badge badge-info">Review</span></div>`;
  // activity
  el("hrActivity").innerHTML = `
    <div class="list-item"><span style="color:var(--success-dark)">${ICON("checkCircle", 18)}</span><div class="col flex-1"><p class="list-title">Leave approved</p><p class="list-sub">Deepa R · 18–19 Aug · 12:04</p></div></div>
    <div class="list-item"><span style="color:var(--info)">${ICON("user", 18)}</span><div class="col flex-1"><p class="list-title">Candidate moved to Offer</p><p class="list-sub">Janani V · HR Executive · 11:40</p></div></div>
    <div class="list-item"><span style="color:var(--warning)">${ICON("zap", 18)}</span><div class="col flex-1"><p class="list-title">Overtime submitted</p><p class="list-sub">Divya Lakshmi · 2.0 hrs · 11:02</p></div></div>
    <div class="list-item"><span style="color:var(--primary)">${ICON("checkCircle", 18)}</span><div class="col flex-1"><p class="list-title">Wage approved</p><p class="list-sub">Week 32 · 5 employees · 09:30</p></div></div>`;
  // celebrations
  el("hrCelebrations").innerHTML = `
    <div class="list-item"><div class="avatar" style="background:var(--error-bg);color:var(--error)">MS</div><div class="col flex-1"><p class="list-title">Meena S · Birthday</p><p class="list-sub">Logistics · today</p></div><span class="badge badge-primary">Today</span></div>
    <div class="list-item"><div class="avatar" style="background:var(--success-bg);color:var(--success-dark)">VA</div><div class="col flex-1"><p class="list-title">Vijay Anand · 2 yrs</p><p class="list-sub">HR · work anniversary</p></div></div>`;
}

/* ---------- People / directory ---------- */
function renderPeople() {
  el("pplFilters").innerHTML = `<span class="chip active" onclick="pplFilter(this,'all')">All</span><span class="chip" onclick="pplFilter(this,'Permanent')">Permanent</span><span class="chip" onclick="pplFilter(this,'Contract')">Contract</span><span class="chip" onclick="pplFilter(this,'Hourly Wage')">Hourly</span>`;
  renderPplList("all");
}
function pplFilter(c, type) {
  document.querySelectorAll("#pplFilters .chip").forEach(x => x.classList.remove("active"));
  c.classList.add("active");
  renderPplList(type);
}
function renderPplList(type) {
  let list = EMPLOYEES;
  if (type !== "all") list = list.filter(e => e.type === type);
  el("pplCount").textContent = `${list.length} employees`;
  el("pplList").innerHTML = list.map(e => {
    const stc = { present: "success", absent: "error", leave: "warning", late: "info", working: "success" };
    return `<div class="card card-pad card-press" style="margin-bottom:10px" onclick="openEmpProfile('${e.id}')">
      <div class="row gap-3">
        <div class="avatar" style="background:${AVATAR_COLORS[e.avatar]}" >${INITIALS(e.name)}</div>
        <div class="col flex-1"><p class="list-title">${e.name}</p><p class="list-sub">${e.id} · ${e.role}</p><p class="list-sub">${deptName(e.dept)} · ${e.type}</p></div>
        <span class="badge badge-${stc[e.status]}"><span class="dot"></span>${e.status[0].toUpperCase()+e.status.slice(1)}</span>
      </div></div>`;
  }).join("") || `<div class="state-view"><div class="state-icon">${ICON("users", 28)}</div><p class="state-title">No employees found</p><p class="state-sub">Try adjusting your filters.</p></div>`;
}
function openEmpProfile(id) {
  state.profileEmp = id;
  go("emp-profile");
}

/* ---------- Employee profile ---------- */
function renderEmpProfile() {
  const e = empOf(state.profileEmp);
  const stc = { present: "success", absent: "error", leave: "warning", late: "info", working: "success" };
  const body = el("empProfileBody");
  body.innerHTML = `
    <div class="profile-hero">
      <div class="avatar avatar-xl" style="background:${AVATAR_COLORS[e.avatar]}">${INITIALS(e.name)}</div>
      <h2 class="t-h2" style="margin-top:10px">${e.name}</h2>
      <p class="t-body-sm text-secondary">${e.id} · ${e.role}</p>
      <div class="row gap-2" style="margin-top:10px">
        <span class="badge badge-primary">${e.type}</span>
        <span class="badge badge-${stc[e.status]}"><span class="dot"></span>${e.status[0].toUpperCase()+e.status.slice(1)}</span>
      </div>
    </div>
    <div class="tabs tab-scroll" style="margin-top:16px;background:transparent;padding:0" id="epTabs">
      ${["Overview","Employment","Attendance","Leave","Wages","Docs","Performance"].map((t,i)=>`<div class="tab ${i===0?"active":""}" data-ep="${t.toLowerCase()}" onclick="epTab(this,'${t.toLowerCase()}')">${t}</div>`).join("")}
    </div>
    <div id="epContent" style="margin-top:14px"></div>`;
  epTab(null, "overview", e);
}
function epTab(tab, key) {
  document.querySelectorAll("#epTabs .tab").forEach(t => t.classList.remove("active"));
  if (tab) tab.classList.add("active");
  const e = empOf(state.profileEmp);
  const c = el("epContent");
  if (key === "overview") c.innerHTML = `
    <div class="card card-pad"><p class="section-title">Contact</p>
      <div class="kv"><span class="kv-key">Phone</span><span class="kv-val">${e.phone}</span></div>
      <div class="kv"><span class="kv-key">Email</span><span class="kv-val">${e.name.toLowerCase().replace(/ /g,".")}@orchidflowers.in</span></div>
      <div class="kv"><span class="kv-key">Address</span><span class="kv-val">Kovaipudur, Coimbatore</span></div>
      <div class="kv"><span class="kv-key">Emergency contact</span><span class="kv-val">Family member</span></div>
    </div>
    <div class="card card-pad" style="margin-top:12px"><p class="section-title">Employment summary</p>
      <div class="kv"><span class="kv-key">Department</span><span class="kv-val">${deptName(e.dept)}</span></div>
      <div class="kv"><span class="kv-key">Designation</span><span class="kv-val">${e.role}</span></div>
      <div class="kv"><span class="kv-key">Employment type</span><span class="kv-val">${e.type}</span></div>
      <div class="kv"><span class="kv-key">Shift</span><span class="kv-val">${shiftOf(e.shift).name}</span></div>
      <div class="kv"><span class="kv-key">Joining date</span><span class="kv-val">${e.joined}</span></div>
      <div class="kv"><span class="kv-key">Reporting manager</span><span class="kv-val">${e.manager === "—" ? "Head Office" : e.manager}</span></div>
    </div>`;
  else if (key === "employment") c.innerHTML = `
    <div class="card card-pad"><p class="section-title">Employment</p>
      <div class="kv"><span class="kv-key">Employee ID</span><span class="kv-val">${e.id}</span></div>
      <div class="kv"><span class="kv-key">Status</span><span class="kv-val">Active</span></div>
      <div class="kv"><span class="kv-key">Contract type</span><span class="kv-val">${e.type}</span></div>
      <div class="kv"><span class="kv-key">Hourly rate</span><span class="kv-val">₹${e.wage.rate} / hr</span></div>
      <div class="kv"><span class="kv-key">Rate effective</span><span class="kv-val">${e.wage.eff}</span></div>
      <div class="kv"><span class="kv-key">Bank account</span><span class="kv-val">•••• 4821</span></div>
      <div class="kv"><span class="kv-key">PAN</span><span class="kv-val">•••••389F</span></div>
    </div>`;
  else if (key === "attendance") c.innerHTML = `
    <div class="card card-pad"><div class="row between"><div class="col"><p class="t-caption text-secondary">This month</p><p class="t-metric">18 / 22</p></div><div class="col"><p class="t-caption text-secondary">On time</p><p class="t-metric">89%</p></div><div class="col"><p class="t-caption text-secondary">Late</p><p class="t-metric" style="color:var(--info)">2</p></div><div class="col"><p class="t-caption text-secondary">Absent</p><p class="t-metric" style="color:var(--error)">1</p></div></div></div>
    <div class="card card-pad" style="margin-top:12px"><p class="section-title">Today</p>
      <div class="kv"><span class="kv-key">Check-in</span><span class="kv-val">05:58</span></div>
      <div class="kv"><span class="kv-key">Check-out</span><span class="kv-val">14:02</span></div>
      <div class="kv"><span class="kv-key">Working hours</span><span class="kv-val">8.1 hrs</span></div>
      <div class="kv"><span class="kv-key">Status</span><span class="kv-val">Present</span></div>
    </div>`;
  else if (key === "leave") c.innerHTML = `
    <div class="card card-pad"><p class="section-title">Leave balance</p>
      <div class="kv"><span class="kv-key">Casual Leave</span><span class="kv-val">8 / 10</span></div>
      <div class="kv"><span class="kv-key">Sick Leave</span><span class="kv-val">10 / 10</span></div>
      <div class="kv"><span class="kv-key">Earned Leave</span><span class="kv-val">12 / 12</span></div>
    </div>
    <div class="card" style="margin-top:12px">
      <div class="list-item"><div class="col flex-1"><p class="list-title">Casual Leave</p><p class="list-sub">09 Aug · approved</p></div><span class="badge badge-success">Approved</span></div>
      <div class="list-item"><div class="col flex-1"><p class="list-title">Sick Leave</p><p class="list-sub">02 Aug · approved</p></div><span class="badge badge-success">Approved</span></div>
    </div>`;
  else if (key === "wages") c.innerHTML = `
    <div class="card card-pad"><p class="section-title">Current rate</p>
      <div class="kv"><span class="kv-key">Hourly rate</span><span class="kv-val">₹${e.wage.rate}</span></div>
      <div class="kv"><span class="kv-key">Overtime rate</span><span class="kv-val">₹${Math.round(e.wage.rate * 1.25)} (1.25×)</span></div>
      <div class="kv"><span class="kv-key">Effective</span><span class="kv-val">${e.wage.eff}</span></div>
    </div>
    <div class="card card-pad" style="margin-top:12px"><p class="section-title">This week</p>
      <div class="kv"><span class="kv-key">Regular hours</span><span class="kv-val">40.0</span></div>
      <div class="kv"><span class="kv-key">Overtime</span><span class="kv-val">4.5</span></div>
      <div class="kv"><span class="kv-key">Estimated wage</span><span class="kv-val" style="color:var(--success-dark)">₹5,475</span></div>
    </div>`;
  else if (key === "docs") c.innerHTML = `
    <div class="card">
      <div class="doc-card"><div class="doc-icon id">${ICON("fingerprint",20)}</div><div class="col flex-1"><p class="list-title">Aadhaar Card</p></div><span class="badge badge-success">Verified</span></div>
      <div class="doc-card"><div class="doc-icon id">${ICON("fingerprint",20)}</div><div class="col flex-1"><p class="list-title">PAN Card</p></div><span class="badge badge-success">Verified</span></div>
      <div class="doc-card"><div class="doc-icon edu">${ICON("graduation",20)}</div><div class="col flex-1"><p class="list-title">SSLC Certificate</p></div><span class="badge badge-success">Verified</span></div>
    </div>`;
  else if (key === "performance") c.innerHTML = `
    <div class="card card-pad"><div class="row gap-4">
      <div class="col flex-1"><p class="t-caption text-secondary">Average rating</p><p class="t-metric">${e.rating}</p></div>
      <div class="col flex-1"><p class="t-caption text-secondary">Reviews</p><p class="t-metric">2</p></div>
      <div class="col flex-1"><p class="t-caption text-secondary">Last review</p><p class="t-metric" style="font-size:18px">Apr 26</p></div>
    </div></div>
    <div class="card card-pad" style="margin-top:12px"><p class="section-title">Recent review · Apr 2026</p>
      <p class="t-body-sm text-secondary" style="margin-top:8px"><b>Strengths:</b> Reliable, consistent attendance, good work ethic.</p>
      <p class="t-body-sm text-secondary" style="margin-top:6px"><b>Improve:</b> Speed on flower grading tasks.</p>
    </div>`;
}

/* ---------- Hourly workforce ---------- */
function renderHourly() {
  const hourly = EMPLOYEES.filter(e => e.type === "Hourly Wage");
  el("hourlyList").innerHTML = hourly.map(e => `
    <div class="list-item clickable" onclick="openHourlyEmp('${e.id}')">
      <div class="avatar" style="background:${AVATAR_COLORS[e.avatar]}">${INITIALS(e.name)}</div>
      <div class="col flex-1"><p class="list-title">${e.name}</p><p class="list-sub">${e.role} · ${deptName(e.dept)}</p></div>
      <div class="col" style="text-align:right"><p class="list-title">₹${e.wage.rate}/hr</p><p class="t-caption text-tertiary">44.5 hrs</p></div>
      <span class="list-chev">${ICON("chevronRight", 18)}</span>
    </div>`).join("");
}
function openHourlyEmp(id) { state.hourlyEmpId = id; go("hourly-emp"); }

function renderHourlyEmp() {
  const e = empOf(state.hourlyEmpId);
  const body = el("hourlyEmpBody");
  body.innerHTML = `
    <div class="profile-hero"><div class="avatar avatar-xl" style="background:${AVATAR_COLORS[e.avatar]}">${INITIALS(e.name)}</div>
      <h2 class="t-h2" style="margin-top:10px">${e.name}</h2><p class="t-body-sm text-secondary">${e.id} · ${e.role}</p>
      <div class="row gap-2" style="margin-top:10px"><span class="badge badge-primary">Hourly Wage</span><span class="badge badge-success"><span class="dot"></span>Active</span></div></div>
    <div class="home-grid2" style="margin-top:16px">
      <div class="card card-pad stat-cell"><p class="t-caption text-secondary">Hourly rate</p><p class="t-metric">₹${e.wage.rate}</p><p class="t-caption text-tertiary">eff. ${e.wage.eff}</p></div>
      <div class="card card-pad stat-cell"><p class="t-caption text-secondary">OT rate</p><p class="t-metric" style="color:var(--warning)">₹${Math.round(e.wage.rate*1.25)}</p><p class="t-caption text-tertiary">1.25×</p></div>
      <div class="card card-pad stat-cell"><p class="t-caption text-secondary">This week</p><p class="t-metric">44.5</p><p class="t-caption text-tertiary">hours</p></div>
      <div class="card card-pad stat-cell"><p class="t-caption text-secondary">Est. wage</p><p class="t-metric" style="color:var(--success-dark)">₹5,475</p><p class="t-caption text-tertiary">Week 33</p></div>
    </div>
    <p class="section-title" style="margin-top:18px">Working hours · Week 33</p>
    <div class="card" style="margin-top:8px">
      <div class="list-item"><div class="col flex-1"><p class="list-title">Mon · 10 Aug</p></div><p class="list-title">8.1 hrs</p></div>
      <div class="list-item"><div class="col flex-1"><p class="list-title">Tue · 11 Aug</p></div><p class="list-title">8.1 hrs</p></div>
      <div class="list-item"><div class="col flex-1"><p class="list-title">Wed · 12 Aug</p></div><p class="list-title">8.3 hrs</p></div>
      <div class="list-item"><div class="col flex-1"><p class="list-title">Thu · 13 Aug</p></div><p class="list-title">7.6 hrs</p></div>
      <div class="list-item"><div class="col flex-1"><p class="list-title">Fri · 14 Aug</p></div><p class="list-title">—</p></div>
    </div>
    <p class="section-title" style="margin-top:18px">Wage history</p>
    <div class="card" style="margin-top:8px">
      <div class="list-item"><div class="col flex-1"><p class="list-title">Week 32</p><p class="list-sub">03 – 09 Aug</p></div><p class="list-title">₹4,760</p></div>
      <div class="list-item"><div class="col flex-1"><p class="list-title">Week 31</p><p class="list-sub">27 Jul – 02 Aug</p></div><p class="list-title">₹4,880</p></div>
    </div>`;
}

/* ---------- Attendance admin ---------- */
function renderAttendanceAdmin() {
  el("aaStatusTabs").innerHTML = `<span class="chip active" onclick="aaFilter(this,'all')">All</span><span class="chip" onclick="aaFilter(this,'Present')">Present</span><span class="chip" onclick="aaFilter(this,'Late')">Late</span><span class="chip" onclick="aaFilter(this,'Absent')">Absent</span><span class="chip" onclick="aaFilter(this,'On Leave')">On Leave</span>`;
  renderAaList("all");
}
function aaFilter(c, s) { document.querySelectorAll("#aaStatusTabs .chip").forEach(x => x.classList.remove("active")); c.classList.add("active"); renderAaList(s); }
function renderAaList(filter) {
  let rows = ATTENDANCE_TODAY;
  if (filter !== "all") rows = rows.filter(r => r.status === filter);
  const stc = { Present: "success", Late: "info", Absent: "error", "On Leave": "warning", Working: "success" };
  el("aaList").innerHTML = rows.map(r => {
    const e = empOf(r.emp);
    return `<div class="list-item clickable" onclick="openEmpProfile('${r.emp}')">
      <div class="avatar" style="background:${AVATAR_COLORS[e.avatar]}">${INITIALS(e.name)}</div>
      <div class="col flex-1"><p class="list-title">${e.name}</p><p class="list-sub">${deptName(e.dept)} · ${shiftOf(e.shift).name}</p></div>
      <div class="col" style="text-align:right"><p class="list-sub">In ${r.in}</p><p class="t-caption text-tertiary">${r.hrs} hrs</p></div>
      <span class="badge badge-${stc[r.status]}">${r.status}</span>
    </div>`;
  }).join("") || `<div class="state-view"><div class="state-icon">${ICON("attendance",28)}</div><p class="state-title">No employees in this status</p><p class="state-sub">Try another status filter.</p></div>`;
}

/* ---------- Overtime ---------- */
function renderOvertime() {
  const pend = OVERTIME_REQUESTS.filter(o => o.status === "pending");
  el("otPending").innerHTML = pend.map(o => {
    const e = empOf(o.emp);
    return `<div class="card appr-card" style="margin-bottom:10px">
      <div class="row gap-3"><div class="avatar" style="background:${AVATAR_COLORS[e.avatar]}">${INITIALS(e.name)}</div>
      <div class="col flex-1"><p class="list-title">${e.name} · ${e.role}</p><p class="list-sub">${o.date} · ${o.reg} reg hrs</p></div>
      <div class="col" style="text-align:right"><p class="list-title" style="color:var(--warning)">+${o.ot} hrs</p><p class="t-caption text-tertiary">≈₹${o.ot * o.rate}</p></div></div>
      <div class="approval-actions">
        <button class="btn btn-success" onclick="openModal('approvalConfirm','${e.name}')">${ICON("check",16)} Approve</button>
        <button class="btn btn-outline" onclick="openModal('rejectModal','${e.name}')">Reject</button>
        <button class="btn btn-ghost" onclick="openModal('otDetail','${o.id}')">Details</button>
      </div></div>`;
  }).join("") || `<div class="state-view"><div class="state-icon">${ICON("checkCircle",28)}</div><p class="state-title">All caught up</p><p class="state-sub">No overtime requests pending approval.</p></div>`;
  const recent = OVERTIME_REQUESTS.filter(o => o.status !== "pending");
  el("otRecent").innerHTML = recent.map(o => {
    const e = empOf(o.emp);
    return `<div class="list-item"><div class="avatar" style="background:${AVATAR_COLORS[e.avatar]}">${INITIALS(e.name)}</div>
      <div class="col flex-1"><p class="list-title">${e.name} · +${o.ot} hrs</p><p class="list-sub">${o.date}</p></div>
      <span class="badge badge-${o.status === "approved" ? "success" : "error"}">${o.status[0].toUpperCase()+o.status.slice(1)}</span></div>`;
  }).join("");
}

/* ---------- Wages admin ---------- */
function renderWages() {
  el("wageTabs").innerHTML = `<div class="tab active" data-wg="pending">To approve (2)</div><div class="tab" data-wg="all">All runs</div>`;
  renderWageRuns("pending");
  bindTabs("wageTabs", t => t.dataset.wg === "all" ? renderWageRuns("all") : renderWageRuns("pending"));
}
function renderWageRuns(mode) {
  let runs = WAGE_RUNS;
  if (mode === "pending") runs = runs.filter(r => r.status === "Draft" || r.status === "Submitted");
  const sc = { Draft: "neutral", Submitted: "info", Reviewed: "warning", Approved: "success" };
  el("wageContent").innerHTML = runs.map(r => {
    const e = empOf(r.emp);
    const canApprove = r.status === "Submitted";
    return `<div class="card appr-card" style="margin-bottom:10px">
      <div class="row gap-3"><div class="avatar" style="background:${AVATAR_COLORS[e.avatar]}">${INITIALS(e.name)}</div>
      <div class="col flex-1"><p class="list-title">${e.name} · ${r.period}</p><p class="list-sub">${r.hours} hrs · OT ${r.ot} · ₹${r.regAmt.toLocaleString('en-IN')} + ₹${r.otAmt.toLocaleString('en-IN')}</p></div>
      <span class="badge badge-${sc[r.status]}">${r.status}</span></div>
      <div class="row between" style="margin-top:8px"><p class="t-h3" style="color:var(--success-dark)">₹${r.total.toLocaleString('en-IN')}</p>
      <div class="row gap-2">${canApprove ? `<button class="btn btn-success btn-sm" onclick="openModal('wageApprove','${e.name}')">${ICON("check",14)} Approve</button><button class="btn btn-outline btn-sm" onclick="go('wage-detail')">Details</button>` : `<button class="btn btn-outline btn-sm" onclick="go('wage-detail')">View</button>`}</div></div></div>`;
  }).join("") || `<div class="state-view"><div class="state-icon">${ICON("checkCircle",28)}</div><p class="state-title">No pending wage runs</p><p class="state-sub">All weekly wages have been reviewed.</p></div>`;
}

/* ---------- Assignments ---------- */
function renderAssignments() {
  el("asTabs").innerHTML = `<div class="tab active" data-as="all">All</div><div class="tab" data-as="active">In progress</div><div class="tab" data-as="done">Completed</div>`;
  renderAsList("all");
  bindTabs("asTabs", t => renderAsList(t.dataset.as));
}
function renderAsList(mode) {
  let list = TASKS;
  if (mode === "active") list = list.filter(t => t.status === "In Progress");
  if (mode === "done") list = list.filter(t => t.status === "Completed");
  const sc = { Assigned: "info", "In Progress": "warning", Completed: "success" };
  el("asList").innerHTML = list.map(t => {
    const e = empOf(t.emp);
    const pc = t.priority === "High" ? "error" : t.priority === "Medium" ? "warning" : "neutral";
    return `<div class="card appr-card" style="margin-bottom:10px">
      <div class="row gap-3"><div class="avatar" style="background:${AVATAR_COLORS[e.avatar]}">${INITIALS(e.name)}</div>
      <div class="col flex-1"><p class="list-title">${t.task}</p><p class="list-sub">${e.name} · ${t.loc}</p></div>
      <span class="badge badge-${pc}">${t.priority}</span></div>
      <div class="row between" style="margin-top:8px"><p class="t-caption text-tertiary">${t.start} – ${t.end}</p><span class="badge badge-${sc[t.status]}">${t.status}</span></div></div>`;
  }).join("") || `<div class="state-view"><div class="state-icon">${ICON("briefcase",28)}</div><p class="state-title">No assignments</p><p class="state-sub">No tasks match this filter.</p></div>`;
}

/* ---------- Reports ---------- */
function renderReports() {
  const recent = ["Attendance Report", "Hourly Wage Report", "Overtime Report"];
  const all = ["Employee Report", "Attendance Report", "Leave Report", "Recruitment Report", "Performance Report", "Shift Report", "Working Hour Report", "Hourly Wage Report", "Overtime Report", "Payment Summary"];
  const icons = { "Employee Report": "people", "Attendance Report": "attendance", "Leave Report": "calendar", "Recruitment Report": "user", "Performance Report": "star", "Shift Report": "clock", "Working Hour Report": "clock", "Hourly Wage Report": "wallet", "Overtime Report": "zap", "Payment Summary": "rupee" };
  el("repRecent").innerHTML = `<div class="card">` + recent.map(r => `
    <div class="report-row clickable" onclick="openModal('reportDetail','${r}')"><div class="more-icon">${ICON(icons[r] || "chart",18)}</div><div class="col flex-1"><p class="list-title">${r}</p><p class="list-sub">Last opened · today</p></div><span class="list-chev">${ICON("chevronRight",18)}</span></div>`).join("") + `</div>`;
  el("repAll").innerHTML = `<div class="card">` + all.map(r => `
    <div class="report-row clickable" onclick="openModal('reportDetail','${r}')"><div class="more-icon">${ICON(icons[r] || "chart",18)}</div><div class="col flex-1"><p class="list-title">${r}</p></div><span class="list-chev">${ICON("chevronRight",18)}</span></div>`).join("") + `</div>`;
}

/* ---------- More ---------- */
function renderMore() {
  el("moreName").textContent = CURRENT_USER.name;
  el("moreRole").textContent = `${CURRENT_USER.id} · ${CURRENT_USER.role}`;
  const sections = state.role === "hr" ? [
    { t: "People & Talent", items: [["Recruitment","user","recruitment"],["Onboarding","graduation","onboarding"],["Hourly Workforce","clock","hourly"],["Employees","people","people"]] },
    { t: "Workforce", items: [["Attendance","attendance","attendance-admin"],["Overtime","zap","overtime"],["Wage Management","wallet","wages"],["Shifts & Schedule","calendar","shift"],["Daily Work","briefcase","assignments"]] },
    { t: "Employee Experience", items: [["Leave","calendar","leave"],["Performance","star","performance"],["Policies","book","policies"]] },
    { t: "Organization", items: [["Departments","building","departments"],["Holiday Calendar","calendar","holidays"],["Events","megaphone","events"]] },
    { t: "Insights", items: [["Reports","chart","reports"],["Notifications","bell","notifications"]] },
  ] : [
    { t: "Work", items: [["Attendance","attendance","attendance"],["Leave","calendar","leave"],["My Schedule","calendar","shift"],["Working Hours","clock","hours"]] },
    { t: "Me", items: [["My Wages","wallet","wage"],["My Documents","folder","docs"],["Performance","star","performance"],["Notifications","bell","notifications"]] },
    { t: "Company", items: [["HR Policies","book","policies"],["Holiday Calendar","calendar","holidays"],["Company Events","megaphone","events"],["Birthdays & Anniversaries","cake","celebrations"]] },
    { t: "Account", items: [["Profile","user","profile"],["Settings","settings","settings"]] },
  ];
  el("moreSections").innerHTML = sections.map(sec => `
    <div class="more-group"><div class="more-group-title">${sec.t}</div><div class="more-card">
    ${sec.items.map(([name, icon, nav], i) => `<div class="more-item" onclick="go('${nav}')">
      <div class="more-icon ${i % 3 === 1 ? "alt" : i % 3 === 2 ? "success" : ""}">${ICON(icon, 18)}</div>
      <div class="more-main"><p class="more-name">${name}</p></div><span class="list-chev">${ICON("chevronRight", 18)}</span>
    </div>`).join("")}
    </div></div>`).join("");
}

/* ---------- Recruitment ---------- */
function renderRecruitment() {
  const stages = ["Applied", "Screening", "Interview", "Selected", "Offer", "Joined", "Rejected"];
  const counts = [1, 1, 2, 1, 1, 0, 1];
  const max = 2;
  el("funnel").innerHTML = stages.map((s, i) => `
    <div class="funnel-item">
      <span class="t-caption text-secondary" style="width:72px">${s}</span>
      <div class="funnel-bar ${counts[i] === 0 ? "zero" : ""}" style="width:${(counts[i] / max) * 100}%">${counts[i]} ${counts[i] === 1 ? "candidate" : "candidates"}</div>
    </div>`).join("");
  el("openPositions").innerHTML = `<div class="card">
    <div class="list-item clickable"><div class="col flex-1"><p class="list-title">Gardening Staff</p><p class="list-sub">Production · 3 positions · Full time</p></div><span class="badge badge-error">Urgent</span></div>
    <div class="list-item clickable"><div class="col flex-1"><p class="list-title">Packing Supervisor</p><p class="list-sub">Packing · 1 position</p></div><span class="badge badge-warning">Active</span></div>
    <div class="list-item clickable"><div class="col flex-1"><p class="list-title">HR Executive</p><p class="list-sub">HR · 1 position</p></div><span class="badge badge-success">Offer out</span></div>
    <div class="list-item clickable"><div class="col flex-1"><p class="list-title">Driver</p><p class="list-sub">Logistics · 1 position</p></div><span class="badge badge-info">Screening</span></div>
  </div>`;
  el("upInterviews").innerHTML = `<div class="card">
    <div class="list-item clickable" onclick="go('cand-profile')"><div class="avatar" style="background:${AVATAR_COLORS[1]}">AS</div><div class="col flex-1"><p class="list-title">Aarthi S · Packing Supervisor</p><p class="list-sub">Today · 11:30 AM · In person</p></div><span class="badge badge-primary">Today</span></div>
    <div class="list-item clickable"><div class="avatar" style="background:${AVATAR_COLORS[5]}">SM</div><div class="col flex-1"><p class="list-title">Selvi M · Packing Staff</p><p class="list-sub">17 Aug · 10:00 AM · In person</p></div></div>
    <div class="list-item clickable"><div class="avatar" style="background:${AVATAR_COLORS[0]}">NR</div><div class="col flex-1"><p class="list-title">Naveen R · Gardening Staff</p><p class="list-sub">18 Aug · 09:30 AM · Phone</p></div></div>
  </div>`;
}

/* ---------- Candidates ---------- */
function renderCandidates() {
  el("candStages").innerHTML = `<span class="chip active" onclick="candStage(this,'all')">All</span>` + Object.keys(STAGE_COLORS).map(s => `<span class="chip" onclick="candStage(this,'${s}')">${s}</span>`).join("");
  renderCandList("all");
}
function candStage(c, s) { document.querySelectorAll("#candStages .chip").forEach(x => x.classList.remove("active")); c.classList.add("active"); renderCandList(s); }
function renderCandList(stage) {
  let list = CANDIDATES;
  if (stage !== "all") list = list.filter(c => c.stage === stage);
  el("candList").innerHTML = list.map(c => `
    <div class="card card-pad card-press" style="margin-bottom:10px" onclick="openCandidate('${c.id}')">
      <div class="row gap-3"><div class="avatar" style="background:${AVATAR_COLORS[c.avatar]}">${INITIALS(c.name)}</div>
      <div class="col flex-1"><p class="list-title">${c.name}</p><p class="list-sub">${c.pos} · ${c.exp}</p></div>
      <span class="badge badge-${STAGE_COLORS[c.stage]}">${c.stage}</span></div>
      <div class="row between" style="margin-top:8px"><p class="t-caption text-tertiary">Applied ${c.applied}</p><p class="t-caption">${c.score ? `<span class="stars">${starsHTML(c.score)}</span>` : "Not rated"}</p></div>
    </div>`).join("") || `<div class="state-view"><div class="state-icon">${ICON("user",28)}</div><p class="state-title">No candidates here</p><p class="state-sub">No candidates match this stage.</p></div>`;
}
function starsHTML(v) {
  let s = "";
  for (let i = 1; i <= 5; i++) s += `<span class="star" style="color:${i <= Math.round(v) ? "var(--warning)" : "var(--border-strong)"}">${ICON("star", 13)}</span>`;
  return s;
}
function openCandidate(id) { state.candId = id; go("cand-profile"); }

/* ---------- Candidate profile ---------- */
function renderCandProfile() {
  const c = CANDIDATES.find(x => x.id === state.candId);
  const body = el("candProfileBody");
  body.innerHTML = `
    <div class="profile-hero"><div class="avatar avatar-xl" style="background:${AVATAR_COLORS[c.avatar]}">${INITIALS(c.name)}</div>
      <h2 class="t-h2" style="margin-top:10px">${c.name}</h2><p class="t-body-sm text-secondary">${c.id} · ${c.pos}</p>
      <div class="row gap-2" style="margin-top:10px"><span class="badge badge-${STAGE_COLORS[c.stage]}">${c.stage}</span><span class="badge badge-neutral">${c.exp}</span></div></div>
    <div class="tabs tab-scroll" style="margin-top:16px;background:transparent;padding:0">
      <div class="tab active" onclick="candTab(this,'overview')">Overview</div>
      <div class="tab" onclick="candTab(this,'resume')">Resume</div>
      <div class="tab" onclick="candTab(this,'interviews')">Interviews</div>
      <div class="tab" onclick="candTab(this,'notes')">Notes</div>
    </div>
    <div id="candContent" style="margin-top:14px"></div>`;
  candTab(null, "overview", c);
}
function candTab(tab, key) {
  document.querySelectorAll("#candProfileBody .tab").forEach(t => t.classList.remove("active"));
  if (tab) tab.classList.add("active");
  const c = CANDIDATES.find(x => x.id === state.candId);
  const body = el("candContent");
  if (key === "overview") body.innerHTML = `
    <div class="card card-pad"><p class="section-title">Details</p>
      <div class="kv"><span class="kv-key">Phone</span><span class="kv-val">${c.phone}</span></div>
      <div class="kv"><span class="kv-key">Email</span><span class="kv-val">${c.name.toLowerCase().replace(/ /g,".")}@gmail.com</span></div>
      <div class="kv"><span class="kv-key">Position</span><span class="kv-val">${c.pos}</span></div>
      <div class="kv"><span class="kv-key">Experience</span><span class="kv-val">${c.exp}</span></div>
      <div class="kv"><span class="kv-key">Expected salary</span><span class="kv-val">₹${c.expected.toLocaleString('en-IN')}/mo</span></div>
      <div class="kv"><span class="kv-key">Employment type</span><span class="kv-val">Full time</span></div>
      <div class="kv"><span class="kv-key">Applied</span><span class="kv-val">${c.applied}</span></div>
    </div>
    <div class="card card-pad" style="margin-top:12px"><p class="section-title">Interview score</p>
      <div class="row between" style="margin-top:6px"><p class="t-h2">${c.score || "—"}</p><span class="stars">${c.score ? starsHTML(c.score) : "Not rated"}</span></div></div>`;
  else if (key === "resume") body.innerHTML = `
    <div class="card card-pad"><div class="row gap-3"><div style="width:44px;height:44px;border-radius:12px;background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center">${ICON("file",20)}</div>
      <div class="col flex-1"><p class="list-title">${c.name}_Resume.pdf</p><p class="list-sub">2.1 MB · uploaded ${c.applied}</p></div>
      <button class="btn btn-outline btn-sm" onclick="toast('Resume downloaded')">${ICON("download",14)} Download</button></div></div>
    <div class="card card-pad" style="margin-top:12px"><p class="section-title">Summary</p>
      <p class="t-body-sm text-secondary" style="margin-top:8px">${c.exp} experience in ${c.pos} role with a local flower business. Familiar with daily operations, quality checks and packing workflows. References available on request.</p></div>`;
  else if (key === "interviews") body.innerHTML = `
    <div class="card">
      <div class="list-item"><div class="col flex-1"><p class="list-title">Phone screen</p><p class="list-sub">13 Aug · 10:00 · Priya Devi</p></div><span class="badge badge-success">Completed</span></div>
      <div class="list-item"><div class="col flex-1"><p class="list-title">Technical interview</p><p class="list-sub">17 Aug · 11:30 · scheduled</p></div><span class="badge badge-warning">Upcoming</span></div>
    </div>`;
  else if (key === "notes") body.innerHTML = `
    <div class="card card-pad"><p class="section-title">Notes</p>
      <p class="t-body-sm text-secondary" style="margin-top:8px"><b>Priya Devi:</b> Good communicator, eager to learn. Verify references.</p>
      <p class="t-body-sm text-secondary" style="margin-top:6px"><b>System:</b> Applied 12 Aug · auto-checked availability.</p></div>`;
}

/* ---------- Interview / eval / offer candidates ---------- */
function renderIvCandidate() {
  const c = CANDIDATES.find(x => x.id === state.candId);
  el("ivCandidate").innerHTML = `<div class="row gap-3"><div class="avatar" style="background:${AVATAR_COLORS[c.avatar]}">${INITIALS(c.name)}</div><div class="col flex-1"><p class="list-title">${c.name}</p><p class="list-sub">${c.pos} · ${c.phone}</p></div></div>`;
  el("ivInterviewer").innerHTML = ["Priya Devi (HR Manager)", "R. Vasanth (Production)", "Arun Kumar (Admin)"].map((x, i) => `<option ${i === 0 ? "selected" : ""}>${x}</option>`).join("");
}
function renderEvCandidate() {
  const c = CANDIDATES.find(x => x.id === state.candId);
  el("evCandidate").innerHTML = `<div class="row gap-3"><div class="avatar" style="background:${AVATAR_COLORS[c.avatar]}">${INITIALS(c.name)}</div><div class="col flex-1"><p class="list-title">${c.name}</p><p class="list-sub">${c.pos} · Interview 17 Aug</p></div></div>`;
  const cats = ["Communication", "Technical skills", "Experience", "Attitude", "Overall"];
  el("evRatings").innerHTML = cats.map((cat, i) => `
    <div class="field" style="margin-bottom:14px"><label class="field-label">${cat}</label>
      <div class="row gap-1" id="rating${i}">${[1,2,3,4,5].map(v => `<span class="star rate-star ${v <= 4 ? "on" : ""}" data-cat="${i}" data-v="${v}" onclick="rate(this)">${ICON("star", 26)}</span>`).join("")}</div>
    </div>`).join("");
}
function rate(star) {
  const cat = star.dataset.cat, v = +star.dataset.v;
  star.parentElement.querySelectorAll(".rate-star").forEach((s, i) => s.classList.toggle("on", i < v));
}
function renderOfferCandidate() {
  const c = CANDIDATES.find(x => x.id === state.candId);
  el("offCandidate").innerHTML = `<div class="row gap-3"><div class="avatar" style="background:${AVATAR_COLORS[c.avatar]}">${INITIALS(c.name)}</div><div class="col flex-1"><p class="list-title">${c.name}</p><p class="list-sub">${c.pos} · expected ₹${c.expected.toLocaleString('en-IN')}/mo</p></div></div>`;
  el("offTimeline").innerHTML = `
    <div class="timeline-item done"><p class="t-body-sm" style="font-weight:600">Offer generated</p><p class="t-caption text-tertiary">Draft ready for review</p></div>
    <div class="timeline-item current"><p class="t-body-sm" style="font-weight:600">Pending approval</p><p class="t-caption text-tertiary">Awaiting HR Manager</p></div>
    <div class="timeline-item"><p class="t-body-sm" style="font-weight:600">Sent to candidate</p><p class="t-caption text-tertiary">—</p></div>
    <div class="timeline-item"><p class="t-body-sm" style="font-weight:600">Offer accepted</p><p class="t-caption text-tertiary">—</p></div>`;
}

/* ---------- Onboarding ---------- */
function renderOnboarding() {
  const steps = ["Personal Information", "Employment", "Documents", "Reporting", "Benefits", "Emergency Contact", "Review", "Complete"];
  const done = ["Personal Information", "Employment", "Documents"];
  el("onbSteps").innerHTML = steps.map((s, i) => {
    const d = done.includes(s), cur = s === "Documents";
    return `<div class="onb-step-row">
      <div class="onb-step-num ${d ? "done" : cur ? "current" : ""}">${d ? ICON("check", 14) : i + 1}</div>
      <div class="col flex-1"><p class="list-title" style="font-size:13.5px">${s}</p><p class="list-sub">${cur ? "3 documents uploaded · 1 pending" : d ? "Completed" : "Not started"}</p></div>
      ${cur ? `<span class="badge badge-warning">In progress</span>` : d ? `<span class="badge badge-success">Done</span>` : `<span class="list-chev">${ICON("chevronRight",16)}</span>`}
    </div>`;
  }).join("");
  const docs = [
    { n: "Aadhaar Card", s: "Verified", c: "success" },
    { n: "PAN Card", s: "Verified", c: "success" },
    { n: "Bank Account Proof", s: "Pending", c: "warning" },
    { n: "Degree Certificate", s: "Pending", c: "warning" },
  ];
  el("onbDocs").innerHTML = docs.map(d => `
    <div class="doc-card"><div class="doc-icon id">${ICON("file",20)}</div><div class="col flex-1"><p class="list-title">${d.n}</p><p class="list-sub">Uploaded 12 Aug</p></div><span class="badge badge-${d.c}">${d.s}</span></div>`).join("");
}

/* ---------- More nav routing for unbuilt screens ---------- */
function renderDepartments() { el("departmentsPlaceholder"); }
function renderCelebrations() {
  // used via a dedicated screen; we route to it through more
}

/* ============================================================
   ROUTER
   ============================================================ */
const ROUTES = {
  "splash": { init: () => { /* handled by timer */ } },
  "login": { init: () => { el("otpTo").textContent = "+91 98450 88907"; } },
  "otp": {},
  "forgot": {},
  "firstlogin": { init: initFirstLogin },
  "home": { init: () => { renderPending(); renderGlance(); renderUpcoming(); renderHeroState(); } },
  "attendance": { init: () => { renderGPS(); renderAttControl(); el("attSummary").classList.add("hidden"); } },
  "att-history": { init: renderAttHistory },
  "requests": { init: renderRequests },
  "leave": { init: renderLeave },
  "apply-leave": { init: initLeaveForm },
  "shift": { init: renderShift },
  "hours": { init: renderHours },
  "wage": { init: () => { renderWageHistory(); } },
  "wage-detail": { init: renderWageTimeline },
  "docs": { init: renderDocs },
  "policies": { init: renderPolicies },
  "policy-detail": { init: renderPolicyDetail },
  "holidays": { init: renderHolidays },
  "notifications": { init: renderNotifications },
  "profile": { init: renderProfile },
  "settings": {},
  "hr-home": { init: renderHR },
  "people": { init: renderPeople },
  "emp-profile": { init: renderEmpProfile },
  "add-employee": { init: initAddEmployee },
  "recruitment": { init: renderRecruitment },
  "candidates": { init: renderCandidates },
  "cand-profile": { init: renderCandProfile },
  "interview": { init: renderIvCandidate },
  "evaluation": { init: renderEvCandidate },
  "offer": { init: renderOfferCandidate },
  "onboarding": { init: renderOnboarding },
  "hourly": { init: renderHourly },
  "hourly-emp": { init: renderHourlyEmp },
  "attendance-admin": { init: renderAttendanceAdmin },
  "overtime": { init: renderOvertime },
  "overtime-detail": { init: () => {} },
  "wages": { init: renderWages },
  "assignments": { init: renderAssignments },
  "reports": { init: renderReports },
  "report-detail": { init: () => {} },
  "more": { init: renderMore },
  // HR-only extras
  "departments": { init: () => { toast("Department list (open in web dashboard)"); } },
  "events": { init: () => { toast("Events (open in web dashboard)"); } },
  "celebrations": { init: renderCelebrations },
  "performance": { init: () => { toast("Performance (open in web dashboard)"); } },
  "onboarding": { init: renderOnboarding },
};

function dispatch(id) {
  const route = ROUTES[id];
  if (route && route.init) route.init();
  else if (ROUTES[id]) { /* noop */ }
  else { /* unknown */ }
}

function showScreen(id, { push = true } = {}) {
  if (push && state.screen !== id) state.from = state.screen;
  state.screen = id;
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const scr = document.getElementById("scr-" + id);
  if (scr) { scr.classList.add("active"); scr.scrollTop = 0; }
  updateNav();
  closeSheets();
  dispatch(id);
}

/* ---------- First login onboarding ---------- */
function initFirstLogin() {
  onbStep = 0;
  renderOnb();
}
const ONB = [
  { t: "Welcome to Orchid HRM", s: "Let's set up your account so you can get to work quickly.", c: ["building"], body: `<div style="text-align:center;padding:10px 0"><div class="avatar avatar-xl" style="background:var(--primary-light);width:84px;height:84px;font-size:30px">DL</div><h2 style="margin-top:14px">Welcome, Divya!</h2><p class="t-body text-secondary" style="margin-top:6px">You've been added as <b>Gardening Staff</b> in <b>Production</b>.</p></div>` },
  { t: "Confirm your profile", s: "Please confirm these details are correct.", body: `<div class="card card-pad"><div class="kv"><span class="kv-key">Name</span><span class="kv-val">Divya Lakshmi</span></div><div class="kv"><span class="kv-key">Employee ID</span><span class="kv-val">OH-1008</span></div><div class="kv"><span class="kv-key">Department</span><span class="kv-val">Production</span></div><div class="kv"><span class="kv-key">Shift</span><span class="kv-val">Morning · 06:00</span></div><div class="kv"><span class="kv-key">Mobile</span><span class="kv-val">+91 98450 88907</span></div></div><div class="field" style="margin-top:14px"><label class="field-label">Email (optional)</label><input class="input" placeholder="divya.l@orchidflowers.in" /></div>` },
  { t: "Set your password", s: "Create a password you'll use to sign in.", body: `<div class="field"><label class="field-label">Password</label><input class="input" type="password" placeholder="At least 8 characters" /></div><div class="field" style="margin-top:14px"><label class="field-label">Confirm password</label><input class="input" type="password" placeholder="Re-enter password" /></div><p class="t-caption text-tertiary" style="margin-top:10px">Use a mix of letters and numbers.</p>` },
  { t: "Add a profile photo", s: "Upload a clear photo of yourself for your team.", body: `<div style="text-align:center"><div class="avatar avatar-xl" style="width:96px;height:96px;font-size:32px;margin:0 auto 14px">DL</div><div class="upload-zone" onclick="simulateUpload(this)"><div class="upload-icon">${ICON("camera", 28)}</div><p class="t-body-sm">Tap to take or upload a photo</p></div></div>` },
  { t: "Emergency contact", s: "Who should we contact in an emergency?", body: `<div class="field"><label class="field-label">Contact name</label><input class="input" value="Murugan (Husband)" /></div><div class="field" style="margin-top:14px"><label class="field-label">Relationship</label><select class="select"><option>Spouse</option><option>Parent</option><option>Child</option><option>Friend</option></select></div><div class="field" style="margin-top:14px"><label class="field-label">Mobile number</label><input class="input" value="+91 98451 99887" /></div>` },
  { t: "Allow notifications", s: "Get updates on approvals, leave and important announcements.", body: `<div class="permission-card"><div class="permission-icon">${ICON("bell", 20)}</div><div class="col flex-1"><p class="list-title">Notifications</p><p class="list-sub">Leave, wage &amp; attendance alerts</p></div><button class="btn btn-primary btn-sm" onclick="this.textContent='Allowed';this.disabled=true">Allow</button></div><div class="permission-card"><div class="permission-icon">${ICON("camera", 20)}</div><div class="col flex-1"><p class="list-title">Camera &amp; documents</p><p class="list-sub">For document uploads</p></div><button class="btn btn-outline btn-sm" onclick="this.textContent='Allowed';this.classList.add('btn-primary');this.classList.remove('btn-outline');this.disabled=true">Allow</button></div>` },
  { t: "Location permission", s: "We use your location to verify attendance at the work area.", body: `<div class="permission-card"><div class="permission-icon">${ICON("mapPin", 20)}</div><div class="col flex-1"><p class="list-title">Location access</p><p class="list-sub">Only used while you are on shift</p></div><button class="btn btn-primary btn-sm" onclick="this.textContent='Allowed';this.disabled=true">Allow</button></div><p class="t-caption text-tertiary" style="margin-top:10px">You can change this anytime in Settings.</p>` },
  { t: "You're all set!", s: "Your Orchid HRM account is ready. Let's get started.", body: `<div style="text-align:center;padding:20px 0"><div style="width:88px;height:88px;border-radius:50%;background:var(--success-bg);color:var(--success-dark);display:flex;align-items:center;justify-content:center;margin:0 auto">${ICON("checkCircle", 40)}</div><h2 style="margin-top:16px">Welcome to the team!</h2><p class="t-body text-secondary" style="margin-top:6px">You can now check in, apply for leave and view your wages.</p></div>` },
];
function renderOnb() {
  const s = ONB[onbStep];
  el("onbTrack").innerHTML = ONB.map((_, i) => `<div class="onb-step ${i <= onbStep ? "done" : ""}"></div>`).join("");
  el("onbBody").innerHTML = `<h2 class="t-h1">${s.t}</h2><p class="t-body text-secondary" style="margin-top:8px">${s.s}</p><div style="margin-top:20px">${s.body}</div>`;
  const isLast = onbStep === ONB.length - 1;
  el("onbActions").innerHTML = `<button class="btn btn-outline" onclick="${onbStep === 0 ? "go('login')" : "onbStep--;renderOnb()"}">${onbStep === 0 ? "Skip" : "Back"}</button>
    <button class="btn btn-primary" onclick="${isLast ? "finishOnboarding()" : "onbStep++;renderOnb()"}">${isLast ? "Finish" : "Continue"}</button>`;
}
function finishOnboarding() { toast("Account created · welcome to Orchid HRM"); showScreen("home"); }

/* ---------- Leave form ---------- */
function initLeaveForm() {
  el("leaveType").innerHTML = LEAVE_TYPES.map(l => `<option>${l.name}</option>`).join("");
  bindSeg("durSeg", s => {
    leaveDur = s.dataset.dur;
    el("alToField").classList.toggle("hidden", leaveDur === "single");
    el("alDays").textContent = leaveDur === "single" ? "1 day" : "2 days";
  });
  el("leaveForm").onsubmit = (e) => { e.preventDefault(); openModal("leaveConfirm"); };
}
function confirmLeave() { openModal("leaveSuccess"); }
function closeLeaveDone() { closeSheets(); toast("Leave request submitted"); go("requests"); }

/* ---------- Add employee ---------- */
function initAddEmployee() {
  el("aeDept").innerHTML = DEPARTMENTS.map((d, i) => `<option ${i === 0 ? "selected" : ""}>${d.name}</option>`).join("");
  el("aeShift").innerHTML = SHIFTS.map((s, i) => `<option ${i === 0 ? "selected" : ""}>${s.name} (${s.short})</option>`).join("");
  el("aeManager").innerHTML = ["Arun Kumar", "Priya Devi", "R. Vasanth", "Kavitha R", "Meena S"].map((m, i) => `<option ${i === 0 ? "selected" : ""}>${m}</option>`).join("");
  el("aeDesignation").innerHTML = ["Gardening Staff", "Packing Staff", "Driver", "Sales Associate", "HR Executive", "Supervisor"].map(d => `<option>${d}</option>`).join("");
  bindSeg("aeTypeSeg", s => { el("aeRateField").classList.toggle("hidden", s.dataset.type !== "Hourly Wage"); });
}

/* ---------- Tabs & segments binding ---------- */
function bindTabs(id, fn) {
  document.querySelectorAll("#" + id + " .tab").forEach(t => t.onclick = () => {
    document.querySelectorAll("#" + id + " .tab").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    fn(t);
  });
}
function bindSeg(id, fn) {
  document.querySelectorAll("#" + id + " .seg").forEach(s => s.onclick = () => {
    document.querySelectorAll("#" + id + " .seg").forEach(x => x.classList.remove("active"));
    s.classList.add("active");
    fn(s);
  });
}

/* ---------- Demo tool ---------- */
function toggleDemo() { el("demoPanel").classList.toggle("hidden"); }
function resetDemo() {
  state.role = "employee"; state.loc = "inside"; state.net = "online"; state.checkedIn = false; state.onBreak = false;
  setDemoUI();
  go("home");
}
function setDemoUI() {
  document.querySelectorAll("#demoRole .seg").forEach(s => s.classList.toggle("active", s.dataset.role === state.role));
  document.querySelectorAll("#demoLoc .seg").forEach(s => s.classList.toggle("active", s.dataset.loc === state.loc));
  document.querySelectorAll("#demoNet .seg").forEach(s => s.classList.toggle("active", s.dataset.net === state.net));
  bindSeg("demoRole", s => { state.role = s.dataset.role; setDemoUI(); go("home"); });
  bindSeg("demoLoc", s => { state.loc = s.dataset.loc; setDemoUI(); renderGPS(); renderHeroState(); if (state.screen === "attendance") renderAttControl(); });
  bindSeg("demoNet", s => { state.net = s.dataset.net; setDemoUI(); el("offlineBanner").classList.toggle("hidden", state.net === "online"); if (state.net === "offline") toast("Offline mode", "error"); });
  bindSeg("demoAuth", s => { if (s.dataset.auth === "first") go("firstlogin"); else { state.checkedIn = false; go("login"); } });
}

/* ---------- OTP behavior ---------- */
function initOTP() {
  let t = 30;
  el("otpTimer").textContent = "00:30";
  const inputs = document.querySelectorAll("#otpRow .otp-in");
  inputs.forEach((inp, i) => {
    inp.value = "";
    inp.addEventListener("input", () => {
      inp.value = inp.value.replace(/\D/g, "");
      if (inp.value && i < inputs.length - 1) inputs[i + 1].focus();
    });
    inp.addEventListener("keydown", e => { if (e.key === "Backspace" && !inp.value && i > 0) inputs[i - 1].focus(); });
  });
  clearInterval(otpTimer);
  otpTimer = setInterval(() => {
    t--; el("otpTimer").textContent = `00:${String(t).padStart(2, "0")}`;
    if (t <= 0) clearInterval(otpTimer);
  }, 1000);
  setTimeout(() => inputs[0].focus(), 300);
}

/* ---------- Login ---------- */
function initLogin() {
  el("loginForm").onsubmit = (e) => {
    e.preventDefault();
    const user = el("loginUser").value.trim();
    if (state.net === "offline") { toast("No connection. Check your network.", "error"); return; }
    if (user) go("otp");
  };
  el("togglePass").onclick = () => { const p = el("loginPass"); p.type = p.type === "password" ? "text" : "password"; el("togglePass").innerHTML = ICON(p.type === "password" ? "eye" : "eyeOff", 18); };
  el("bioBtn").onclick = () => { toast("Biometric verified · signing in"); setTimeout(() => showScreen(state.role === "hr" ? "hr-home" : "home"), 700); };
  el("otpVerify").onclick = () => {
    const filled = [...document.querySelectorAll("#otpRow .otp-in")].every(i => i.value);
    if (!filled) { toast("Enter the 6-digit OTP", "error"); return; }
    toast("Verified · signing you in");
    setTimeout(() => showScreen(state.role === "hr" ? "hr-home" : "home"), 800);
  };
}

/* ---------- Policy read ---------- */
function confirmPolicyRead() { openModal("policyRead"); }

/* ---------- Launch ---------- */
function launch() {
  injectIcons();
  updateNav();
  initLogin();
  initOTP();
  renderProfile();
  setDemoUI();
  renderMore();
  // splash -> login
  setTimeout(() => showScreen("login"), 1700);
  tickClock();
}
document.addEventListener("DOMContentLoaded", launch);

/* Expose a few for inline handlers */
window.chipActive = chipActive;
window.go = go;
window.back = back;
window.openAttendance = openAttendance;
window.simulateUpload = simulateUpload;
window.openSheet = openSheet;
window.openModal = openModal;
window.closeSheets = closeSheets;
window.toast = toast;
window.openEmpProfile = openEmpProfile;
window.openHourlyEmp = openHourlyEmp;
window.openCandidate = openCandidate;
window.openPolicy = openPolicy;
window.openDoc = openDoc;
window.confirmPolicyRead = confirmPolicyRead;
window.epTab = epTab;
window.candTab = candTab;
window.rate = rate;
window.confirmLeave = confirmLeave;
window.closeLeaveDone = closeLeaveDone;
window.finishOnboarding = finishOnboarding;
window.toggleDemo = toggleDemo;
window.resetDemo = resetDemo;
window.pplFilter = pplFilter;
window.aaFilter = aaFilter;
window.candStage = candStage;
window.doCheckIn = doCheckIn;
window.startBreak = startBreak;
window.endBreak = endBreak;
window.checkOut = checkOut;
window.attMap = attMap;
