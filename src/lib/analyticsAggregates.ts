/**
 * Client-side aggregates for Admin → Innsikt (Krøll).
 * Rates use UNIQUE SESSIONS as denominators (not raw event spam).
 * Never invent revenue — payment_completed only when Stripe verifies.
 */
import {
  countEvent,
  type AnalyticsEventName,
  type AnalyticsEventRow,
} from './analytics'

/** Min unique viewers before a pattern ranks as “top performing”. */
export const MIN_PATTERN_SAMPLE = 10

export type RateStat = {
  count: number
  unique: number
  rate: number | null
  rateLabel: string
  sampleNote: string | null
}

export function pct(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return `${(n * 100).toFixed(1)}%`
}

export function ppDelta(rate: number | null, avg: number | null): string | null {
  if (
    rate == null ||
    avg == null ||
    !Number.isFinite(rate) ||
    !Number.isFinite(avg)
  ) {
    return null
  }
  const d = (rate - avg) * 100
  const sign = d > 0 ? '+' : ''
  return `${sign}${d.toFixed(1)} pp vs snitt`
}

function rateFrom(uniqueNum: number, uniqueDen: number): RateStat {
  const rate = uniqueDen > 0 ? uniqueNum / uniqueDen : null
  const sampleNote =
    uniqueDen > 0 && uniqueDen < MIN_PATTERN_SAMPLE
      ? `kun ${uniqueDen} seer${uniqueDen === 1 ? '' : 'e'}`
      : null
  return {
    count: uniqueNum,
    unique: uniqueNum,
    rate,
    rateLabel: rate == null ? '—' : pct(rate),
    sampleNote,
  }
}

export function formatCountRate(
  count: number,
  rate: number | null,
  verb: string,
  sampleNote?: string | null,
): string {
  const ratePart = rate == null ? '' : ` · ${pct(rate)}`
  const sample = sampleNote ? ` (${sampleNote})` : ''
  return `${count} ${verb}${ratePart}${sample}`
}

function sessionsFor(
  events: AnalyticsEventRow[],
  name: AnalyticsEventName | AnalyticsEventName[],
  patternId?: string,
): Set<string> {
  const set = new Set(Array.isArray(name) ? name : [name])
  const out = new Set<string>()
  for (const e of events) {
    if (!set.has(e.event_name as AnalyticsEventName)) continue
    if (patternId && e.pattern_id !== patternId) continue
    out.add(e.anonymous_session_id)
  }
  return out
}

export type PatternIntel = {
  pattern_id: string
  views: number
  unique_viewers: number
  cart_adds: number
  unique_cart: number
  cart_rate: number | null
  purchases: number
  unique_buyers: number
  purchase_rate: number | null
  opens_owned: number
  unique_opens: number
  open_rate: number | null
  repeat_viewers: number
  repeat_rate: number | null
  sample_ok: boolean
  sample_note: string | null
  top_source: string | null
  sources: Record<string, number>
  is_demo_views: number
}

export type PatternBenchmarks = {
  cart_rate: number | null
  purchase_rate: number | null
  open_rate: number | null
  repeat_rate: number | null
}

export type PatternSortKey =
  | 'views'
  | 'cart_adds'
  | 'cart_rate'
  | 'purchases'
  | 'purchase_rate'
  | 'opens_owned'
  | 'repeat_rate'

