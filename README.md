# Anniversary Feedback

Interactive feedback wall untuk event ulang tahun perusahaan.

Peserta scan QR → menjawab satu pertanyaan di HP → feedback-nya langsung
mengalir mengelilingi layar besar. Di tengah layar tampil **Top 3 saran
terbaik** yang di-update operator lewat proses AI manual (tanpa AI API,
tanpa biaya per-token).

```
QR  →  /participant  →  Supabase  →  realtime  →  /display
                              ↑                       ↑
                        /admin export             /admin publish Top 3
                              ↓                       ↑
                    ChatGPT / Gemini (manual) ────────┘
```

---

## 1. Halaman

| Route          | Untuk siapa      | Dioptimasi untuk |
| -------------- | ---------------- | ---------------- |
| `/participant` | Peserta          | Mobile, tanpa login, satu layar |
| `/display`     | Layar besar / TV | 16:9, fullscreen, tanpa operator |
| `/admin`       | Operator event   | Desktop / tablet, password |
| `/qr`          | Signage / slide  | QR besar untuk dipajang |
| `/`            | Navigasi internal| Daftar semua route |

---

## 2. Menjalankan secara lokal

```bash
npm install
cp .env.example .env.local     # boleh dikosongkan dulu → jalan di DEMO MODE
npm run dev                    # http://localhost:3000
```

Tanpa env Supabase, aplikasi otomatis masuk **DEMO MODE**: data disimpan di
memori server, `/display` memakai polling 3 detik, dan semua route tetap bisa
dicoba. Untuk mencoba `/admin`, minimal set `ADMIN_PASSWORD` di `.env.local`.

Perintah lain:

```bash
npm run build      # production build
npm start          # jalankan hasil build
npx tsc --noEmit   # typecheck
npx eslint .       # lint
```

---

## 3. Setup Supabase (produksi)

