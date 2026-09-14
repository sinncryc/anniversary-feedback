import Link from "next/link";
import { designConcept, eventConfig } from "@/lib/event-config";
import EventLogos from "@/components/brand/event-logos";

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
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-ink-900 px-6 py-16">
      <div aria-hidden className="stage-bg">
        <div className="constellation-field" />
      </div>

      <div className="relative w-full max-w-2xl">
        <EventLogos className="mb-8" />

        <p className="text-[0.65rem] font-semibold tracking-[0.3em] text-azure-300/70">
          {eventConfig.organization}
        </p>
        <h1 className="headline-glow mt-2 font-display text-3xl font-extrabold text-white sm:text-4xl">
          {eventConfig.name}
        </h1>
        <p className="mt-2 font-display text-sm italic text-azure-300/80">
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

        <p className="mt-10 text-center text-[0.65rem] tracking-[0.2em] text-slate-600">
          Design concept — {designConcept}
        </p>
      </div>
    </main>
  );
}
