import { NextResponse } from "next/server";
import { fetchAuthMutation, fetchAuthQuery, isAuthenticated } from "@/lib/auth-server";
import { api } from "@/../convex/_generated/api";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  try {
    const state = await fetchAuthQuery(api.performanceFeedback.myDailyFeedback, {});
    return NextResponse.json(state, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FEEDBACK_LOAD_FAILED";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  try {
    const body = await request.json();
    const result = await fetchAuthMutation(api.performanceFeedback.submitDailyFeedback, {
      workDate: body.workDate,
      completedWork: body.completedWork,
      achievements: body.achievements,
      challenges: body.challenges,
      selfRating: body.selfRating,
      nextDayPlan: body.nextDayPlan,
      additionalFeedback: body.additionalFeedback || undefined,
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FEEDBACK_SUBMISSION_FAILED";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