export function buildPatternIntelligence(events: AnalyticsEventRow[]): {
  patterns: PatternIntel[]
  benchmarks: PatternBenchmarks
} {
  type Acc = {
    views: number
    viewers: Set<string>
    viewCounts: Map<string, number>
    cart: number
    cartSessions: Set<string>
    purchases: number
    buyers: Set<string>
    opens: number
    openSessions: Set<string>
    sources: Map<string, number>
    demoViews: number
  }

  const map = new Map<string, Acc>()

  function acc(id: string): Acc {
    let cur = map.get(id)
    if (!cur) {
      cur = {
        views: 0,
        viewers: new Set(),
        viewCounts: new Map(),
        cart: 0,
        cartSessions: new Set(),
        purchases: 0,
        buyers: new Set(),
        opens: 0,
        openSessions: new Set(),
        sources: new Map(),
        demoViews: 0,
      }
      map.set(id, cur)
    }
    return cur
  }

  for (const e of events) {
    if (!e.pattern_id) continue
    const cur = acc(e.pattern_id)
    const sid = e.anonymous_session_id
    switch (e.event_name) {
      case 'pattern_viewed': {
        cur.views += 1
        cur.viewers.add(sid)
        cur.viewCounts.set(sid, (cur.viewCounts.get(sid) ?? 0) + 1)
        const src = e.source ?? 'unknown'
        cur.sources.set(src, (cur.sources.get(src) ?? 0) + 1)
        if (e.properties?.is_demo === true) cur.demoViews += 1
        break
      }
      case 'pattern_added_to_cart':
        cur.cart += 1
        cur.cartSessions.add(sid)
        break
      case 'payment_completed':
      case 'free_pattern_claimed':
        cur.purchases += 1
        cur.buyers.add(sid)
        break
      case 'pattern_opened_owned':
      case 'pattern_reader_opened':
        cur.opens += 1
        cur.openSessions.add(sid)
        break
      default:
        break
    }
  }

  const patterns: PatternIntel[] = [...map.entries()].map(([pattern_id, v]) => {
    const unique_viewers = v.viewers.size
    const repeat_viewers = [...v.viewCounts.values()].filter((n) => n > 1).length
    const cart_rate =
      unique_viewers > 0 ? v.cartSessions.size / unique_viewers : null
    const purchase_rate =
      unique_viewers > 0 ? v.buyers.size / unique_viewers : null
    const open_rate =
      v.buyers.size > 0 ? v.openSessions.size / v.buyers.size : null
    const repeat_rate =
      unique_viewers > 0 ? repeat_viewers / unique_viewers : null
    const sample_ok = unique_viewers >= MIN_PATTERN_SAMPLE
    const sample_note = sample_ok
      ? null
      : unique_viewers === 0
        ? 'ingen seere'
        : `kun ${unique_viewers} seer${unique_viewers === 1 ? '' : 'e'} — ikke nok data`

    return {
      pattern_id,
      views: v.views,
      unique_viewers,
      cart_adds: v.cart,
      unique_cart: v.cartSessions.size,
      cart_rate,
      purchases: v.purchases,
      unique_buyers: v.buyers.size,
      purchase_rate,
      opens_owned: v.opens,
      unique_opens: v.openSessions.size,
      open_rate,
      repeat_viewers,
      repeat_rate,
      sample_ok,
      sample_note,
      top_source:
        [...v.sources.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
      sources: Object.fromEntries(v.sources),
      is_demo_views: v.demoViews,
    }
  })

  const withViews = patterns.filter((r) => r.unique_viewers > 0)
  const avg = (pick: (r: PatternIntel) => number | null) => {
    const vals = withViews
      .map(pick)
      .filter((x): x is number => x != null && Number.isFinite(x))
    if (vals.length === 0) return null
    return vals.reduce((a, b) => a + b, 0) / vals.length
  }

  return {
    patterns,
    benchmarks: {
      cart_rate: avg((r) => r.cart_rate),
      purchase_rate: avg((r) => r.purchase_rate),
      open_rate: avg((r) => r.open_rate),
      repeat_rate: avg((r) => r.repeat_rate),
    },
  }
}

export function sortPatterns(
  patterns: PatternIntel[],
  key: PatternSortKey,
  opts?: { topOnly?: boolean },
): PatternIntel[] {
  let list = [...patterns]
  if (opts?.topOnly) {
    list = list.filter((r) => r.sample_ok)
  }
  const rateKeys = new Set<PatternSortKey>([
    'cart_rate',
    'purchase_rate',
    'repeat_rate',
  ])
  list.sort((a, b) => {
    const av = a[key] ?? -1
    const bv = b[key] ?? -1
    if (rateKeys.has(key)) {
      if (bv !== av) return (bv as number) - (av as number)
      return b.unique_viewers - a.unique_viewers
    }
    if (bv !== av) return (bv as number) - (av as number)
    return b.unique_viewers - a.unique_viewers
  })
  return list
}

export function dailySeries(
  events: AnalyticsEventRow[],
): { day: string; count: number; sessions: number }[] {
  const map = new Map<string, { count: number; sessions: Set<string> }>()
  for (const e of events) {
    const day = e.created_at.slice(0, 10)
    const cur = map.get(day) ?? { count: 0, sessions: new Set() }
    cur.count += 1
    cur.sessions.add(e.anonymous_session_id)
    map.set(day, cur)
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, v]) => ({
      day,
      count: v.count,
      sessions: v.sessions.size,
    }))
}

