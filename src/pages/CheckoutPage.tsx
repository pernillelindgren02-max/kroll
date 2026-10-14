import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useLocale } from '../context/LocaleContext'
import { useOwnership } from '../context/OwnershipContext'
import { trackEvent } from '../lib/analytics'
import {
  isFreeClaimPattern,
  isPayablePattern,
  startStripeCheckout,
} from '../lib/checkoutArchitecture'
import { lt } from '../lib/localeText'
import './CheckoutPage.css'

export function CheckoutPage() {
  const { t, locale } = useLocale()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { patterns, totalNok, remove, clear } = useCart()
  const { owns, claimFreePatterns } = useOwnership()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (patterns.length === 0) return
    trackEvent('checkout_started', {
      source: 'checkout',
      properties: {
        line_count: patterns.length,
        total_nok: totalNok,
      },
    })
  }, [patterns.length, totalNok])

  const freeIds = patterns
    .filter((p) => isFreeClaimPattern(p) && !owns(p.id))
    .map((p) => p.id)
  const paidPatterns = patterns.filter(
    (p) => isPayablePattern(p) && !owns(p.id),
  )
  const alreadyOwned = patterns.filter((p) => owns(p.id))

  async function claimFree() {
    setBusy(true)
    setMessage(null)
    const { claimed } = await claimFreePatterns(freeIds)
    for (const id of claimed) {
      remove(id)
      trackEvent('free_pattern_claimed', {
        patternId: id,
        source: 'checkout',
        properties: { is_demo: true },
      })
    }
    for (const p of alreadyOwned) remove(p.id)
    setBusy(false)
    if (claimed.length) {
      setMessage(t('checkout.claimed', { count: claimed.length }))
    }
    if (paidPatterns.length === 0 && patterns.length === claimed.length + alreadyOwned.length) {
      clear()
      navigate('/mine')
    }
  }

  async function tryStripe() {
    setBusy(true)
    setMessage(null)
    trackEvent('checkout_stripe_attempt', {
      source: 'checkout',
      properties: {
        line_count: paidPatterns.length,
        total_nok: paidPatterns.reduce(
          (s, p) => s + (p.demoPattern ? 0 : p.priceNok),
          0,
        ),
      },
    })
    if (!user) {
      setMessage(t('checkout.signInRequired'))
      setBusy(false)
      return
    }
    const result = await startStripeCheckout({
      patternIds: paidPatterns.map((p) => p.id),
      successUrl: `${window.location.origin}/kasse/suksess`,
      cancelUrl: `${window.location.origin}/kasse`,
    })
    setBusy(false)
    if (result.url) {
      window.location.href = result.url
      return
    }
    setMessage(result.error ?? t('checkout.stripePending'))
  }

  if (patterns.length === 0) {
    return (
      <main className="page">
        <header className="page-header">
          <h1>{t('checkout.title')}</h1>
        </header>
        <p className="empty">{t('cart.empty')}</p>
        <Link to="/" className="btn btn--primary">
          {t('cart.continue')}
        </Link>
      </main>
    )
  }

  return (
    <main className="page checkout-page">
      <header className="page-header">
        <h1>{t('checkout.title')}</h1>
        <p>{t('checkout.lead')}</p>
      </header>

      <section className="checkout-block">
        <h2>{t('checkout.summary')}</h2>
        <ul className="checkout-lines">
          {patterns.map((p) => (
            <li key={p.id}>
              <span>
                {lt(p.title, locale)}
                {owns(p.id) ? ` · ${t('explore.owned')}` : ''}
                {p.demoPattern ? ' · Demo' : ''}
              </span>
              <span>
                {isFreeClaimPattern(p) || owns(p.id)
                  ? t('cart.free')
                  : t('explore.price', { price: p.priceNok })}
              </span>
            </li>
          ))}
        </ul>
        <div className="cart-summary__row">
          <span>{t('cart.total')}</span>
          <strong>{t('explore.price', { price: totalNok })}</strong>
        </div>
      </section>

      {freeIds.length > 0 && (
        <section className="checkout-block">
          <h2>{t('checkout.freeTitle')}</h2>
          <p>{t('checkout.freeLead')}</p>
          <button
            type="button"
            className="btn btn--sage btn--block"
            disabled={busy}
            onClick={() => void claimFree()}
          >
            {t('checkout.claimFree')}
          </button>
        </section>
      )}

      {paidPatterns.length > 0 && (
        <section className="checkout-block">
          <h2>{t('checkout.paidTitle')}</h2>
          <p>{t('checkout.stripePending')}</p>
          <p className="checkout-secure">{t('checkout.secureNote')}</p>
          {!user && <p className="muted">{t('checkout.signInRequired')}</p>}
          <button
            type="button"
            className="btn btn--accent btn--block"
            disabled={busy}
            onClick={() => void tryStripe()}
          >
            {t('checkout.payStripe')}
          </button>
        </section>
      )}

      {message && (
        <p className="checkout-message" role="status">
          {message}
        </p>
      )}

      <Link to="/kurv" className="btn btn--ghost btn--block">
        {t('checkout.backCart')}
      </Link>
    </main>
  )
}
