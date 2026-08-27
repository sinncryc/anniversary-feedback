import Link from "next/link";
import { eventConfig } from "@/lib/event-config";

const ROUTES = [
  {
    href: "/participant",
    label: "Participant",
    description: "Halaman peserta — dibuka dari QR di HP.",
  },
  {
    href: "/display",
    label: "Display",
    description: "Layar besar 16:9 — feedback river + Top 3.",
  },
  {
    href: "/qr",
    label: "QR Board",
    description: "QR code besar untuk dicetak atau ditayangkan.",
  },
  {
    href: "/admin",
    label: "Admin",
    description: "Export JSON, import hasil AI, update Top 3.",
  },
];

export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-ink-900 px-6 py-16">
      <div className="w-full max-w-2xl">
        <p className="text-[0.65rem] font-semibold tracking-[0.3em] text-azure-300/70">
          {eventConfig.organization}
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-white">
          Anniversary Feedback
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {eventConfig.tagline}
        </p>

        <div className="mt-9 grid gap-3 sm:grid-cols-2">
          {ROUTES.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className="group rounded-2xl border border-ink-500 bg-ink-800/60 p-5 transition hover:border-gold-400/40 hover:bg-ink-700/60"
            >
              <p className="font-display text-base font-bold text-white group-hover:text-gold-300">
                {route.label}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                {route.description}
              </p>
              <p className="mt-3 font-mono text-[0.7rem] text-slate-600">
                {route.href}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
