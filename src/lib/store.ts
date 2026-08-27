import "server-only";

import {
  getAdminClient,
  getServerClient,
  hasServiceRole,
  isSupabaseConfigured,
} from "./supabase";
import type { DisplayState, FeedbackRow, TopThreeItem } from "./types";

/** How much recent feedback the display seeds its river with. */
export const RIVER_SEED_LIMIT = 120;

/* ------------------------------------------------------------------ */
/* In-memory demo store                                                */
/* ------------------------------------------------------------------ */
/*
 * Used only when Supabase env vars are absent, so the app can be run and
 * demoed locally with zero setup. It is per-process and NOT durable — never
 * rely on it in production (a serverless deploy has many processes).
 */

type DemoStore = {
  feedback: FeedbackRow[];
  nextId: number;
  top3: TopThreeItem[];
  top3UpdatedAt: string | null;
};

const globalForDemo = globalThis as unknown as { __afDemoStore?: DemoStore };

function demo(): DemoStore {
  globalForDemo.__afDemoStore ??= {
    feedback: [],
    nextId: 1,
    top3: [],
    top3UpdatedAt: null,
  };
  return globalForDemo.__afDemoStore;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export const usingDemoStore = () => !isSupabaseConfigured();

/**
 * Reads run with the service role when it is available so admin exports and
 * counters can see moderated-out rows too; otherwise they fall back to the
 * anon key and RLS decides what is visible.
 */
function readClient() {
  return hasServiceRole() ? getAdminClient() : getServerClient();
}

export async function insertFeedback(params: {
  message: string;
  sessionId: string;
  isVisible: boolean;
}): Promise<FeedbackRow> {
  if (usingDemoStore()) {
    const row: FeedbackRow = {
      id: demo().nextId++,
      message: params.message,
      created_at: new Date().toISOString(),
      is_visible: params.isVisible,
    };
    demo().feedback.push(row);
    return row;
  }

  const { data, error } = await getServerClient()
    .from("feedback")
    .insert({
      message: params.message,
      session_id: params.sessionId,
      is_visible: params.isVisible,
    })
    .select("id, message, created_at, is_visible")
    .single();

  if (error) throw new Error(error.message);
  return data as FeedbackRow;
}

export async function listFeedback(options?: {
  limit?: number;
  onlyVisible?: boolean;
}): Promise<FeedbackRow[]> {
  const limit = options?.limit ?? 5000;
  const onlyVisible = options?.onlyVisible ?? false;

  if (usingDemoStore()) {
    return demo()
      .feedback.filter((f) => (onlyVisible ? f.is_visible : true))
      .slice(-limit)
      .reverse();
  }

  let query = readClient()
    .from("feedback")
    .select("id, message, created_at, is_visible")
    .order("id", { ascending: false })
    .limit(limit);

  if (onlyVisible) query = query.eq("is_visible", true);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as FeedbackRow[];
}

export async function countFeedback(): Promise<number> {
  if (usingDemoStore()) return demo().feedback.length;

  const { count, error } = await readClient()
    .from("feedback")
    .select("id", { count: "exact", head: true });

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getTop3(): Promise<{
  items: TopThreeItem[];
  updatedAt: string | null;
}> {
  if (usingDemoStore()) {
    return { items: demo().top3, updatedAt: demo().top3UpdatedAt };
  }

  const { data, error } = await readClient()
    .from("ai_summary")
    .select("rank, title, count, summary, updated_at")
    .order("rank", { ascending: true });

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const items = rows.map((r) => ({
    rank: r.rank as 1 | 2 | 3,
    title: r.title as string,
    count: r.count as number,
    summary: r.summary as string,
  }));
  const updatedAt =
    rows.length > 0
      ? rows
          .map((r) => r.updated_at as string)
          .sort()
          .at(-1) ?? null
      : null;

  return { items, updatedAt };
}

export async function setTop3(items: TopThreeItem[]): Promise<string> {
  const updatedAt = new Date().toISOString();

  if (usingDemoStore()) {
    demo().top3 = items;
    demo().top3UpdatedAt = updatedAt;
    return updatedAt;
  }

  if (!hasServiceRole()) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY belum di-set di server, jadi Top 3 tidak bisa dipublish.",
    );
  }

  const { error } = await getAdminClient()
    .from("ai_summary")
    .upsert(
      items.map((item) => ({
        rank: item.rank,
        title: item.title,
        count: item.count,
        summary: item.summary,
        updated_at: updatedAt,
      })),
      { onConflict: "rank" },
    );

  if (error) throw new Error(error.message);
  return updatedAt;
}

export async function getDisplayState(): Promise<DisplayState> {
  const [rows, top3, total] = await Promise.all([
    listFeedback({ limit: RIVER_SEED_LIMIT, onlyVisible: true }),
    getTop3(),
    countFeedback(),
  ]);

  return {
    feedback: rows.map((r) => ({
      id: r.id,
      text: r.message,
      created_at: r.created_at,
    })),
    top3: top3.items,
    top3UpdatedAt: top3.updatedAt,
    totalResponses: total,
    demoMode: usingDemoStore(),
  };
}
