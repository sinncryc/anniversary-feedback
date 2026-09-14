"use client";

import { useEffect, useRef, useState } from "react";

/** How long the "just published" glow / sweep / flare stays visible. */
export const PUBLISH_PULSE_MS = 1400;

/**
 * True for PUBLISH_PULSE_MS right after `version` changes, false otherwise
 * (including on first mount — the first paint already gets its own entrance
 * animation for free). Shared by TopThree's own pulse and by
 * StageBackground's poster-asset flare so both react to the same publish
 * moment without either owning the other's state.
 */
export function usePublishPulse(version: string): boolean {
  const [pulsing, setPulsing] = useState(false);
  const seenVersion = useRef<string | null>(null);

  useEffect(() => {
    if (seenVersion.current === null) {
      seenVersion.current = version;
      return;
    }
    if (seenVersion.current === version) return;
    seenVersion.current = version;

    setPulsing(true);
    const timer = setTimeout(() => setPulsing(false), PUBLISH_PULSE_MS);
    return () => clearTimeout(timer);
  }, [version]);

  return pulsing;
}
