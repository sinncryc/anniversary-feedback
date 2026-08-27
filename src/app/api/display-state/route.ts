import { NextResponse } from "next/server";
import { getDisplayState } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public, read-only snapshot for /display.
 * Used to seed the river on load, and as the polling fallback when Supabase
 * Realtime is unavailable (demo mode / dropped websocket).
 */
export async function GET() {
  try {
    const state = await getDisplayState();
    return NextResponse.json(state, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[display-state] failed", error);
    return NextResponse.json(
      { error: "Gagal memuat data display." },
      { status: 500 },
    );
  }
}
