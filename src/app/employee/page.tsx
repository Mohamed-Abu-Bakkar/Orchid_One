import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { EmployeeRealtimeFrame } from "@/components/employee-realtime-frame";
import { employeeDashboardGuard } from "@/lib/employee-dashboard-guard";

export const dynamic = "force-dynamic";

export default async function EmployeePage() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const request = new NextRequest(new URL("/employee", `${protocol}://${host}`), { headers: requestHeaders });
  const guard = await employeeDashboardGuard(request, "/employee");
  if (guard) redirect(guard.headers.get("location") ?? "/login?next=/employee");

  return <EmployeeRealtimeFrame />;
}
