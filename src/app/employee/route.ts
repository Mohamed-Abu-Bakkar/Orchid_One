import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.redirect(new URL("/login?next=/employee", request.url));
  }

  const filePath = join(process.cwd(), "OrchidHRM", "employee_mobileApp.html");
  let html = await readFile(filePath, "utf8");
  html = html
    .replaceAll('href="assets/', 'href="/employee/assets/')
    .replaceAll('src="assets/', 'src="/employee/assets/')
    .replace('href="manifest.json"', 'href="/manifest.webmanifest"')
    .replace("</body>", '<script src="/employee-controller.js" defer></script>\n</body>');

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