export type FunnelStep = {
  id: string
  label: string
  sessions: number
  conversionFromStart: number | null
  conversionFromPrev: number | null
}

export function buildFunnel(
  events: AnalyticsEventRow[],
  steps: { id: string; label: string; events: AnalyticsEventName[] }[],
): FunnelStep[] {
  const stepSessions = steps.map((s) => sessionsFor(events, s.events))
  const start = stepSessions[0]?.size ?? 0
  return steps.map((s, i) => {
    const n = stepSessions[i].size
    const prev = i === 0 ? null : stepSessions[i - 1].size
    return {
      id: s.id,
      label: s.label,
      sessions: n,
      conversionFromStart: start > 0 ? n / start : null,
      conversionFromPrev: prev && prev > 0 ? n / prev : i === 0 ? 1 : null,
    }
  })
}

export const FUNNELS = {
  purchase: [
    {
      id: 'explore',
      label: 'Utforsk',
      events: ['explore_viewed'] as AnalyticsEventName[],
    },
    {
      id: 'view',
      label: 'Oppskrift sett',
      events: ['pattern_viewed'] as AnalyticsEventName[],
    },
    {
      id: 'cart',
      label: 'I handlekurv',
      events: ['pattern_added_to_cart'] as AnalyticsEventName[],
    },
    {
      id: 'checkout',
      label: 'Checkout startet',
      events: ['checkout_started'] as AnalyticsEventName[],
    },
    {
      id: 'paid',
      label: 'Betaling fullført (verifisert)',
      events: ['payment_completed'] as AnalyticsEventName[],
    },
    {
      id: 'opened',
      label: 'Åpnet i Mine oppskrifter',
      events: ['pattern_opened_owned', 'pattern_reader_opened'] as AnalyticsEventName[],
    },
  ],
  explore: [
    {
      id: 'explore',
      label: 'Utforsk',
      events: ['explore_viewed'] as AnalyticsEventName[],
    },
    {
      id: 'click',
      label: 'Kort → detalj',
      events: ['explore_pattern_click'] as AnalyticsEventName[],
    },
    {
      id: 'view',
      label: 'Oppskrift sett',
      events: ['pattern_viewed'] as AnalyticsEventName[],
    },
    {
      id: 'cart',
      label: 'I handlekurv',
      events: ['pattern_added_to_cart'] as AnalyticsEventName[],
    },
  ],
  stash: [
    {
      id: 'view',
      label: 'Garnlager åpnet',
      events: ['stash_viewed'] as AnalyticsEventName[],
    },
    {
      id: 'add',
      label: 'Garn lagt til',
      events: ['stash_item_added'] as AnalyticsEventName[],
    },
    {
      id: 'match',
      label: 'Matching sett',
      events: ['yarn_match_viewed', 'yarn_match_state'] as AnalyticsEventName[],
    },
    {
      id: 'cart',
      label: 'I handlekurv',
      events: ['pattern_added_to_cart'] as AnalyticsEventName[],
    },
  ],
  myPatterns: [
    {
      id: 'owned',
      label: 'Mine oppskrifter',
      events: ['my_patterns_viewed'] as AnalyticsEventName[],
    },
    {
      id: 'open',
      label: 'Åpnet oppskrift',
      events: ['pattern_opened_owned'] as AnalyticsEventName[],
    },
    {
      id: 'read',
      label: 'Leser åpnet',
      events: ['pattern_reader_opened'] as AnalyticsEventName[],
    },
  ],
} as const

