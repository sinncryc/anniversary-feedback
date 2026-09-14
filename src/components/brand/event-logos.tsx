import Image from "next/image";

/**
 * Sponsor lockup for the "Knowledge in Motion" design concept — mirrors the
 * ASTRA KM FEST 2026 poster's top bar (Astra on the left, Satu Indonesia on
 * the right). Both source PNGs actually have transparent backgrounds (no
 * baked-in white square), so they sit directly on the dark navy field —
 * `.brand-mark`'s soft drop-shadow glow keeps thin dark linework (like Satu
 * Indonesia's outline strokes) readable without boxing each logo in a
 * white chip, which read as pasted-on rather than part of the scene.
 */
export default function EventLogos({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const markHeight = size === "sm" ? "h-8" : "h-10";
  const astraWidth = size === "sm" ? 108 : 140;
  const satuWidth = size === "sm" ? 72 : 94;

  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <span className={`brand-mark flex items-center ${markHeight}`}>
        <Image
          src="/logos/astra-logo.png"
          alt="Astra International"
          width={astraWidth}
          height={astraWidth / 3.54}
          className="h-full w-auto object-contain"
          priority
        />
      </span>
      <span className={`brand-mark flex items-center ${markHeight}`}>
        <Image
          src="/logos/satu-indonesia-logo.png"
          alt="Satu Indonesia — Semangat Astra Terpadu Untuk Indonesia"
          width={satuWidth}
          height={satuWidth / 2.04}
          className="h-full w-auto object-contain"
        />
      </span>
    </div>
  );
}
