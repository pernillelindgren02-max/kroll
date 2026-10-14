import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext'
import { useOwnership } from '../context/OwnershipContext'
import { trackEvent } from '../lib/analytics'
import './CheckoutPage.css'

/**
 * Stripe return URL target. Ownership is refreshed from the server —
 * query params alone never grant access.
 * Success-page visit is NEVER treated as a verified purchase.
 */
export function CheckoutSuccessPage() {
  const { t } = useLocale()
  const { ownerships, loading } = useOwnership()
  const [note, setNote] = useState(t('checkout.successPending'))

  useEffect(() => {
    trackEvent('checkout_success_page_viewed', {
      source: 'checkout_success',
      properties: {
        // Explicitly not a purchase signal
        verified_purchase: false,
      },
    })
  }, [])

  useEffect(() => {
    // When Stripe is live: poll/fetch ownership after webhook settles.
    // Today: remind that only verified purchases appear in My Patterns.
    // Do NOT emit payment_completed here — only backend/webhook verification.
    if (!loading) {
      setNote(
        ownerships.length
          ? t('checkout.successReady')
          : t('checkout.successPending'),
      )
    }
  }, [loading, ownerships.length, t])

  return (
    <main className="page">
      <header className="page-header">
        <h1>{t('checkout.successTitle')}</h1>
        <p>{note}</p>
      </header>
      <p className="muted">{t('checkout.successSecure')}</p>
      <div className="cart-actions" style={{ marginTop: '1.25rem' }}>
        <Link to="/mine" className="btn btn--primary btn--block">
          {t('nav.myPatterns')}
        </Link>
        <Link to="/" className="btn btn--ghost btn--block">
          {t('cart.continue')}
        </Link>
      </div>
    </main>
  )
}
