"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

export function EmployeeRealtimeFrame() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [frameReady, setFrameReady] = useState(false);
  const [wageMinuteBucket, setWageMinuteBucket] = useState(() => Math.floor(Date.now() / 60000));
  const workspace = useQuery(api.employee.myWorkspace, {});
  const wageEstimate = useQuery(api.employee.myTodayWageEstimate, { minuteBucket: wageMinuteBucket });
  const policies = useQuery(api.policies.listPublishedForEmployee, {});
  const workDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const work = useQuery(api.teamsWork.myWorkDashboard, { workDate });
  useEffect(() => {
    const timer = window.setInterval(() => setWageMinuteBucket(Math.floor(Date.now() / 60000)), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const markNotificationRead = useMutation(api.notifications.markRead);
  const markAllNotificationsRead = useMutation(api.notifications.markAllRead);
  const submitDateOfBirth = useMutation(api.employee.submitMyDateOfBirth);
  const completeMyProfile = useMutation(api.employee.completeMyProfile);
  const updateMyProfile = useMutation(api.employee.updateMyProfile);

  useEffect(() => {
    if (!frameReady || workspace === undefined || policies === undefined || work === undefined || wageEstimate === undefined) return;
    frameRef.current?.contentWindow?.postMessage(
      { type: "ORCHID_EMPLOYEE_WORKSPACE", payload: { workspace, policies, work, wageEstimate } },
      window.location.origin
    );
  }, [frameReady, workspace, policies, work, wageEstimate]);

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
      } else if (message.action === "complete-my-profile") {
        void completeMyProfile({
          dateOfBirth: String(message.dateOfBirth ?? ""),
          address: {
            line1: String(message.address?.line1 ?? ""), line2: String(message.address?.line2 ?? "") || undefined,
            city: String(message.address?.city ?? ""), district: String(message.address?.district ?? "") || undefined,
            state: String(message.address?.state ?? ""), postalCode: String(message.address?.postalCode ?? ""),
            country: String(message.address?.country ?? "India"),
          },
          emergencyContact: message.emergencyContact && typeof message.emergencyContact === "object"
            ? { name: String(message.emergencyContact.name ?? ""), relationship: String(message.emergencyContact.relationship ?? ""), phone: String(message.emergencyContact.phone ?? "") }
            : null,
          bankDetails: message.bankDetails && typeof message.bankDetails === "object"
            ? { accountHolder: String(message.bankDetails.accountHolder ?? ""), bankName: String(message.bankDetails.bankName ?? ""), accountNumber: String(message.bankDetails.accountNumber ?? ""), ifsc: String(message.bankDetails.ifsc ?? "") }
            : null,
        }).then(
          () => frameRef.current?.contentWindow?.postMessage({ type: "ORCHID_PROFILE_COMPLETION_RESULT", success: true }, window.location.origin),
          (error: unknown) => frameRef.current?.contentWindow?.postMessage({ type: "ORCHID_PROFILE_COMPLETION_RESULT", success: false, error: error instanceof Error ? error.message : "Unable to complete your profile." }, window.location.origin)
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
  }, [markNotificationRead, markAllNotificationsRead, submitDateOfBirth, updateMyProfile, completeMyProfile]);
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
