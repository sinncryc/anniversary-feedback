import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { resetAllData } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Wipes all feedback and the published Top 3 — for clearing trial-and-error
 * data between test runs, or right before the real event so the audience
 * screen starts from zero. Irreversible; the admin dashboard button confirms
 * with the operator before calling this.
 */
export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  try {
    await resetAllData();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/reset] failed", error);
    const message = error instanceof Error ? error.message : "Gagal mereset data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
