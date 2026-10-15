import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
/** Prefer publishable key; anon key still accepted for older .env files. */
const publishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  ''
).trim()

function looksLikePlaceholder(value: string): boolean {
  const lower = value.toLowerCase()
  return (
    value.length === 0 ||
    lower.includes('your_project') ||
    lower.includes('your_') ||
    lower.includes('xxxx') ||
    lower === 'eyj...'
  )
}

export const isSupabaseConfigured =
  !looksLikePlaceholder(url) && !looksLikePlaceholder(publishableKey)

/**
 * Same env shape as Fra gryte til gaffel so both apps can point at one
 * Supabase project later (shared Auth + profiles). Krøll tables stay separate.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Distinct storage key so two apps on the same origin don't collide
        // during local dual-dev. Shared production domains can align later.
        storageKey: 'kroll-auth',
      },
    })
  : null

/** Hostname only — never log the publishable/anon key. */
function supabaseHostLabel(): string {
  try {
    return new URL(url).host || '(empty)'
  } catch {
    return '(invalid VITE_SUPABASE_URL)'
  }
}

export async function testSupabaseConnection(): Promise<void> {
  if (!supabase) {
    console.info(
      '[Krøll/Supabase] Not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (same values as FGTG) in .env.local or Netlify env, then rebuild.',
    )
    return
  }

  console.info('[Krøll/Supabase] Using project host:', supabaseHostLabel())

  try {
    const { error } = await supabase.auth.getSession()
    if (error) {
      console.warn('[Krøll/Supabase] Connection failed:', error.message)
      return
    }
    console.info('[Krøll/Supabase] Connection OK (auth.getSession).')
  } catch (err) {
    console.warn('[Krøll/Supabase] Connection failed:', err)
  }
}

void testSupabaseConnection()
