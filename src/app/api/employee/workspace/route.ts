import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth-server";
import { fetchAuthQuery } from "@/lib/auth-server";
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
