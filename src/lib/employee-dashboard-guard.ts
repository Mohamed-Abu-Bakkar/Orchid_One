import { NextRequest, NextResponse } from "next/server";
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server";
import { api } from "@/../convex/_generated/api";

/**
 * Server-side gate for the employee dashboard pages.
 * Unauthenticated users go to login; signed-in users without a linked
 * employee record (missing profile row or no employeeId) go to the
 * profile-pending page; back-office roles go to the admin dashboard.
 * Returns null when the request may proceed.
 */
export async function employeeDashboardGuard(
  request: NextRequest,
  loginNext: string
): Promise<NextResponse | null> {
  if (!(await isAuthenticated())) {
    return NextResponse.redirect(new URL(`/login?next=${loginNext}`, request.url));
  }

  try {
    const account = await fetchAuthQuery(api.account.getMyAccountStatus, {});
    if (!account) {
      return NextResponse.redirect(new URL("/profile-pending", request.url));
    }
    if (account.role !== "employee") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (!account.employeeId) {
      return NextResponse.redirect(new URL("/profile-pending", request.url));
    }
  } catch {
    // Status lookup failed — serve the page and let the client re-check.
  }

  return null;
}
