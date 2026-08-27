/**
 * Lightweight admin auth for an MVP event tool.
 *
 * One shared password (ADMIN_PASSWORD) exchanged for a signed, expiring
 * httpOnly cookie. No user accounts, no database. Uses Web Crypto only, so the
 * same code runs in middleware (edge) and in route handlers (node).
 */

export const ADMIN_COOKIE = "af_admin";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // one event day

function secret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    ""
  );
}

export function adminAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD?.trim());
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return toHex(sig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function passwordMatches(candidate: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) return false;
  if (typeof candidate !== "string") return false;
  return timingSafeEqual(candidate, expected);
}

export async function createSessionToken(): Promise<string> {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = String(expiresAt);
  return `${payload}.${await sign(payload)}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token || !secret()) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  return timingSafeEqual(signature, await sign(payload));
}

export const ADMIN_COOKIE_MAX_AGE = SESSION_TTL_MS / 1000;

/** Route-handler guard. Returns true when the caller holds a valid session. */
export async function isAdminRequest(request: {
  cookies: { get(name: string): { value: string } | undefined };
}): Promise<boolean> {
  return verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
}