1. Buat project baru di [supabase.com](https://supabase.com) (Free tier cukup).
2. Buka **SQL Editor**, paste seluruh isi [`supabase/schema.sql`](supabase/schema.sql), lalu **Run**.
   Script ini membuat tabel, RLS policy, dan mendaftarkan kedua tabel ke Realtime.
3. Buka **Project Settings → API**, salin:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (server-only, jangan pernah
     ditaruh di variable ber-prefix `NEXT_PUBLIC_`)
4. Isi `.env.local`, restart `npm run dev`. Badge di `/display` berubah dari
   `DEMO` menjadi `LIVE` saat websocket realtime tersambung.

### Skema data

**`feedback`** — satu baris per masukan peserta.

| Kolom | Keterangan |
| --- | --- |
| `id` | identity primary key |
| `message` | teks, 10–500 karakter (dicek di DB juga) |
| `session_id` | UUID acak dari cookie httpOnly, tidak terhubung ke identitas siapa pun |
| `is_visible` | `false` bila kena filter kata kasar — tetap tersimpan, tidak pernah tampil di layar |
| `created_at` | timestamptz |

**`ai_summary`** — tepat tiga baris, satu per rank.

| Kolom | Keterangan |
| --- | --- |
| `rank` | primary key, 1–3 |
| `title`, `count`, `summary` | isi kartu Top 3 |
| `updated_at` | dipakai `/display` untuk memicu animasi pergantian |

`rank` dipakai sebagai primary key (bukan `id` terpisah) supaya tombol
**Update Display** cukup satu `upsert on conflict (rank)` — tidak perlu
menghapus baris lama, dan tidak pernah ada state setengah jadi di layar.

### Keamanan RLS

- `anon` boleh **insert** ke `feedback` dan **select** hanya yang `is_visible = true`.
- `anon` boleh **select** `ai_summary`, tapi tidak ada policy update/delete di mana pun —
  jadi anon key yang terekspos di browser tidak bisa mengubah apa yang tampil di proyektor.
- Penulisan `ai_summary` hanya lewat server memakai `SUPABASE_SERVICE_ROLE_KEY`.

---

## 4. Alur AI manual (tanpa AI API)

Setiap ~2–5 menit, operator:

1. Buka `/admin` → **Salin prompt + data** (satu klik: prompt siap pakai +
   seluruh feedback JSON langsung ke clipboard).
   Alternatif: **Export JSON** untuk mengunduh file mentahnya.
2. Paste ke ChatGPT / Gemini.
3. Salin JSON balasan AI → paste di kolom **Import hasil AI** (atau upload file `.json`).
4. JSON divalidasi otomatis; kalau valid, preview Top 3 muncul.
5. Klik **Update Display** → layar besar berganti tanpa reload.

Format export:

```json
{ "responses": [ { "id": 1, "text": "…", "created_at": "2026-08-26T14:00:00Z" } ] }
```

Format yang diterima saat import:

```json
{
  "top_3": [
    { "rank": 1, "title": "Komunikasi Internal",   "count": 32, "summary": "…" },
    { "rank": 2, "title": "Pengembangan Karyawan", "count": 24, "summary": "…" },
    { "rank": 3, "title": "Fasilitas Kerja",       "count": 19, "summary": "…" }
  ]
}
```

Validasi menolak: bukan JSON, `top_3` bukan array, jumlah item ≠ 3, rank
duplikat / di luar 1–3, `title` atau `summary` kosong, `title` > 60 karakter,
`summary` > 220 karakter, `count` bukan bilangan bulat ≥ 0. Pesan errornya
ditulis untuk operator, bukan untuk developer.

---

## 5. Cara kerja feedback river

Empat lane menempel di tepi layar dan mengalir searah jarum jam:
atas (→), kanan (↓), bawah (←), kiri (↑).

- **Satu kartu dilepas tiap 2,3 detik**, bergantian antar lane. Feedback baru
  selalu didahulukan; kalau antrean kosong, feedback lama didaur ulang supaya
  layar tidak pernah kosong.
- **Kecepatan konstan per lane.** Ini yang membuat kartu tidak pernah saling
  menyusul dan menumpuk — jarak yang dibuat saat spawn bertahan sampai akhir.
- **Maksimal 4 kartu aktif per lane (16 node DOM)**, berapa pun jumlah total
  feedback. 20 respons dan 2.000 respons sama ringannya.
- Kartu baru diberi glow emas + titik penanda, lalu jadi kartu biasa.
- Animasi berhenti saat tab tidak aktif, dan mengikuti `prefers-reduced-motion`.

Semua animasi memakai CSS `transform`/`opacity` (tanpa Framer Motion) supaya
berjalan di compositor dan tetap 60fps di laptop event yang biasa-biasa saja.

---

## 6. Privasi & moderasi

- Tidak ada login, nama, email, nomor HP, atau employee ID — tidak diminta,
  tidak disimpan.
- `session_id` hanya UUID acak di cookie httpOnly, dipakai untuk mencegah
  submit ganda dari perangkat yang sama.
- Filter kata kasar (Indonesia + Inggris, tahan leetspeak dan spasi sisipan)
  menandai feedback sebagai `is_visible = false`. Feedback tetap tersimpan
  untuk sintesis AI, tapi tidak pernah muncul di layar besar.
- Daftar kata ada di `src/lib/moderation.ts` — tambahkan istilah internal
  yang perlu diblok sebelum acara.

---

## 7. Deploy ke Vercel

1. Push repo ini ke GitHub.
2. Vercel → **New Project** → import repo. Framework Next.js terdeteksi otomatis.
3. Isi Environment Variables (lihat bagian 8), lalu Deploy.
4. Set `NEXT_PUBLIC_APP_URL` ke domain produksi kalau QR akan dicetak lebih dulu.
5. Sebelum acara: buka `/display` di laptop yang tersambung ke TV/proyektor,
   tekan tombol **FULLSCREEN** di pojok kiri bawah (atau F11). Tombol akan
   memudar sendiri dan layar tidak butuh operator lagi.

Tidak perlu VPS, tidak perlu backend terpisah. Vercel Free + Supabase Free
cukup untuk skala event internal.

---

## 8. Environment variables

| Variable | Wajib? | Keterangan |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ya (produksi) | Project URL Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ya (produksi) | Anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ya untuk publish Top 3 | Server-only. Tanpa ini, `/admin` bisa export tapi tidak bisa update layar |
| `ADMIN_PASSWORD` | ya | Password `/admin` |
| `ADMIN_SESSION_SECRET` | tidak | Secret penandatangan cookie admin. Default: `ADMIN_PASSWORD` |
| `NEXT_PUBLIC_EVENT_ORG` | tidak | Baris kecil di atas nama event |
| `NEXT_PUBLIC_EVENT_NAME` | tidak | Nama event |
| `NEXT_PUBLIC_EVENT_TAGLINE` | tidak | Subjudul |
| `NEXT_PUBLIC_EVENT_QUESTION` | tidak | Pertanyaan untuk peserta |
| `NEXT_PUBLIC_APP_URL` | tidak | Base URL untuk QR. Kosong = pakai origin browser |

Default branding ada di `src/lib/event-config.ts`.

---

## 9. Struktur project

```
src/
  app/
    page.tsx                     hub navigasi
    layout.tsx                   font self-hosted + metadata
    globals.css                  design tokens + seluruh keyframe animasi
    participant/                 halaman peserta (mobile-first)
    display/                     layar besar
    qr/                          QR board
    admin/                       konsol operator
    api/
      feedback/                  POST submit (validasi + moderasi + anti-flood)
      display-state/             GET snapshot publik (seed river + fallback polling)
      admin/{login,logout,session,stats,export,top3}/
  components/display/
    feedback-river.tsx           dispatcher + 4 lane perimeter
    top-three.tsx                kartu Top 3 + medallion
    stage-background.tsx         gradient, grid, partikel
    use-display-data.ts          realtime Supabase / polling + antrean
  lib/
    event-config.ts  types.ts  validation.ts  moderation.ts
    store.ts         supabase.ts  supabase-browser.ts  auth.ts  use-is-client.ts
  proxy.ts                       gate untuk /api/admin/*
supabase/schema.sql              tabel, RLS, realtime
```

---

## 10. Catatan operasional

- **Latihan dulu.** Buka `/display` + `/participant` + `/admin` bersamaan sehari
  sebelum acara, dan lakukan satu siklus export → AI → import penuh sambil
  dihitung waktunya. Langkah manual inilah yang paling mungkin jadi hambatan
  saat hari-H, bukan aplikasinya.
- **Siapkan Top 3 cadangan.** Kalau ChatGPT/Gemini sedang lambat atau
  operator sibuk, layar akan menampilkan Top 3 terakhir yang dipublish —
  jadi publish satu set awal sebelum tamu masuk agar bagian tengah tidak kosong.
- **Satu perangkat satu masukan** ditegakkan lewat cookie httpOnly. Ini bukan
  penghalang mutlak (incognito atau HP lain tetap bisa), tapi cocok untuk
  konteks event tanpa login.
- **Demo mode ≠ produksi.** Di Vercel, penyimpanan memori tidak dibagi antar
  instance serverless. Pastikan env Supabase terisi sebelum acara.
