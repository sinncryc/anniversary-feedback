"use client";

import { useMemo, useState } from "react";
import {
  FEEDBACK_MAX_LENGTH,
  FEEDBACK_MIN_LENGTH,
  eventConfig,
} from "@/lib/event-config";

type Status = "idle" | "submitting" | "success";

export default function ParticipantForm() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const trimmed = useMemo(() => message.trim(), [message]);
  const tooShort = trimmed.length > 0 && trimmed.length < FEEDBACK_MIN_LENGTH;
  const canSubmit =
    status !== "submitting" &&
    trimmed.length >= FEEDBACK_MIN_LENGTH &&
    trimmed.length <= FEEDBACK_MAX_LENGTH;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? "Gagal mengirim feedback. Silakan coba lagi.");
        setStatus("idle");
        return;
      }

      setStatus("success");
    } catch {
      setError("Koneksi bermasalah. Periksa jaringan Anda lalu coba lagi.");
      setStatus("idle");
    }
  }

  if (status === "success") {
    return <SuccessScreen />;
  }

  return (
    <main className="relative flex min-h-dvh flex-col bg-ink-900 px-5 pt-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(80%_100%_at_50%_0%,rgba(31,120,209,0.28),transparent_70%)]"
      />

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col">
        <header className="fade-up">
          <p className="text-[0.68rem] font-semibold tracking-[0.28em] text-azure-300/70">
            {eventConfig.organization}
          </p>
          <p className="mt-1 font-display text-sm font-semibold tracking-[0.16em] text-gold-400">
            {eventConfig.name}
          </p>
        </header>

        <h1 className="fade-up mt-8 font-display text-3xl font-extrabold leading-tight text-white">
          Share Your Voice
        </h1>
        <p className="fade-up mt-2 text-sm leading-relaxed text-slate-400">
          Jawaban Anda anonim. Tidak ada nama, email, atau data pribadi yang
          disimpan.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-1 flex-col">
          <label
            htmlFor="feedback"
            className="fade-up block rounded-2xl border border-azure-400/15 bg-ink-700/60 p-4 text-[0.95rem] font-medium leading-relaxed text-slate-100"
          >
            {eventConfig.question}
          </label>

          <textarea
            id="feedback"
            name="feedback"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={FEEDBACK_MAX_LENGTH}
            rows={6}
            autoFocus
            disabled={status === "submitting"}
            placeholder="Tulis satu hal yang menurut Anda paling penting…"
            className="mt-4 w-full resize-none rounded-2xl border border-ink-500 bg-ink-800/80 p-4 text-base leading-relaxed text-white outline-none transition placeholder:text-slate-600 focus:border-azure-400/70 focus:ring-4 focus:ring-azure-500/15 disabled:opacity-60"
          />

          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={tooShort ? "text-amber-400" : "text-slate-500"}>
              {tooShort
                ? `Minimal ${FEEDBACK_MIN_LENGTH} karakter`
                : `Minimal ${FEEDBACK_MIN_LENGTH}, maksimal ${FEEDBACK_MAX_LENGTH} karakter`}
            </span>
            <span
              className={
                trimmed.length > FEEDBACK_MAX_LENGTH - 50
                  ? "text-amber-400"
                  : "text-slate-500"
              }
            >
              {trimmed.length}/{FEEDBACK_MAX_LENGTH}
            </span>
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            >
              {error}
            </p>
          ) : null}

          <div className="flex-1" />

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-gold-300 to-gold-500 text-base font-bold tracking-wide text-ink-900 shadow-[0_12px_32px_rgba(224,180,92,0.28)] transition active:scale-[0.985] disabled:cursor-not-allowed disabled:from-ink-600 disabled:to-ink-600 disabled:text-slate-500 disabled:shadow-none"
          >
            {status === "submitting" ? (
              <>
                <Spinner />
                Mengirim…
              </>
            ) : (
              "Kirim Feedback"
            )}
          </button>

          <p className="mt-4 text-center text-[0.7rem] leading-relaxed text-slate-600">
            Satu peserta, satu masukan. Feedback Anda akan tampil di layar utama
            tanpa identitas.
          </p>
        </form>
      </div>
    </main>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="h-4 w-4 animate-spin rounded-full border-2 border-ink-900/30 border-t-ink-900"
    />
  );
}

function SuccessScreen() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-ink-900 px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_35%,rgba(224,180,92,0.18),transparent_70%)]"
      />
      <div className="fade-up relative w-full max-w-sm text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-gold-400/40 bg-gold-400/10">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-9 w-9 text-gold-300"
            aria-hidden
          >
            <path
              d="M4.5 12.5 9.5 17.5 19.5 7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="mt-7 font-display text-2xl font-extrabold text-white">
          Terima kasih!
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Masukan Anda sudah terkirim dan sedang mengalir di layar utama.
          Selamat menikmati acara.
        </p>

        <p className="mt-8 font-display text-xs font-semibold tracking-[0.24em] text-gold-500/80">
          {eventConfig.name}
        </p>
      </div>
    </main>
  );
}
