"use client";

import Image from "next/image";
import { useMemo, type CSSProperties } from "react";
import { useIsClient } from "@/lib/use-is-client";

/** Deterministic 0..1 "random" — keeps the render pure and the layout stable. */
function noise(index: number, salt: number): number {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

type Particle = {
  left: number;
  size: number;
  duration: number;
  delay: number;
};

const CONTAIN: CSSProperties = { objectFit: "contain" };
const COVER: CSSProperties = { objectFit: "cover" };

/**
 * Ambient depth for the big screen. Rendered client-side only so the random
 * particle positions never cause a hydration mismatch.
 *
 * The real ASTRA KM FEST 2026 poster artwork is used sparingly, not stacked
 * as a permanent full-bleed collage: a near-invisible compass watermark sits
 * behind the headline at all times, and the network "hands" + fiber-optic
 * accent stay fully transparent until `pulsing` goes true (see
 * use-publish-pulse.ts) — i.e. right when a fresh AI synthesis is published —
 * then flare in for ~1.7s and fade back out. That keeps the poster's own
 * "Knowledge in Motion" motif for the one moment it's actually about
 * something moving/updating, instead of cluttering the screen at all times.
 */
export default function StageBackground({
  pulsing = false,
}: {
  pulsing?: boolean;
}) {
  const isClient = useIsClient();

  const particles = useMemo<Particle[]>(() => {
    if (!isClient) return [];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return [];
    return Array.from({ length: 26 }, (_, index) => ({
      left: noise(index, 1) * 100,
      size: 1.5 + noise(index, 2) * 2.5,
      duration: 22 + noise(index, 3) * 26,
      delay: noise(index, 4) * -40,
    }));
  }, [isClient]);

  return (
    <div aria-hidden className="stage-bg">
      <div className="poster-kompas-wrap">
        <div className={`poster-kompas ${pulsing ? "poster-kompas-flare" : ""}`}>
          <Image src="/assets/kompas.png" alt="" fill sizes="60vw" style={CONTAIN} priority />
          {/* Ride along with the compass's own rotation instead of sitting
              static in a corner — reads as debris/energy orbiting the
              centerpiece rather than assets pasted on top of the scene. */}
          <div className="poster-orbit-dot poster-orbit-dot-1">
            <Image src="/assets/dot-1.png" alt="" fill sizes="120px" style={CONTAIN} />
          </div>
          <div className="poster-orbit-dot poster-orbit-dot-2">
            <Image src="/assets/dot-2.png" alt="" fill sizes="100px" style={CONTAIN} />
          </div>
        </div>
      </div>

      <div className="stage-grid" />

      {/* Mounted at all times (so the images are already loaded and ready)
          but fully transparent until a publish pulse triggers the flare. */}
      <div className={`poster-burst ${pulsing ? "poster-burst-active" : ""}`}>
        <div className="poster-fiber-flash">
          <Image src="/assets/optic-fiber.png" alt="" fill sizes="100vw" style={COVER} />
        </div>
        <div className="poster-hand poster-hand-left">
          <Image src="/assets/tangan-kiri.png" alt="" fill sizes="30vw" style={COVER} />
        </div>
        <div className="poster-hand poster-hand-right">
          <Image src="/assets/tangan-kanan.png" alt="" fill sizes="30vw" style={COVER} />
        </div>
      </div>

      <div className="constellation-field" />
      {particles.map((particle, index) => (
        <span
          key={index}
          className="particle"
          style={{
            left: `${particle.left}%`,
            bottom: "-6vh",
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_50%,rgba(4,6,13,0.72),transparent_75%)]" />
    </div>
  );
}
