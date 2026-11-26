import { createClient } from "@supabase/supabase-js";

/**
 * Server Supabase client for shared sync.
 * Prefers secret/service_role; falls back to publishable/anon when
 * write RLS policies allow it (couple app).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim();
  const publishable =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const key = secret || publishable;

  if (!url || !key) {
    throw new Error(
      "Shared sync needs NEXT_PUBLIC_SUPABASE_URL and a Supabase API key"
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      // Secret keys reject browser User-Agents; use a server identity.
      headers: { "User-Agent": "peace-wilson-sync/1.0" },
    },
  });
}

export function isSharedSyncServerReady(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
        process.env.SUPABASE_SECRET_KEY?.trim() ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim())
  );
}
