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

  async function hydrate() {
    try {
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
      const { workspace, policies, work } = await response.json();
      window.__orchidWorkspace = workspace;
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

      const workCard=document.createElement("section");workCard.className="bento-card mt-4";const workTitle=document.createElement("h3");workTitle.className="text-title-md font-title-md font-semibold text-primary mb-3";workTitle.textContent="My team & work";workCard.append(workTitle);
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
      document.querySelectorAll("#docTabs [data-doc]").forEach(tab=>tab.addEventListener("click",()=>{document.querySelectorAll("#docTabs [data-doc]").forEach(item=>item.classList.toggle("active",item===tab));renderEmployeeDocuments(tab.dataset.doc||"all");}));
      renderEmployeeDocuments("all");
      window.openDocs=()=>{window.pushScreen("docsScreen");renderEmployeeDocuments("all");};
      window.openUploadSheet=()=>document.getElementById("uploadSheet")?.classList.remove("hidden");
      window.closeUploadSheet=()=>document.getElementById("uploadSheet")?.classList.add("hidden");
      const employeeDocumentFile = document.getElementById("employeeDocumentFile");
      employeeDocumentFile?.addEventListener("change", () => {
        const label = document.getElementById("employeeDocumentFileLabel");
        if (label) label.textContent = employeeDocumentFile.files?.[0]?.name || "Tap to choose a document";
      });


      const attendance = workspace.attendance ?? [];
      const latest = attendance[0];
      const acceptedEvents = attendance.filter(event => event.geofencePassed || event.reviewStatus === "approved");
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
          const verified = latestToday.geofencePassed || latestToday.reviewStatus === "approved";
          gpsTitle.textContent = verified ? "Attendance location verified" : "Location requires review";
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
      const validWorkDays = performanceDays.filter(day => ["present", "late"].includes(day.status));
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
      historyViewButtons.forEach(button => button.addEventListener("click", () => applyHistoryView(button.dataset.view === "month" ? "month" : "week")));
      applyHistoryView("week");

      const wageRecords = workspace.wageRecords ?? [];
      const payScreen = document.getElementById("payScreen");
      if (payScreen) {
        const body = payScreen.querySelector(".flex-1.overflow-y-auto");
        if (body) {
          body.replaceChildren();
          if (!wageRecords.length) empty(body, "No payslips are available yet.");
          wageRecords.forEach(record => {
            const card = document.createElement("article");
            card.className = "bento-card";
            const title = document.createElement("p");
            title.className = "text-body-md font-body-md font-semibold text-primary";
            title.textContent = record.period ? fmtDate(record.period.fromDate) + " – " + fmtDate(record.period.toDate) : "Wage record";
            const amount = document.createElement("p");
            amount.className = "text-headline-lg-mobile font-headline-lg-mobile text-primary font-semibold mt-2";
            amount.textContent = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(record.totalPaise / 100);
            const status = document.createElement("p");
            status.className = "text-label-sm font-label-sm text-on-surface-variant mt-1";
            status.textContent = "Status: " + record.status;
            card.append(title, amount, status);
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
    }
  }

  
  window.toggleCheckIn = () => {
    const events = window.__orchidWorkspace?.attendance ?? [];
    const latest = events[0];
    if (latest?.reviewStatus === "pending") { window.toast?.("Attendance is awaiting supervisor or admin review."); return; }
    const latestAccepted = events.find(event => event.geofencePassed || event.reviewStatus === "approved");
    const eventType = latestAccepted && latestAccepted.eventType !== "check_out" ? "check_out" : "check_in";
    if (!navigator.geolocation) {
      window.toast?.("Location services are not available on this device.");
      return;
    }
    window.toast?.("Verifying your location…");
    navigator.geolocation.getCurrentPosition(async position => {
      try {
        const response = await fetch("/api/employee/workspace", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyM: position.coords.accuracy,
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
    }, error => {
      window.toast?.(error.code === 1 ? "Location permission is required to record attendance." : "Unable to verify your location.");
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
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
