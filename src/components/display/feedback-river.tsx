"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clampForRiver } from "@/lib/moderation";
import type { RiverSource } from "./use-display-data";

/**
 * The perimeter "river".
 *
 * Four independent lanes hug the edges of the screen and flow clockwise:
 * top → right → bottom → left. A single dispatcher releases one card at a
 * time so new feedback trickles in instead of dumping all at once, and each
 * lane has a hard cap on live DOM nodes so the display stays smooth whether
 * there are 20 responses or 2,000.
 */

type LaneId = "top" | "right" | "bottom" | "left";

type LaneConfig = {
  id: LaneId;
  axis: "x" | "y";
  animation: string;
  capacity: number;
  /** Seconds to cross the lane. Constant per lane on purpose — see below. */
  duration: number;
};

/*
 * Every card in a lane moves at exactly the same speed. That is what stops
 * cards from catching up with and overlapping each other: with a constant
 * speed and a constant release interval, the spacing set at spawn time is
 * preserved for the whole journey. Lanes differ in speed so the perimeter
 * still feels alive rather than mechanical.
 */
const LANES: LaneConfig[] = [
  { id: "top", axis: "x", animation: "river-flow-right", capacity: 4, duration: 36 },
  { id: "right", axis: "y", animation: "river-flow-down", capacity: 4, duration: 28 },
  { id: "bottom", axis: "x", animation: "river-flow-left", capacity: 4, duration: 36 },
  { id: "left", axis: "y", animation: "river-flow-up", capacity: 4, duration: 28 },
];

/*
 * One card is released every SPAWN_INTERVAL_MS, round-robin across the four
 * lanes — so each lane receives a card every 4 x SPAWN_INTERVAL_MS (~9.2s).
 * That gap is wider than the widest card takes to clear its own length, which
 * is the second half of the no-overlap guarantee.
 */
const SPAWN_INTERVAL_MS = 2300;

type ActiveCard = {
  key: string;
  sourceId: number;
  text: string;
  fresh: boolean;
  duration: number;
  jitter: number;
};

type LaneState = Record<LaneId, ActiveCard[]>;

const emptyLanes = (): LaneState => ({ top: [], right: [], bottom: [], left: [] });

