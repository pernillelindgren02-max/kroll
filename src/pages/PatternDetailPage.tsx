import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PatternSizeGuide } from '../components/PatternSizeGuide'
import { PatternTechOverview } from '../components/PatternTechOverview'
import { useCart } from '../context/CartContext'
import { useLocale } from '../context/LocaleContext'
import { useOwnership } from '../context/OwnershipContext'
import { usePatterns } from '../context/PatternsContext'
import { useProgress } from '../context/ProgressContext'
import { useStash } from '../context/StashContext'
import type { MessageKey } from '../i18n/messages'
import {
  matchStateFromStrength,
  trackEvent,
} from '../lib/analytics'
import { isFreeClaimPattern } from '../lib/checkoutArchitecture'
import { lt } from '../lib/localeText'
import { requestPdfAccess } from '../lib/pdfAccess'
import {
  formatQuantitySeries,
  groupHeldTogether,
  resolveGramsBySize,
  yarnDisplayName,
} from '../lib/yarnQuantity'
import { matchPatternToStash } from '../lib/yarnMatch'
import type { KnittingPattern } from '../types/models'
import './PatternDetailPage.css'

const DIFFICULTY_KEYS: Record<KnittingPattern['difficulty'], MessageKey> = {
  beginner: 'pattern.difficulty.beginner',
  easy: 'pattern.difficulty.easy',
  intermediate: 'pattern.difficulty.intermediate',
  advanced: 'pattern.difficulty.advanced',
}