export type PathEdge = {
  from: string
  to: string
  count: number
  sessions: number
}

export function pathTransitions(events: AnalyticsEventRow[]): PathEdge[] {
  const map = new Map<string, { count: number; sessions: Set<string> }>()
  for (const e of events) {
    if (e.event_name !== 'route_viewed') continue
    const from = (e.from_path || '(start)').slice(0, 80)
    const to = (e.path || '?').slice(0, 80)
    if (from === to) continue
    const key = `${from}→${to}`
    const cur = map.get(key) ?? { count: 0, sessions: new Set() }
    cur.count += 1
    cur.sessions.add(e.anonymous_session_id)
    map.set(key, cur)
  }
  return [...map.entries()]
    .map(([k, v]) => {
      const [from, to] = k.split('→')
      return { from, to, count: v.count, sessions: v.sessions.size }
    })
    .sort((a, b) => b.count - a.count)
}

export function commonPaths(
  events: AnalyticsEventRow[],
  maxLen = 4,
): { path: string; sessions: number }[] {
  const bySession = new Map<string, { t: number; path: string }[]>()
  for (const e of events) {
    if (e.event_name !== 'route_viewed' || !e.path) continue
    const list = bySession.get(e.anonymous_session_id) ?? []
    list.push({ t: new Date(e.created_at).getTime(), path: e.path })
    bySession.set(e.anonymous_session_id, list)
  }
  const pathCounts = new Map<string, Set<string>>()
  for (const [sid, list] of bySession) {
    const ordered = [...list].sort((a, b) => a.t - b.t).map((x) => x.path)
    const uniq: string[] = []
    for (const p of ordered) {
      if (uniq[uniq.length - 1] !== p) uniq.push(p)
    }
    const slice = uniq.slice(0, maxLen)
    if (slice.length < 2) continue
    const key = slice.join(' → ')
    const set = pathCounts.get(key) ?? new Set()
    set.add(sid)
    pathCounts.set(key, set)
  }
  return [...pathCounts.entries()]
    .map(([path, sessions]) => ({ path, sessions: sessions.size }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 20)
}

/** FLOW A/B/C — observational path families, not causal. */
export function userFlowBuckets(events: AnalyticsEventRow[]): {
  id: string
  label: string
  sessions: number
  note: string
}[] {
  const bySession = new Map<string, Set<string>>()
  for (const e of events) {
    const set = bySession.get(e.anonymous_session_id) ?? new Set()
    set.add(e.event_name)
    bySession.set(e.anonymous_session_id, set)
  }
  let a = 0
  let b = 0
  let c = 0
  let other = 0
  for (const names of bySession.values()) {
    const explore = names.has('explore_viewed')
    const stash = names.has('stash_viewed') || names.has('stash_item_added')
    const cart = names.has('pattern_added_to_cart') || names.has('checkout_started')
    const match = names.has('yarn_match_viewed') || names.has('yarn_match_state')
    if (explore && cart && !stash) a += 1
    else if (stash && match) b += 1
    else if (explore && stash) c += 1
    else other += 1
  }
  return [
    {
      id: 'A',
      label: 'FLOW A — Utforsk → kurv',
      sessions: a,
      note: 'Direkte shopp uten garnlager i samme økt',
    },
    {
      id: 'B',
      label: 'FLOW B — Garnlager → matching',
      sessions: b,
      note: 'Starter i stash / matching',
    },
    {
      id: 'C',
      label: 'FLOW C — Utforsk + garnlager',
      sessions: c,
      note: 'Blander browsing og stash i samme økt',
    },
    {
      id: 'other',
      label: 'Andre / ufullstendige',
      sessions: other,
      note: 'Ikke nok signal for A/B/C',
    },
  ]
}

export type RetentionResult = {
  cohortDay: string
  size: number
  d1: number | null
  d7: number | null
  d30: number | null
}

export function computeRetention(events: AnalyticsEventRow[]): RetentionResult[] {
  const firstSeen = new Map<string, string>()
  const activeDays = new Map<string, Set<string>>()
  for (const e of events) {
    const day = e.created_at.slice(0, 10)
    const sid = e.anonymous_session_id
    if (!firstSeen.has(sid) || day < (firstSeen.get(sid) as string)) {
      firstSeen.set(sid, day)
    }
    const set = activeDays.get(sid) ?? new Set()
    set.add(day)
    activeDays.set(sid, set)
  }

  const cohorts = new Map<string, string[]>()
  for (const [sid, day] of firstSeen) {
    const list = cohorts.get(day) ?? []
    list.push(sid)
    cohorts.set(day, list)
  }

  const dayMs = 86400000
  function retained(sids: string[], cohortDay: string, offset: number): number {
    const target = new Date(new Date(cohortDay).getTime() + offset * dayMs)
      .toISOString()
      .slice(0, 10)
    let n = 0
    for (const sid of sids) {
      if (activeDays.get(sid)?.has(target)) n += 1
    }
    return n
  }

  const today = new Date().toISOString().slice(0, 10)
  return [...cohorts.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 30)
    .map(([cohortDay, sids]) => {
      const size = sids.length
      const ageDays = Math.floor(
        (new Date(today).getTime() - new Date(cohortDay).getTime()) / dayMs,
      )
      return {
        cohortDay,
        size,
        d1: ageDays >= 1 ? retained(sids, cohortDay, 1) / size : null,
        d7: ageDays >= 7 ? retained(sids, cohortDay, 7) / size : null,
        d30: ageDays >= 30 ? retained(sids, cohortDay, 30) / size : null,
      }
    })
}

export function featureAdoption(
  events: AnalyticsEventRow[],
): { feature: string; sessions: number; rate: number | null }[] {
  const total = new Set(events.map((e) => e.anonymous_session_id)).size
  const features: { feature: string; events: AnalyticsEventName[] }[] = [
    { feature: 'Utforsk', events: ['explore_viewed'] },
    { feature: 'Søk', events: ['explore_search'] },
    { feature: 'Handlekurv', events: ['cart_viewed', 'pattern_added_to_cart'] },
    { feature: 'Checkout', events: ['checkout_started'] },
    { feature: 'Garnlager', events: ['stash_viewed'] },
    { feature: 'Garnmatching', events: ['yarn_match_viewed', 'yarn_match_state'] },
    { feature: 'Mine oppskrifter', events: ['my_patterns_viewed'] },
    { feature: 'Prosjekter', events: ['projects_viewed', 'project_created'] },
  ]
  return features.map((f) => {
    const sessions = sessionsFor(events, f.events).size
    return {
      feature: f.feature,
      sessions,
      rate: total > 0 ? sessions / total : null,
    }
  })
}

export function deviceBreakdown(
  events: AnalyticsEventRow[],
): { device: string; count: number; sessions: number }[] {
  const map = new Map<string, { count: number; sessions: Set<string> }>()
  for (const e of events) {
    const d =
      typeof e.properties?.device === 'string' ? e.properties.device : 'ukjent'
    const cur = map.get(d) ?? { count: 0, sessions: new Set() }
    cur.count += 1
    cur.sessions.add(e.anonymous_session_id)
    map.set(d, cur)
  }
  return [...map.entries()]
    .map(([device, v]) => ({
      device,
      count: v.count,
      sessions: v.sessions.size,
    }))
    .sort((a, b) => b.sessions - a.sessions)
}

export function browserBreakdown(
  events: AnalyticsEventRow[],
): { browser: string; count: number; sessions: number }[] {
  const map = new Map<string, { count: number; sessions: Set<string> }>()
  for (const e of events) {
    const d =
      typeof e.properties?.browser === 'string'
        ? e.properties.browser
        : 'ukjent'
    const cur = map.get(d) ?? { count: 0, sessions: new Set() }
    cur.count += 1
    cur.sessions.add(e.anonymous_session_id)
    map.set(d, cur)
  }
  return [...map.entries()]
    .map(([browser, v]) => ({
      browser,
      count: v.count,
      sessions: v.sessions.size,
    }))
    .sort((a, b) => b.sessions - a.sessions)
}

export function sourceAttribution(
  events: AnalyticsEventRow[],
): { source: string; views: number; sessions: number }[] {
  const map = new Map<string, { views: number; sessions: Set<string> }>()
  for (const e of events) {
    if (e.event_name !== 'pattern_viewed') continue
    const src = e.source ?? 'unknown'
    const cur = map.get(src) ?? { views: 0, sessions: new Set() }
    cur.views += 1
    cur.sessions.add(e.anonymous_session_id)
    map.set(src, cur)
  }
  return [...map.entries()]
    .map(([source, v]) => ({
      source,
      views: v.views,
      sessions: v.sessions.size,
    }))
    .sort((a, b) => b.views - a.views)
}

export function matchStateBreakdown(
  events: AnalyticsEventRow[],
): { state: string; count: number; sessions: number }[] {
  const map = new Map<string, { count: number; sessions: Set<string> }>()
  for (const e of events) {
    if (
      e.event_name !== 'yarn_match_state' &&
      e.event_name !== 'yarn_match_viewed'
    ) {
      continue
    }
    const state =
      typeof e.properties?.match_state === 'string'
        ? e.properties.match_state
        : 'uncertain'
    const cur = map.get(state) ?? { count: 0, sessions: new Set() }
    cur.count += 1
    cur.sessions.add(e.anonymous_session_id)
    map.set(state, cur)
  }
  const order = ['great', 'enough', 'nearly', 'insufficient', 'uncertain']
  return [...map.entries()]
    .map(([state, v]) => ({
      state,
      count: v.count,
      sessions: v.sessions.size,
    }))
    .sort(
      (a, b) =>
        order.indexOf(a.state) - order.indexOf(b.state) || b.sessions - a.sessions,
    )
}

/** Observational: sessions with stash/match vs without — not causal. */
export function matcherVsNonMatcher(events: AnalyticsEventRow[]): {
  label: string
  sessions: number
  cartRate: number | null
  note: string
}[] {
  const bySession = new Map<string, Set<string>>()
  for (const e of events) {
    const set = bySession.get(e.anonymous_session_id) ?? new Set()
    set.add(e.event_name)
    bySession.set(e.anonymous_session_id, set)
  }
  let matchers = 0
  let matchersCart = 0
  let non = 0
  let nonCart = 0
  for (const names of bySession.values()) {
    const matched =
      names.has('yarn_match_viewed') ||
      names.has('yarn_match_state') ||
      names.has('stash_item_added')
    const cart = names.has('pattern_added_to_cart')
    if (matched) {
      matchers += 1
      if (cart) matchersCart += 1
    } else {
      non += 1
      if (cart) nonCart += 1
    }
  }
  return [
    {
      label: 'Med garnlager/matching',
      sessions: matchers,
      cartRate: matchers > 0 ? matchersCart / matchers : null,
      note: 'Observasjonelt — ikke kausal',
    },
    {
      label: 'Uten garnlager/matching',
      sessions: non,
      cartRate: non > 0 ? nonCart / non : null,
      note: 'Observasjonelt — ikke kausal',
    },
  ]
}

export function timeToActionBuckets(
  events: AnalyticsEventRow[],
): { bucket: string; count: number }[] {
  const bySession = new Map<string, AnalyticsEventRow[]>()
  for (const e of events) {
    const list = bySession.get(e.anonymous_session_id) ?? []
    list.push(e)
    bySession.set(e.anonymous_session_id, list)
  }
  const buckets = new Map<string, number>([
    ['0–30s', 0],
    ['30s–2m', 0],
    ['2–10m', 0],
    ['10m+', 0],
  ])
  for (const list of bySession.values()) {
    const ordered = [...list].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
    const start =
      ordered.find((e) => e.event_name === 'session_started') ?? ordered[0]
    const action = ordered.find((e) =>
      [
        'pattern_added_to_cart',
        'stash_item_added',
        'explore_search',
        'checkout_started',
      ].includes(e.event_name),
    )
    if (!start || !action) continue
    const sec =
      (new Date(action.created_at).getTime() -
        new Date(start.created_at).getTime()) /
      1000
    if (sec < 0) continue
    const key =
      sec <= 30 ? '0–30s' : sec <= 120 ? '30s–2m' : sec <= 600 ? '2–10m' : '10m+'
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }
  return [...buckets.entries()].map(([bucket, count]) => ({ bucket, count }))
}

export function searchIntelligence(events: AnalyticsEventRow[]): {
  buckets: { label: string; count: number }[]
  validatedTerms: { term: string; count: number; zero: boolean }[]
  zeroResults: number
  searches: number
  searchSessions: number
  openFromSearch: number
  purchaseFromSearch: number
} {
  const buckets = new Map<string, number>()
  const terms = new Map<string, { count: number; zero: number }>()
  let searches = 0
  let zeroResults = 0
  const searchSessions = new Set<string>()
  const openFromSearch = new Set<string>()
  const purchaseFromSearch = new Set<string>()

  for (const e of events) {
    if (e.event_name === 'explore_search') {
      searches += 1
      searchSessions.add(e.anonymous_session_id)
      const bucket =
        typeof e.properties?.query_bucket === 'string'
          ? e.properties.query_bucket
          : 'other'
      buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1)
      const term =
        typeof e.properties?.validated_term === 'string'
          ? e.properties.validated_term
          : null
      const zero =
        e.properties?.zero_results === true || e.properties?.zero_results === 1
      if (zero) zeroResults += 1
      if (term) {
        const cur = terms.get(term) ?? { count: 0, zero: 0 }
        cur.count += 1
        if (zero) cur.zero += 1
        terms.set(term, cur)
      }
    }
    if (
      (e.event_name === 'pattern_viewed' ||
        e.event_name === 'explore_pattern_click') &&
      (e.source === 'search' || e.properties?.via === 'search')
    ) {
      openFromSearch.add(e.anonymous_session_id)
    }
    if (
      e.event_name === 'payment_completed' &&
      (e.source === 'search' || e.properties?.via === 'search')
    ) {
      purchaseFromSearch.add(e.anonymous_session_id)
    }
  }

  return {
    buckets: [...buckets.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    validatedTerms: [...terms.entries()]
      .map(([term, v]) => ({
        term,
        count: v.count,
        zero: v.zero > 0 && v.zero === v.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 40),
    zeroResults,
    searches,
    searchSessions: searchSessions.size,
    openFromSearch: openFromSearch.size,
    purchaseFromSearch: purchaseFromSearch.size,
  }
}

export function projectStatusBreakdown(
  events: AnalyticsEventRow[],
): { status: string; count: number }[] {
  const map = new Map<string, number>()
  for (const e of events) {
    if (
      e.event_name !== 'project_created' &&
      e.event_name !== 'project_status_changed'
    ) {
      continue
    }
    const status =
      typeof e.properties?.status === 'string' ? e.properties.status : 'unknown'
    map.set(status, (map.get(status) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)
}

export function technicalHealth(events: AnalyticsEventRow[]): {
  clientErrors: number
  errorSessions: number
  byPath: { path: string; count: number }[]
} {
  const errs = events.filter((e) => e.event_name === 'technical_error')
  const byPath = new Map<string, number>()
  for (const e of errs) {
    const p =
      e.path ||
      (typeof e.properties?.path === 'string' ? e.properties.path : 'ukjent')
    byPath.set(p, (byPath.get(p) ?? 0) + 1)
  }
  return {
    clientErrors: errs.length,
    errorSessions: new Set(errs.map((e) => e.anonymous_session_id)).size,
    byPath: [...byPath.entries()]
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count),
  }
}

export function deltaLabel(
  current: number,
  previous: number | null,
): string | null {
  if (previous == null || previous === 0) return null
  const d = ((current - previous) / previous) * 100
  const sign = d > 0 ? '+' : ''
  return `${sign}${d.toFixed(0)}% vs forrige`
}

export function overviewKpis(
  events: AnalyticsEventRow[],
  previous: AnalyticsEventRow[],
) {
  const sessions = new Set(events.map((e) => e.anonymous_session_id)).size
  const prevSessions = new Set(previous.map((e) => e.anonymous_session_id)).size
  const views = countEvent(events, 'pattern_viewed')
  const prevViews = countEvent(previous, 'pattern_viewed')
  const cart = countEvent(events, 'pattern_added_to_cart')
  const prevCart = countEvent(previous, 'pattern_added_to_cart')
  const stash = sessionsFor(events, 'stash_viewed').size
  const prevStash = sessionsFor(previous, 'stash_viewed').size
  const paid = countEvent(events, 'payment_completed')
  const viewers = sessionsFor(events, 'pattern_viewed').size
  const cartSessions = sessionsFor(events, 'pattern_added_to_cart').size
  return {
    sessions: {
      value: sessions,
      delta: deltaLabel(sessions, prevSessions || null),
    },
    views: { value: views, delta: deltaLabel(views, prevViews || null) },
    cart: { value: cart, delta: deltaLabel(cart, prevCart || null) },
    stash: { value: stash, delta: deltaLabel(stash, prevStash || null) },
    cartRate: rateFrom(cartSessions, viewers),
    verifiedPurchases: paid,
  }
}

export function salesSnapshot(events: AnalyticsEventRow[]): {
  verifiedPurchases: number
  freeClaims: number
  checkoutStarted: number
  stripeAttempts: number
  successPageViews: number
  demoViews: number
  stripeReady: boolean
  note: string
} {
  let demoViews = 0
  for (const e of events) {
    if (e.event_name === 'pattern_viewed' && e.properties?.is_demo === true) {
      demoViews += 1
    }
  }
  const verifiedPurchases = countEvent(events, 'payment_completed')
  return {
    verifiedPurchases,
    freeClaims: countEvent(events, 'free_pattern_claimed'),
    checkoutStarted: countEvent(events, 'checkout_started'),
    stripeAttempts: countEvent(events, 'checkout_stripe_attempt'),
    successPageViews: countEvent(events, 'checkout_success_page_viewed'),
    demoViews,
    stripeReady: false,
    note:
      verifiedPurchases === 0
        ? 'Stripe er ikke tilkoblet — verifisert omsetning er utilgjengelig. Success-side telles separat og er ikke kjøp.'
        : 'Kun payment_completed (webhook/verifisert eierskap) teller som kjøp.',
  }
}

export function eventsToCsv(events: AnalyticsEventRow[]): string {
  const header = [
    'created_at',
    'event_name',
    'pattern_id',
    'source',
    'env',
    'path',
    'from_path',
    'anonymous_session_id',
  ]
  const lines = [header.join(',')]
  for (const e of events.slice(0, 5000)) {
    lines.push(
      [
        e.created_at,
        e.event_name,
        e.pattern_id ?? '',
        e.source ?? '',
        e.env ?? '',
        e.path ?? '',
        e.from_path ?? '',
        e.anonymous_session_id,
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(','),
    )
  }
  return lines.join('\n')
}

export function propString(e: AnalyticsEventRow, key: string): string | null {
  const v = e.properties?.[key]
  return typeof v === 'string' && v.trim() ? v.trim() : null
}
