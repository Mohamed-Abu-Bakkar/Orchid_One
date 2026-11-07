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
      const headerIdentity = document.querySelector("header .text-label-sm");
      if (headerIdentity) headerIdentity.textContent = "Employee · " + safe(p.employeeCode);
      document.querySelectorAll("#attScreen header .text-label-sm").forEach(node => { node.textContent = "Employee · " + safe(p.employeeCode); });
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
  window.submitNewRequest = () => window.toast?.("Request submission is not enabled until the leave workflow is configured.");
  // Employee policy actions are bound after the published policy data is loaded.

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hydrate, { once: true });
  else hydrate();
})();

/* PWA: register the static-asset service worker (Next pages register via RegisterSW). */
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(function(){});
