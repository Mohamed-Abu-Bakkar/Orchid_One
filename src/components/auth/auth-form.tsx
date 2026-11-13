"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useConvexAuth } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { authClient } from "@/lib/auth-client";

type Mode = "login" | "register";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading: convexAuthLoading } = useConvexAuth();
  const ensureUserProfile = useMutation(api.account.ensureUserProfile);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [awaitingConvexAuth, setAwaitingConvexAuth] = useState(false);

  useEffect(() => {
    if (!awaitingConvexAuth || convexAuthLoading || !isAuthenticated) return;

    let cancelled = false;
    async function provisionAccount() {
      try {
        // Better Auth can establish its session before Convex has validated
        // the corresponding JWT. Wait for Convex auth before calling mutations.
        const profile = await ensureUserProfile({});
        if (cancelled) return;

        console.info("[Orchid One][Auth] Login role:", profile.role, "| Account status:", profile.status);

        if (profile.status === "suspended") {
          await authClient.signOut();
          if (!cancelled) setError("This account is suspended. Contact the Orchid Flowers administrator.");
          return;
        }

        router.replace(profile.role === "employee" ? "/" : "/admin");
        router.refresh();
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Your session could not be verified. Please try signing in again.");
        }
      } finally {
        if (!cancelled) {
          setAwaitingConvexAuth(false);
          setBusy(false);
        }
      }
    }

    void provisionAccount();
    return () => { cancelled = true; };
  }, [awaitingConvexAuth, convexAuthLoading, isAuthenticated, ensureUserProfile, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const result = mode === "register"
        ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
        : await authClient.signIn.email({ email: email.trim(), password });

      if (result.error) {
        throw new Error(result.error.message || (mode === "register" ? "Registration failed" : "Sign in failed"));
      }

      // Do not call a Convex authenticated mutation yet. The provider must
      // first receive and validate the JWT issued by Better Auth.
      setAwaitingConvexAuth(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand"><img className="auth-mark" src="/assets/orchid-logo.png" alt="Orchid One logo" /><span>ORCHID ONE</span></div>
        <p className="auth-eyebrow">ORCHID FLOWERS</p>
        <h1>{mode === "register" ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-subtitle">{mode === "register" ? "Create an account and start using the Orchid workforce portal." : "Sign in to continue to your Orchid workspace."}</p>
        <form onSubmit={submit} className="auth-form">
          {mode === "register" && <label>Full name<input autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" /></label>}
          <label>Email address<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
          <label>Password<input type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" suppressHydrationWarning /></label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {awaitingConvexAuth && <p className="employee-muted" role="status">Verifying your secure session…</p>}
          <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"}</button>
        </form>
        <p className="auth-switch">{mode === "register" ? "Already have an account? " : "New to Orchid One? "}<a href={mode === "register" ? "/login" : "/register"}>{mode === "register" ? "Sign in" : "Create an account"}</a></p>
      </section>
    </main>
  );
}
