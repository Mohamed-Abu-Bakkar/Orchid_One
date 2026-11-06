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

  async function hydrate() {
    try {
      const response = await fetch("/api/employee/workspace", { credentials: "same-origin", cache: "no-store" });
      if (response.status === 401) {
        window.location.replace("/login?next=/");
        return;
      }
      if (!response.ok) throw new Error("Unable to load employee workspace");
      const { workspace, policies, work } = await response.json();
      window.__orchidWorkspace = workspace;
      if (!workspace?.linked || !workspace.profile) {
        document.querySelectorAll("#home > div, #attScreen, #hoursScreen, #payScreen, #reqScreen, #docsScreen, #analyticsScreen, #notifScreen, #polScreen").forEach(node => node.classList.add("hidden"));
        const main = document.createElement("main");
        main.className = "min-h-screen flex items-center justify-center p-6 bg-surface";
        main.innerHTML = '<section class="bento-card max-w-sm text-center"><span class="material-symbols-outlined text-primary text-4xl">person_off</span><h1 class="text-title-md font-title-md font-semibold text-primary mt-3">Employee profile not linked</h1><p class="text-body-md font-body-md text-on-surface-variant mt-2">Your login is active, but HR has not linked an employee record yet. Please contact your HR administrator.</p><button class="mt-5 bg-primary text-white rounded-lg px-5 py-2.5" onclick="fetch(\'/api/auth/sign-out\',{method:\'POST\'}).finally(()=>location.href=\'/login\')">Sign out</button></section>';
        document.body.append(main);
        return;
      }

      const p = workspace.profile;
      const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ");
      const headerIdentity = document.querySelector("header .text-label-sm");
      if (headerIdentity) headerIdentity.textContent = "Employee · " + safe(p.employeeCode);
      const greeting = document.querySelector("h2.text-headline-lg-mobile");
      if (greeting) greeting.textContent = "Good morning, " + fullName;
      const profileImage = document.querySelector('header img[alt*="Profile Picture"]');
      if (profileImage) profileImage.alt = fullName + " profile picture";
      const roleLine = document.querySelector("h2.text-headline-lg-mobile + p");
      if (roleLine) roleLine.textContent = [p.designation, workspace.department?.name, workspace.location?.name].filter(Boolean).join(" · ");

      const workCard=document.createElement("section");workCard.className="bento-card mt-4";const workTitle=document.createElement("h3");workTitle.className="text-title-md font-title-md font-semibold text-primary mb-3";workTitle.textContent="My team & work";workCard.append(workTitle);
      if(work?.team){const teamLine=document.createElement("p");teamLine.className="text-body-md font-body-md text-on-surface";teamLine.textContent=work.team.name+" · "+work.team.shiftName;workCard.append(teamLine);const teamMembers=document.createElement("p");teamMembers.className="text-label-sm font-label-sm text-on-surface-variant mt-1 mb-3";teamMembers.textContent="Team: "+work.team.members.map(m=>m.name).join(", ");workCard.append(teamMembers);}else{const none=document.createElement("p");none.className="text-label-sm font-label-sm text-on-surface-variant";none.textContent="No team assigned today.";workCard.append(none);}
      (work?.assignments??[]).forEach(task=>{const card=document.createElement("article");card.className="rounded-lg border border-outline-variant/50 p-3 mb-3";const heading=document.createElement("p");heading.className="text-body-md font-body-md font-semibold text-on-surface";heading.textContent=task.title;const detail=document.createElement("p");detail.className="text-label-sm font-label-sm text-on-surface-variant mt-1";detail.textContent=task.category+" · "+task.priority;const select=document.createElement("select");select.className="input mt-2";[["not_started","Not Started"],["in_progress","In Progress"],["completed","Completed"]].forEach(([value,label])=>{const o=document.createElement("option");o.value=value;o.textContent=label;select.append(o);});select.value=task.status;select.addEventListener("change",async()=>{const previous=task.status;select.disabled=true;try{const response=await fetch("/api/employee/work",{method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({progressId:task.progressId,status:select.value})});const payload=await response.json();if(!response.ok)throw Error(payload.error||"Unable to update");task.status=select.value;window.toast?.("Work status updated.");}catch(error){select.value=previous;window.toast?.(error instanceof Error?error.message:"Unable to update work.");}finally{select.disabled=false;}});card.append(heading,detail,select);workCard.append(card);});
      if(!(work?.assignments??[]).length){const empty=document.createElement("p");empty.className="text-label-sm font-label-sm text-on-surface-variant";empty.textContent="No work assignments today.";workCard.append(empty);}document.querySelector("#home")?.prepend(workCard);
      const docs = workspace.documents ?? [];
      if (docs.length) {
        const docContent = document.getElementById("docContent");
        if (docContent) {
          docContent.replaceChildren();
          docs.forEach(doc => {
            const card = document.createElement("div");
            card.className = "doc-card";
            const icon = document.createElement("div");
            icon.className = "doc-icon";
            icon.textContent = "description";
            const copy = document.createElement("div");
            copy.className = "flex flex-col flex-1 min-w-0";
            const name = document.createElement("p");
            name.className = "text-body-md font-body-md font-semibold text-on-surface";
            name.textContent = doc.originalFileName || doc.documentType;
            const meta = document.createElement("p");
            meta.className = "text-label-sm font-label-sm text-on-surface-variant mt-0.5";
            meta.textContent = (doc.documentType || "Document") + " · uploaded " + fmtDate(doc.uploadedAt);
            copy.append(name, meta);
            const badge = document.createElement("span");
            badge.className = "doc-badge " + (doc.reviewStatus === "approved" ? "success" : "warning");
            badge.textContent = doc.reviewStatus === "approved" ? "Verified" : doc.reviewStatus || "Pending";
            card.append(icon, copy, badge);
            docContent.append(card);
          });
        }
      } else empty(document.getElementById("docContent"), "No employee documents have been uploaded yet.");

      const attendance = workspace.attendance ?? [];
      const latest = attendance[0];
      const acceptedEvents = attendance.filter(event => event.geofencePassed || event.reviewStatus === "approved");
      const latestAccepted = acceptedEvents[0];
      const pendingReview = latest?.reviewStatus === "pending";
      const checkedIn = !!latestAccepted && latestAccepted.eventType !== "check_out";
      let sessionStart = null;
      if (checkedIn) {
        for (const event of acceptedEvents) {
          if (event.eventType === "check_out") break;
          if (event.eventType === "check_in") { sessionStart = event; break; }
        }
        if (!sessionStart && latestAccepted.eventType === "check_in") sessionStart = latestAccepted;
      }
      const sessionStartedAt = sessionStart ? (sessionStart.receivedAt || sessionStart.clientTimestamp) : null;
      const formatElapsed = milliseconds => {
        const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
        const seconds = String(totalSeconds % 60).padStart(2, "0");
        return hours + ":" + minutes + ":" + seconds;
      };
      const updateAttendanceTimer = () => {
        const elapsed = checkedIn && sessionStartedAt ? Date.now() - sessionStartedAt : null;
        const display = elapsed === null ? "—" : formatElapsed(elapsed);
        const stat = document.getElementById("statTodayHrs");
        const ringTime = document.getElementById("ringTime");
        if (stat) stat.textContent = display;
        if (ringTime) ringTime.textContent = display;
      };
      if (window.__orchidAttendanceTimer) clearInterval(window.__orchidAttendanceTimer);
      updateAttendanceTimer();
      if (checkedIn && sessionStartedAt) window.__orchidAttendanceTimer = setInterval(updateAttendanceTimer, 1000);
      const heroLabel = document.getElementById("heroStateLabel");
      if (heroLabel) heroLabel.textContent = pendingReview ? "Attendance awaiting review" : checkedIn ? "Checked in · working" : "You are not checked in yet";
      text("#heroStateSub", pendingReview ? "Your outside-geofence attempt does not count until approved." : checkedIn ? "Elapsed time includes breaks." : "No active attendance session");
      text("#heroBtn", pendingReview ? "Awaiting Review" : checkedIn ? "Check Out" : "Check In");
      text("#attCheckBtn", pendingReview ? "Awaiting Review" : checkedIn ? "Check Out" : "Check In");
      [document.getElementById("heroBtn"), document.getElementById("attCheckBtn")].forEach(button => { if (button) button.disabled = pendingReview; });
      const ringSub = document.getElementById("ringSub");
      if (ringSub) ringSub.textContent = checkedIn ? "Elapsed time" : "Not checked in";
      if (sessionStart) {
        const when = new Date(sessionStartedAt);
        text("#statTodaySub", "Checked in · " + when.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
      } else text("#statTodaySub", "No active attendance session");
      const ring = document.getElementById("heroRing");
      if (ring) ring.classList.toggle("done", checkedIn);

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

      const dailyHours = document.getElementById("dailyHours");
      if (dailyHours) empty(dailyHours, attendance.length ? "Attendance events are available in the attendance screen." : "No attendance records are available yet.");
      const weekBars = document.getElementById("weekBars");
      if (weekBars) empty(weekBars, "Working-hour totals are not calculated from raw punch events.");

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

      const balances = workspace.leaveBalances ?? [];
      const leaveBalanceTotal = balances.reduce((sum, item) => sum + Math.max(0, item.allocated - item.used), 0);
      const statCards = document.querySelectorAll("#home .bento-card");
      statCards.forEach(card => {
        const label = card.querySelector("p");
        if (!label) return;
        if (label.textContent?.toLowerCase().includes("today's hours")) {
          // The live attendance timer above owns this value while a session is active.
        }
        if (label.textContent?.toLowerCase().includes("leave balance")) {
          const value = card.querySelectorAll("p")[1];
          if (value) value.textContent = String(leaveBalanceTotal);
        }
        if (label.textContent?.toLowerCase().includes("estimated wage")) {
          const value = card.querySelectorAll("p")[1];
          if (value) value.textContent = wageRecords.length ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(wageRecords[0].totalPaise / 100) : "—";
        }
      });

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
