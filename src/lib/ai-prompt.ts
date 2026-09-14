import type { ExportPayload } from "./types";

/**
 * Shared between the manual "Copy Prompt" button in /admin (operator pastes
 * this into ChatGPT/Gemini/Claude by hand) and the automatic cron route
 * (src/app/api/cron/auto-summarize/route.ts, which sends the same prompt to
 * the Gemini API on a timer). Kept in one place so the two paths can never
 * drift apart — whatever the manual flow asks the AI to do, the automatic
 * flow asks for exactly the same thing.
 */
export const AI_PROMPT = `Kamu adalah analis Employee Voice. Di bawah ini adalah JSON berisi seluruh feedback anonim karyawan pada acara ulang tahun perusahaan.

Tugas:
1. Kelompokkan seluruh feedback ke dalam tema-tema yang bermakna (bahasa Indonesia).
2. Pilih 3 tema dengan jumlah feedback terbanyak.
3. Untuk setiap tema, tulis judul singkat (maks 4 kata) dan satu kalimat ringkasan yang netral, konstruktif, dan layak ditampilkan di layar besar.

Balas HANYA dengan JSON valid, tanpa penjelasan lain, dalam format persis ini:
{
  "top_3": [
    { "rank": 1, "title": "...", "count": 0, "summary": "..." },
    { "rank": 2, "title": "...", "count": 0, "summary": "..." },
    { "rank": 3, "title": "...", "count": 0, "summary": "..." }
  ]
}

Aturan: "count" = jumlah feedback pada tema tersebut. "title" maks 60 karakter. "summary" maks 220 karakter.

Data feedback:
`;

export function buildAiPrompt(payload: ExportPayload): string {
  return AI_PROMPT + JSON.stringify(payload, null, 2);
}
