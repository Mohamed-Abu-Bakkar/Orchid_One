"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

export function EmployeeRealtimeFrame() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [frameReady, setFrameReady] = useState(false);
  const workspace = useQuery(api.employee.myWorkspace, {});
  const policies = useQuery(api.policies.listPublishedForEmployee, {});
  const workDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const work = useQuery(api.teamsWork.myWorkDashboard, { workDate });
  const markNotificationRead = useMutation(api.notifications.markRead);
  const markAllNotificationsRead = useMutation(api.notifications.markAllRead);
  const submitDateOfBirth = useMutation(api.employee.submitMyDateOfBirth);
  const updateMyProfile = useMutation(api.employee.updateMyProfile);

  useEffect(() => {
    if (!frameReady || workspace === undefined || policies === undefined || work === undefined) return;
    frameRef.current?.contentWindow?.postMessage(
      { type: "ORCHID_EMPLOYEE_WORKSPACE", payload: { workspace, policies, work } },
      window.location.origin
    );
  }, [frameReady, workspace, policies, work]);

  useEffect(() => {
    const handleNotificationAction = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      const message = event.data;
      if (message?.type !== "ORCHID_NOTIFICATION_ACTION") return;
      if (message.action === "mark-read" && typeof message.notificationId === "string") {
        void markNotificationRead({ notificationId: message.notificationId as any });
      } else if (message.action === "mark-all-read") {
        void markAllNotificationsRead({});
      } else if (message.action === "update-my-profile") {
        void updateMyProfile({
          firstName: String(message.firstName ?? ""), lastName: String(message.lastName ?? ""),
          dateOfBirth: String(message.dateOfBirth ?? ""),
          emergencyContact: message.emergencyContact && typeof message.emergencyContact === "object"
            ? { name: String(message.emergencyContact.name ?? ""), relationship: String(message.emergencyContact.relationship ?? ""), phone: String(message.emergencyContact.phone ?? "") }
            : null,
        }).then(
          () => frameRef.current?.contentWindow?.postMessage({ type: "ORCHID_PROFILE_UPDATE_RESULT", success: true }, window.location.origin),
          (error: unknown) => frameRef.current?.contentWindow?.postMessage({ type: "ORCHID_PROFILE_UPDATE_RESULT", success: false, error: error instanceof Error ? error.message : "Unable to update your profile." }, window.location.origin)
        );
      } else if (message.action === "submit-date-of-birth" && typeof message.dateOfBirth === "string") {
        void submitDateOfBirth({ dateOfBirth: message.dateOfBirth }).then(
          () => frameRef.current?.contentWindow?.postMessage({ type: "ORCHID_DATE_OF_BIRTH_RESULT", success: true }, window.location.origin),
          (error: unknown) => frameRef.current?.contentWindow?.postMessage({ type: "ORCHID_DATE_OF_BIRTH_RESULT", success: false, error: error instanceof Error ? error.message : "Unable to save date of birth." }, window.location.origin)
        );
      }
    };
    window.addEventListener("message", handleNotificationAction);
    return () => window.removeEventListener("message", handleNotificationAction);
  }, [markNotificationRead, markAllNotificationsRead, submitDateOfBirth, updateMyProfile]);
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
