import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** The root entry point now leads to the authenticated employee application. */
export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/employee", request.url));
}
