import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, adminAuthConfigured, verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authenticated = await verifySessionToken(
    request.cookies.get(ADMIN_COOKIE)?.value,
  );
  return NextResponse.json(
    { authenticated, configured: adminAuthConfigured() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
