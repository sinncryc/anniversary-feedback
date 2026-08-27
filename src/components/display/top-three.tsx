"use client";

import { useMemo } from "react";
import { eventConfig } from "@/lib/event-config";
import type { TopThreeItem } from "@/lib/types";

/*
 * Rank badges are drawn rather than emoji: 🥇🥈🥉 render as flat clip-art on
 * most projectors and change shape between operating systems. A gradient
 * medallion reads as gold/silver/bronze everywhere and matches the palette.
 */
const MEDALS: Record<
  number,
  { label: string; accent: string; badge: string; ring: string }
> = {
  1: {
    label: "RANK 01",
    accent: "text-gold-300",
    badge: "bg-[linear-gradient(150deg,#fff2cf_0%,#f0cd80_42%,#b6832c_100%)] text-[#3d2a06]",
    ring: "ring-gold-300/35",
  },
  2: {
    label: "RANK 02",
    accent: "text-slate-200",
    badge: "bg-[linear-gradient(150deg,#f7fafd_0%,#ccd5e2_45%,#8b95a6_100%)] text-[#222834]",
    ring: "ring-slate-300/25",
  },
  3: {
    label: "RANK 03",
    accent: "text-amber-500/90",
    badge: "bg-[linear-gradient(150deg,#f6cda6_0%,#cd8f57_45%,#8a5626_100%)] text-[#3a2208]",
    ring: "ring-amber-500/25",
  },
};

export default function TopThree({
  items,
  updatedAt,
}: {
  items: TopThreeItem[];
  updatedAt: string | null;
}) {
  // Re-keying on updatedAt replays the entrance animation whenever the
  // operator publishes a new synthesis — a smooth swap, no reload.
  const version = updatedAt ?? "initial";
  const ordered = useMemo(
    () => items.slice().sort((a, b) => a.rank - b.rank),
    [items],
  );

  return (
    <div className="flex w-full max-w-[min(1180px,74vw)] flex-col items-center">
      <p
        key={`headline-${version}`}
        className="fade-up font-display text-[clamp(0.72rem,1.05vw,1.05rem)] font-semibold tracking-[0.42em] text-azure-300/75"
      >
        {eventConfig.displayHeadline}
      </p>

      <h1
        key={`sub-${version}`}
        className="headline-glow gold-text mt-[0.55vh] font-display text-[clamp(1.9rem,3.4vw,4rem)] font-extrabold leading-[1.06] tracking-tight"
      >
        {eventConfig.displaySubHeadline}
      </h1>

      {ordered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-[2.6vh] grid w-full grid-cols-3 items-end gap-[1.4vw]">
          {[2, 1, 3].map((rank, column) => {
            const item = ordered.find((entry) => entry.rank === rank);
            if (!item) return <div key={rank} />;
            return (
              <RankCard
                key={`${version}-${rank}`}
                item={item}
                delay={column * 130}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function RankCard({ item, delay }: { item: TopThreeItem; delay: number }) {
  const medal = MEDALS[item.rank];
  const isChampion = item.rank === 1;

  return (
    <article
      className={`rank-card ${isChampion ? "rank-card-1" : ""} flex flex-col ${
        isChampion ? "px-[1.9vw] py-[3.1vh]" : "px-[1.5vw] py-[2.3vh]"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <header className="flex items-center justify-between gap-3">
        <span
          className={`font-display text-[clamp(0.58rem,0.68vw,0.82rem)] font-bold tracking-[0.3em] ${medal.accent}`}
        >
          {medal.label}
        </span>
        <span
          aria-hidden
          className={`flex shrink-0 items-center justify-center rounded-full font-display font-extrabold shadow-[0_6px_18px_rgba(0,0,0,0.45)] ring-1 ${medal.badge} ${medal.ring} ${
            isChampion
              ? "h-[clamp(2.2rem,3.2vw,3.6rem)] w-[clamp(2.2rem,3.2vw,3.6rem)] text-[clamp(1rem,1.5vw,1.7rem)]"
              : "h-[clamp(1.8rem,2.5vw,2.8rem)] w-[clamp(1.8rem,2.5vw,2.8rem)] text-[clamp(0.85rem,1.2vw,1.35rem)]"
          }`}
        >
          {item.rank}
        </span>
      </header>

      <h2
        className={`mt-[1.2vh] font-display font-extrabold leading-[1.12] ${
          isChampion
            ? "gold-text text-[clamp(1.35rem,2.35vw,2.7rem)]"
            : "text-white text-[clamp(1.05rem,1.75vw,2rem)]"
        }`}
      >
        {item.title}
      </h2>

      <p
        className={`mt-[0.9vh] font-display font-semibold tracking-[0.14em] ${
          isChampion ? "text-gold-400" : "text-azure-300/80"
        } text-[clamp(0.62rem,0.82vw,1rem)]`}
      >
        {item.count.toLocaleString("id-ID")} RESPONSES
      </p>

      <div
        className={`mt-[1.4vh] h-px w-full ${
          isChampion
            ? "bg-gradient-to-r from-gold-400/60 via-gold-400/20 to-transparent"
            : "bg-gradient-to-r from-azure-400/35 via-azure-400/10 to-transparent"
        }`}
      />

      <p
        className={`mt-[1.4vh] leading-relaxed text-slate-300/85 ${
          isChampion
            ? "text-[clamp(0.82rem,1.05vw,1.25rem)]"
            : "text-[clamp(0.75rem,0.92vw,1.1rem)]"
        }`}
      >
        &ldquo;{item.summary}&rdquo;
      </p>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="fade-up mt-[4vh] flex flex-col items-center gap-4 rounded-3xl border border-azure-400/15 bg-ink-700/45 px-[3vw] py-[5vh] text-center">
      <div className="flex gap-2" aria-hidden>
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="h-2.5 w-2.5 rounded-full bg-azure-400/60"
            style={{
              animation: "pulse-dot 1.6s ease-in-out infinite",
              animationDelay: `${index * 200}ms`,
            }}
          />
        ))}
      </div>
      <p className="font-display text-[clamp(1rem,1.6vw,1.8rem)] font-bold text-white">
        Menunggu sintesis pertama
      </p>
      <p className="max-w-[36ch] text-[clamp(0.75rem,0.95vw,1.05rem)] leading-relaxed text-slate-400">
        Feedback sedang mengalir masuk. Top 3 akan muncul di sini begitu operator
        mempublikasikan hasil sintesis.
      </p>
    </div>
  );
}
