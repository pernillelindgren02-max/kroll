import { useEffect, useMemo, useState } from 'react'
import { usePatterns } from '../../context/PatternsContext'
import {
  fetchAnalyticsEvents,
  uniqueSessions,
  uniqueUsers,
  type AnalyticsEnv,
  type AnalyticsEventRow,
  type AnalyticsPeriod,
} from '../../lib/analytics'
import {
  buildFunnel,
  buildPatternIntelligence,
  browserBreakdown,
  commonPaths,
  computeRetention,
  deviceBreakdown,
  eventsToCsv,
  featureAdoption,
  FUNNELS,
  matcherVsNonMatcher,
  matchStateBreakdown,
  MIN_PATTERN_SAMPLE,
  overviewKpis,
  pathTransitions,
  pct,
  ppDelta,
  projectStatusBreakdown,
  salesSnapshot,
  searchIntelligence,
  sortPatterns,
  sourceAttribution,
  technicalHealth,
  timeToActionBuckets,
  userFlowBuckets,
  type PatternSortKey,
} from '../../lib/analyticsAggregates'
import { lt } from '../../lib/localeText'
import { useLocale } from '../../context/LocaleContext'
import './Admin.css'

const PERIODS: { id: AnalyticsPeriod; label: string }[] = [
  { id: 'today', label: 'I dag' },
  { id: '7d', label: '7 dager' },
  { id: '30d', label: '30 dager' },
  { id: '90d', label: '90 dager' },
  { id: 'all', label: 'Alt' },
  { id: 'custom', label: 'Egendefinert' },
]

type TabId =
  | 'overview'
  | 'flow'
  | 'sales'
  | 'patterns'
  | 'explore'
  | 'search'
  | 'stash'
  | 'matching'
  | 'myPatterns'
  | 'projects'
  | 'retention'
  | 'technical'

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Oversikt' },
  { id: 'flow', label: 'Brukerflyt' },
  { id: 'sales', label: 'Salg' },
  { id: 'patterns', label: 'Oppskrifter' },
  { id: 'explore', label: 'Utforsk' },
  { id: 'search', label: 'Søk' },
  { id: 'stash', label: 'Garnlager' },
  { id: 'matching', label: 'Garnmatching' },
  { id: 'myPatterns', label: 'Mine oppskrifter' },
  { id: 'projects', label: 'Prosjekter' },
  { id: 'retention', label: 'Retention' },
  { id: 'technical', label: 'Teknisk' },
]

const PATTERN_SORTS: { id: PatternSortKey; label: string }[] = [
  { id: 'views', label: 'Visninger' },
  { id: 'cart_adds', label: 'Kurv-antall' },
  { id: 'cart_rate', label: 'Kurv-rate' },
  { id: 'purchases', label: 'Kjøp/claims' },
  { id: 'purchase_rate', label: 'Kjøpsrate' },
  { id: 'opens_owned', label: 'Åpninger' },
  { id: 'repeat_rate', label: 'Gjenbesøk' },
]

function MiniBars({
  rows,
}: {
  rows: { label: string; value: number; max?: number }[]
}) {
  const max = Math.max(1, ...rows.map((r) => r.max ?? r.value))
  return (
    <ul className="innsikt-bars">
      {rows.map((r) => (
        <li key={r.label} className="innsikt-bars__row">
          <span className="innsikt-bars__label">{r.label}</span>
          <span className="innsikt-bars__track">
            <span
              className="innsikt-bars__fill"
              style={{ width: `${Math.round((r.value / max) * 100)}%` }}
            />
          </span>
          <span className="innsikt-bars__value">{r.value}</span>
        </li>
      ))}
    </ul>
  )
}

