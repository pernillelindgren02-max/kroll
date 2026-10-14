/**
 * Krøll product analytics — fire-and-forget, never blocks UI.
 * Admin-only read. Never store stash contents, private notes, email, or secrets.
 * Single stack — extend here; do not add parallel trackers.
 */
import { supabase } from './supabaseClient'

export const ANALYTICS_EVENTS = [
  'session_started',
  'route_viewed',
  'explore_viewed',
  'explore_search',
  'explore_filter_apply',
  'explore_category_open',
  'explore_sort_change',
  'explore_pattern_click',
  'pattern_viewed',
  'pattern_added_to_cart',
  'pattern_removed_from_cart',
  'cart_viewed',
  'checkout_started',
  'checkout_stripe_attempt',
  'checkout_success_page_viewed',
  'payment_completed',
  'free_pattern_claimed',
  'my_patterns_viewed',
  'pattern_opened_owned',
  'pattern_reader_opened',
  'stash_viewed',
  'stash_item_added',
  'stash_item_removed',
  'yarn_match_viewed',
  'yarn_match_state',
  'projects_viewed',
  'project_created',
  'project_status_changed',
  'technical_error',
] as const

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number]

export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>

export type AnalyticsEnv = 'dev' | 'prod'

export type AnalyticsEventRow = {
  id: string
  event_name: string
  created_at: string
  anonymous_session_id: string
  user_id: string | null
  pattern_id: string | null
  source: string | null
  properties: Record<string, unknown>
  env?: AnalyticsEnv
  path?: string | null
  from_path?: string | null
}

const SESSION_KEY = 'kroll-analytics-sid-v1'
const BUFFER_KEY = 'kroll-analytics-buffer-v1'
const BUFFER_MAX = 800
const TABLE = 'kroll_analytics_events'

const FORBIDDEN_PROP_KEYS = [
  'note',
  'notes',
  'body',
  'text',
  'password',
  'email',
  'token',
  'secret',
  'content',
  'stash',
  'stash_contents',
  'inventory',
  'colour_name',
  'color_name',
  'custom_brand',
  'custom_name',
]

let sessionStarted = false
let lastPath: string | null = null
const recentDedup = new Map<string, number>()

function newSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 24)
  }
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}

export function getAnonymousSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY)
    if (existing && existing.length >= 8) return existing
    const id = newSessionId()
    localStorage.setItem(SESSION_KEY, id)
    return id
  } catch {
    return newSessionId()
  }
}

export function getAnalyticsEnv(): AnalyticsEnv {
  return import.meta.env.PROD ? 'prod' : 'dev'
}

