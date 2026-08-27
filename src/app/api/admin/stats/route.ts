import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { countFeedback, getTop3, usingDemoStore } from "@/lib/store";
import { hasServiceRole } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  try {
    const [total, top3] = await Promise.all([countFeedback(), getTop3()]);
    return NextResponse.json(
      {
        totalResponses: total,
        top3: top3.items,
        lastAiUpdate: top3.updatedAt,
        demoMode: usingDemoStore(),
        canPublish: usingDemoStore() || hasServiceRole(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[admin/stats] failed", error);
    return NextResponse.json({ error: "Gagal memuat statistik." }, { status: 500 });
  }
}
