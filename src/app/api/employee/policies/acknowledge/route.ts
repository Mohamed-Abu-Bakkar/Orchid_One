import { NextResponse } from "next/server";
import type { Id } from "@/../convex/_generated/dataModel";
import { fetchAuthMutation, isAuthenticated } from "@/lib/auth-server";
import { api } from "@/../convex/_generated/api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  try {
    const body = await request.json();
    if (typeof body.policyId !== "string" || !body.policyId.trim()) return NextResponse.json({ error: "POLICY_ID_REQUIRED" }, { status: 400 });
    const result = await fetchAuthMutation(api.policies.acknowledge, { policyId: body.policyId as Id<"policies"> });
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    console.error("[employee policy acknowledgement]", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "POLICY_ACKNOWLEDGEMENT_FAILED" }, { status: 400 });
  }
}
