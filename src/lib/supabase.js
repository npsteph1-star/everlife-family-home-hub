/**
 * Family Home Hub — Supabase browser client
 *
 * SAFE TO IMPORT even when env vars are not yet configured.
 * Check `isSupabaseConfigured` before calling any Supabase API.
 *
 * The anon key is intentionally public — Supabase Row Level Security
 * enforces what each authenticated user can read and write.
 * See supabase/schema.sql.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * True when both required environment variables are present.
 * When false, `supabase` is null and a SetupRequired screen is shown.
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseUrl.startsWith('https://') &&
  supabaseAnonKey && supabaseAnonKey.length > 10
)

/**
 * The Supabase client, or null if env vars are missing.
 * Always guard with `isSupabaseConfigured` before use.
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Supabase manages its own storage key (sb-*-auth-token).
        // App data is NOT stored here — this is auth session only.
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    })
  : null

export default supabase
