import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { EmployeeMuhurthamCalendar } from "@/components/shared/muhurtham-calendar";
import { employeeDashboardGuard } from "@/lib/employee-dashboard-guard";

export const dynamic = "force-dynamic";

export default async function EmployeeMuhurthamPage() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const request = new NextRequest(new URL("/employee/calendar", `${protocol}://${host}`), { headers: requestHeaders });
  const guard = await employeeDashboardGuard(request, "/employee/calendar");
  if (guard) redirect(guard.headers.get("location") ?? "/login?next=/employee/calendar");
  return <main className="min-h-screen bg-surface p-4 md:p-8"><EmployeeMuhurthamCalendar /></main>;
}