export default function FeedbackRiver({
  pool,
  pending,
  onConsume,
}: {
  pool: RiverSource[];
  pending: RiverSource[];
  onConsume: (id: number) => void;
}) {
  const [lanes, setLanes] = useState<LaneState>(emptyLanes);
  const [travel, setTravel] = useState<Record<LaneId, number>>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  const laneRefs = useRef<Partial<Record<LaneId, HTMLDivElement | null>>>({});
  const laneCursor = useRef(0);
  const recycleCursor = useRef(0);
  const uid = useRef(0);

  // Latest values without re-arming the dispatcher interval on every change.
  const poolRef = useRef(pool);
  const pendingRef = useRef(pending);
  const consumeRef = useRef(onConsume);

  useEffect(() => {
    poolRef.current = pool;
    pendingRef.current = pending;
    consumeRef.current = onConsume;
  }, [pool, pending, onConsume]);

  /* Measure lane travel distance ------------------------------------ */
  useEffect(() => {
    const measure = () => {
      setTravel((previous) => {
        const next = { ...previous };
        let changed = false;
        for (const lane of LANES) {
          const element = laneRefs.current[lane.id];
          if (!element) continue;
          const value =
            lane.axis === "x" ? element.clientWidth : element.clientHeight;
          if (value !== next[lane.id]) {
            next[lane.id] = value;
            changed = true;
          }
        }
        return changed ? next : previous;
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    for (const lane of LANES) {
      const element = laneRefs.current[lane.id];
      if (element) observer.observe(element);
    }
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  /* Dispatcher ------------------------------------------------------- */
  const spawn = useCallback(() => {
    if (document.hidden) return;

    const queued = pendingRef.current;
    const available = poolRef.current;
    if (queued.length === 0 && available.length === 0) return;

    setLanes((previous) => {
      // Pick the next lane that still has room, starting round-robin.
      let lane: LaneConfig | null = null;
      for (let step = 0; step < LANES.length; step += 1) {
        const candidate = LANES[(laneCursor.current + step) % LANES.length];
        if (previous[candidate.id].length < candidate.capacity) {
          lane = candidate;
          laneCursor.current = (laneCursor.current + step + 1) % LANES.length;
          break;
        }
      }
      if (!lane) return previous;

      let source: RiverSource | undefined;
      let fresh = false;

      if (queued.length > 0) {
        source = queued[0];
        fresh = true;
      } else if (available.length > 0) {
        source = available[recycleCursor.current % available.length];
        recycleCursor.current += 1;
      }
      if (!source) return previous;

      if (fresh) consumeRef.current(source.id);

      uid.current += 1;
      const card: ActiveCard = {
        key: `${source.id}-${uid.current}`,
        sourceId: source.id,
        text: clampForRiver(source.text, lane.axis === "x" ? 80 : 60),
        fresh,
        duration: lane.duration,
        jitter: Math.round((Math.random() - 0.5) * (lane.axis === "x" ? 22 : 30)),
      };

      return { ...previous, [lane.id]: [...previous[lane.id], card] };
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(spawn, SPAWN_INTERVAL_MS);
    // Release the first card immediately rather than after a full interval.
    const kickoff = setTimeout(spawn, 120);
    return () => {
      clearInterval(timer);
      clearTimeout(kickoff);
    };
  }, [spawn]);

  const retire = useCallback((laneId: LaneId, key: string) => {
    setLanes((previous) => ({
      ...previous,
      [laneId]: previous[laneId].filter((card) => card.key !== key),
    }));
  }, []);

  const laneClasses = useMemo(
    () => ({
      top: "river-lane lane-mask-x left-0 right-0 top-0 h-[var(--lane-h)]",
      bottom: "river-lane lane-mask-x left-0 right-0 bottom-0 h-[var(--lane-h)]",
      left: "river-lane lane-mask-y left-0 top-[var(--lane-h)] bottom-[var(--lane-h)] w-[var(--lane-w)]",
      right:
        "river-lane lane-mask-y right-0 top-[var(--lane-h)] bottom-[var(--lane-h)] w-[var(--lane-w)]",
    }),
    [],
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 [--lane-h:clamp(74px,9vh,132px)] [--lane-w:clamp(190px,17vw,330px)]"
    >
      {LANES.map((lane) => (
        <div
          key={lane.id}
          ref={(element) => {
            laneRefs.current[lane.id] = element;
          }}
          className={laneClasses[lane.id]}
        >
          {lanes[lane.id].map((card) => (
            <div
              key={card.key}
              className={
                lane.axis === "x" ? "river-item river-item-h" : "river-item river-item-v"
              }
              style={
                {
                  animationName: lane.animation,
                  animationDuration: `${card.duration}s`,
                  "--travel": `${travel[lane.id]}px`,
                } as unknown as React.CSSProperties
              }
              onAnimationEnd={(event) => {
                if (event.currentTarget === event.target) retire(lane.id, card.key);
              }}
            >
              <div
                className={`river-card ${card.fresh ? "river-card-fresh" : ""} px-[1.15em] py-[0.62em]`}
                style={{
                  animationDuration: `${card.duration}s`,
                  // Small cross-axis offset so the lane does not look like a ruler.
                  ...(lane.axis === "x"
                    ? { marginTop: `${card.jitter}px` }
                    : { marginLeft: `${card.jitter}px` }),
                  fontSize: "clamp(0.82rem, 0.92vw, 1.08rem)",
                  maxWidth:
                    lane.axis === "x"
                      ? "min(24rem, 21vw)"
                      : "calc(var(--lane-w) - 2.4rem)",
                }}
              >
                <p className="leading-snug text-slate-200/90">
                  {card.fresh ? (
                    <span className="mr-2 inline-block h-1.5 w-1.5 -translate-y-[1px] rounded-full bg-gold-300 align-middle" />
                  ) : null}
                  {card.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
