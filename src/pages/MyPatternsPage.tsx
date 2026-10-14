import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext'
import { useOwnership } from '../context/OwnershipContext'
import { usePatterns } from '../context/PatternsContext'
import { useProgress } from '../context/ProgressContext'
import { trackEvent } from '../lib/analytics'
import { lt } from '../lib/localeText'
import { requestPdfAccess } from '../lib/pdfAccess'
import './MyPatternsPage.css'

function formatDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'nb-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso.slice(0, 10)
  }
}

export function MyPatternsPage() {
  const { locale, t } = useLocale()
  const { ownerships } = useOwnership()
  const { getPattern, getSectionsFor } = usePatterns()
  const { getProgress } = useProgress()
  const [toast, setToast] = useState<string | null>(null)

  const rows = ownerships
    .map((o) => ({ ownership: o, pattern: getPattern(o.patternId) }))
    .filter(
      (r): r is { ownership: (typeof ownerships)[0]; pattern: NonNullable<ReturnType<typeof getPattern>> } =>
        Boolean(r.pattern),
    )
    .sort((a, b) =>
      b.ownership.purchasedAt.localeCompare(a.ownership.purchasedAt),
    )

  useEffect(() => {
    trackEvent('my_patterns_viewed', {
      source: 'my_patterns',
      properties: { result_count: rows.length },
    })
  }, [rows.length])

  async function handlePdf(patternId: string) {
    const row = rows.find((r) => r.pattern.id === patternId)
    if (!row) return
    const result = await requestPdfAccess(row.pattern, row.ownership)
    if (result.ok) {
      window.open(result.url, '_blank', 'noopener,noreferrer')
      return
    }
    setToast(
      result.reason === 'no_pdf'
        ? t('pattern.pdfPlaceholder')
        : t('pattern.pdfError'),
    )
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>{t('myPatterns.title')}</h1>
        <p>{t('myPatterns.lead')}</p>
      </header>

      {rows.length === 0 ? (
        <div className="empty stack">
          <p>{t('myPatterns.empty')}</p>
          <Link to="/" className="btn btn--primary">
            {t('explore.title')}
          </Link>
        </div>
      ) : (
        <div className="stack">
          {rows.map(({ pattern, ownership }) => {
            const progress = getProgress(pattern.id)
            const section = progress?.sectionId
              ? getSectionsFor(pattern.id).find(
                  (s) => s.id === progress.sectionId,
                )
              : undefined
            return (
              <article key={pattern.id} className="my-pattern-card">
                <div
                  className="my-pattern-card__cover"
                  style={{
                    background: pattern.coverImageUrl
                      ? `center/cover url(${pattern.coverImageUrl})`
                      : 'linear-gradient(145deg, #ded0bd, #ad360b 55%, #5e3a52)',
                  }}
                  aria-hidden
                />
                <div className="my-pattern-card__body">
                  <p className="my-pattern-card__meta">
                    {t('myPatterns.purchased', {
                      date: formatDate(ownership.purchasedAt, locale),
                    })}
                    {pattern.demoPattern ? ' · Demo' : ''}
                    {ownership.purchaseKind === 'demo_claim'
                      ? ` · ${t('cart.free')}`
                      : ''}
                  </p>
                  <h2>{lt(pattern.title, locale)}</h2>
                  <p>{lt(pattern.tagline, locale)}</p>
                  <div className="my-pattern-card__actions">
                    <Link
                      to={`/oppskrift/${pattern.id}/les`}
                      className="btn btn--primary"
                      onClick={() =>
                        trackEvent('pattern_opened_owned', {
                          patternId: pattern.id,
                          source: 'my_patterns',
                          properties: { is_demo: Boolean(pattern.demoPattern) },
                        })
                      }
                    >
                      {t('pattern.read')}
                    </Link>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => void handlePdf(pattern.id)}
                    >
                      {t('pattern.pdf')}
                    </button>
                    <Link
                      to={`/oppskrift/${pattern.id}?src=my_patterns`}
                      className="btn btn--ghost"
                    >
                      {t('explore.view')}
                    </Link>
                  </div>
                  {progress?.sectionId && (
                    <Link
                      to={`/oppskrift/${pattern.id}/les`}
                      className="btn btn--sage btn--block continue-link"
                      onClick={() =>
                        trackEvent('pattern_opened_owned', {
                          patternId: pattern.id,
                          source: 'my_patterns',
                          properties: { is_demo: Boolean(pattern.demoPattern) },
                        })
                      }
                    >
                      {t('myPatterns.continue')}
                      {progress.rowNumber != null
                        ? ` · ${t('reader.row', { row: progress.rowNumber })}`
                        : ''}
                      {section ? ` · ${lt(section.title, locale)}` : ''}
                    </Link>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {toast && (
        <p className="pattern-detail__toast" role="status">
          {toast}
        </p>
      )}
    </main>
  )
}
