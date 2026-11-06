import { NextResponse } from "next/server";
import type { Id } from "@/../convex/_generated/dataModel";
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server";
import { api } from "@/../convex/_generated/api";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ policyId: string }> }) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  try {
    const { policyId } = await params;
    const url = await fetchAuthQuery(api.policies.getPolicyFileUrl, { policyId: policyId as Id<"policies"> });
    if (!url) return NextResponse.json({ error: "POLICY_FILE_UNAVAILABLE" }, { status: 404 });
    return NextResponse.redirect(url, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    console.error("[employee policy file]", error);
    return NextResponse.json({ error: "POLICY_FILE_UNAVAILABLE" }, { status: 404 });
  }
}
