/**
 * Basic profanity / abuse screen.
 *
 * Deliberately simple: it is a speed bump so obviously offensive text never
 * reaches the projector, not a content-moderation system. Flagged feedback is
 * still stored (is_visible = false) so the AI synthesis step can still see it
 * and an operator can review it later.
 */

const BLOCKLIST = [
  // Indonesian
  "anjing", "anjg", "asu", "bangsat", "bajingan", "kontol", "memek", "ngentot",
  "ngentod", "entot", "pepek", "peler", "tolol", "goblok", "goblog", "idiot",
  "bego", "kampret", "keparat", "brengsek", "bacot", "jancok", "jancuk", "cok",
  "cuk", "kimak", "kimat", "pukimak", "puki", "lonte", "pelacur", "sundal",
  "bangke", "setan", "iblis", "monyet", "babi", "bangsad", "tai", "taik",
  "sialan", "bejat", "biadab", "jembut", "kntl", "mmk", "ngtd",
  // English
  "fuck", "fucking", "fuk", "shit", "bitch", "bastard", "asshole", "dick",
  "cunt", "whore", "slut", "retard", "moron", "stupid", "nigger", "faggot",
  "motherfucker", "wtf", "stfu",
];

const LEET_MAP: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "6": "g", "7": "t",
  "8": "b", "9": "g", "@": "a", "$": "s", "!": "i", "|": "i", "*": "",
};

/** Normalise text so simple obfuscation (l33t, spacing, repetition) still matches. */
function normalise(input: string): string {
  const lowered = input.toLowerCase();
  let out = "";
  for (const ch of lowered) {
    out += ch in LEET_MAP ? LEET_MAP[ch] : ch;
  }
  // collapse 3+ repeats -> 1 (anjiiiing -> anjing-ish), strip non-letters
  out = out.replace(/(.)\1{2,}/g, "$1");
  return out.replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function isClean(message: string): boolean {
  const normalised = normalise(message);
  const spaceless = normalised.replace(/\s/g, "");
  const words = new Set(normalised.split(" "));

  for (const bad of BLOCKLIST) {
    if (words.has(bad)) return false;
    // catch "a n j i n g" / "anj_ing" style splits
    if (bad.length >= 5 && spaceless.includes(bad)) return false;
  }
  return true;
}

/** Shorten a message for the river cards without cutting mid-word. */
export function clampForRiver(message: string, max = 90): string {
  const clean = message.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice).trimEnd()}…`;
}
