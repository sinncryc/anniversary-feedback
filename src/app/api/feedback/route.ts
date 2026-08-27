import { NextResponse, type NextRequest } from "next/server";
import { isClean } from "@/lib/moderation";
import { insertFeedback } from "@/lib/store";
import { validateFeedbackMessage } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_COOKIE = "af_session";
const SUBMITTED_COOKIE = "af_submitted";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * In-process spam brake.
 *
 * Deliberately generous on IP: at a company event hundreds of phones share
 * one NAT'd public IP, so a tight per-IP limit would lock out the room. The
 * real one-per-person rule is the httpOnly cookie below; this only stops a
 * script hammering the endpoint.
 */
const IP_WINDOW_MS = 60_000;
const IP_MAX_PER_WINDOW = 60;
const ipHits = new Map<string, number[]>();

function ipFlooding(ip: string): boolean {
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS);
  hits.push(now);
  ipHits.set(ip, hits);

  if (ipHits.size > 2000) {
    for (const [key, times] of ipHits) {
      if (times.every((t) => now - t > IP_WINDOW_MS)) ipHits.delete(key);
    }
  }
  return hits.length > IP_MAX_PER_WINDOW;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON yang valid." }, { status: 400 });
  }

  const message = (body as Record<string, unknown> | null)?.message;
  const validated = validateFeedbackMessage(message);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  if (request.cookies.get(SUBMITTED_COOKIE)?.value === "1") {
    return NextResponse.json(
      { error: "Anda sudah mengirim feedback dari perangkat ini. Terima kasih!" },
      { status: 409 },
    );
  }

  const sessionId = request.cookies.get(SESSION_COOKIE)?.value ?? crypto.randomUUID();

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (ipFlooding(ip)) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
      { status: 429 },
    );
  }

  try {
    const row = await insertFeedback({
      message: validated.value,
      sessionId,
      isVisible: isClean(validated.value),
    });

    const response = NextResponse.json({ ok: true, id: row.id }, { status: 201 });
    response.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ONE_YEAR,
    });
    response.cookies.set(SUBMITTED_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ONE_YEAR,
    });
    return response;
  } catch (error) {
    console.error("[feedback] insert failed", error);
    return NextResponse.json(
      { error: "Gagal menyimpan feedback. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
