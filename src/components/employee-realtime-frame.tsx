"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

export function EmployeeRealtimeFrame() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [frameReady, setFrameReady] = useState(false);
  const workspace = useQuery(api.employee.myWorkspace, {});
  const policies = useQuery(api.policies.listPublishedForEmployee, {});
  const workDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const work = useQuery(api.teamsWork.myWorkDashboard, { workDate });

  useEffect(() => {
    if (!frameReady || workspace === undefined || policies === undefined || work === undefined) return;
    frameRef.current?.contentWindow?.postMessage(
      { type: "ORCHID_EMPLOYEE_WORKSPACE", payload: { workspace, policies, work } },
      window.location.origin
    );
  }, [frameReady, workspace, policies, work]);

  return (
    <iframe
      ref={frameRef}
      src="/employee/content"
      title="Orchid One employee workspace"
      onLoad={() => setFrameReady(true)}
      onError={() => setFrameReady(false)}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "block",
        width: "100%",
        minWidth: "100vw",
        maxWidth: "none",
        height: "100dvh",
        minHeight: "100dvh",
        flex: "0 0 100vw",
        alignSelf: "stretch",
        boxSizing: "border-box",
        margin: 0,
        padding: 0,
        border: 0,
        background: "#fcf9f8",
      }}
      allow="geolocation"
    />
  );
}
