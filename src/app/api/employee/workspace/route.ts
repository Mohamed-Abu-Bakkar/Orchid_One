import { NextResponse } from "next/server";
import { fetchAuthMutation, fetchAuthQuery, isAuthenticated } from "@/lib/auth-server";
import { api } from "@/../convex/_generated/api";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  try {
    const [workspace, policies] = await Promise.all([
      fetchAuthQuery(api.employee.myWorkspace, {}),
      fetchAuthQuery(api.policies.listPublishedForEmployee, {}),
    ]);
    return NextResponse.json({ workspace, policies }, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  } catch (error) {
    console.error("[employee workspace api]", error);
    return NextResponse.json({ error: "WORKSPACE_UNAVAILABLE" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  try {
    const body = await request.json();
    const result = await fetchAuthMutation(api.attendance.recordPunch, {
      eventType: body.eventType,
      latitude: body.latitude,
      longitude: body.longitude,
      accuracyM: body.accuracyM,
      clientTimestamp: body.clientTimestamp,
      idempotencyKey: body.idempotencyKey,
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[employee attendance api]", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "ATTENDANCE_PUNCH_FAILED" }, { status: 400 });
  }
}
