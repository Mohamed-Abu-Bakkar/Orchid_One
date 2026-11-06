"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import AdminShell from "@/components/admin/admin-shell";

const ADMIN_ROLES = ["superadmin", "admin", "hr_manager"];

export function AdminAccessGuard() {
  const router = useRouter();
  const session = authClient.useSession();
  const account = useQuery(api.account.getMyAccountStatus, session.data ? {} : "skip");

  useEffect(() => {
    if (!session.isPending && !session.data) router.replace("/login");
    if (account && account.status !== "active") {
      router.replace(account.status === "rejected" ? "/rejected" : account.status === "suspended" ? "/suspended" : "/pending-approval");
    }
    if (account?.status === "active" && !ADMIN_ROLES.includes(account.role)) router.replace("/");
  }, [session.isPending, session.data, account, router]);

  if (session.isPending || (session.data && account === undefined)) {
    return <main className="auth-page"><section className="auth-card"><p className="auth-subtitle">Verifying administrator access…</p></section></main>;
  }
  if (!session.data || !account || account.status !== "active" || !ADMIN_ROLES.includes(account.role)) return null;
  return <AdminShell />;
}
