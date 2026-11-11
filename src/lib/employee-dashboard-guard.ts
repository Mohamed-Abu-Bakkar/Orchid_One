import { NextRequest, NextResponse } from "next/server";
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server";
import { api } from "@/../convex/_generated/api";

/**
 * Server-side gate for the employee dashboard.
 * Employees must have a linked employee record. Superadmins may enter
 * the employee experience as a preview without linking themselves as staff.
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
    if (account.status !== "active") {
      return NextResponse.redirect(new URL("/suspended", request.url));
    }
    if (account.role !== "employee" && account.role !== "superadmin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    // Preview mode for Superadmin does not require an employee profile link.
    if (account.role === "employee" && !account.employeeId) {
      return NextResponse.redirect(new URL("/profile-pending", request.url));
    }
  } catch {
    // Status lookup failed — serve the page and let the client re-check.
  }

  return null;
}
