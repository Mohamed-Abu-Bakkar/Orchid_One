import { NextResponse } from "next/server";
import { fetchAuthMutation, isAuthenticated } from "@/lib/auth-server";
import { api } from "@/../convex/_generated/api";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  try {
    const body = await request.json();
    if (!body?.progressId || !["in_progress", "submitted_for_review"].includes(body.status)) {
      return NextResponse.json({ error: "INVALID_WORK_UPDATE" }, { status: 400 });
    }
    await fetchAuthMutation(api.teamsWork.updateMyWorkStatus, {
      progressId: body.progressId,
      status: body.status,
    });
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "WORK_STATUS_UPDATE_FAILED";
    console.error("[employee work api]", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