export function deviceClass(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  const w = window.innerWidth
  if (w < 640) return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

export function browserFamily(): string {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (/Edg\//.test(ua)) return 'edge'
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'chrome'
  if (/Firefox\//.test(ua)) return 'firefox'
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'safari'
  return 'other'
}

function sanitizeProperties(
  input?: AnalyticsProperties,
): Record<string, string | number | boolean | null> {
  if (!input) return {}
  const out: Record<string, string | number | boolean | null> = {}
  for (const [rawKey, value] of Object.entries(input)) {
    const key = rawKey.trim()
    if (!key || FORBIDDEN_PROP_KEYS.includes(key)) continue
    const lower = key.toLowerCase()
    if (lower.includes('note')) continue
    if (lower.includes('password')) continue
    if (lower.includes('email')) continue
    if (lower.includes('token')) continue
    if (lower.includes('secret')) continue
    if (lower.includes('stash_content')) continue
    if (value === undefined) continue
    if (typeof value === 'string') {
      out[key] = value.slice(0, 80)
    } else if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      out[key] = value
    }
  }
  return out
}

function pushLocalBuffer(row: AnalyticsEventRow): void {
  try {
    const raw = localStorage.getItem(BUFFER_KEY)
    const list: AnalyticsEventRow[] = raw
      ? (JSON.parse(raw) as AnalyticsEventRow[])
      : []
    list.unshift(row)
    localStorage.setItem(BUFFER_KEY, JSON.stringify(list.slice(0, BUFFER_MAX)))
  } catch {
    /* ignore quota */
  }
}

export function readLocalAnalyticsBuffer(): AnalyticsEventRow[] {
  try {
    const raw = localStorage.getItem(BUFFER_KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as AnalyticsEventRow[]
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function shouldDedup(
  name: string,
  patternId: string | null,
  path: string | null,
): boolean {
  const key = `${name}|${patternId ?? ''}|${path ?? ''}`
  const now = Date.now()
  const prev = recentDedup.get(key)
  recentDedup.set(key, now)
  if (recentDedup.size > 80) {
    for (const [k, t] of recentDedup) {
      if (now - t > 5000) recentDedup.delete(k)
    }
  }
  return prev != null && now - prev < 800
}

/**
 * Track a product event. Never throws. Never awaits in callers.
 */
export function trackEvent(
  name: AnalyticsEventName,
  opts?: {
    patternId?: string | null
    source?: string | null
    properties?: AnalyticsProperties
    userId?: string | null
    path?: string | null
    fromPath?: string | null
  },
): void {
  try {
    if (!(ANALYTICS_EVENTS as readonly string[]).includes(name)) return

    const path =
      opts?.path ??
      (typeof location !== 'undefined' ? location.pathname : null)
    const patternId = opts?.patternId?.trim() || null
    if (shouldDedup(name, patternId, path)) return

    const env = getAnalyticsEnv()
    let language: 'no' | 'en' | undefined
    try {
      const stored = localStorage.getItem('kroll-locale-v1')
      if (stored === 'no' || stored === 'en') language = stored
    } catch {
      /* ignore */
    }
    const props = sanitizeProperties({
      ...opts?.properties,
      device: opts?.properties?.device ?? deviceClass(),
      browser: opts?.properties?.browser ?? browserFamily(),
      app_language: opts?.properties?.app_language ?? language ?? 'no',
    })

    const row: AnalyticsEventRow = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      event_name: name,
      created_at: new Date().toISOString(),
      anonymous_session_id: getAnonymousSessionId(),
      user_id: opts?.userId ?? null,
      pattern_id: patternId,
      source: opts?.source?.trim()?.slice(0, 40) || null,
      properties: props,
      env,
      path: path?.slice(0, 120) ?? null,
      from_path: opts?.fromPath?.slice(0, 120) ?? null,
    }

    pushLocalBuffer(row)

    if (!supabase) return

    void supabase
      .from(TABLE)
      .insert({
        event_name: row.event_name,
        anonymous_session_id: row.anonymous_session_id,
        user_id: row.user_id,
        pattern_id: row.pattern_id,
        source: row.source,
        properties: row.properties,
        env: row.env,
        path: row.path,
        from_path: row.from_path,
      })
      .then(() => {
        /* fail silent */
      })
  } catch {
    /* never block UI */
  }
}

export function trackSessionStart(userId?: string | null): void {
  if (sessionStarted) return
  sessionStarted = true
  trackEvent('session_started', {
    userId: userId ?? null,
    source: 'app',
    properties: {
      path: typeof location !== 'undefined' ? location.pathname : '/',
      device: deviceClass(),
    },
  })
}

export function trackRouteView(pathname: string): void {
  if (pathname.startsWith('/admin')) {
    lastPath = pathname
    return
  }
  const from = lastPath
  lastPath = pathname
  trackEvent('route_viewed', {
    source: 'router',
    path: pathname,
    fromPath: from,
    properties: { device: deviceClass() },
  })
}

export type AnalyticsPeriod = 'today' | '7d' | '30d' | '90d' | 'all' | 'custom'

export function periodRange(
  period: AnalyticsPeriod,
  custom?: { from: string; to: string },
): {
  from: Date | null
  to: Date | null
  prevFrom: Date | null
  prevTo: Date | null
} {
  const to = new Date()
  if (period === 'custom' && custom?.from && custom?.to) {
    const from = new Date(custom.from)
    const end = new Date(custom.to)
    end.setHours(23, 59, 59, 999)
    const span = end.getTime() - from.getTime()
    return {
      from,
      to: end,
      prevFrom: new Date(from.getTime() - span),
      prevTo: from,
    }
  }
  if (period === 'all') {
    return { from: null, to: null, prevFrom: null, prevTo: null }
  }
  if (period === 'today') {
    const from = new Date(to)
    from.setHours(0, 0, 0, 0)
    const prevTo = new Date(from)
    const prevFrom = new Date(from)
    prevFrom.setDate(prevFrom.getDate() - 1)
    return { from, to, prevFrom, prevTo }
  }
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000)
  const prevTo = new Date(from)
  const prevFrom = new Date(from.getTime() - days * 24 * 60 * 60 * 1000)
  return { from, to, prevFrom, prevTo }
}

function inRange(iso: string, from: Date | null, to: Date | null): boolean {
  const t = new Date(iso).getTime()
  if (from && t < from.getTime()) return false
  if (to && t > to.getTime()) return false
  return true
}

export async function fetchAnalyticsEvents(opts: {
  period: AnalyticsPeriod
  custom?: { from: string; to: string }
  env?: AnalyticsEnv | 'all'
  includePrevious?: boolean
}): Promise<{
  events: AnalyticsEventRow[]
  previous: AnalyticsEventRow[]
  source: 'supabase' | 'local'
}> {
  const { from, to, prevFrom, prevTo } = periodRange(opts.period, opts.custom)
  const envFilter = opts.env ?? 'all'

  const filterEnv = (list: AnalyticsEventRow[]) =>
    envFilter === 'all'
      ? list
      : list.filter((e) => (e.env ?? 'prod') === envFilter)

  if (supabase) {
    try {
      let query = supabase
        .from(TABLE)
        .select(
          'id, event_name, created_at, anonymous_session_id, user_id, pattern_id, source, properties, env, path, from_path',
        )
        .order('created_at', { ascending: false })
        .limit(8000)

      if (from) query = query.gte('created_at', from.toISOString())
      if (to) query = query.lte('created_at', to.toISOString())
      if (envFilter !== 'all') query = query.eq('env', envFilter)

      const { data, error } = await query
      if (!error && data) {
        let previous: AnalyticsEventRow[] = []
        if (opts.includePrevious && prevFrom && prevTo) {
          let prevQ = supabase
            .from(TABLE)
            .select(
              'id, event_name, created_at, anonymous_session_id, user_id, pattern_id, source, properties, env, path, from_path',
            )
            .gte('created_at', prevFrom.toISOString())
            .lt('created_at', prevTo.toISOString())
            .order('created_at', { ascending: false })
            .limit(8000)
          if (envFilter !== 'all') prevQ = prevQ.eq('env', envFilter)
          const prevRes = await prevQ
          if (!prevRes.error && prevRes.data) {
            previous = filterEnv(prevRes.data as AnalyticsEventRow[])
          }
        }
        return {
          events: filterEnv(data as AnalyticsEventRow[]),
          previous,
          source: 'supabase',
        }
      }
    } catch {
      /* local fallback */
    }
  }

  const all = readLocalAnalyticsBuffer()
  const events = filterEnv(all.filter((e) => inRange(e.created_at, from, to)))
  const previous =
    opts.includePrevious && prevFrom && prevTo
      ? filterEnv(all.filter((e) => inRange(e.created_at, prevFrom, prevTo)))
      : []
  return { events, previous, source: 'local' }
}

export function aggregateCounts(events: AnalyticsEventRow[]) {
  const byName = new Map<string, { count: number; sessions: Set<string> }>()
  for (const e of events) {
    const cur = byName.get(e.event_name) ?? {
      count: 0,
      sessions: new Set<string>(),
    }
    cur.count += 1
    cur.sessions.add(e.anonymous_session_id)
    byName.set(e.event_name, cur)
  }
  return [...byName.entries()]
    .map(([event_name, v]) => ({
      event_name,
      count: v.count,
      sessions: v.sessions.size,
    }))
    .sort((a, b) => b.count - a.count)
}

export function countEvent(
  events: AnalyticsEventRow[],
  name: AnalyticsEventName | AnalyticsEventName[],
): number {
  const set = new Set(Array.isArray(name) ? name : [name])
  return events.filter((e) => set.has(e.event_name as AnalyticsEventName)).length
}

export function uniqueSessions(events: AnalyticsEventRow[]): number {
  return new Set(events.map((e) => e.anonymous_session_id)).size
}

export function uniqueUsers(events: AnalyticsEventRow[]): number {
  return new Set(
    events.map((e) => e.user_id).filter((id): id is string => Boolean(id)),
  ).size
}

export function searchQueryBucket(query: string): string {
  const len = query.trim().length
  if (len === 0) return 'empty'
  if (len <= 3) return '1-3'
  if (len <= 8) return '4-8'
  if (len <= 16) return '9-16'
  return '17+'
}

/** Only store search term when it matches a known public vocabulary token. */
export function validatedSearchTerm(
  query: string,
  knownTerms: Iterable<string>,
): string | null {
  const q = query.trim().toLowerCase()
  if (q.length < 2 || q.length > 40) return null
  for (const term of knownTerms) {
    const t = term.trim().toLowerCase()
    if (!t) continue
    if (t === q || t.startsWith(q) || q.startsWith(t)) {
      return t.slice(0, 40)
    }
  }
  return null
}

/** Map yarn match strength → analytics match_state (safe metadata only). */
export function matchStateFromStrength(
  strength: 'strong' | 'soft' | 'none' | null | undefined,
  opts?: { hasStash?: boolean },
): 'great' | 'enough' | 'nearly' | 'insufficient' | 'uncertain' {
  if (!opts?.hasStash) return 'uncertain'
  if (strength === 'strong') return 'great'
  if (strength === 'soft') return 'nearly'
  if (strength === 'none') return 'insufficient'
  return 'uncertain'
}

if (import.meta.env.DEV && typeof window !== 'undefined') {
  const w = window as Window & {
    __krollTrack?: typeof trackEvent
    __krollAnalyticsBuffer?: typeof readLocalAnalyticsBuffer
  }
  w.__krollTrack = trackEvent
  w.__krollAnalyticsBuffer = readLocalAnalyticsBuffer
}