export function PatternDetailPage() {
  const { id = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { locale, t } = useLocale()
  const { getPattern, yarnMap } = usePatterns()
  const { owns, getOwnership, claimFreePattern } = useOwnership()
  const { add: addToCart, has: inCart } = useCart()
  const { getProgress } = useProgress()
  const { items } = useStash()
  const [toast, setToast] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const pattern = getPattern(id)
  const owned = pattern ? owns(pattern.id) : false
  const progress = pattern ? getProgress(pattern.id) : undefined
  const match = useMemo(
    () => (pattern ? matchPatternToStash(pattern, items, yarnMap) : null),
    [pattern, items, yarnMap],
  )
  const viewSource =
    searchParams.get('src')?.slice(0, 40) ||
    (typeof document !== 'undefined' && document.referrer.includes('/mine')
      ? 'my_patterns'
      : 'explore')

  useEffect(() => {
    if (!pattern || (pattern.status !== 'published' && !pattern.demoPattern)) {
      return
    }
    trackEvent('pattern_viewed', {
      patternId: pattern.id,
      source: viewSource,
      properties: {
        is_demo: Boolean(pattern.demoPattern),
        difficulty: pattern.difficulty,
        category: pattern.categories[0] ?? null,
        owned,
      },
    })
    if (owned) {
      trackEvent('pattern_opened_owned', {
        patternId: pattern.id,
        source: 'detail',
        properties: { is_demo: Boolean(pattern.demoPattern) },
      })
    }
    if (items.length > 0 && match) {
      trackEvent('yarn_match_viewed', {
        patternId: pattern.id,
        source: 'detail',
        properties: {
          match_state: matchStateFromStrength(match.strength, {
            hasStash: true,
          }),
        },
      })
    }
  }, [pattern?.id])

  if (!pattern || (pattern.status !== 'published' && !pattern.demoPattern)) {
    return (
      <main className="page">
        <Link to="/" className="back-link">
          ← {t('nav.back')}
        </Link>
        <p className="empty">{t('explore.empty')}</p>
      </main>
    )
  }

  const current = pattern
  const title = lt(current.title, locale)
  const freeClaim = isFreeClaimPattern(current)

  async function handlePdf() {
    setBusy(true)
    const result = await requestPdfAccess(current, getOwnership(current.id))
    setBusy(false)
    if (result.ok) {
      window.open(result.url, '_blank', 'noopener,noreferrer')
      return
    }
    if (result.reason === 'not_owned') {
      setToast(t('pattern.pdfOwnedOnly'))
      return
    }
    setToast(
      result.reason === 'no_pdf'
        ? t('pattern.pdfPlaceholder')
        : t('pattern.pdfError'),
    )
  }

  function handleAddToCart() {
    const result = addToCart(current.id)
    if (!result.ok && result.reason === 'duplicate') {
      setToast(t('cart.alreadyInCart'))
      return
    }
    if (result.ok) {
      trackEvent('pattern_added_to_cart', {
        patternId: current.id,
        source: viewSource,
        properties: {
          is_demo: Boolean(current.demoPattern),
          difficulty: current.difficulty,
          price_nok: current.demoPattern ? 0 : current.priceNok,
        },
      })
    }
    setToast(t('cart.added'))
  }

  async function handleClaimFree() {
    setBusy(true)
    const result = await claimFreePattern(current.id)
    setBusy(false)
    if (result.ok) {
      trackEvent('free_pattern_claimed', {
        patternId: current.id,
        source: 'detail',
        properties: { is_demo: Boolean(current.demoPattern) },
      })
    }
    setToast(result.ok ? t('purchase.done') : result.error ?? t('purchase.already'))
  }

  return (
    <main className="page pattern-detail">
      <Link to="/" className="back-link">
        ← {t('nav.back')}
      </Link>

      <div
        className="pattern-detail__cover"
        style={{
          background: pattern.coverImageUrl
            ? `center/cover url(${pattern.coverImageUrl})`
            : 'linear-gradient(145deg, #ded0bd 0%, #ad360b 48%, #5e3a52 100%)',
        }}
        role="img"
        aria-label={title}
      />

      <header className="pattern-detail__header">
        <p className="pattern-detail__designer">{pattern.designer}</p>
        <h1>{title}</h1>
        <p>{lt(pattern.tagline, locale)}</p>
        <div className="pattern-detail__chips">
          <span>{t(DIFFICULTY_KEYS[pattern.difficulty])}</span>
          {pattern.demoPattern && (
            <span className="chip chip--demo">Demo</span>
          )}
          {owned ? (
            <span className="chip chip--sage">{t('explore.owned')}</span>
          ) : freeClaim ? (
            <span className="chip chip--sage">{t('cart.free')}</span>
          ) : (
            <span className="chip chip--price">
              {t('explore.price', { price: pattern.priceNok })}
            </span>
          )}
        </div>
      </header>

      {pattern.demoPattern && (
        <p className="demo-banner">{t('pattern.demoBanner')}</p>
      )}

      <p className="pattern-detail__desc">{lt(pattern.description, locale)}</p>

      <PatternTechOverview pattern={pattern} />
      <PatternSizeGuide pattern={pattern} />

      {match && items.length > 0 && (
        <section className="pattern-detail__match" aria-label="Yarn match">
          <h2>
            {match.strength === 'strong'
              ? t('pattern.match')
              : match.strength === 'soft'
                ? t('pattern.matchSoft')
                : t('pattern.noMatch')}
          </h2>
          <p className="muted">{t('pattern.leftoverLead')}</p>
          <ul>
            {match.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      )}

      {pattern.techniques.length > 0 && (
        <section className="stack">
          <h2>{t('pattern.techniques')}</h2>
          <ul className="technique-list">
            {pattern.techniques.map((tech) => (
              <li key={lt(tech, locale)}>{lt(tech, locale)}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="stack">
        <h2>{t('pattern.materials')}</h2>
        {groupHeldTogether(pattern.yarnRequirements).map((group) => (
          <div
            key={group.groupId ?? group.yarns[0]?.id ?? group.yarns[0]?.label.no}
            className="info-block"
          >
            {group.groupId && group.yarns.length > 1 && (
              <p>
                <strong>{t('pattern.heldTogether')}</strong>
              </p>
            )}
            {group.yarns.map((req) => {
              const grams = resolveGramsBySize(req)
              return (
                <div key={req.id ?? yarnDisplayName(req, locale)}>
                  <strong>{yarnDisplayName(req, locale)}</strong>
                  <p>
                    {req.weight ? `${req.weight} · ` : ''}
                    {req.gramsPerSkein && req.metresPerSkein
                      ? `${req.gramsPerSkein} g / ${req.metresPerSkein} m`
                      : ''}
                  </p>
                  <p className="pattern-detail__grams">
                    {formatQuantitySeries(grams, 'g')}
                  </p>
                  {req.substituteNote && (
                    <p className="muted">{lt(req.substituteNote, locale)}</p>
                  )}
                  {req.notions && <p>{lt(req.notions, locale)}</p>}
                </div>
              )
            })}
          </div>
        ))}
      </section>

      {owned && progress?.sectionId && (
        <button
          type="button"
          className="btn btn--sage btn--block resume-btn"
          onClick={() => navigate(`/oppskrift/${pattern.id}/les`)}
        >
          {t('myPatterns.continue')}
          {progress.rowNumber != null
            ? ` · ${t('reader.row', { row: progress.rowNumber })}`
            : ''}
        </button>
      )}

      <div className="pattern-detail__actions">
        {owned ? (
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => navigate(`/oppskrift/${pattern.id}/les`)}
          >
            {t('pattern.read')}
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn btn--accent btn--block"
              disabled={busy || inCart(pattern.id)}
              onClick={handleAddToCart}
            >
              {inCart(pattern.id) ? t('cart.alreadyInCart') : t('cart.add')}
            </button>
            {freeClaim && (
              <button
                type="button"
                className="btn btn--sage btn--block"
                disabled={busy}
                onClick={() => void handleClaimFree()}
              >
                {t('pattern.claimFree')}
              </button>
            )}
          </>
        )}
        {owned && (
          <button
            type="button"
            className="btn btn--ghost btn--block"
            disabled={busy}
            onClick={() => void handlePdf()}
          >
            {t('pattern.pdf')}
          </button>
        )}
        <Link to="/kurv" className="btn btn--ghost btn--block">
          {t('nav.cart')}
          {inCart(pattern.id) ? ` · ${t('cart.viewCart')}` : ''}
        </Link>
      </div>

      {toast && (
        <p className="pattern-detail__toast" role="status">
          {toast}
        </p>
      )}
    </main>
  )
}
