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
        window.location.replace("/login?next=/employee");
        return;
      }
      if (!response.ok) throw new Error("Unable to load employee workspace");
      const { workspace, policies } = await response.json();
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
      const checkedIn = latest?.eventType === "check_in" || latest?.eventType === "break_end";
      const heroLabel = document.getElementById("heroStateLabel");
      if (heroLabel) heroLabel.textContent = checkedIn ? "Checked in · working" : "You are not checked in yet";
      text("#heroStateSub", checkedIn ? "Shift active" : "No active attendance session");
      text("#heroBtn", checkedIn ? "Check Out" : "Check In");
      text("#attCheckBtn", checkedIn ? "Check Out" : "Check In");
      const ringSub = document.getElementById("ringSub");
      if (ringSub) ringSub.textContent = checkedIn ? "Checked in" : "Not checked in";
      if (latest?.eventType === "check_in") {
        const when = new Date(latest.clientTimestamp);
        text("#statTodayHrs", "—");
        text("#statTodaySub", "Checked in · " + when.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
      } else {
        text("#statTodayHrs", "—");
        text("#statTodaySub", "No completed hours recorded");
      }
      const ring = document.getElementById("heroRing");
      if (ring) ring.classList.toggle("done", checkedIn);
      const ringTime = document.getElementById("ringTime");
      if (ringTime) ringTime.textContent = "—";

      const leaveRequests = workspace.leaveRequests ?? [];
      const reqContent = document.getElementById("reqContent");
      if (!leaveRequests.length) empty(reqContent, "No leave requests have been submitted.");
      const dailyHours = document.getElementById("dailyHours");
      if (dailyHours && !attendance.length) empty(dailyHours, "No attendance records are available yet.");

      const wageRecords = workspace.wageRecords ?? [];
      const payScreen = document.getElementById("payScreen");
      if (payScreen && !wageRecords.length) {
        const content = payScreen.querySelector(".grid, .flex.flex-col.gap-3");
        if (content) empty(content, "No payslips are available yet.");
      }

      const notificationList = document.getElementById("notifList");
      if (!(workspace.notifications ?? []).length) empty(notificationList, "You have no notifications.");

      const policyList = document.getElementById("polList");
      if (policyList) {
        if (!policies?.length) empty(policyList, "No published policies are available.");
        else {
          policyList.replaceChildren();
          policies.forEach(policy => {
            const card = document.createElement("button");
            card.type = "button";
            card.className = "bento-card flex items-center gap-3 cursor-pointer hover:bg-surface-container-high transition-colors text-left w-full";
            const title = document.createElement("span");
            title.className = "text-body-md font-body-md font-medium text-on-surface flex-1";
            title.textContent = policy.title;
            const version = document.createElement("span");
            version.className = "text-label-sm font-label-sm text-on-surface-variant";
            version.textContent = "v" + policy.version + (policy.effectiveFrom ? " · eff. " + policy.effectiveFrom : "");
            card.append(title, version);
            card.addEventListener("click", () => {
              const target = document.getElementById("polDetailScreen");
              if (target) {
                document.getElementById("pdTitle").textContent = policy.title;
                document.getElementById("pdMeta").textContent = "v" + policy.version;
                document.getElementById("pdName").textContent = policy.title;
                document.getElementById("pdVersion").textContent = "v" + policy.version;
                document.getElementById("pdBadge").textContent = policy.acknowledged ? "Acknowledged" : "Awaiting acknowledgement";
                document.getElementById("pdSummary").textContent = policy.description || "No description provided.";
                document.getElementById("pdFile").textContent = "Policy document";
                document.getElementById("pdPoints").replaceChildren();
                window.pushScreen("polDetailScreen");
              }
            });
            policyList.append(card);
          });
        }
      }
    } catch (error) {
      console.error("[Orchid employee]", error);
      const notice = document.createElement("p");
      notice.className = "text-body-md text-error text-center p-4";
      notice.textContent = "Employee data could not be loaded. Refresh to try again.";
      document.querySelector(".p-4.flex.flex-col.gap-3")?.prepend(notice);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hydrate, { once: true });
  else hydrate();
})();
