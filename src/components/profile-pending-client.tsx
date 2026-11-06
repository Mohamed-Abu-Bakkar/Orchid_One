"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type State = "checking" | "pending" | "error";

export function ProfilePendingClient() {
  const router = useRouter();
  const [state, setState] = useState<State>("checking");
  const [email, setEmail] = useState<string | null>(null);

  const check = useCallback(async () => {
    setState("checking");
    try {
      const sessionResponse = await fetch("/api/auth/get-session", {
        credentials: "same-origin",
        cache: "no-store"
      });
      const sessionData = sessionResponse.ok ? await sessionResponse.json() : null;
      const user = sessionData?.user ?? null;
      if (!user) {
        router.replace("/login");
        return;
      }
      setEmail(user.email ?? null);

      const workspaceResponse = await fetch("/api/employee/workspace", {
        credentials: "same-origin",
        cache: "no-store"
      });
      if (workspaceResponse.status === 401) {
        router.replace("/login");
        return;
      }
      if (!workspaceResponse.ok) {
        setState("error");
        return;
      }
      const { workspace } = await workspaceResponse.json();
      if (workspace?.linked && workspace?.profile) {
        router.replace("/");
        return;
      }
      setState("pending");
    } catch {
      setState("error");
    }
  }, [router]);

  useEffect(() => {
    void check();
  }, [check]);

  async function signOut() {
    try {
      await authClient.signOut();
    } catch {
      // Continue to the login screen even if sign-out fails.
    }
    router.replace("/login");
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <span className="auth-mark">✿</span>
          <span>ORCHID ONE</span>
        </div>
        <p className="auth-eyebrow">ACCOUNT SETUP</p>
        <h1>Profile not linked yet</h1>
        <p className="auth-subtitle">
          You are signed in{email ? ` as ${email}` : ""}, but HR has not linked an employee
          record to your account yet. The employee dashboard becomes available as soon as your
          profile is linked.
        </p>

        {state === "checking" && (
          <p className="auth-footnote" role="status">Checking your account status…</p>
        )}
        {state === "error" && (
          <p className="auth-error" role="alert">
            We could not verify your account status. Please try again.
          </p>
        )}
        {state === "pending" && (
          <p className="auth-footnote" role="status">
            Waiting for your HR administrator to link an employee record to this account.
          </p>
        )}

        <button className="auth-submit" type="button" onClick={() => void check()} disabled={state === "checking"}>
          {state === "checking" ? "Checking…" : "Refresh status"}
        </button>
        <p className="auth-switch">
          <button
            type="button"
            onClick={() => void signOut()}
            style={{ border: 0, background: "none", padding: 0, font: "inherit", color: "var(--primary)", fontWeight: 600, cursor: "pointer" }}
          >
            Sign out
          </button>
        </p>
        <p className="auth-footnote" style={{ marginTop: 14 }}>
          Need help? Contact your HR administrator.
        </p>
      </section>
    </main>
  );
}
