import { NextRequest, NextResponse } from "next/server";
import { employeeDashboardGuard } from "@/lib/employee-dashboard-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await employeeDashboardGuard(request, "/");
  if (guard) return guard;
  return NextResponse.redirect(new URL("/employee", request.url));
}