function FunnelBlock({
  title,
  steps,
}: {
  title: string
  steps: {
    label: string
    sessions: number
    conversionFromStart: number | null
    conversionFromPrev: number | null
  }[]
}) {
  return (
    <section className="innsikt-panel">
      <h3 className="innsikt-panel__title">{title}</h3>
      <ol className="innsikt-funnel">
        {steps.map((s, i) => (
          <li key={s.label} className="innsikt-funnel__step">
            <span className="innsikt-funnel__n">{i + 1}</span>
            <div>
              <p className="admin-list__name">{s.label}</p>
              <p className="admin-list__meta">
                {s.sessions} unike økter
                {s.conversionFromPrev != null && i > 0
                  ? ` · ${pct(s.conversionFromPrev)} fra forrige`
                  : ''}
                {s.conversionFromStart != null
                  ? ` · ${pct(s.conversionFromStart)} fra start`
                  : ''}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Kpi({
  label,
  value,
  delta,
  hint,
}: {
  label: string
  value: string | number
  delta?: string | null
  hint?: string
}) {
  return (
    <article className="innsikt-kpi">
      <p className="innsikt-kpi__label">{label}</p>
      <p className="innsikt-kpi__value">{value}</p>
      {delta ? <p className="innsikt-delta">{delta}</p> : null}
      {hint ? <p className="admin-list__meta">{hint}</p> : null}
    </article>
  )
}

export function AdminInnsiktPage() {
  const { locale } = useLocale()
  const { patterns } = usePatterns()
  const [period, setPeriod] = useState<AnalyticsPeriod>('7d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [env, setEnv] = useState<AnalyticsEnv | 'all'>('all')
  const [excludeDev, setExcludeDev] = useState(false)
  const [tab, setTab] = useState<TabId>('overview')
  const [events, setEvents] = useState<AnalyticsEventRow[]>([])
  const [previous, setPrevious] = useState<AnalyticsEventRow[]>([])
  const [source, setSource] = useState<'supabase' | 'local'>('local')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [patternSort, setPatternSort] = useState<PatternSortKey>('views')
  const [topOnly, setTopOnly] = useState(true)
  const [drillPattern, setDrillPattern] = useState<string | null>(null)

  const patternName = useMemo(() => {
    const map = new Map(patterns.map((p) => [p.id, lt(p.title, locale)]))
    return (id: string) => map.get(id) ?? id
  }, [patterns, locale])

  const effectiveEnv: AnalyticsEnv | 'all' = excludeDev ? 'prod' : env

  async function reload() {
    setLoading(true)
    try {
      const custom =
        period === 'custom' && customFrom && customTo
          ? { from: customFrom, to: customTo }
          : undefined
      const result = await fetchAnalyticsEvents({
        period,
        custom,
        env: effectiveEnv,
        includePrevious: true,
      })
      setEvents(result.events)
      setPrevious(result.previous)
      setSource(result.source)
      setMessage(
        result.source === 'local'
          ? 'Viser lokal buffer (kjør kroll/supabase/kroll-analytics.sql for sky-Innsikt).'
          : null,
      )
    } catch {
      setEvents([])
      setPrevious([])
      setMessage('Kunne ikke hente Innsikt.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on filters
  }, [period, customFrom, customTo, effectiveEnv])

  const sessions = uniqueSessions(events)
  const users = uniqueUsers(events)
  const kpis = useMemo(() => overviewKpis(events, previous), [events, previous])
  const series = useMemo(() => dailySeriesSafe(events), [events])
  const { patterns: patternIntel, benchmarks } = useMemo(
    () => buildPatternIntelligence(events),
    [events],
  )
  const sortedPatterns = useMemo(
    () => sortPatterns(patternIntel, patternSort, { topOnly }),
    [patternIntel, patternSort, topOnly],
  )
  const purchaseFunnel = useMemo(
    () => buildFunnel(events, [...FUNNELS.purchase]),
    [events],
  )
  const exploreFunnel = useMemo(
    () => buildFunnel(events, [...FUNNELS.explore]),
    [events],
  )
  const stashFunnel = useMemo(
    () => buildFunnel(events, [...FUNNELS.stash]),
    [events],
  )
  const myFunnel = useMemo(
    () => buildFunnel(events, [...FUNNELS.myPatterns]),
    [events],
  )
  const retention = useMemo(() => computeRetention(events), [events])
  const devices = useMemo(() => deviceBreakdown(events), [events])
  const browsers = useMemo(() => browserBreakdown(events), [events])
  const tech = useMemo(() => technicalHealth(events), [events])
  const sales = useMemo(() => salesSnapshot(events), [events])
  const search = useMemo(() => searchIntelligence(events), [events])
  const matchStates = useMemo(() => matchStateBreakdown(events), [events])
  const matcherCmp = useMemo(() => matcherVsNonMatcher(events), [events])
  const flows = useMemo(() => userFlowBuckets(events), [events])
  const adoption = useMemo(() => featureAdoption(events), [events])
  const sources = useMemo(() => sourceAttribution(events), [events])
  const transitions = useMemo(() => pathTransitions(events).slice(0, 15), [events])
  const paths = useMemo(() => commonPaths(events), [events])
  const timeBuckets = useMemo(() => timeToActionBuckets(events), [events])
  const projectStatuses = useMemo(() => projectStatusBreakdown(events), [events])

  const drill = drillPattern
    ? patternIntel.find((p) => p.pattern_id === drillPattern)
    : null

  function downloadCsv() {
    const csv = eventsToCsv(events)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kroll-innsikt-${period}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="admin-innsikt">
      <header className="admin-page-header">
        <h1>Innsikt</h1>
        <p className="admin-list__meta">
          Analytics-kontrollsenter · {sessions} økter · {users} innloggede brukere
          · kilde: {source}
          {loading ? ' · laster…' : ''}
        </p>
      </header>

      <label className="innsikt-tab-select">
        <span>Seksjon</span>
        <select
          value={tab}
          onChange={(e) => setTab(e.target.value as TabId)}
          aria-label="Innsikt-seksjon"
        >
          {TABS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <div className="admin-filter-tabs innsikt-section-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={
              tab === t.id
                ? 'admin-filter-tabs__btn admin-filter-tabs__btn--active'
                : 'admin-filter-tabs__btn'
            }
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="innsikt-toolbar">
        <div className="admin-filter-tabs">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={
                period === p.id
                  ? 'admin-filter-tabs__btn admin-filter-tabs__btn--active'
                  : 'admin-filter-tabs__btn'
              }
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <label className="innsikt-check">
          Env
          <select
            value={env}
            onChange={(e) => setEnv(e.target.value as AnalyticsEnv | 'all')}
            disabled={excludeDev}
          >
            <option value="all">alle</option>
            <option value="dev">dev</option>
            <option value="prod">prod</option>
          </select>
        </label>
        <label className="innsikt-check">
          <input
            type="checkbox"
            checked={excludeDev}
            onChange={(e) => setExcludeDev(e.target.checked)}
          />
          Skjul dev
        </label>
        <button type="button" className="btn btn--ghost" onClick={() => void reload()}>
          Oppdater
        </button>
        <button type="button" className="btn btn--ghost" onClick={downloadCsv}>
          Eksporter CSV
        </button>
      </div>

      {period === 'custom' && (
        <div className="innsikt-custom-range">
          <label>
            Fra
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
          </label>
          <label>
            Til
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </label>
        </div>
      )}

      {message ? <p className="innsikt-banner">{message}</p> : null}

      {tab === 'overview' && (
        <>
          <div className="innsikt-kpi-grid">
            <Kpi
              label="Økter"
              value={kpis.sessions.value}
              delta={kpis.sessions.delta}
            />
            <Kpi
              label="Oppskriftvisninger"
              value={kpis.views.value}
              delta={kpis.views.delta}
            />
            <Kpi
              label="Kurv-adds"
              value={kpis.cart.value}
              delta={kpis.cart.delta}
            />
            <Kpi
              label="Garnlager-økter"
              value={kpis.stash.value}
              delta={kpis.stash.delta}
            />
            <Kpi
              label="Kurv-rate"
              value={kpis.cartRate.rateLabel}
              hint={
                kpis.cartRate.sampleNote
                  ? kpis.cartRate.sampleNote
                  : `${kpis.cartRate.unique} økter med kurv / seere`
              }
            />
            <Kpi
              label="Verifiserte kjøp"
              value={kpis.verifiedPurchases}
              hint="Stripe utilgjengelig til tilkoblet"
            />
          </div>
          <section className="innsikt-panel">
            <h3 className="innsikt-panel__title">Aktivitet per dag</h3>
            <MiniBars
              rows={series.map((d) => ({
                label: d.day.slice(5),
                value: d.sessions,
              }))}
            />
          </section>
          <FunnelBlock title="Kjøpstrakt" steps={purchaseFunnel} />
          <section className="innsikt-panel">
            <h3 className="innsikt-panel__title">Funksjonsadopsjon</h3>
            <ul className="innsikt-rate-grid">
              {adoption.map((f) => (
                <li key={f.feature}>
                  <strong>{f.feature}</strong> — {f.sessions} økter
                  {f.rate != null ? ` · ${pct(f.rate)}` : ''}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {tab === 'flow' && (
        <>
          <section className="innsikt-panel">
            <h3 className="innsikt-panel__title">FLOW A / B / C</h3>
            <p className="admin-list__meta">
              Observasjonelle øktfamilier — ikke kausale.
            </p>
            <ul className="innsikt-rate-grid">
              {flows.map((f) => (
                <li key={f.id}>
                  <strong>{f.label}</strong> — {f.sessions} økter
                  <br />
                  <span className="admin-list__meta">{f.note}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="innsikt-panel">
            <h3 className="innsikt-panel__title">Vanlige stier</h3>
            <ul className="innsikt-rate-grid">
              {paths.length === 0 ? (
                <li>Ikke nok rutedata ennå.</li>
              ) : (
                paths.map((p) => (
                  <li key={p.path}>
                    {p.path} — {p.sessions} økter
                  </li>
                ))
              )}
            </ul>
          </section>
          <section className="innsikt-panel">
            <h3 className="innsikt-panel__title">Overganger</h3>
            <ul className="innsikt-rate-grid">
              {transitions.map((t) => (
                <li key={`${t.from}-${t.to}`}>
                  {t.from} → {t.to} — {t.count} ({t.sessions} økter)
                </li>
              ))}
            </ul>
          </section>
          <section className="innsikt-panel">
            <h3 className="innsikt-panel__title">Tid til første handling</h3>
            <MiniBars
              rows={timeBuckets.map((b) => ({
                label: b.bucket,
                value: b.count,
              }))}
            />
          </section>
        </>
      )}

      {tab === 'sales' && (
        <>
          <div className="innsikt-kpi-grid">
            <Kpi
              label="Verifiserte kjøp (NOK-klar)"
              value={sales.verifiedPurchases}
              hint="Kun payment_completed"
            />
            <Kpi label="Gratis claims" value={sales.freeClaims} />
            <Kpi label="Checkout startet" value={sales.checkoutStarted} />
            <Kpi label="Stripe-forsøk" value={sales.stripeAttempts} />
            <Kpi
              label="Success-side"
              value={sales.successPageViews}
              hint="Ikke kjøp"
            />
            <Kpi
              label="Demo-visninger"
              value={sales.demoViews}
              hint="Separert fra betalt omsetning"
            />
          </div>
          <section className="innsikt-panel innsikt-panel--warn">
            <h3 className="innsikt-panel__title">Stripe</h3>
            <p>{sales.note}</p>
            <p className="admin-list__meta">
              Omsetning i NOK vises her når Stripe + webhook er tilkoblet. Aldri
              fabrikkert.
            </p>
          </section>
          <FunnelBlock title="Kjøpstrakt" steps={purchaseFunnel} />
        </>
      )}

      {tab === 'patterns' && (
        <>
          <div className="innsikt-toolbar">
            <label className="innsikt-check">
              Sorter
              <select
                value={patternSort}
                onChange={(e) =>
                  setPatternSort(e.target.value as PatternSortKey)
                }
              >
                {PATTERN_SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="innsikt-check">
              <input
                type="checkbox"
                checked={topOnly}
                onChange={(e) => setTopOnly(e.target.checked)}
              />
              Kun ≥ {MIN_PATTERN_SAMPLE} unike seere
            </label>
          </div>
          <section className="innsikt-panel">
            <h3 className="innsikt-panel__title">Benchmarks (snitt)</h3>
            <ul className="innsikt-rate-grid">
              <li>Kurv-rate: {benchmarks.cart_rate != null ? pct(benchmarks.cart_rate) : '—'}</li>
              <li>
                Kjøpsrate:{' '}
                {benchmarks.purchase_rate != null
                  ? pct(benchmarks.purchase_rate)
                  : '—'}
              </li>
              <li>
                Åpne etter eierskap:{' '}
                {benchmarks.open_rate != null ? pct(benchmarks.open_rate) : '—'}
              </li>
              <li>
                Gjenbesøk:{' '}
                {benchmarks.repeat_rate != null
                  ? pct(benchmarks.repeat_rate)
                  : '—'}
              </li>
            </ul>
          </section>
          <div className="innsikt-metric-cards">
            {sortedPatterns.length === 0 ? (
              <p className="admin-list__meta">
                {topOnly
                  ? 'Ikke nok data ennå for ranking med minste utvalg.'
                  : 'Ingen oppskriftshendelser i perioden.'}
              </p>
            ) : (
              sortedPatterns.map((p) => (
                <article key={p.pattern_id} className="innsikt-metric-card">
                  <h4 className="innsikt-metric-card__title">
                    <button
                      type="button"
                      className="innsikt-linkish"
                      onClick={() => setDrillPattern(p.pattern_id)}
                    >
                      {patternName(p.pattern_id)}
                    </button>
                    {p.is_demo_views ? ' · demo' : ''}
                  </h4>
                  {!p.sample_ok && p.sample_note ? (
                    <p className="innsikt-flag">{p.sample_note}</p>
                  ) : null}
                  <dl>
                    <div className="innsikt-metric-card__row">
                      <dt>Visninger</dt>
                      <dd>
                        {p.views} ({p.unique_viewers} økter)
                      </dd>
                    </div>
                    <div className="innsikt-metric-card__row">
                      <dt>Kurv %</dt>
                      <dd>
                        {p.cart_adds}
                        {p.cart_rate != null ? ` · ${pct(p.cart_rate)}` : ''}
                      </dd>
                    </div>
                    <div className="innsikt-metric-card__row">
                      <dt>Kjøp %</dt>
                      <dd>
                        {p.purchases}
                        {p.purchase_rate != null
                          ? ` · ${pct(p.purchase_rate)}`
                          : ''}
                      </dd>
                    </div>
                    <div className="innsikt-metric-card__row">
                      <dt>Kilde</dt>
                      <dd>{p.top_source ?? '—'}</dd>
                    </div>
                  </dl>
                </article>
              ))
            )}
          </div>

          <div className="innsikt-table-wrap">
            <table className="innsikt-table">
              <thead>
                <tr>
                  <th>Oppskrift</th>
                  <th>Visninger</th>
                  <th>Kurv</th>
                  <th>Kjøp/claim</th>
                  <th>Kilde</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedPatterns.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      {topOnly
                        ? 'Ikke nok data ennå for ranking med minste utvalg.'
                        : 'Ingen oppskriftshendelser i perioden.'}
                    </td>
                  </tr>
                ) : (
                  sortedPatterns.map((p) => (
                    <tr key={p.pattern_id}>
                      <td>
                        <button
                          type="button"
                          className="innsikt-linkish"
                          onClick={() => setDrillPattern(p.pattern_id)}
                        >
                          {patternName(p.pattern_id)}
                        </button>
                        {!p.sample_ok && p.sample_note ? (
                          <span className="innsikt-flag"> · {p.sample_note}</span>
                        ) : null}
                      </td>
                      <td>
                        {p.views} ({p.unique_viewers} økter)
                      </td>
                      <td>
                        {p.cart_adds}
                        {p.cart_rate != null ? ` · ${pct(p.cart_rate)}` : ''}
                        {ppDelta(p.cart_rate, benchmarks.cart_rate)
                          ? ` · ${ppDelta(p.cart_rate, benchmarks.cart_rate)}`
                          : ''}
                      </td>
                      <td>
                        {p.purchases}
                        {p.purchase_rate != null
                          ? ` · ${pct(p.purchase_rate)}`
                          : ''}
                      </td>
                      <td>{p.top_source ?? '—'}</td>
                      <td>{p.is_demo_views ? 'demo' : ''}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {drill && (
            <section className="innsikt-panel">
              <div className="innsikt-panel__head">
                <h3 className="innsikt-panel__title">
                  Detalj: {patternName(drill.pattern_id)}
                </h3>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setDrillPattern(null)}
                >
                  Lukk
                </button>
              </div>
              <ul className="innsikt-rate-grid">
                <li>
                  Kilder:{' '}
                  {Object.entries(drill.sources)
                    .map(([k, v]) => `${k} (${v})`)
                    .join(', ') || '—'}
                </li>
                <li>
                  Åpnet etter eierskap: {drill.opens_owned} (
                  {drill.open_rate != null ? pct(drill.open_rate) : '—'})
                </li>
                <li>
                  Gjenbesøk: {drill.repeat_viewers} (
                  {drill.repeat_rate != null ? pct(drill.repeat_rate) : '—'})
                </li>
              </ul>
            </section>
          )}
        </>
      )}

      {tab === 'explore' && (
        <>
          <FunnelBlock title="Utforsk-trakt" steps={exploreFunnel} />
          <section className="innsikt-panel">
            <h3 className="innsikt-panel__title">Trafikkilder til oppskrift</h3>
            <MiniBars
              rows={sources.map((s) => ({
                label: s.source.slice(0, 12),
                value: s.views,
              }))}
            />
          </section>
          <p className="admin-list__meta">
            Filter/kategori/sort trackes når UI sender explore_filter_apply /
            explore_category_open / explore_sort_change. Ingen heatmaps.
          </p>
        </>
      )}

      {tab === 'search' && (
        <>
          <div className="innsikt-kpi-grid">
            <Kpi label="Søk" value={search.searches} />
            <Kpi label="Søkeøkter" value={search.searchSessions} />
            <Kpi
              label="Zero-result"
              value={search.zeroResults}
              hint={
                search.searches
                  ? pct(search.zeroResults / search.searches)
                  : undefined
              }
            />
            <Kpi label="Åpnet fra søk" value={search.openFromSearch} />
            <Kpi
              label="Kjøp fra søk"
              value={search.purchaseFromSearch}
              hint="Kun verifisert"
            />
          </div>
          <section className="innsikt-panel">
            <h3 className="innsikt-panel__title">Query-lengde (buckets)</h3>
            <MiniBars
              rows={search.buckets.map((b) => ({
                label: b.label,
                value: b.count,
              }))}
            />
          </section>
          <section className="innsikt-panel">
            <h3 className="innsikt-panel__title">
              Udekket etterspørsel (aggregert vokabular)
            </h3>
            <p className="admin-list__meta">
              Kun validerte offentlige termer — ingen rå søkehistorikk per bruker.
            </p>
            <ul className="innsikt-rate-grid">
              {search.validatedTerms.filter((t) => t.zero).length === 0 ? (
                <li>Ingen zero-result termer ennå (eller søk ikke i bruk).</li>
              ) : (
                search.validatedTerms
                  .filter((t) => t.zero)
                  .map((t) => (
                    <li key={t.term}>
                      {t.count} søk på «{t.term}» — ingen treff
                    </li>
                  ))
              )}
            </ul>
          </section>
        </>
      )}

      {tab === 'stash' && (
        <>
          <FunnelBlock title="Garnlager-trakt" steps={stashFunnel} />
          <section className="innsikt-panel">
            <h3 className="innsikt-panel__title">Adopsjon</h3>
            <ul className="innsikt-rate-grid">
              {adoption
                .filter((f) => f.feature === 'Garnlager' || f.feature === 'Garnmatching')
                .map((f) => (
                  <li key={f.feature}>
                    {f.feature}: {f.sessions} økter
                    {f.rate != null ? ` · ${pct(f.rate)} av alle økter` : ''}
                  </li>
                ))}
            </ul>
            <p className="admin-list__meta">
              Private stash-innhold lagres aldri i analytics — kun trygge
              metadata (f.eks. match_state, has_stash).
            </p>
          </section>
        </>
      )}

      {tab === 'matching' && (
        <>
          <section className="innsikt-panel">
            <h3 className="innsikt-panel__title">Match-tilstander</h3>
            <MiniBars
              rows={matchStates.map((m) => ({
                label: m.state,
                value: m.sessions,
              }))}
            />
          </section>
          <FunnelBlock title="Matching-trakt" steps={stashFunnel} />
          <section className="innsikt-panel">
            <h3 className="innsikt-panel__title">
              Matchere vs ikke-matchere
            </h3>
            <p className="admin-list__meta">
              Observasjonell sammenligning — ikke kausal.
            </p>
            <ul className="innsikt-rate-grid">
              {matcherCmp.map((r) => (
                <li key={r.label}>
                  <strong>{r.label}</strong> — {r.sessions} økter · kurv-rate{' '}
                  {r.cartRate != null ? pct(r.cartRate) : '—'}
                  <br />
                  <span className="admin-list__meta">{r.note}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {tab === 'myPatterns' && (
        <>
          <FunnelBlock title="Mine oppskrifter" steps={myFunnel} />
          <section className="innsikt-panel">
            <h3 className="innsikt-panel__title">Kjøp → første åpning</h3>
            <p className="admin-list__meta">
              Måles via payment_completed / free_pattern_claimed →
              pattern_opened_owned / pattern_reader_opened per økt. Median tid
              vises når utvalget er pålitelig.
            </p>
            <ul className="innsikt-rate-grid">
              <li>
                Verifiserte kjøp: {sales.verifiedPurchases} · gratis claims:{' '}
                {sales.freeClaims}
              </li>
              <li>
                Åpninger (eiet):{' '}
                {
                  events.filter(
                    (e) =>
                      e.event_name === 'pattern_opened_owned' ||
                      e.event_name === 'pattern_reader_opened',
                  ).length
                }
              </li>
            </ul>
          </section>
        </>
      )}

      {tab === 'projects' && (
        <section className="innsikt-panel">
          <h3 className="innsikt-panel__title">Prosjektstatus (eksplisitt)</h3>
          <p className="admin-list__meta">
            Kun status satt av brukeren — ingen antatte tilstander.
          </p>
          {projectStatuses.length === 0 ? (
            <p>Ingen prosjekthendelser i perioden.</p>
          ) : (
            <MiniBars
              rows={projectStatuses.map((p) => ({
                label: p.status,
                value: p.count,
              }))}
            />
          )}
        </section>
      )}

      {tab === 'retention' && (
        <section className="innsikt-panel">
          <h3 className="innsikt-panel__title">D1 / D7 / D30 kohorter</h3>
          <div className="innsikt-metric-cards">
            {retention.length === 0 ? (
              <p className="admin-list__meta">Ikke nok data.</p>
            ) : (
              retention.map((r) => (
                <article key={r.cohortDay} className="innsikt-metric-card">
                  <h4 className="innsikt-metric-card__title">{r.cohortDay}</h4>
                  <dl>
                    <div className="innsikt-metric-card__row">
                      <dt>Størrelse</dt>
                      <dd>{r.size}</dd>
                    </div>
                    <div className="innsikt-metric-card__row">
                      <dt>D1</dt>
                      <dd>{r.d1 != null ? pct(r.d1) : '—'}</dd>
                    </div>
                    <div className="innsikt-metric-card__row">
                      <dt>D7</dt>
                      <dd>{r.d7 != null ? pct(r.d7) : '—'}</dd>
                    </div>
                    <div className="innsikt-metric-card__row">
                      <dt>D30</dt>
                      <dd>{r.d30 != null ? pct(r.d30) : '—'}</dd>
                    </div>
                  </dl>
                </article>
              ))
            )}
          </div>
          <div className="innsikt-table-wrap">
            <table className="innsikt-table">
              <thead>
                <tr>
                  <th>Kohort</th>
                  <th>Størrelse</th>
                  <th>D1</th>
                  <th>D7</th>
                  <th>D30</th>
                </tr>
              </thead>
              <tbody>
                {retention.length === 0 ? (
                  <tr>
                    <td colSpan={5}>Ikke nok data.</td>
                  </tr>
                ) : (
                  retention.map((r) => (
                    <tr key={r.cohortDay}>
                      <td>{r.cohortDay}</td>
                      <td>{r.size}</td>
                      <td>{r.d1 != null ? pct(r.d1) : '—'}</td>
                      <td>{r.d7 != null ? pct(r.d7) : '—'}</td>
                      <td>{r.d30 != null ? pct(r.d30) : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'technical' && (
        <>
          <div className="innsikt-kpi-grid">
            <Kpi label="Klientfeil" value={tech.clientErrors} />
            <Kpi label="Feiløkter" value={tech.errorSessions} />
          </div>
          <section className="innsikt-panel">
            <h3 className="innsikt-panel__title">Feil per sti</h3>
            <ul className="innsikt-rate-grid">
              {tech.byPath.length === 0 ? (
                <li>Ingen technical_error i perioden.</li>
              ) : (
                tech.byPath.map((p) => (
                  <li key={p.path}>
                    {p.path} — {p.count}
                  </li>
                ))
              )}
            </ul>
            <p className="admin-list__meta">
              Aldri tokens, passord eller sensitive spor i payloads.
            </p>
          </section>
          <section className="innsikt-panel">
            <h3 className="innsikt-panel__title">Enhet</h3>
            <MiniBars
              rows={devices.map((d) => ({
                label: d.device,
                value: d.sessions,
              }))}
            />
          </section>
          <section className="innsikt-panel">
            <h3 className="innsikt-panel__title">Nettleserfamilie</h3>
            <MiniBars
              rows={browsers.map((b) => ({
                label: b.browser,
                value: b.sessions,
              }))}
            />
            <p className="admin-list__meta">
              Grovt aggregat — ingen fingerprinting. PWA markeres når
              display-mode er pålitelig.
            </p>
          </section>
        </>
      )}
    </div>
  )
}

function dailySeriesSafe(events: AnalyticsEventRow[]) {
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
