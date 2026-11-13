(() => {
  const text = (selector, value) => {
    const node = document.querySelector(selector);
    if (node && value !== null && value !== undefined && value !== "") node.textContent = String(value);
  };
  const empty = (node, message) => {
    if (!node) return;
    node.replaceChildren();
    const item = document.createElement("p");
    item.className = "text-body-md font-body-md text-on-surface-variant text-center py-8";
    item.textContent = message;
    node.append(item);
  };
  const fmtDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
  };
  const safe = (value) => value == null || value === "" ? "—" : String(value);
  const scheduleTime = (minute) => {
    const value = Number(minute);
    if (!Number.isFinite(value)) return "—";
    const normalized = ((value % 1440) + 1440) % 1440;
    return String(Math.floor(normalized / 60)).padStart(2, "0") + ":" + String(normalized % 60).padStart(2, "0");
  };
  const scheduleDateLabel = (value, options = { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) => {
    const date = new Date(value + "T00:00:00Z");
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-IN", { ...options, timeZone: "UTC" }).format(date);
  };
  function renderHomeUpcoming(workspace = window.__orchidWorkspace) {
    const root = document.getElementById("upcomingList");
    if (!root) return;
    root.replaceChildren();
    const timeZone = workspace?.timeZone || "Asia/Kolkata";
    const dateKey = (date) => new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
    const addDays = (value, days) => {
      const date = new Date(value + "T00:00:00Z");
      date.setUTCDate(date.getUTCDate() + days);
      return date.toISOString().slice(0, 10);
    };
    const today = dateKey(new Date());
    const rangeEnd = addDays(today, 29);
    const dateLabel = (value) => value === today ? "Today" :
      value === addDays(today, 1) ? "Tomorrow" :
      new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(new Date(value + "T00:00:00Z"));
    const items = (Array.isArray(workspace?.upcoming) ? workspace.upcoming : [])
      .filter(item => /^\d{4}-\d{2}-\d{2}$/.test(item.date || "") &&
        item.date >= today && item.date <= rangeEnd)
      .sort((a, b) => a.date.localeCompare(b.date) || String(a.title).localeCompare(String(b.title)));
    if (!items.length) {
      empty(root, "No holidays, birthdays or scheduled events in the next 30 days.");
      return;
    }
    items.forEach((item, index) => {
      if (index) {
        const divider = document.createElement("div");
        divider.className = "h-px bg-outline-variant/30 mx-4";
        root.append(divider);
      }
      const row = document.createElement("div");
      row.className = "flex items-center justify-between gap-3 px-4 py-3";
      const copy = document.createElement("div");
      copy.className = "flex flex-col flex-1 min-w-0";
      const title = document.createElement("p");
      title.className = "text-body-md font-body-md font-medium text-on-surface";
      title.textContent = item.title || "Upcoming event";
      const subtitle = document.createElement("p");
      subtitle.className = "text-label-sm font-label-sm text-on-surface-variant mt-0.5";
      subtitle.textContent = item.subtitle || "Upcoming event";
      copy.append(title, subtitle);
      const date = document.createElement("span");
      date.className = "flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide " +
        (item.type === "birthday" ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-surface-container-highest text-on-surface-variant");
      date.textContent = dateLabel(item.date);
      row.append(copy, date);
      root.append(row);
    });
  }

  function renderMySchedule() {
    const workspace = window.__orchidWorkspace;
    const schedule = workspace?.schedule;
    const monthTitle = document.getElementById("scheduleMonthTitle");
    const calendar = document.getElementById("scheduleCalendarGrid");
    const selectedTitle = document.getElementById("scheduleSelectedDate");
    const dayDetails = document.getElementById("scheduleDayDetails");
    const upcomingList = document.getElementById("scheduleUpcomingList");
    const upcomingCount = document.getElementById("scheduleUpcomingCount");
    if (!calendar || !dayDetails || !upcomingList) return;
    calendar.replaceChildren();
    dayDetails.replaceChildren();
    upcomingList.replaceChildren();
    if (!schedule?.month || !Array.isArray(schedule.days) || !schedule.days.length) {
      if (monthTitle) monthTitle.textContent = "Schedule unavailable";
      empty(calendar, "No schedule data is available.");
      empty(dayDetails, "Your schedule could not be loaded.");
      empty(upcomingList, "No upcoming shifts available.");
      if (upcomingCount) upcomingCount.textContent = "";
      return;
    }
    const [year, month] = schedule.month.split("-").map(Number);
    const firstDay = new Date(Date.UTC(year, month - 1, 1));
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    if (monthTitle) monthTitle.textContent = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(firstDay);
    const byDate = new Map(schedule.days.map(day => [day.date, day]));
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
    let selectedDate = byDate.has(today) ? today : schedule.days[0].date;
    const renderDetails = (dateKey) => {
      const day = byDate.get(dateKey);
      if (!day) return;
      if (selectedTitle) selectedTitle.textContent = scheduleDateLabel(dateKey);
      dayDetails.replaceChildren();
      (day.holidays || []).forEach(name => {
        const holiday = document.createElement("p");
        holiday.className = "text-body-sm font-medium text-[#B26A00] mb-2";
        holiday.textContent = "Holiday · " + name;
        dayDetails.append(holiday);
      });
      if (day.shifts?.length) {
        day.shifts.forEach(shift => {
          const card = document.createElement("div");
          card.className = "rounded-lg bg-surface-container-low p-3 mb-2";
          const name = document.createElement("p");
          name.className = "text-body-md font-semibold text-on-surface";
          name.textContent = shift.name;
          const timing = document.createElement("p");
          timing.className = "text-label-sm text-on-surface-variant mt-1";
          const overnight = Number(shift.endMinute) <= Number(shift.startMinute) ? " (+1 day)" : "";
          timing.textContent = scheduleTime(shift.startMinute) + " – " + scheduleTime(shift.endMinute) + overnight;
          const breakTime = document.createElement("p");
          breakTime.className = "text-label-sm text-on-surface-variant mt-1";
          breakTime.textContent = "Break · " + (Number(shift.breakMinutes) || 0) + " minutes";
          card.append(name, timing, breakTime);
          dayDetails.append(card);
        });
      } else if (day.weeklyOff) {
        const off = document.createElement("p");
        off.className = "text-body-sm text-on-surface-variant";
        off.textContent = "Weekly off";
        dayDetails.append(off);
      } else if (!(day.holidays || []).length) {
        const none = document.createElement("p");
        none.className = "text-body-sm text-on-surface-variant";
        none.textContent = "No shift assigned for this date.";
        dayDetails.append(none);
      }
      calendar.querySelectorAll("[data-schedule-date]").forEach(button => {
        const active = button.dataset.scheduleDate === dateKey;
        button.classList.toggle("bg-primary", active);
        button.classList.toggle("text-white", active);
        button.classList.toggle("border-primary", active);
        button.classList.toggle("bg-surface-container-low", !active && Boolean(byDate.get(button.dataset.scheduleDate)?.shifts?.length));
        button.classList.toggle("text-on-surface", !active);
        button.setAttribute("aria-pressed", String(active));
      });
    };
    const leading = firstDay.getUTCDay();
    for (let index = 0; index < leading; index++) {
      const spacer = document.createElement("span");
      spacer.className = "min-h-10";
      calendar.append(spacer);
    }
    for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
      const dateKey = schedule.month + "-" + String(dayNumber).padStart(2, "0");
      const item = byDate.get(dateKey);
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.scheduleDate = dateKey;
      button.className = "min-h-10 rounded-lg border border-outline-variant/40 flex flex-col items-center justify-center gap-0.5 text-xs font-medium";
      button.setAttribute("aria-label", scheduleDateLabel(dateKey) + (item?.shifts?.length ? ", shift assigned" : item?.weeklyOff ? ", weekly off" : ""));
      const number = document.createElement("span");
      number.textContent = String(dayNumber);
      button.append(number);
      if (item?.shifts?.length || item?.weeklyOff || item?.holidays?.length) {
        const dot = document.createElement("span");
        dot.className = "w-1.5 h-1.5 rounded-full " + (item?.holidays?.length ? "bg-[#D97706]" : item?.shifts?.length ? "bg-primary" : "bg-outline");
        if (item?.holidays?.length) dot.style.backgroundColor = "#D97706";
        button.append(dot);
      }
      if (dateKey === today) button.classList.add("ring-1", "ring-primary");
      button.addEventListener("click", () => renderDetails(dateKey));
      calendar.append(button);
    }
    renderDetails(selectedDate);
    const upcoming = schedule.days.filter(day => day.date >= today && day.shifts?.length).flatMap(day => day.shifts.map(shift => ({ date: day.date, shift })));
    if (upcomingCount) upcomingCount.textContent = upcoming.length ? String(upcoming.length) : "";
    if (!upcoming.length) {
      empty(upcomingList, "No upcoming shifts scheduled this month.");
    } else {
      upcoming.slice(0, 12).forEach((item, index) => {
        if (index) {
          const divider = document.createElement("div");
          divider.className = "h-px bg-outline-variant/30 mx-4";
          upcomingList.append(divider);
        }
        const row = document.createElement("div");
        row.className = "flex items-center justify-between gap-3 px-4 py-3";
        const copy = document.createElement("div");
        copy.className = "flex flex-col min-w-0";
        const name = document.createElement("p");
        name.className = "text-body-md font-medium text-on-surface";
        name.textContent = item.shift.name;
        const date = document.createElement("p");
        date.className = "text-label-sm text-on-surface-variant mt-0.5";
        date.textContent = scheduleDateLabel(item.date, { weekday: "short", day: "2-digit", month: "short" });
        copy.append(name, date);
        const time = document.createElement("span");
        time.className = "text-label-sm font-semibold text-on-surface-variant flex-shrink-0";
        time.textContent = scheduleTime(item.shift.startMinute) + " – " + scheduleTime(item.shift.endMinute);
        row.append(copy, time);
        upcomingList.append(row);
      });
    }
  }

  function renderMyWork() {
    const root = document.getElementById("myWorkList");
    const historyRoot = document.getElementById("myWorkHistory");
    const counts = document.getElementById("myWorkSummary");
    if (!root || !historyRoot) return;
    root.replaceChildren();
    historyRoot.replaceChildren();
    const work = window.__orchidWork || {};
    const active = work.assignments || [];
    const history = work.history || [];
    if (counts) counts.textContent = active.length + " active · " + history.length + " in history";
    const renderTask = (task, target, isHistory) => {
      const card = document.createElement("article");
      card.className = "rounded-xl border border-outline-variant/50 bg-surface p-4 mb-3";
      const top = document.createElement("div");
      top.className = "flex items-start justify-between gap-3";
      const title = document.createElement("h3");
      title.className = "text-body-lg font-semibold text-on-surface";
      title.textContent = task.title;
      const status = document.createElement("span");
      status.className = "text-[10px] rounded-full px-2 py-1 bg-surface-container text-on-surface-variant whitespace-nowrap";
      status.textContent = String(task.status || "not_started").replaceAll("_", " ");
      top.append(title, status);
      const meta = document.createElement("p");
      meta.className = "text-label-sm text-on-surface-variant mt-2";
      meta.textContent = [task.category, task.priority, scheduleDateLabel(task.workDate, { day: "2-digit", month: "short", year: "numeric" })].filter(Boolean).join(" · ");
      card.append(top, meta);
      if (task.description) {
        const description = document.createElement("p");
        description.className = "text-body-sm text-on-surface-variant mt-3 whitespace-pre-wrap";
        description.textContent = task.description;
        card.append(description);
      }
      if (task.reviewNote) {
        const note = document.createElement("p");
        note.className = "text-body-sm text-amber-700 bg-amber-50 rounded-lg p-2 mt-3";
        note.textContent = "Supervisor note: " + task.reviewNote;
        card.append(note);
      }
      if (!isHistory && task.status === "not_started") {
        const start = document.createElement("button");
        start.type = "button"; start.className = "w-full mt-4 rounded-lg bg-primary text-white py-2.5 font-semibold";
        start.textContent = "Start Work";
        start.addEventListener("click", () => updateMyWork(task.progressId, "in_progress", start));
        card.append(start);
      } else if (!isHistory && task.status === "in_progress") {
        const submit = document.createElement("button");
        submit.type = "button"; submit.className = "w-full mt-4 rounded-lg bg-primary text-white py-2.5 font-semibold";
        submit.textContent = "Submit for Review";
        submit.addEventListener("click", () => updateMyWork(task.progressId, "submitted_for_review", submit));
        card.append(submit);
      } else if (task.status === "submitted_for_review") {
        const info = document.createElement("p");
        info.className = "text-label-sm text-primary mt-3";
        info.textContent = "Submitted. Waiting for supervisor review.";
        card.append(info);
      }
      target.append(card);
    };
    if (!active.length) empty(root, "No current or upcoming work has been assigned to you.");
    else active.forEach(task => renderTask(task, root, false));
    if (!history.length) empty(historyRoot, "No previous work assignments.");
    else history.forEach(task => renderTask(task, historyRoot, true));
  }
  async function updateMyWork(progressId, status, button) {
    if (!progressId || !button) return;
    const label = button.textContent;
    button.disabled = true; button.textContent = "Saving…";
    try {
      const response = await fetch("/api/employee/work", {
        method: "PATCH", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progressId, status })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update work.");
      await hydrate();
      renderMyWork();
      window.toast?.(status === "in_progress" ? "Work started." : "Work submitted for supervisor review.");
    } catch (error) {
      button.disabled = false; button.textContent = label;
      window.toast?.(error instanceof Error ? error.message : "Unable to update work.");
    }
  }
  window.renderMyWork = renderMyWork;

  window.renderMySchedule = renderMySchedule;


  // Register document upload immediately; it must not wait for workspace hydration.
  window.uploadEmployeeDocument=async()=>{
        const file=document.getElementById("employeeDocumentFile")?.files?.[0],category=document.getElementById("employeeDocumentCategory")?.value||"",type=document.getElementById("employeeDocumentType")?.value?.trim()||"",message=document.getElementById("employeeDocumentMessage"),button=document.getElementById("employeeDocumentUploadButton");
        const say=value=>{if(message)message.textContent=value;};if(!file||!type){say("Choose a file and enter its document name.");return;}
        if(!["application/pdf","image/jpeg","image/png"].includes(file.type)){say("Only PDF, JPG and PNG files are supported.");return;}
        if(file.size<=0||file.size>15*1024*1024){say("The file must be 15 MB or smaller.");return;}
        button.disabled=true;button.textContent="Uploading…";say("");
        try{
          const start=await fetch("/api/employee/documents/upload-url",{method:"POST",credentials:"same-origin"}),startData=await start.json();if(!start.ok)throw Error(startData.error||"Unable to start upload.");
          const uploaded=await fetch(startData.url,{method:"POST",headers:{"Content-Type":file.type},body:file});if(!uploaded.ok)throw Error("The file upload failed.");
          const stored=await uploaded.json();
          const saved=await fetch("/api/employee/documents",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({storageId:stored.storageId,documentCategory:category,documentType:type,originalFileName:file.name,mimeType:file.type})});
          const result=await saved.json();if(!saved.ok)throw Error(result.error||"Unable to save document details.");
          window.toast?.("Document submitted for verification.");window.closeUploadSheet();window.location.reload();
        }catch(error){say(error instanceof Error?error.message:"Unable to upload document.");}
        finally{button.disabled=false;button.textContent="Upload for review";}
      };

  async function hydrate(prefetchedPayload) {
    if (window.__orchidHydrating) return;
    window.__orchidHydrating = true;
    try {
      let payload = prefetchedPayload;
      if (!payload) {
        const response = await fetch("/api/employee/workspace", { credentials: "same-origin", cache: "no-store" });
        if (response.status === 401) {
          window.location.replace("/login?next=/");
          return;
        }
        if (response.status === 403) {
          window.location.replace("/profile-pending");
          return;
        }
        if (!response.ok) throw new Error("Unable to load employee workspace");
        payload = await response.json();
      }
      const { workspace, policies, work } = payload;
      window.__orchidWorkspaceSnapshot = JSON.stringify({ workspace, policies, work });
      window.__orchidWorkspace = workspace;
      renderHomeUpcoming(workspace);
      window.__orchidWork = work || { assignments: [], history: [] };
      window.renderHours?.();
      if (!workspace?.linked || !workspace.profile) {
        window.location.replace("/profile-pending");
        return;
      }

      const p = workspace.profile;
      const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ");
      const moreProfileName = document.getElementById("moreProfileName");
      if (moreProfileName) moreProfileName.textContent = fullName || "Employee";
      const moreProfileIdentity = document.getElementById("moreProfileIdentity");
      if (moreProfileIdentity) moreProfileIdentity.textContent = [p.employeeCode, p.designation, workspace.department?.name].filter(Boolean).join(" · ");

      const joiningDate = p.joiningDate && /^\d{4}-\d{2}-\d{2}$/.test(p.joiningDate)
        ? new Date(p.joiningDate + "T00:00:00Z")
        : null;
      const now = new Date();
      let completedYears = null;
      if (joiningDate && !Number.isNaN(joiningDate.getTime()) && joiningDate <= now) {
        completedYears = now.getUTCFullYear() - joiningDate.getUTCFullYear();
        if (
          now.getUTCMonth() < joiningDate.getUTCMonth() ||
          (now.getUTCMonth() === joiningDate.getUTCMonth() && now.getUTCDate() < joiningDate.getUTCDate())
        ) completedYears -= 1;
      }
      text("#moreYearsAtOrchid", completedYears == null ? "—" : String(completedYears));

      const profileLeaveBalances = workspace.leaveBalances ?? [];
      const availableProfileLeave = profileLeaveBalances.reduce((total, balance) => {
        const allocated = Number(balance.allocated);
        const used = Number(balance.used);
        const pending = Number(balance.pending);
        if (![allocated, used, pending].every(Number.isFinite)) return total;
        return total + Math.max(0, allocated - used - pending);
      }, 0);
      text("#moreLeaveBalance", profileLeaveBalances.length
        ? String(Number(availableProfileLeave.toFixed(1)))
        : "—");

      const profileAttendance = workspace.attendanceSummary;
      text("#moreAttendance", profileAttendance?.scheduledDays
        ? String(profileAttendance.percentage ?? 0) + "%"
        : "—");
      
      const headerIdentity = document.querySelector("header .text-label-sm");
      if (headerIdentity) headerIdentity.textContent = "Employee · " + safe(p.employeeCode);
      document.querySelectorAll("#attScreen header .text-label-sm").forEach(node => { node.textContent = "Employee · " + safe(p.employeeCode); });
      const mainIdentity = document.getElementById("mainEmployeeIdentity");
      if (mainIdentity) mainIdentity.textContent = "Employee · " + safe(p.employeeCode);
      const requestIdentity = document.getElementById("requestEmployeeIdentity");
      if (requestIdentity) requestIdentity.textContent = "Employee · " + safe(p.employeeCode);
      const leaveTypeSelect = document.getElementById("reqLeaveType");
      if (leaveTypeSelect) {
        leaveTypeSelect.replaceChildren(new Option("Select leave type", ""));
        (workspace.leaveTypes || []).forEach(type => leaveTypeSelect.add(new Option(type.name, type.id)));
      }
      const performanceIdentity = document.getElementById("performanceEmployeeIdentity");
      if (performanceIdentity) performanceIdentity.textContent = "Employee · " + safe(p.employeeCode);
      const greeting = document.querySelector("h2.text-headline-lg-mobile");
      if (greeting) greeting.textContent = "Good morning, " + fullName;
      const profileImage = document.querySelector('header img[alt*="Profile Picture"]');
      if (profileImage) profileImage.alt = fullName + " profile picture";
      const roleLine = document.querySelector("h2.text-headline-lg-mobile + p");
      if (roleLine) roleLine.textContent = [p.designation, workspace.department?.name, workspace.location?.name].filter(Boolean).join(" · ");

      const teamDate = document.getElementById("employeeTeamDate");
      if (teamDate) teamDate.textContent = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date());
      const teamContent = document.getElementById("employeeTeamContent");
      if (teamContent) {
        teamContent.replaceChildren();
        if (!work?.team) {
          empty(teamContent, "You are not assigned to a team for today's shift.");
        } else {
          const team = work.team;
          const heading = document.createElement("div");
          heading.className = "flex items-center justify-between gap-2 mb-3";
          const title = document.createElement("p");
          title.className = "text-body-md font-body-md font-semibold text-on-surface";
          title.textContent = team.name;
          const shiftName = document.createElement("span");
          shiftName.className = "text-label-sm font-label-sm text-primary";
          shiftName.textContent = team.shiftName;
          heading.append(title, shiftName);
          teamContent.append(heading);
          const memberList = document.createElement("div");
          memberList.className = "flex flex-col gap-3";
          const members = team.members ?? [];
          if (!members.length) empty(memberList, "No team members are assigned for this date.");
          members.forEach((member, index) => {
            const row = document.createElement("div");
            row.className = "flex items-center gap-3 p-2 rounded-lg bg-surface-container-low";
            const initials = document.createElement("div");
            initials.className = "w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-label-md flex-shrink-0";
            initials.textContent = (member.name || "?").split(/\\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
            const details = document.createElement("div");
            details.className = "flex-1 min-w-0";
            const name = document.createElement("p");
            name.className = "text-body-md font-body-md font-semibold text-on-surface";
            name.textContent = member.name || "Employee";
            if (member.employeeCode && p.employeeCode && member.employeeCode === p.employeeCode) {
              const you = document.createElement("span");
              you.className = "text-label-sm text-primary font-semibold";
              you.textContent = " (You)";
              name.append(you);
            }
            const code = document.createElement("p");
            code.className = "text-label-sm font-label-sm text-on-surface-variant mt-0.5";
            code.textContent = member.employeeCode ? "Employee ID · " + member.employeeCode : "Team member";
            details.append(name, code);
            row.append(initials, details);
            memberList.append(row);
          });
          teamContent.append(memberList);
          const count = document.createElement("p");
          count.className = "text-label-sm font-label-sm text-on-surface-variant mt-3";
          count.textContent = members.length + (members.length === 1 ? " member" : " members");
          teamContent.append(count);
        }
      }

      document.getElementById("orchidWorkCard")?.remove();const workCard=document.createElement("section");workCard.id="orchidWorkCard";workCard.className="bento-card mt-4";const workTitle=document.createElement("h3");workTitle.className="text-title-md font-title-md font-semibold text-primary mb-3";workTitle.textContent="My team & work";workCard.append(workTitle);
      if(work?.team){const teamLine=document.createElement("p");teamLine.className="text-body-md font-body-md text-on-surface";teamLine.textContent=work.team.name+" · "+work.team.shiftName;workCard.append(teamLine);const teamMembers=document.createElement("p");teamMembers.className="text-label-sm font-label-sm text-on-surface-variant mt-1 mb-3";teamMembers.textContent="Team: "+work.team.members.map(m=>m.name).join(", ");workCard.append(teamMembers);}else{const none=document.createElement("p");none.className="text-label-sm font-label-sm text-on-surface-variant";none.textContent="No team assigned today.";workCard.append(none);}
      (work?.assignments??[]).forEach(task=>{const card=document.createElement("article");card.className="rounded-lg border border-outline-variant/50 p-3 mb-3";const heading=document.createElement("p");heading.className="text-body-md font-body-md font-semibold text-on-surface";heading.textContent=task.title;const detail=document.createElement("p");detail.className="text-label-sm font-label-sm text-on-surface-variant mt-1";detail.textContent=task.category+" · "+task.priority;const select=document.createElement("select");select.className="input mt-2";[["not_started","Not Started"],["in_progress","In Progress"],["completed","Completed"]].forEach(([value,label])=>{const o=document.createElement("option");o.value=value;o.textContent=label;select.append(o);});select.value=task.status;select.addEventListener("change",async()=>{const previous=task.status;select.disabled=true;try{const response=await fetch("/api/employee/work",{method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({progressId:task.progressId,status:select.value})});const payload=await response.json();if(!response.ok)throw Error(payload.error||"Unable to update");task.status=select.value;window.toast?.("Work status updated.");}catch(error){select.value=previous;window.toast?.(error instanceof Error?error.message:"Unable to update work.");}finally{select.disabled=false;}});card.append(heading,detail,select);workCard.append(card);});
      if(!(work?.assignments??[]).length){const empty=document.createElement("p");empty.className="text-label-sm font-label-sm text-on-surface-variant";empty.textContent="No work assignments today.";workCard.append(empty);}document.querySelector("#home")?.prepend(workCard);
      window.__orchidEmployeeDocuments=workspace.documents??[];
      const docContent=document.getElementById("docContent");
      const renderEmployeeDocuments=(category="all")=>{
        if(!docContent)return;
        const rows=window.__orchidEmployeeDocuments.filter(doc=>category==="all"||String(doc.documentCategory||"").toLowerCase()===category);
        docContent.replaceChildren();if(!rows.length){empty(docContent,"No documents in this category yet.");return;}
        rows.forEach(doc=>{
          const card=document.createElement("div");card.className="doc-card";
          const icon=document.createElement("div");icon.className="doc-icon";icon.textContent="description";
          const copy=document.createElement("div");copy.className="flex flex-col flex-1 min-w-0";
          const name=document.createElement("p");name.className="text-body-md font-body-md font-semibold text-on-surface";name.textContent=doc.documentType||doc.originalFileName;
          const meta=document.createElement("p");meta.className="text-label-sm font-label-sm text-on-surface-variant mt-0.5";meta.textContent=(doc.documentCategory||"Document")+" · uploaded "+fmtDate(doc.uploadedAt)+(doc.replacesDocumentId?" · replacement":"");copy.append(name,meta);
          if(doc.reviewNote){const note=document.createElement("p");note.className="text-label-sm text-error mt-1";note.textContent="Review note: "+doc.reviewNote;copy.append(note);}
          const badge=document.createElement("span");badge.className="doc-badge "+(doc.reviewStatus==="verified"?"success":"warning");badge.textContent=doc.reviewStatus==="verified"?"Verified":doc.reviewStatus==="replaced"?"File removed":doc.reviewStatus==="rejected"?"Rejected":"Pending";card.append(icon,copy,badge);
          if(doc.reviewStatus!=="replaced"){const view=document.createElement("button");view.type="button";view.className="text-primary text-label-sm font-semibold";view.textContent="View";view.addEventListener("click",()=>window.open("/api/employee/documents/"+encodeURIComponent(doc._id)+"/file","_blank","noopener"));card.append(view);}docContent.append(card);
        });
      };
      window.renderDocs=renderEmployeeDocuments;
      document.querySelectorAll("#docTabs [data-doc]").forEach(tab=>tab.onclick=()=>{document.querySelectorAll("#docTabs [data-doc]").forEach(item=>item.classList.toggle("active",item===tab));renderEmployeeDocuments(tab.dataset.doc||"all");});
      renderEmployeeDocuments("all");
      window.openDocs=()=>{window.pushScreen("docsScreen");renderEmployeeDocuments("all");};
      window.openUploadSheet=()=>document.getElementById("uploadSheet")?.classList.remove("hidden");
      window.closeUploadSheet=()=>document.getElementById("uploadSheet")?.classList.add("hidden");
      const employeeDocumentFile = document.getElementById("employeeDocumentFile");
      employeeDocumentFile && (employeeDocumentFile.onchange = () => {
        const label = document.getElementById("employeeDocumentFileLabel");
        if (label) label.textContent = employeeDocumentFile.files?.[0]?.name || "Tap to choose a document";
      });


      const attendance = workspace.attendance ?? [];
      const latest = attendance[0];
      const acceptedEvents = attendance.filter(event => event.locationType === "remote" || event.geofencePassed === true || event.reviewStatus === "approved");
      const pendingReview = latest?.reviewStatus === "pending";
      const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
      const todayEvents = acceptedEvents.filter(event => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(event.receivedAt || event.clientTimestamp)) === todayKey).sort((x, y) => x.receivedAt - y.receivedAt);
      const latestToday = todayEvents[todayEvents.length - 1];
      const formatAttendanceDate = value => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "2-digit", month: "short", year: "numeric" }).format(value);
      const formatPunchTime = value => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
      const eventLabel = type => ({ check_in: "Checked in", check_out: "Checked out", break_start: "Break started", break_end: "Break ended" }[type] || String(type || "Attendance"));
      text("#attDateLabel", formatAttendanceDate(new Date()));
      text("#attClock", formatPunchTime(Date.now()));
      if (window.__orchidAttendanceClock) clearInterval(window.__orchidAttendanceClock);
      window.__orchidAttendanceClock = setInterval(() => text("#attClock", formatPunchTime(Date.now())), 1000);
      const attendanceEventsNode = document.getElementById("todayAttendanceEvents");
      if (attendanceEventsNode) {
        attendanceEventsNode.replaceChildren();
        const heading = document.createElement("p"); heading.className = "text-body-md font-body-md font-semibold text-on-surface mb-2"; heading.textContent = "Today’s attendance events"; attendanceEventsNode.append(heading);
        if (!todayEvents.length) { const note=document.createElement("p"); note.className="text-label-sm text-on-surface-variant py-3"; note.textContent="No accepted attendance punches recorded today."; attendanceEventsNode.append(note); }
        else todayEvents.forEach(event => {
          const row = document.createElement("div"); row.className = "flex items-center justify-between gap-3 py-2 border-t border-outline-variant/30";
          const label = document.createElement("p"); label.className = "text-body-md font-body-md text-on-surface"; label.textContent = eventLabel(event.eventType);
          const time = document.createElement("p"); time.className = "text-label-sm font-label-sm text-on-surface-variant tabular-nums"; time.textContent = formatPunchTime(event.receivedAt || event.clientTimestamp);
          row.append(label, time); attendanceEventsNode.append(row);
        });
      }
      const gpsTitle = document.getElementById("gpsStatusTitle"), gpsDetail = document.getElementById("gpsStatusDetail"), gpsBadge = document.getElementById("gpsStatusBadge");
      if (gpsTitle && gpsDetail && gpsBadge) {
        if (latestToday) {
          const verified = latestToday.locationType === "remote" || latestToday.geofencePassed === true || latestToday.reviewStatus === "approved";
          gpsTitle.textContent = latestToday.locationType === "remote" ? (latestToday.accuracyM ? "Remote attendance · GPS recorded" : "Remote attendance · GPS unavailable") : verified ? "Attendance location verified" : "Location requires review";
          gpsDetail.textContent = "Last verified punch · " + formatPunchTime(latestToday.receivedAt || latestToday.clientTimestamp);
          gpsBadge.textContent = verified ? "Verified" : "Review";
          gpsBadge.className = "px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 " + (verified ? "bg-[#e6f4ea] text-[#1E8E4E]" : "bg-[#fff4e0] text-[#b26a00]");
        }
      }

      const checkedIn = !!latestToday && latestToday.eventType !== "check_out";
      const formatElapsed = milliseconds => { const seconds = Math.max(0, Math.floor(milliseconds / 1000)); return [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60].map(value => String(value).padStart(2, "0")).join(":"); };
      const calculateTodayMilliseconds = () => {
        let openWork = null, total = 0;
        for (const event of todayEvents) {
          const at = event.receivedAt || event.clientTimestamp;
          if (event.eventType === "check_in" || event.eventType === "break_end") openWork = at;
          if ((event.eventType === "break_start" || event.eventType === "check_out") && openWork !== null) { total += Math.max(0, at - openWork); openWork = null; }
        }
        if (openWork !== null) total += Math.max(0, Date.now() - openWork);
        return total;
      };
      const updateAttendanceTimer = () => { const display = formatElapsed(calculateTodayMilliseconds()); text("#statTodayHrs", display); text("#ringTime", display); };
      if (window.__orchidAttendanceTimer) clearInterval(window.__orchidAttendanceTimer);
      updateAttendanceTimer(); window.__orchidAttendanceTimer = setInterval(updateAttendanceTimer, 1000);
      text("#heroStateLabel", pendingReview ? "Attendance awaiting review" : checkedIn ? (latestToday.eventType === "break_start" ? "You are on break" : "Checked in · working") : "You are not checked in yet");
      text("#heroStateSub", pendingReview ? "Your outside-geofence attempt does not count until approved." : checkedIn ? "Working time excludes recorded breaks." : "No active attendance session");
      text("#heroBtn", pendingReview ? "Awaiting Review" : checkedIn ? "Check Out" : "Check In");
      text("#attCheckBtn", pendingReview ? "Awaiting Review" : checkedIn ? "Check Out" : "Check In");
      [document.getElementById("heroBtn"), document.getElementById("attCheckBtn")].forEach(button => { if (button) button.disabled = pendingReview; });
      text("#ringSub", checkedIn ? "Working time" : "Today"); text("#statTodaySub", checkedIn ? "Currently working" : "Recorded today");
      const ring = document.getElementById("heroRing"); if (ring) ring.classList.toggle("done", checkedIn);
      const shift = workspace.shift, shiftLabel = document.getElementById("employeeShiftLabel");
      const breakPanel = document.getElementById("homeBreakPanel");
      const breakButton = document.getElementById("homeBreakBtn");
      const breakTitle = document.getElementById("homeBreakTitle");
      const breakSub = document.getElementById("homeBreakSub");
      const breakCountdown = document.getElementById("homeBreakCountdown");
      const breakActive = checkedIn && latestToday?.eventType === "break_start";
      const breakDurationMs = Math.max(0, Number(shift?.breakMinutes) || 0) * 60000;
      let completedBreakMs = 0;
      let openBreakStartedAt = null;
      todayEvents.forEach(event => {
        const eventAt = Number(event.receivedAt || event.clientTimestamp);
        if (event.eventType === "break_start" && openBreakStartedAt === null) openBreakStartedAt = eventAt;
        if (event.eventType === "break_end" && openBreakStartedAt !== null) {
          completedBreakMs += Math.max(0, eventAt - openBreakStartedAt);
          openBreakStartedAt = null;
        }
      });
      const breakStartedAt = breakActive ? openBreakStartedAt : null;
      const elapsedActiveBreakMs = breakActive && breakStartedAt ? Math.max(0, Date.now() - breakStartedAt) : 0;
      const remainingBreakMs = Math.max(0, breakDurationMs - completedBreakMs - elapsedActiveBreakMs);
      const breakEnabled = checkedIn && breakDurationMs > 0 && !pendingReview && (breakActive || remainingBreakMs > 0);
      window.__orchidBreakState = { active: breakActive, startedAt: breakStartedAt, durationMs: breakDurationMs, remainingMs: remainingBreakMs, enabled: breakEnabled };
      if (breakPanel) breakPanel.classList.toggle("hidden", !(checkedIn && breakDurationMs > 0 && !pendingReview));
      if (breakButton) {
        breakButton.disabled = !breakEnabled;
        breakButton.textContent = breakActive ? "End Break · Return to Work" : remainingBreakMs > 0 ? "Start Break" : "Break Used";
      }
      if (breakTitle) breakTitle.textContent = breakActive ? "You are on break" : remainingBreakMs > 0 ? "Break countdown" : "Daily break allowance used";
      if (breakSub) breakSub.textContent = breakActive
        ? "Your remaining break time is counting down."
        : remainingBreakMs > 0
          ? "Remaining break allowance for today · " + Math.ceil(remainingBreakMs / 60000) + " minutes"
          : "Your unused break allowance expires at the end of today.";
      const updateBreakCountdown = () => {
        if (!breakCountdown) return;
        const remaining = Math.max(0, breakDurationMs - completedBreakMs - (breakActive && breakStartedAt ? Date.now() - breakStartedAt : 0));
        breakCountdown.textContent = String(Math.floor(remaining / 60000)).padStart(2, "0") + ":" + String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");
        if (remaining === 0 && breakActive && breakSub) breakSub.textContent = "Break time is over. End break to return to work.";
      };
      if (window.__orchidBreakTimer) clearInterval(window.__orchidBreakTimer);
      updateBreakCountdown();
      if (breakActive) window.__orchidBreakTimer = setInterval(updateBreakCountdown, 1000);
      const formatShiftTime = (minute) => {
        if (typeof minute !== "number" || !Number.isFinite(minute)) return "—";
        const normalized = ((minute % 1440) + 1440) % 1440;
        return String(Math.floor(normalized / 60)).padStart(2, "0") + ":" + String(normalized % 60).padStart(2, "0");
      };
      text("#employeeShiftName", shift?.name ?? "No shift assigned");
      text("#employeeShiftHours", shift ? formatShiftTime(shift.startMinute) + " – " + formatShiftTime(shift.endMinute) : "—");
      text("#employeeShiftBreak", shift && typeof shift.breakMinutes === "number" ? shift.breakMinutes + " min" : "—");
      text("#employeeShiftCheckout", shift ? formatShiftTime(shift.endMinute) : "—");
      text("#attShiftLabel", shift ? shift.name + " · " + formatShiftTime(shift.startMinute) + " – " + formatShiftTime(shift.endMinute) : "No shift assigned today");
      text("#employeeOfficeName", workspace.location?.name ?? "Work location not assigned");
      text("#employeeOfficeAddress", workspace.location?.address ?? "Office address not configured");
      if (shiftLabel) shiftLabel.textContent = shift ? shift.name + " · " + [shift.startMinute, shift.endMinute].map(value => String(Math.floor(value / 60)).padStart(2, "0") + ":" + String(value % 60).padStart(2, "0")).join(" – ") : "No shift assigned today";
      const clockDate = () => { const now = new Date(); text("#heroClock", now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })); text("#heroDate", now.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "short", year: "numeric" })); };
      clockDate(); if (window.__orchidClockTimer) clearInterval(window.__orchidClockTimer); window.__orchidClockTimer = setInterval(clockDate, 1000);
      const summary = workspace.attendanceSummary;
      text("#statMonthAttendance", summary?.scheduledDays ? summary.attendedDays + " / " + summary.scheduledDays : "—");
      text("#statMonthAttendanceSub", summary?.scheduledDays ? (summary.percentage ?? 0) + "% attendance" : "No scheduled shifts this month");
      const balances = workspace.leaveBalances ?? [];
      const availableLeave = balances.reduce((sum, item) => sum + Math.max(0, item.allocated - item.used - item.pending), 0);
      text("#statLeaveBalance", balances.length ? String(availableLeave) : "—");
      text("#statLeaveBalanceSub", balances.length ? balances.map(item => item.leaveTypeName).join(", ") : "No leave balance configured");
      const weeklyWage = workspace.weeklyWage;
      text("#statWeeklyWage", weeklyWage ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(weeklyWage.totalPaise / 100) : "—");
      text("#statWeeklyWageSub", weeklyWage ? weeklyWage.payableUnits + " payable units · " + weeklyWage.status : "No approved wage for this week");
      // Employee performance is derived only from recorded attendance days and finalized wages.
      const performance = workspace.performance ?? {};
      const performanceDays = performance.attendanceDays ?? [];
      const scheduledPerformanceDates = new Set(performance.scheduledWorkDates ?? []);
      const validWorkDays = performanceDays.filter(day => ["present", "late"].includes(day.status) && (!performance.scheduledWorkDates || scheduledPerformanceDates.has(day.workDate)));
      const totalPayableMinutes = validWorkDays.reduce((sum, day) => sum + Math.max(0, Number(day.payableMinutes) || 0), 0);
      const hoursValue = totalPayableMinutes / 60;
      text("#performanceTotalHours", hoursValue.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "h");
      text("#performanceAttendance", summary?.percentage == null ? "—" : String(summary.percentage) + "%");
      const finalizedWeeklyWages = (workspace.wageRecords ?? []).filter(record => record.period?.periodType === "weekly" && ["approved", "locked"].includes(record.status));
      const averageWeeklyWagePaise = finalizedWeeklyWages.length ? finalizedWeeklyWages.reduce((sum, record) => sum + (Number(record.totalPaise) || 0), 0) / finalizedWeeklyWages.length : null;
      text("#performanceAverageWage", averageWeeklyWagePaise == null ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(averageWeeklyWagePaise / 100) + "/wk");
      text("#performanceShiftsAttended", String(validWorkDays.length) + "/mo");
      text("#performanceScheduledShifts", String(performance.scheduledShifts ?? 0));
      text("#performanceRecordedDays", String(validWorkDays.length));
      const trendNode = document.getElementById("performanceTrendBars");
      let performanceRange = "weekly";
      const renderPerformanceTrend = () => {
        if (!trendNode) return;
        const now = new Date();
        const todayLocal = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
        const selected = performanceRange === "weekly"
          ? (() => { const date = new Date(todayLocal + "T00:00:00Z"); const weekday = (date.getUTCDay() + 6) % 7; date.setUTCDate(date.getUTCDate() - weekday); const start = date.toISOString().slice(0,10); return Array.from({length:7},(_,i)=>{const d=new Date(start+"T00:00:00Z");d.setUTCDate(d.getUTCDate()+i);return d.toISOString().slice(0,10);}); })()
          : Array.from({length: new Date(now.getFullYear(),now.getMonth()+1,0).getDate()},(_,i)=>String(now.getFullYear())+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(i+1).padStart(2,"0"));
        const byDate = new Map(performanceDays.map(day => [day.workDate, Math.max(0, Number(day.payableMinutes)||0) / 60]));
        const values = selected.map(date => ({ date, hours: byDate.get(date) ?? 0 }));
        const max = Math.max(8, ...values.map(item => item.hours));
        trendNode.replaceChildren();
        values.forEach((item,index) => {
          const column=document.createElement("div");column.className="flex flex-col items-center flex-1 gap-2 z-10 min-w-0";
          const bar=document.createElement("div");bar.className="w-full rounded-t-sm "+(item.hours>0?"bg-primary":"bg-outline-variant/40");bar.style.height=Math.max(3,(item.hours/max)*100)+"%";bar.title=item.date+": "+item.hours.toFixed(1)+" hours";
          const label=document.createElement("span");label.className="text-[10px] text-on-surface-variant";label.textContent=performanceRange==="weekly"?new Intl.DateTimeFormat("en-IN",{weekday:"short",timeZone:"UTC"}).format(new Date(item.date+"T12:00:00Z")):String(Number(item.date.slice(-2)));
          column.append(bar,label);trendNode.append(column);
        });
        const weeklyTab=document.getElementById("performanceWeeklyTab"),monthlyTab=document.getElementById("performanceMonthlyTab");
        [[weeklyTab,"weekly"],[monthlyTab,"monthly"]].forEach(([tab,range])=>{if(!tab)return;const active=performanceRange===range;tab.classList.toggle("bg-primary",active);tab.classList.toggle("text-white",active);tab.classList.toggle("shadow-sm",active);tab.classList.toggle("text-on-surface-variant",!active);});
      };
      window.setPerformanceRange = range => { if (range==="weekly"||range==="monthly") { performanceRange=range; renderPerformanceTrend(); } };
      renderPerformanceTrend();
      const upcomingList = document.getElementById("upcomingList");
      if (upcomingList) {
        upcomingList.replaceChildren(); const upcoming = workspace.upcoming ?? [];
        if (!upcoming.length) empty(upcomingList, "No upcoming holidays, birthdays or shift changes.");
        upcoming.forEach((item, index) => {
          if (index) { const divider = document.createElement("div"); divider.className = "h-px bg-outline-variant/30 mx-4"; upcomingList.append(divider); }
          const row = document.createElement("div"); row.className = "flex items-center justify-between gap-3 px-4 py-3";
          const copy = document.createElement("div"); copy.className = "flex flex-col flex-1 min-w-0";
          const title = document.createElement("p"); title.className = "text-body-md font-body-md font-medium text-on-surface"; title.textContent = item.title;
          const detail = document.createElement("p"); detail.className = "text-label-sm font-label-sm text-on-surface-variant mt-0.5"; detail.textContent = item.subtitle; copy.append(title, detail);
          const date = document.createElement("span"); date.className = "flex-shrink-0 px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-[10px] font-medium tracking-wide"; date.textContent = fmtDate(item.date);
          row.append(copy, date); upcomingList.append(row);
        });
      }
      const leaveRequests = workspace.leaveRequests ?? [];
      const reqContent = document.getElementById("reqContent");
      if (reqContent) {
        reqContent.replaceChildren();
        if (!leaveRequests.length) empty(reqContent, "No leave requests have been submitted.");
        leaveRequests.forEach(request => {
          const card = document.createElement("article");
          card.className = "bento-card flex items-center gap-3";
          const copy = document.createElement("div");
          copy.className = "flex flex-col flex-1 min-w-0";
          const title = document.createElement("p");
          title.className = "text-body-md font-body-md font-medium text-on-surface";
          const leaveType = workspace.leaveBalances?.find(item => String(item.leaveTypeId) === String(request.leaveTypeId))?.leaveTypeName || "Leave";
          title.textContent = leaveType + " request";
          const meta = document.createElement("p");
          meta.className = "text-label-sm font-label-sm text-on-surface-variant mt-0.5";
          meta.textContent = fmtDate(request.fromDate) + " – " + fmtDate(request.toDate) + " · " + request.requestedDays + " day(s)";
          if (Array.isArray(request.daySelections) && request.daySelections.length) { const detail = document.createElement("p"); detail.className = "text-label-sm text-on-surface-variant mt-1"; detail.textContent = request.daySelections.map(item => fmtDate(item.date) + ": " + (leavePortionLabels[item.portion] || "Leave")).join(" · "); copy.append(detail); }
          copy.append(title, meta);
          const badge = document.createElement("span");
          badge.className = "flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold " + (request.status === "approved" ? "bg-[#e6f4ea] text-[#1E8E4E]" : request.status === "rejected" ? "bg-[#fde8e8] text-[#B3261E]" : "bg-secondary-fixed text-secondary");
          badge.textContent = request.status;
          card.append(copy, badge);
          reqContent.append(card);
        });
      }


      const allAcceptedEvents = attendance.filter(event => event.geofencePassed || event.reviewStatus === "approved");
      const dayKey = value => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(value));
      const historyByDay = new Map();
      allAcceptedEvents.forEach(event => { const at=event.receivedAt || event.clientTimestamp; const key=dayKey(at); if(!historyByDay.has(key))historyByDay.set(key,[]); historyByDay.get(key).push(event); });
      const summarizeDay = events => {
        let open=null,total=0,firstIn=null,lastOut=null;
        events.sort((a,b)=>(a.receivedAt||a.clientTimestamp)-(b.receivedAt||b.clientTimestamp));
        for(const event of events){const at=event.receivedAt||event.clientTimestamp;if(event.eventType==="check_in"||event.eventType==="break_end"){if(event.eventType==="check_in"&&firstIn===null)firstIn=at;open=at;}if((event.eventType==="break_start"||event.eventType==="check_out")&&open!==null){total+=Math.max(0,at-open);open=null;}if(event.eventType==="check_out")lastOut=at;}
        const isToday=events.length&&dayKey(events[0].receivedAt||events[0].clientTimestamp)===dayKey(Date.now());
        if(open!==null&&isToday)total+=Math.max(0,Date.now()-open);
        return {total,firstIn,lastOut};
      };
      const historyRows=[...historyByDay.entries()].sort((a,b)=>b[0].localeCompare(a[0]));
      const weekStart=new Date();weekStart.setHours(0,0,0,0);weekStart.setDate(weekStart.getDate()-6);
      const weekBars=document.getElementById("weekBars");
      if(weekBars){
        weekBars.replaceChildren();
        const days=Array.from({length:7},(_,i)=>{const d=new Date(weekStart);d.setDate(d.getDate()+i);return d;});
        const totals=days.map(d=>summarizeDay([...(historyByDay.get(dayKey(d.getTime()))||[])]).total),max=Math.max(1,...totals);
        days.forEach((d,i)=>{const wrap=document.createElement("div");wrap.className="flex-1 flex flex-col items-center justify-end h-full gap-1";const bar=document.createElement("div");bar.className="bar"+(totals[i]?" main":"");bar.style.height=Math.max(4,Math.round(totals[i]/max*100))+"%";bar.title=(totals[i]/3600000).toFixed(2)+" hours";wrap.append(bar);weekBars.append(wrap);});
        text("#hoursWeekLabel",formatAttendanceDate(weekStart)+" – "+formatAttendanceDate(new Date()));
      }
      const dailyHours=document.getElementById("dailyHours");
      if(dailyHours){
        dailyHours.replaceChildren();
        if(!historyRows.length){const note=document.createElement("p");note.className="text-body-md text-on-surface-variant text-center py-8";note.textContent="No accepted attendance history is available yet.";dailyHours.append(note);}
        historyRows.forEach(([key,events],index)=>{
          const summary=summarizeDay([...events]),row=document.createElement("div");row.dataset.date=key;row.className="px-4 py-3"+(index?" border-t border-outline-variant/30":"");
          const top=document.createElement("div");top.className="flex items-center justify-between gap-2";
          const date=document.createElement("p");date.className="text-body-md font-body-md font-semibold text-on-surface";date.textContent=formatAttendanceDate(new Date(key+"T12:00:00+05:30"));
          const hours=document.createElement("p");hours.className="text-body-md font-body-md font-semibold text-primary tabular-nums";hours.textContent=(summary.total/3600000).toFixed(2)+" hrs";top.append(date,hours);
          const detail=document.createElement("p");detail.className="text-label-sm font-label-sm text-on-surface-variant mt-1";detail.textContent=(summary.firstIn?"In "+formatPunchTime(summary.firstIn):"No check-in")+" · "+(summary.lastOut?"Out "+formatPunchTime(summary.lastOut):"No check-out")+" · "+events.length+" event(s)";
          row.append(top,detail);dailyHours.append(row);
        });
      }
      const historyViewButtons = document.querySelectorAll("#hoursSeg [data-view]");
      const applyHistoryView = view => {
        const days = view === "month" ? 30 : 7;
        const cutoff = new Date(); cutoff.setHours(0,0,0,0); cutoff.setDate(cutoff.getDate() - (days - 1));
        const cutoffKey = dayKey(cutoff.getTime());
        dailyHours?.querySelectorAll("[data-date]").forEach(row => { row.hidden = row.dataset.date < cutoffKey; });
        historyViewButtons.forEach(button => {
          const active = button.dataset.view === view;
          button.className = active
            ? "flex-1 py-2 rounded-md text-body-md font-body-md font-semibold text-primary bg-surface shadow-sm"
            : "flex-1 py-2 rounded-md text-body-md font-body-md text-on-surface-variant";
          button.setAttribute("aria-pressed", String(active));
        });
      };
      historyViewButtons.forEach(button => button.onclick = () => applyHistoryView(button.dataset.view === "month" ? "month" : "week"));
      applyHistoryView("week");

      const wageRecords = workspace.wageRecords ?? [];
      const payScreen = document.getElementById("payScreen");
      const moneyINR = paise => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((Number(paise) || 0) / 100);
      const escapePrintText = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
      const printPayslip = (record, earnings, deductions, hasEarningsBreakdown, hasDeductionsBreakdown) => {
        const profile = workspace.profile || {};
        const periodLabel = record.period ? fmtDate(record.period.fromDate) + " – " + fmtDate(record.period.toDate) : "Wage record";
        const rows = (items, isDeduction) => items.map(item => "<tr><td>" + escapePrintText(item.label) + (isDeduction && item.reason ? "<small>" + escapePrintText(item.reason) + "</small>" : "") + "</td><td class='amount'>" + moneyINR(item.amountPaise) + "</td></tr>").join("");
        const gross = Number(record.grossPaise ?? record.calculationSnapshot?.grossPaise ?? 0);
        const net = Number(record.totalPaise ?? record.calculationSnapshot?.netPaise ?? 0);
        const deductionTotal = hasDeductionsBreakdown ? deductions.reduce((sum, item) => sum + (Number(item.amountPaise) || 0), 0) : null;
        const printWindow = window.open("", "_blank");
        if (!printWindow) { window.toast?.("Allow pop-ups to print or save your payslip."); return; }
        printWindow.onload = () => { printWindow.focus(); printWindow.print(); };
        printWindow.document.write("<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Payslip " + escapePrintText(record.payslipNumber || "") + "</title><style>body{font:14px Arial,sans-serif;color:#242124;margin:36px}header{border-bottom:2px solid #4a1254;padding-bottom:16px;margin-bottom:24px}h1{color:#4a1254;margin:0 0 6px;font-size:24px}h2{font-size:16px;margin:24px 0 8px;color:#4a1254}.muted{color:#68616a;font-size:12px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#f8f4f8;padding:14px;border-radius:8px}.meta strong{display:block;margin-top:4px}table{width:100%;border-collapse:collapse}td{padding:10px 6px;border-bottom:1px solid #e6e0e6}td.amount{text-align:right;white-space:nowrap}small{display:block;color:#777;margin-top:3px}.totals{margin:20px 0 0 auto;max-width:320px}.totals p{display:flex;justify-content:space-between;margin:8px 0}.net{font-size:19px;font-weight:bold;color:#4a1254;border-top:2px solid #4a1254;padding-top:12px}.foot{margin-top:36px;border-top:1px solid #ddd;padding-top:12px;color:#777;font-size:11px}@media print{body{margin:18mm}}</style></head><body><header><h1>Orchid Flowers</h1><div class='muted'>Employee salary statement</div></header><div class='meta'><div>Employee<strong>" + escapePrintText([profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Employee") + "</strong></div><div>Employee ID<strong>" + escapePrintText(profile.employeeCode || "—") + "</strong></div><div>Pay period<strong>" + escapePrintText(periodLabel) + "</strong></div><div>Payslip reference<strong>" + escapePrintText(record.payslipNumber || "—") + "</strong></div></div><h2>Earnings</h2><table>" + (hasEarningsBreakdown ? (earnings.length ? rows(earnings, false) : "<tr><td colspan='2'>No earnings line items</td></tr>") : "<tr><td colspan='2'>Historical earnings breakdown unavailable</td></tr>") + "</table><h2>Deductions</h2><table>" + (hasDeductionsBreakdown ? (deductions.length ? rows(deductions, true) : "<tr><td colspan='2'>No deductions for this period</td></tr>") : "<tr><td colspan='2'>Historical deductions breakdown unavailable</td></tr>") + "</table><div class='totals'><p><span>Gross earnings</span><strong>" + moneyINR(gross) + "</strong></p><p><span>Total deductions</span><strong>" + (deductionTotal === null ? "Not available" : moneyINR(deductionTotal)) + "</strong></p><p class='net'><span>Net payable</span><strong>" + moneyINR(net) + "</strong></p></div><div class='foot'>Generated from Orchid One. This payslip reflects the approved payroll record and is not proof of bank transfer.</div></body></html>");
        printWindow.document.close();
      };
      if (payScreen) {
        const body = payScreen.querySelector(".flex-1.overflow-y-auto");
        if (body) {
          body.replaceChildren();
          if (!wageRecords.length) empty(body, "No approved payslips are available yet.");
          wageRecords.forEach(record => {
            const card = document.createElement("article");
            card.className = "bento-card";
            const hasEarningsBreakdown = Array.isArray(record.earnings) || Array.isArray(record.calculationSnapshot?.earnings);
            const hasDeductionsBreakdown = Array.isArray(record.deductions) || Array.isArray(record.calculationSnapshot?.deductions);
            const earnings = Array.isArray(record.earnings) ? record.earnings : Array.isArray(record.calculationSnapshot?.earnings) ? record.calculationSnapshot.earnings : [];
            const deductions = Array.isArray(record.deductions) ? record.deductions : Array.isArray(record.calculationSnapshot?.deductions) ? record.calculationSnapshot.deductions : [];
            const title = document.createElement("p");
            title.className = "text-body-md font-body-md font-semibold text-primary";
            title.textContent = record.period ? fmtDate(record.period.fromDate) + " – " + fmtDate(record.period.toDate) : "Wage record";
            const reference = document.createElement("p");
            reference.className = "text-label-sm font-label-sm text-on-surface-variant mt-1";
            reference.textContent = record.payslipNumber || "Payslip reference unavailable";
            const amount = document.createElement("p");
            amount.className = "text-headline-lg-mobile font-headline-lg-mobile text-primary font-semibold mt-2";
            amount.textContent = moneyINR(record.totalPaise);
            const status = document.createElement("p");
            status.className = "text-label-sm font-label-sm text-on-surface-variant mt-1";
            status.textContent = "Net payable · " + String(record.status || "approved").replaceAll("_", " ");
            const details = document.createElement("div");
            details.className = "hidden mt-4 pt-3 border-t border-outline-variant/40";
            const addLine = (label, value, strong = false) => {
              const row = document.createElement("div");
              row.className = "flex items-start justify-between gap-3 py-2 text-body-sm";
              const name = document.createElement("span");
              name.className = "text-on-surface-variant";
              name.textContent = label;
              const total = document.createElement("span");
              total.className = strong ? "font-semibold text-primary text-right" : "font-medium text-on-surface text-right";
              total.textContent = value;
              row.append(name, total);
              details.append(row);
            };
            addLine("Gross earnings", moneyINR(record.grossPaise ?? record.calculationSnapshot?.grossPaise ?? 0));
            if (earnings.length) {
              const heading = document.createElement("p");
              heading.className = "text-label-sm font-semibold text-primary mt-3 mb-1";
              heading.textContent = "Earnings";
              details.append(heading);
              earnings.forEach(item => addLine(item.label, moneyINR(item.amountPaise)));
            } else {
              addLine("Earnings breakdown", hasEarningsBreakdown ? "No earnings line items" : "Unavailable for this historical record");
            }
            if (deductions.length) {
              const heading = document.createElement("p");
              heading.className = "text-label-sm font-semibold text-primary mt-3 mb-1";
              heading.textContent = "Deductions";
              details.append(heading);
              deductions.forEach(item => {
                addLine(item.label + (item.reason ? " · " + item.reason : ""), moneyINR(item.amountPaise));
              });
            } else {
              addLine("Deductions", hasDeductionsBreakdown ? "None for this period" : "Unavailable for this historical record");
            }
            if (Number(record.payableDays) > 0) addLine("Payable days", String(record.payableDays));
            if (Number(record.payableMinutes) > 0) addLine("Payable hours", (record.payableMinutes / 60).toFixed(2));
            addLine("Net payable", moneyINR(record.totalPaise), true);
            const actions = document.createElement("div");
            actions.className = "flex flex-wrap gap-2 mt-3";
            const viewButton = document.createElement("button");
            viewButton.type = "button";
            viewButton.className = "rounded-lg bg-surface-container-high px-4 py-2 text-primary text-label-sm font-semibold";
            viewButton.textContent = "View details";
            viewButton.setAttribute("aria-expanded", "false");
            viewButton.addEventListener("click", () => {
              const opening = details.classList.contains("hidden");
              details.classList.toggle("hidden", !opening);
              viewButton.textContent = opening ? "Hide details" : "View details";
              viewButton.setAttribute("aria-expanded", String(opening));
            });
            const printButton = document.createElement("button");
            printButton.type = "button";
            printButton.className = "rounded-lg bg-primary px-4 py-2 text-white text-label-sm font-semibold";
            printButton.textContent = "Print / Save PDF";
            printButton.addEventListener("click", () => printPayslip(record, earnings, deductions, hasEarningsBreakdown, hasDeductionsBreakdown));
            actions.append(viewButton, printButton);
            card.append(title, reference, amount, status, actions, details);
            body.append(card);
          });
        }
      }

      const notificationList = document.getElementById("notifList");
      if (notificationList) {
        notificationList.replaceChildren();
        const notifications = workspace.notifications ?? [];
        if (!notifications.length) empty(notificationList, "You have no notifications.");
        notifications.forEach(item => {
          const card = document.createElement("article");
          card.className = "bento-card";
          const title = document.createElement("p");
          title.className = "text-body-md font-body-md font-semibold text-on-surface";
          title.textContent = item.title;
          const body = document.createElement("p");
          body.className = "text-label-sm font-label-sm text-on-surface-variant mt-1";
          body.textContent = item.body;
          const time = document.createElement("p");
          time.className = "text-label-sm font-label-sm text-on-surface-variant mt-2";
          time.textContent = fmtDate(item.createdAt);
          card.append(title, body, time);
          notificationList.append(card);
        });
      }

      window.__orchidPolicies = Array.isArray(policies) ? policies : [];
      const policyList = document.getElementById("polList");
      const renderEmployeePolicies = (searchTerm = "") => {
        if (!policyList) return;
        const term = String(searchTerm || "").trim().toLowerCase();
        const matches = window.__orchidPolicies.filter(policy =>
          !term || [policy.title, policy.description, policy.category].some(value => String(value || "").toLowerCase().includes(term))
        );
        policyList.replaceChildren();
        if (!matches.length) {
          empty(policyList, term ? "No policies match your search." : "No published policies are available.");
          return;
        }
        matches.forEach(policy => {
          const card = document.createElement("button");
          card.type = "button";
          card.className = "bento-card flex items-center gap-3 cursor-pointer hover:bg-surface-container-high transition-colors text-left w-full";
          const icon = document.createElement("span");
          icon.className = "more-ic bg-secondary-fixed text-secondary";
          icon.textContent = "menu_book";
          const copy = document.createElement("span");
          copy.className = "flex flex-col flex-1 min-w-0";
          const title = document.createElement("span");
          title.className = "text-body-md font-body-md font-medium text-on-surface";
          title.textContent = policy.title;
          const meta = document.createElement("span");
          meta.className = "text-label-sm font-label-sm text-on-surface-variant mt-0.5";
          meta.textContent = "v" + policy.version + (policy.effectiveFrom ? " · effective " + fmtDate(policy.effectiveFrom) : "");
          copy.append(title, meta);
          const status = document.createElement("span");
          status.className = "text-label-sm font-label-sm " + (policy.acknowledged ? "text-[#1E8E4E]" : "text-on-surface-variant");
          status.textContent = policy.acknowledged ? "Acknowledged" : "Action required";
          card.append(icon, copy, status);
          card.addEventListener("click", () => window.openPolicy(policy._id));
          policyList.append(card);
        });
      };
      window.renderPolicies = renderEmployeePolicies;
      window.openPolicies = () => {
        window.pushScreen("polScreen");
        const search = document.getElementById("polSearch");
        if (search) search.value = "";
        renderEmployeePolicies("");
      };
      window.openPolicy = (policyId) => {
        const policy = window.__orchidPolicies.find(item => String(item._id) === String(policyId));
        if (!policy) return;
        window.__orchidSelectedPolicy = policy;
        const versionLabel = "v" + policy.version + (policy.effectiveFrom ? " · Effective " + fmtDate(policy.effectiveFrom) : "");
        document.getElementById("pdTitle").textContent = policy.title;
        document.getElementById("pdMeta").textContent = versionLabel;
        document.getElementById("pdName").textContent = policy.title;
        document.getElementById("pdVersion").textContent = versionLabel;
        document.getElementById("pdBadge").textContent = policy.acknowledged ? "Acknowledged" : "Awaiting acknowledgement";
        document.getElementById("pdSummary").textContent = policy.description || "No description provided.";
        document.getElementById("pdFile").textContent = policy.originalFileName || "Policy PDF";
        const fileMeta = document.getElementById("pdFileMeta");
        if (fileMeta) fileMeta.textContent = policy.fileSize ? (policy.fileSize / (1024 * 1024)).toFixed(2) + " MB · PDF" : "PDF document";
        const fileButton = document.getElementById("pdFileButton");
        if (fileButton) {
          fileButton.disabled = false;
          fileButton.textContent = "View PDF";
          fileButton.onclick = () => window.open("/api/employee/policies/" + encodeURIComponent(policy._id) + "/file", "_blank", "noopener");
        }
        const ackButton = document.getElementById("pdAcknowledgeButton");
        if (ackButton) {
          ackButton.disabled = !!policy.acknowledged;
          ackButton.innerHTML = policy.acknowledged
            ? '<span class="material-symbols-outlined text-[18px]">verified</span>Already acknowledged'
            : '<span class="material-symbols-outlined text-[18px]" id="pdCheckIcon">check_circle</span>I have read this policy';
        }
        document.getElementById("pdPoints").replaceChildren();
        window.pushScreen("polDetailScreen");
      };
      window.closePolicies = () => window.goBack();
      window.closePolicyDetail = () => window.goBack();
      window.confirmPolicyRead = async () => {
        const policy = window.__orchidSelectedPolicy;
        const button = document.getElementById("pdAcknowledgeButton");
        if (!policy || policy.acknowledged || !button) return;
        button.disabled = true;
        button.textContent = "Saving acknowledgement…";
        try {
          const response = await fetch("/api/employee/policies/acknowledge", {
            method: "POST", credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ policyId: policy._id }),
          });
          const payload = await response.json();
          if (!response.ok) throw new Error(payload.error || "POLICY_ACKNOWLEDGEMENT_FAILED");
          policy.acknowledged = true;
          document.getElementById("pdBadge").textContent = "Acknowledged";
          button.innerHTML = '<span class="material-symbols-outlined text-[18px]">verified</span>Already acknowledged';
          renderEmployeePolicies(document.getElementById("polSearch")?.value || "");
          window.toast?.(payload.alreadyAcknowledged ? "This policy was already acknowledged." : "Policy acknowledgement saved.");
        } catch (error) {
          button.disabled = false;
          button.textContent = "I have read this policy";
          window.toast?.(error instanceof Error ? error.message : "Unable to save acknowledgement.");
        }
      };
      renderEmployeePolicies("");
    } catch (error) {
      console.error("[Orchid employee]", error);
      const notice = document.createElement("p");
      notice.className = "text-body-md text-error text-center p-4";
      notice.textContent = "Employee data could not be loaded. Refresh to try again.";
      document.querySelector(".p-4.flex.flex-col.gap-3")?.prepend(notice);
    } finally {
      window.__orchidHydrating = false;
      if (window.__orchidPendingRealtimePayload) {
        const pending = window.__orchidPendingRealtimePayload;
        window.__orchidPendingRealtimePayload = null;
        window.__orchidApplyRealtimePayload(pending);
      }
    }
  }

  window.__orchidApplyRealtimePayload = (payload) => {
    if (!payload || !payload.workspace || !Array.isArray(payload.policies) || !payload.work) return;
    if (window.__orchidHydrating) {
      window.__orchidPendingRealtimePayload = payload;
      return;
    }
    const active = document.activeElement;
    if (active && (active.matches("input, textarea, select") || active.isContentEditable)) {
      window.__orchidPendingRealtimePayload = payload;
      return;
    }
    const snapshot = JSON.stringify(payload);
    if (snapshot !== window.__orchidWorkspaceSnapshot) hydrate(payload);
  };

  window.addEventListener("message", (event) => {
    if (event.source !== window.parent || event.origin !== window.location.origin) return;
    if (event.data?.type === "ORCHID_EMPLOYEE_WORKSPACE") {
      window.__orchidApplyRealtimePayload(event.data.payload);
    }
  });
  document.addEventListener("focusout", () => {
    if (window.__orchidPendingRealtimePayload) {
      const pending = window.__orchidPendingRealtimePayload;
      window.__orchidPendingRealtimePayload = null;
      window.__orchidApplyRealtimePayload(pending);
    }
  });

  
  window.toggleEmployeeBreak = async () => {
    const state = window.__orchidBreakState;
    if (!state?.enabled) { window.toast?.("A configured shift break is not available right now."); return; }
    const eventType = state.active ? "break_end" : "break_start";
    if (!navigator.geolocation) { window.toast?.("Location services are not available on this device."); return; }
    const button = document.getElementById("homeBreakBtn");
    if (button) { button.disabled = true; button.textContent = "Verifying location…"; }
    navigator.geolocation.getCurrentPosition(async position => {
      try {
        const response = await fetch("/api/employee/workspace", {
          method: "POST", credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType, latitude: position.coords.latitude, longitude: position.coords.longitude,
            accuracyM: position.coords.accuracy, clientTimestamp: Date.now(), idempotencyKey: crypto.randomUUID()
          })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "BREAK_PUNCH_FAILED");
        if (result.requiresReview) window.toast?.("Break punch is outside the assigned work location and requires review.");
        else window.toast?.(eventType === "break_start" ? "Break started." : "Break ended. Welcome back to work.");
        window.location.reload();
      } catch (error) {
        if (button) { button.disabled = false; button.textContent = state.active ? "End Break · Return to Work" : "Start Break"; }
        window.toast?.(error instanceof Error ? error.message : "Unable to record break.");
      }
    }, error => {
      if (button) { button.disabled = false; button.textContent = state.active ? "End Break · Return to Work" : "Start Break"; }
      window.toast?.(error.code === 1 ? "Location permission is required to record a break." : "Unable to verify your location.");
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  };

  window.toggleCheckIn = () => {
    const events = window.__orchidWorkspace?.attendance ?? [];
    const latest = events[0];
    if (latest?.reviewStatus === "pending") { window.toast?.("Attendance is awaiting supervisor or admin review."); return; }

    const latestAccepted = events.find(event =>
      event.locationType === "remote" || event.geofencePassed === true || event.reviewStatus === "approved"
    );
    const eventType = latestAccepted && latestAccepted.eventType !== "check_out" ? "check_out" : "check_in";
    const isRemote = window.__orchidWorkspace?.location?.locationType === "remote";

    const submitPunch = async (gps) => {
      try {
        const response = await fetch("/api/employee/workspace", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType,
            ...(gps || {}),
            clientTimestamp: Date.now(),
            idempotencyKey: crypto.randomUUID(),
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "ATTENDANCE_PUNCH_FAILED");
        if (result.requiresReview) {
          window.toast?.("Outside the assigned work location. Your punch is pending supervisor or admin approval.");
        } else {
          window.toast?.(eventType === "check_in" ? "Checked in successfully." : "Checked out successfully.");
        }
        window.location.reload();
      } catch (error) {
        console.error("[Orchid attendance]", error);
        window.toast?.(error instanceof Error ? error.message : "Unable to record attendance.");
      }
    };

    // Remote attendance is not geofenced and must not depend on device GPS.
    if (isRemote) {
      void submitPunch();
      return;
    }
    if (!navigator.geolocation) {
      window.toast?.("Location services are not available on this device.");
      return;
    }
    window.toast?.("Verifying your location…");
    navigator.geolocation.getCurrentPosition(
      position => void submitPunch({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracyM: position.coords.accuracy,
      }),
      error => {
        window.toast?.(error.code === 1 ? "Location permission is required to record attendance." : "Unable to verify your location.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };
  const leavePortionLabels = { full: "Full day", first_half: "First half", second_half: "Second half" };
  const renderLeaveDaySelections = () => {
    const from = document.getElementById("reqFrom")?.value || "";
    const to = document.getElementById("reqTo")?.value || "";
    const container = document.getElementById("leaveDaySelections");
    const total = document.getElementById("leaveSelectionTotal");
    if (!container) return;
    container.replaceChildren();
    if (!from || !to || from > to) { if (total) total.textContent = "Choose a valid date range."; return; }
    const start = new Date(from + "T00:00:00Z"), end = new Date(to + "T00:00:00Z");
    const count = Math.round((end - start) / 86400000) + 1;
    if (count > 62) { if (total) total.textContent = "A request can cover at most 62 calendar dates."; return; }
    for (let offset = 0; offset < count; offset++) {
      const date = new Date(start); date.setUTCDate(date.getUTCDate() + offset);
      const key = date.toISOString().slice(0, 10);
      const row = document.createElement("label"); row.className = "flex items-center justify-between gap-3 rounded-lg border border-outline-variant/40 p-2";
      const label = document.createElement("span"); label.className = "text-label-sm text-on-surface"; label.textContent = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "2-digit", month: "short", timeZone: "UTC" }).format(date);
      const select = document.createElement("select"); select.className = "bg-surface-container-low rounded-lg px-2 py-2 text-label-sm text-on-surface"; select.dataset.leaveDate = key;
      [["", "No leave"], ["full", "Full day (1)"], ["first_half", "First half (0.5)"], ["second_half", "Second half (0.5)"]].forEach(([value, text]) => { const option = document.createElement("option"); option.value = value; option.textContent = text; select.append(option); });
      select.addEventListener("change", updateLeaveSelectionTotal);
      row.append(label, select); container.append(row);
    }
    updateLeaveSelectionTotal();
  };
  const updateLeaveSelectionTotal = () => {
    const selects = [...(document.querySelectorAll("#leaveDaySelections select") || [])];
    const days = selects.reduce((sum, select) => sum + (select.value === "full" ? 1 : select.value ? 0.5 : 0), 0);
    const total = document.getElementById("leaveSelectionTotal");
    if (total) total.textContent = days + (days === 1 ? " leave day selected" : " leave days selected");
  };
  let selectedEmployeeRequestType = "leave";
  window.prepareNewRequest = () => {
    selectedEmployeeRequestType = "leave";
    const cards = document.querySelectorAll("#reqTypeGrid .req-type-card");
    cards.forEach(card => {
      card.classList.toggle("active", card.dataset.type === selectedEmployeeRequestType);
      card.onclick = () => {
        selectedEmployeeRequestType = card.dataset.type;
        cards.forEach(item => item.classList.toggle("active", item === card));
        document.getElementById("leaveRequestFields")?.classList.toggle("hidden", selectedEmployeeRequestType !== "leave");
        document.getElementById("overtimeRequestFields")?.classList.toggle("hidden", selectedEmployeeRequestType !== "overtime");
        const message = document.getElementById("requestFormMessage");
        if (message) message.textContent = "";
      };
    });
    document.getElementById("leaveRequestFields")?.classList.remove("hidden");
    document.getElementById("overtimeRequestFields")?.classList.add("hidden");
    const message = document.getElementById("requestFormMessage");
    if (message) message.textContent = "";
    const reason = document.getElementById("reqReason");
    if (reason) reason.value = "";
    ["reqFrom", "reqTo"].forEach(id => { const field = document.getElementById(id); if (field) field.onchange = renderLeaveDaySelections; });
    renderLeaveDaySelections();
    const submit = document.getElementById("submitEmployeeRequest");
    if (submit) { submit.disabled = false; submit.textContent = "Submit Request"; }
  };

  window.submitNewRequest = async () => {
    const button = document.getElementById("submitEmployeeRequest");
    const message = document.getElementById("requestFormMessage");
    const say = value => { if (message) message.textContent = value; };
    const reason = document.getElementById("reqReason")?.value?.trim() || "";
    if (!reason) { say("Please enter a reason for your request."); return; }
    if (reason.length > 1000) { say("Reason must be 1,000 characters or fewer."); return; }

    let payload;
    if (selectedEmployeeRequestType === "leave") {
      const leaveTypeId = document.getElementById("reqLeaveType")?.value || "";
      const fromDate = document.getElementById("reqFrom")?.value || "";
      const toDate = document.getElementById("reqTo")?.value || "";
      if (!leaveTypeId || !fromDate || !toDate) { say("Select a leave type and both dates."); return; }
      if (fromDate > toDate) { say("The end date must be on or after the start date."); return; }
      const daySelections = [...document.querySelectorAll("#leaveDaySelections select")].filter(select => select.value).map(select => ({ date: select.dataset.leaveDate, portion: select.value }));
      if (!daySelections.length) { say("Select at least one full or half working day."); return; }
      payload = { type: "leave", leaveTypeId, fromDate, toDate, daySelections, reason };
    } else {
      const workDate = document.getElementById("reqOvertimeDate")?.value || "";
      const hours = Number(document.getElementById("reqOvertimeHours")?.value);
      if (!workDate || !Number.isFinite(hours) || hours <= 0) { say("Enter the overtime work date and a valid number of hours."); return; }
      const requestedMinutes = Math.round(hours * 60);
      if (requestedMinutes <= 0) { say("Overtime duration must be at least one minute."); return; }
      payload = { type: "overtime", workDate, requestedMinutes, reason };
    }

    if (button) { button.disabled = true; button.textContent = "Submitting…"; }
    say("");
    try {
      const response = await fetch("/api/employee/requests", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const messages = {
          NO_WORKING_DAYS_IN_RANGE: "No scheduled working days were found in that leave date range (company holidays are excluded).",
          LEAVE_DATE_NOT_SCHEDULED: "A selected date has no assigned shift. Remove that date or contact your supervisor.",
          LEAVE_DATE_IS_HOLIDAY: "Company holidays cannot be selected for leave.",
          INVALID_LEAVE_SELECTION: "Check your date-wise leave selections and try again.",
          LEAVE_BALANCE_NOT_CONFIGURED: "Your leave balance is not configured. Contact HR before submitting this request.",
          INSUFFICIENT_LEAVE_BALANCE: "You do not have enough available leave balance for this request.",
          OVERLAPPING_PENDING_LEAVE_REQUEST: "A pending leave request already overlaps these dates.",
          CROSS_YEAR_LEAVE_REQUIRES_SPLIT_REQUEST: "Please submit separate leave requests for dates in different calendar years.",
          INVALID_LEAVE_TYPE: "That leave type is unavailable. Refresh and try again.",
          PENDING_OVERTIME_REQUEST_EXISTS: "A pending overtime request already exists for this work date.",
          EMPLOYEE_PROFILE_REQUIRED: "Your employee profile is not linked. Contact an administrator.",
          EMPLOYEE_INACTIVE: "Your employee profile is inactive. Contact an administrator.",
          INVALID_LEAVE_DATE_RANGE: "Choose a valid leave date range.",
          INVALID_OVERTIME_REQUEST: "Enter a valid overtime date and duration.",
        };
        throw new Error(messages[result.error] || result.error || "Unable to submit your request.");
      }
      window.toast?.("Request submitted for supervisor review.");
      window.closeNewRequest?.();
      window.location.reload();
    } catch (error) {
      say(error instanceof Error ? error.message : "Unable to submit your request.");
    } finally {
      if (button) { button.disabled = false; button.textContent = "Submit Request"; }
    }
  };
  // Employee policy actions are bound after the published policy data is loaded.

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hydrate, { once: true });
  else hydrate();
})();

/* PWA: register the static-asset service worker (Next pages register via RegisterSW). */
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(function(){});
