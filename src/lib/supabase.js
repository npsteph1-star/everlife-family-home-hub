/**
 * Family Home Hub — Supabase browser client
 *
 * Singleton instance safe for use in React components.
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from the
 * environment (set in .env.local — never commit that file).
 *
 * The anon key is intentionally public — Supabase Row Level Security
 * enforces what each user can read and write. See supabase/schema.sql.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[FHH] Supabase not configured.\n' +
    'Copy .env.example → .env.local and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Supabase manages its own storage key (sb-*-auth-token).
      // App data is NOT stored here — this is auth session only.
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
)

export default supabase
