import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * Blocks every admin API except the auth endpoints themselves.
 *
 * /participant, /display and /qr stay public, and /admin renders its own
 * login form, so only the data endpoints are hard-gated here. Each admin
 * route handler re-checks the session as well (defence in depth — proxy can
 * be deployed to the edge/CDN and should not be the only gate).
 */
export async function proxy(request: NextRequest) {
  const authorised = await verifySessionToken(
    request.cookies.get(ADMIN_COOKIE)?.value,
  );
  if (authorised) return NextResponse.next();

  return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
}

export const config = {
  matcher: ["/api/admin/((?!login|logout|session).*)"],
};
