"use client";

import { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { eventConfig } from "@/lib/event-config";
import { useIsClient } from "@/lib/use-is-client";

export default function QrBoard() {
  const isClient = useIsClient();

  // NEXT_PUBLIC_APP_URL wins (useful when the QR is printed ahead of the
  // event); otherwise the QR points at whatever host this page is served from.
  const url = useMemo(() => {
    const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
    if (configured) return `${configured}/participant`;
    if (!isClient) return "";
    return `${window.location.origin}/participant`;
  }, [isClient]);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-ink-900 px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_10%,rgba(31,120,209,0.22),transparent_65%),radial-gradient(60%_50%_at_50%_100%,rgba(224,180,92,0.14),transparent_70%)]"
      />

      <div className="relative flex flex-col items-center text-center">
        <p className="text-[0.7rem] font-semibold tracking-[0.34em] text-azure-300/70">
          {eventConfig.organization}
        </p>
        <p className="mt-2 font-display text-sm font-bold tracking-[0.2em] text-gold-400">
          {eventConfig.name}
        </p>

        <h1 className="headline-glow gold-text mt-8 font-display text-[clamp(2rem,5vw,4.5rem)] font-extrabold leading-tight tracking-tight">
          SCAN &amp; SHARE YOUR VOICE
        </h1>

        <div className="mt-10 rounded-3xl border border-gold-400/25 bg-white p-[clamp(1rem,2vw,1.75rem)] shadow-[0_30px_90px_rgba(224,180,92,0.18)]">
          {url ? (
            <QRCodeSVG
              value={url}
              level="M"
              marginSize={0}
              className="h-[clamp(200px,34vh,420px)] w-[clamp(200px,34vh,420px)]"
            />
          ) : (
            <div className="h-[clamp(200px,34vh,420px)] w-[clamp(200px,34vh,420px)] animate-pulse rounded-xl bg-slate-200" />
          )}
        </div>

        <ol className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[clamp(0.75rem,1.1vw,1rem)] text-slate-400">
          {["Scan QR di atas", "Jawab satu pertanyaan", "Kirim — selesai"].map(
            (stepText, index) => (
              <li key={stepText} className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gold-400/40 text-[0.7rem] font-bold text-gold-300">
                  {index + 1}
                </span>
                {stepText}
              </li>
            ),
          )}
        </ol>

        <p className="mt-8 max-w-[46ch] text-xs leading-relaxed text-slate-500">
          Anonim — tidak perlu login, tidak ada nama, email, atau nomor HP yang
          diminta.
        </p>

        {url ? (
          <p className="mt-3 font-mono text-[0.75rem] text-slate-500">{url}</p>
        ) : null}
      </div>
    </main>
  );
}
