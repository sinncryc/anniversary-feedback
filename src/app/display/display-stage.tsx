"use client";

import { useCallback, useEffect, useState } from "react";
import FeedbackRiver from "@/components/display/feedback-river";
import StageBackground from "@/components/display/stage-background";
import TopThree from "@/components/display/top-three";
import { useDisplayData } from "@/components/display/use-display-data";
import { eventConfig } from "@/lib/event-config";

export default function DisplayStage() {
  const {
    pool,
    pending,
    consumePending,
    top3,
    top3UpdatedAt,
    total,
    connection,
    demoMode,
    ready,
  } = useDisplayData();

  const [controlsVisible, setControlsVisible] = useState(true);

  // Controls fade away so the screen needs no operator during the event.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const show = () => {
      setControlsVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => setControlsVisible(false), 3500);
    };
    show();
    window.addEventListener("mousemove", show);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", show);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => {});
  }, []);

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-ink-900">
      <StageBackground />

      <FeedbackRiver pool={pool} pending={pending} onConsume={consumePending} />

      {/* Center column — sits inside the river lanes so nothing overlaps. */}
      <section className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-[clamp(200px,17vw,330px)] py-[clamp(74px,9vh,132px)]">
        <TopThree items={top3} updatedAt={top3UpdatedAt} />

        <div className="mt-[3vh] flex items-center gap-[1.6vw] text-[clamp(0.6rem,0.72vw,0.85rem)] font-semibold tracking-[0.26em] text-slate-500">
          <span>{eventConfig.organization}</span>
          <span aria-hidden className="h-3 w-px bg-slate-700" />
          <span className="text-gold-500/80">{eventConfig.name}</span>
          <span aria-hidden className="h-3 w-px bg-slate-700" />
          <span>
            {ready ? total.toLocaleString("id-ID") : "—"}{" "}
            <span className="text-slate-600">VOICES</span>
          </span>
        </div>
      </section>

      {/* Status corner */}
      <div className="absolute bottom-[1.1vh] right-[1vw] z-30 flex items-center gap-2 rounded-full border border-white/5 bg-black/30 px-3 py-1.5 text-[0.6rem] font-semibold tracking-[0.18em] text-slate-500 backdrop-blur">
        <span
          className={`live-dot h-1.5 w-1.5 rounded-full ${
            connection === "live"
              ? "bg-emerald-400"
              : connection === "polling"
                ? "bg-azure-400"
                : connection === "error"
                  ? "bg-red-400"
                  : "bg-slate-500"
          }`}
        />
        {connection === "live"
          ? "LIVE"
          : connection === "polling"
            ? demoMode
              ? "DEMO"
              : "POLLING"
            : connection === "error"
              ? "RECONNECTING"
              : "CONNECTING"}
      </div>

      <button
        type="button"
        onClick={toggleFullscreen}
        className={`absolute bottom-[1.1vh] left-[1vw] z-30 rounded-full border border-white/5 bg-black/30 px-3 py-1.5 text-[0.6rem] font-semibold tracking-[0.18em] text-slate-500 backdrop-blur transition-opacity duration-700 hover:text-slate-300 ${
          controlsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        FULLSCREEN
      </button>
    </main>
  );
}
