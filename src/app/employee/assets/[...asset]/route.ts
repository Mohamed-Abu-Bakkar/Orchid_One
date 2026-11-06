import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const contentTypes: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml", ".webp": "image/webp", ".ico": "image/x-icon",
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ asset: string[] }> },
) {
  if (!(await isAuthenticated())) return new NextResponse(null, { status: 401 });
  const { asset } = await context.params;
  const root = resolve(process.cwd(), "OrchidHRM", "assets");
  const file = resolve(root, ...asset);
  if (!file.startsWith(root + sep)) return new NextResponse(null, { status: 400 });
  try {
    const bytes = await readFile(file);
    const extension = file.slice(file.lastIndexOf(".")).toLowerCase();
    return new NextResponse(bytes, { headers: { "Content-Type": contentTypes[extension] ?? "application/octet-stream", "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
