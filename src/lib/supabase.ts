import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

export function hasServiceRole(): boolean {
  return Boolean(url && serviceKey);
}

let anonClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

/** Server-side client using the public anon key (respects RLS). */
export function getServerClient(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error("Supabase belum dikonfigurasi (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY).");
  }
  anonClient ??= createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return anonClient;
}

/**
 * Server-only client using the service role key. Used for admin writes
 * (publishing Top 3) so that the anon role never has write access to what
 * appears on the big screen.
 */
export function getAdminClient(): SupabaseClient {
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY belum di-set. Diperlukan untuk publish Top 3.",
    );
  }
  adminClient ??= createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}
