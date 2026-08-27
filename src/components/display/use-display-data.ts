"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getBrowserClient, supabaseEnabled } from "@/lib/supabase-browser";
import type { DisplayState, TopThreeItem } from "@/lib/types";

export type RiverSource = {
  /** Unique per feedback row. */
  id: number;
  text: string;
};

export type ConnectionState = "connecting" | "live" | "polling" | "error";

/** Keep a bounded pool so the river can recycle without growing forever. */
const POOL_LIMIT = 200;
const POLL_INTERVAL_MS = 3000;
const RESYNC_INTERVAL_MS = 60_000;

export function useDisplayData() {
  const [pool, setPool] = useState<RiverSource[]>([]);
  const [pending, setPending] = useState<RiverSource[]>([]);
  const [top3, setTop3] = useState<TopThreeItem[]>([]);
  const [top3UpdatedAt, setTop3UpdatedAt] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [connection, setConnection] = useState<ConnectionState>(
    supabaseEnabled ? "connecting" : "polling",
  );
  const [demoMode, setDemoMode] = useState(false);
  const [ready, setReady] = useState(false);

  const maxIdRef = useRef(0);
  const seenRef = useRef<Set<number>>(new Set());

  const ingest = useCallback((items: RiverSource[], asNew: boolean) => {
    const fresh = items.filter((item) => !seenRef.current.has(item.id));
    if (fresh.length === 0) return;
    for (const item of fresh) {
      seenRef.current.add(item.id);
      if (item.id > maxIdRef.current) maxIdRef.current = item.id;
    }
    setPool((prev) => [...fresh, ...prev].slice(0, POOL_LIMIT));
    if (asNew) {
      setPending((prev) => [...prev, ...fresh].slice(-60));
    }
  }, []);

  const applySnapshot = useCallback(
    (state: DisplayState, treatAsNew: boolean) => {
      setTop3(state.top3);
      setTop3UpdatedAt(state.top3UpdatedAt);
      setTotal(state.totalResponses);
      setDemoMode(state.demoMode);
      // Snapshot arrives newest-first; reverse so the river ingests in order.
      ingest(
        state.feedback
          .slice()
          .reverse()
          .map((f) => ({ id: f.id, text: f.text })),
        treatAsNew,
      );
      setReady(true);
    },
    [ingest],
  );

  const fetchSnapshot = useCallback(
    async (treatAsNew: boolean) => {
      try {
        const response = await fetch("/api/display-state", { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        applySnapshot((await response.json()) as DisplayState, treatAsNew);
        return true;
      } catch (error) {
        console.error("[display] snapshot failed", error);
        return false;
      }
    },
    [applySnapshot],
  );

  /* Initial load ---------------------------------------------------- */
  useEffect(() => {
    // Data loading: state is set from the async response, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchSnapshot(false);
  }, [fetchSnapshot]);

  /* Realtime (Supabase) or polling fallback -------------------------- */
  useEffect(() => {
    const client = supabaseEnabled ? getBrowserClient() : null;

    if (!client) {
      const timer = setInterval(() => void fetchSnapshot(true), POLL_INTERVAL_MS);
      return () => clearInterval(timer);
    }

    const channel = client
      .channel("anniversary-display")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "feedback",
          filter: "is_visible=eq.true",
        },
        (payload) => {
          const row = payload.new as { id: number; message: string };
          if (typeof row?.id === "number" && typeof row?.message === "string") {
            ingest([{ id: row.id, text: row.message }], true);
            setTotal((value) => value + 1);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_summary" },
        () => {
          void fetchSnapshot(false);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setConnection("live");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
          setConnection("error");
      });

    // Safety net: even with a healthy socket, resync occasionally so a
    // missed event never leaves the big screen stale during an event.
    const resync = setInterval(() => void fetchSnapshot(true), RESYNC_INTERVAL_MS);

    return () => {
      clearInterval(resync);
      void client.removeChannel(channel);
    };
  }, [fetchSnapshot, ingest]);

  const consumePending = useCallback((id: number) => {
    setPending((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return {
    pool,
    pending,
    consumePending,
    top3,
    top3UpdatedAt,
    total,
    connection,
    demoMode,
    ready,
  };
}
