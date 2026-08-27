import { FEEDBACK_MAX_LENGTH, FEEDBACK_MIN_LENGTH } from "./event-config";
import type { AiResultPayload, TopThreeItem } from "./types";

export type Validated<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function validateFeedbackMessage(raw: unknown): Validated<string> {
  if (typeof raw !== "string") {
    return { ok: false, error: "Feedback harus berupa teks." };
  }
  const message = raw.replace(/\s+/g, " ").trim();
  if (message.length === 0) {
    return { ok: false, error: "Feedback tidak boleh kosong." };
  }
  if (message.length < FEEDBACK_MIN_LENGTH) {
    return {
      ok: false,
      error: `Feedback minimal ${FEEDBACK_MIN_LENGTH} karakter.`,
    };
  }
  if (message.length > FEEDBACK_MAX_LENGTH) {
    return {
      ok: false,
      error: `Feedback maksimal ${FEEDBACK_MAX_LENGTH} karakter.`,
    };
  }
  return { ok: true, value: message };
}

/**
 * Validates the JSON an operator pastes back from ChatGPT/Gemini.
 * Errors are written to be readable by a non-technical event operator.
 */
export function validateAiResult(raw: unknown): Validated<AiResultPayload> {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "JSON harus berupa object dengan key \"top_3\"." };
  }
  const top3 = (raw as Record<string, unknown>).top_3;
  if (!Array.isArray(top3)) {
    return { ok: false, error: "Key \"top_3\" tidak ditemukan atau bukan array." };
  }
  if (top3.length !== 3) {
    return {
      ok: false,
      error: `"top_3" harus berisi tepat 3 item (ditemukan ${top3.length}).`,
    };
  }

  const items: TopThreeItem[] = [];
  const seenRanks = new Set<number>();

  for (let i = 0; i < 3; i += 1) {
    const item = top3[i];
    const label = `Item ke-${i + 1}`;
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      return { ok: false, error: `${label} bukan object.` };
    }
    const obj = item as Record<string, unknown>;

    const rank = Number(obj.rank);
    if (!Number.isInteger(rank) || rank < 1 || rank > 3) {
      return { ok: false, error: `${label}: "rank" harus 1, 2, atau 3.` };
    }
    if (seenRanks.has(rank)) {
      return { ok: false, error: `Rank ${rank} muncul lebih dari sekali.` };
    }
    seenRanks.add(rank);

    const title = typeof obj.title === "string" ? obj.title.trim() : "";
    if (!title) {
      return { ok: false, error: `${label}: "title" wajib diisi.` };
    }
    if (title.length > 60) {
      return { ok: false, error: `${label}: "title" maksimal 60 karakter.` };
    }

    const summary = typeof obj.summary === "string" ? obj.summary.trim() : "";
    if (!summary) {
      return { ok: false, error: `${label}: "summary" wajib diisi.` };
    }
    if (summary.length > 220) {
      return { ok: false, error: `${label}: "summary" maksimal 220 karakter.` };
    }

    const count = Number(obj.count ?? 0);
    if (!Number.isInteger(count) || count < 0) {
      return { ok: false, error: `${label}: "count" harus bilangan bulat >= 0.` };
    }

    items.push({ rank: rank as 1 | 2 | 3, title, count, summary });
  }

  items.sort((a, b) => a.rank - b.rank);
  return { ok: true, value: { top_3: items } };
}
