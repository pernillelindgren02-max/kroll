import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { guestUserId, storageGet, storageSet } from '../lib/storage'

type AuthContextValue = {
  configured: boolean
  loading: boolean
  session: Session | null
  user: User | null
  /** Stable id for ownership/progress even when guest */
  userId: string
  isAdmin: boolean
  adminChecked: boolean
  isLocalDemo: boolean
  enableLocalDemo: () => void
  signUp: (email: string, password: string) => Promise<string | null>
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  refreshAdmin: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function translateAuthError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login') || lower.includes('invalid credentials')) {
    return 'Feil e-post eller passord / Invalid email or password.'
  }
  if (lower.includes('already registered') || lower.includes('user already')) {
    return 'E-posten er allerede registrert / Email already registered.'
  }
  if (lower.includes('email not confirmed')) {
    return 'E-posten er ikke bekreftet ennå / Email not confirmed yet.'
  }
  if (lower.includes('password')) return 'Passordet må være minst 6 tegn / Min 6 characters.'
  if (lower.includes('email')) return 'Sjekk e-postadressen / Check the email address.'
  return 'Kunne ikke fullføre innloggingen / Sign-in failed.'
}

/** Shared profiles table — same as Fra gryte til gaffel. */
async function fetchIsAdmin(userId: string): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle()
  if (error || !data) return false
  return Boolean(data.is_admin)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminChecked, setAdminChecked] = useState(!isSupabaseConfigured)
  const [isLocalDemo, setIsLocalDemo] = useState(
    () => storageGet('local-demo', false),
  )

  async function syncAdmin(nextSession: Session | null) {
    if (!nextSession?.user) {
      setIsAdmin(Boolean(import.meta.env.DEV && storageGet('local-demo', false)))
      setAdminChecked(true)
      return
    }
    setAdminChecked(false)
    const admin = await fetchIsAdmin(nextSession.user.id)
    setIsAdmin(admin)
    setAdminChecked(true)
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      setAdminChecked(true)
      setIsAdmin(Boolean(import.meta.env.DEV && isLocalDemo))
      return
    }

    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session) {
        setIsLocalDemo(false)
        storageSet('local-demo', false)
      }
      await syncAdmin(data.session)
      if (active) setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession)
        if (nextSession) {
          setIsLocalDemo(false)
          storageSet('local-demo', false)
        }
        void syncAdmin(nextSession)
        setLoading(false)
      },
    )

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [isLocalDemo])

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null
    const userId = user?.id ?? guestUserId()
    // Signed-in: only profiles.is_admin. Local demo admin only when anonymous in DEV.
    const effectiveAdmin = user
      ? isAdmin
      : Boolean(import.meta.env.DEV && isLocalDemo)

    return {
      configured: isSupabaseConfigured,
      loading,
      session,
      user,
      userId,
      isAdmin: effectiveAdmin,
      adminChecked,
      isLocalDemo: !user && isLocalDemo,
      enableLocalDemo() {
        if (user) return
        setIsLocalDemo(true)
        storageSet('local-demo', true)
        if (import.meta.env.DEV) setIsAdmin(true)
      },
      async signUp(email, password) {
        if (!supabase) return 'Supabase er ikke konfigurert ennå.'
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        })
        if (error) return translateAuthError(error.message)
        if (
          data.user &&
          Array.isArray(data.user.identities) &&
          data.user.identities.length === 0
        ) {
          return 'E-posten er allerede registrert.'
        }
        return null
      },
      async signIn(email, password) {
        if (!supabase) return 'Supabase er ikke konfigurert ennå.'
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        return error ? translateAuthError(error.message) : null
      },
      async signOut() {
        if (supabase) await supabase.auth.signOut()
        setIsLocalDemo(false)
        storageSet('local-demo', false)
        setIsAdmin(false)
      },
      async refreshAdmin() {
        await syncAdmin(session)
      },
    }
  }, [loading, session, isAdmin, adminChecked, isLocalDemo])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
