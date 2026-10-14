import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useLocale } from '../context/LocaleContext'
import { useOwnership } from '../context/OwnershipContext'
import { trackEvent } from '../lib/analytics'
import { isFreeClaimPattern } from '../lib/checkoutArchitecture'
import { lt } from '../lib/localeText'
import './CartPage.css'

export function CartPage() {
  const { t, locale } = useLocale()
  const { patterns, totalNok, remove, clear, count } = useCart()
  const { owns } = useOwnership()

  const payable = patterns.filter((p) => !isFreeClaimPattern(p) && !owns(p.id))
  const free = patterns.filter((p) => isFreeClaimPattern(p) || owns(p.id))

  useEffect(() => {
    trackEvent('cart_viewed', {
      source: 'cart',
      properties: {
        line_count: count,
        total_nok: totalNok,
      },
    })
  }, [count, totalNok])

  return (
    <main className="page cart-page">
      <header className="page-header">
        <h1>{t('cart.title')}</h1>
        <p>{t('cart.lead')}</p>
      </header>

      {count === 0 ? (
        <div className="empty stack">
          <p>{t('cart.empty')}</p>
          <Link to="/" className="btn btn--primary">
            {t('cart.continue')}
          </Link>
        </div>
      ) : (
        <>
          <ul className="cart-list">
            {patterns.map((p) => {
              const owned = owns(p.id)
              const freeLine = isFreeClaimPattern(p)
              return (
                <li key={p.id} className="cart-line">
                  <div
                    className="cart-line__swatch"
                    style={{
                      background: `linear-gradient(145deg, #ded0bd, #ad360b 55%, #5e3a52)`,
                    }}
                    aria-hidden
                  />
                  <div className="cart-line__body">
                    <Link to={`/oppskrift/${p.id}`}>
                      <strong>{lt(p.title, locale)}</strong>
                    </Link>
                    <p>
                      {owned
                        ? t('explore.owned')
                        : freeLine
                          ? t('cart.free')
                          : t('explore.price', { price: p.priceNok })}
                      {p.demoPattern ? ' · Demo' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn--ghost cart-line__remove"
                    onClick={() => {
                      remove(p.id)
                      trackEvent('pattern_removed_from_cart', {
                        patternId: p.id,
                        source: 'cart',
                        properties: {
                          is_demo: Boolean(p.demoPattern),
                        },
                      })
                    }}
                  >
                    {t('cart.remove')}
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="cart-summary">
            <div className="cart-summary__row">
              <span>{t('cart.subtotal')}</span>
              <strong>{t('explore.price', { price: totalNok })}</strong>
            </div>
            {free.length > 0 && (
              <p className="muted">{t('cart.freeNote', { count: free.length })}</p>
            )}
            {payable.length > 0 && (
              <p className="muted">{t('cart.paidNote', { count: payable.length })}</p>
            )}
          </div>

          <div className="cart-actions">
            <Link to="/kasse" className="btn btn--accent btn--block">
              {t('cart.checkout')}
            </Link>
            <Link to="/" className="btn btn--ghost btn--block">
              {t('cart.continue')}
            </Link>
            <button type="button" className="btn btn--ghost btn--block" onClick={clear}>
              {t('cart.clear')}
            </button>
          </div>
        </>
      )}
    </main>
  )
}
