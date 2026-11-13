import { NextResponse } from "next/server";
import { fetchAuthMutation, isAuthenticated } from "@/lib/auth-server";
import { api } from "@/../convex/_generated/api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (body?.type === "leave") {
      const result = await fetchAuthMutation(api.employee.submitMyLeaveRequest, {
        leaveTypeId: body.leaveTypeId,
        fromDate: body.fromDate,
        toDate: body.toDate,
        daySelections: body.daySelections,
        reason: body.reason,
      });
      return NextResponse.json({ type: "leave", ...result }, { headers: { "Cache-Control": "no-store" } });
    }

    if (body?.type === "overtime") {
      const requestId = await fetchAuthMutation(api.employee.submitMyOvertimeRequest, {
        workDate: body.workDate,
        requestedMinutes: body.requestedMinutes,
        reason: body.reason,
      });
      return NextResponse.json({ type: "overtime", requestId }, { headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ error: "INVALID_REQUEST_TYPE" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "REQUEST_SUBMISSION_FAILED";
    console.error("[employee request api]", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
