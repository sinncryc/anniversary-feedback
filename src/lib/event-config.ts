/**
 * Single source of truth for event branding.
 * Change these values (or the matching NEXT_PUBLIC_* env vars) and every page follows.
 */
export const eventConfig = {
  /** Small eyebrow line above the main title on the display. */
  organization: process.env.NEXT_PUBLIC_EVENT_ORG ?? "ASTRA INTERNATIONAL",
  /** Main event name. */
  name: process.env.NEXT_PUBLIC_EVENT_NAME ?? "ASTRA LEARN FEST",
  /** Short subtitle / anniversary line. */
  tagline: process.env.NEXT_PUBLIC_EVENT_TAGLINE ?? "KNOWLEDGE MANAGEMENT FEST 2026",
  /** The one question every participant answers. */
  question:
    process.env.NEXT_PUBLIC_EVENT_QUESTION ??
    "Apa satu hal yang ingin Anda perbaiki atau tingkatkan dari perusahaan?",
  /** Headline shown on the big screen. */
  displayHeadline: "WHAT OUR PEOPLE ARE SAYING",
  displaySubHeadline: "TOP 3 SARAN TERBAIK",
} as const;

export const FEEDBACK_MIN_LENGTH = 10;
export const FEEDBACK_MAX_LENGTH = 500;
