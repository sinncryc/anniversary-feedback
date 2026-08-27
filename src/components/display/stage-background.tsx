"use client";

import { useMemo } from "react";
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

/** Ambient depth for the big screen. Rendered client-side only so the random
 *  particle positions never cause a hydration mismatch. */
export default function StageBackground() {
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
      <div className="stage-grid" />
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
