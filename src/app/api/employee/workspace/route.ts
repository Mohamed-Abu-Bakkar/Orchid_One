import { NextResponse } from "next/server";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/../convex/_generated/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [workspace, policies] = await Promise.all([
      fetchAuthQuery(api.employee.myWorkspace, {}),
      fetchAuthQuery(api.policies.listPublishedForEmployee, {}),
    ]);
    return NextResponse.json({ workspace, policies }, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }
}
