import { NextResponse } from "next/server";
import { fetchAuthMutation, isAuthenticated } from "@/lib/auth-server";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

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

    if (body?.type === "overtime_confirmation") {
      if (typeof body.requestId !== "string" || typeof body.confirmed !== "boolean") {
        return NextResponse.json({ error: "INVALID_OVERTIME_CONFIRMATION" }, { status: 400 });
      }
      const result = await fetchAuthMutation(api.employee.confirmMyOvertimeRequest, {
        requestId: body.requestId as Id<"overtimeRequests">,
        confirmed: body.confirmed,
      });
      return NextResponse.json({ type: "overtime_confirmation", ...result }, {
        headers: { "Cache-Control": "no-store" },
      });
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
    const code = message.match(/Error:\\s*([A-Z][A-Z0-9_]+)/)?.[1]
      ?? message.match(/^([A-Z][A-Z0-9_]+)$/)?.[1]
      ?? "REQUEST_SUBMISSION_FAILED";
    console.error("[employee request api]", { code, message });
    return NextResponse.json({ error: code }, {
      status: code === "UNAUTHENTICATED" ? 401 : 400,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
