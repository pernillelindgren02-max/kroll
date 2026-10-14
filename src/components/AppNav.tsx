import { useEffect, useId, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useLocale } from '../context/LocaleContext'
import './AppNav.css'

const LINKS = [
  { to: '/', end: true, key: 'nav.explore' as const },
  { to: '/kurv', key: 'nav.cart' as const, cart: true },
  { to: '/mine', key: 'nav.myPatterns' as const },
  { to: '/garnlager', key: 'nav.stash' as const },
  { to: '/prosjekter', key: 'nav.projects' as const },
  { to: '/konto', key: 'nav.account' as const },
]

function YarnBallIcon() {
  return (
    <svg
      className="yarn-menu__icon"
      viewBox="0 0 48 48"
      width="28"
      height="28"
      aria-hidden
    >
      <circle cx="24" cy="24" r="15.5" fill="currentColor" opacity="0.92" />
      <path
        d="M12 20c6 2 10 8 12 14M16 12c4 6 14 8 20 6M14 28c8 0 14-4 18-10M20 10c2 8 2 16-2 24M28 11c3 7 4 14 1 22"
        fill="none"
        stroke="var(--color-warm-cream)"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M33 14c4-1 8 1 9 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="42" cy="20" r="1.4" fill="currentColor" />
    </svg>
  )
}

/** Top-right yarn-ball menu — replaces the old bottom tab bar. */
export function AppNav() {
  const { t } = useLocale()
  const { count } = useCart()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onPointer)
    }
  }, [open])

  return (
    <div className="yarn-menu" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={
          open ? 'yarn-menu__ball yarn-menu__ball--open' : 'yarn-menu__ball'
        }
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="true"
        aria-label={open ? t('menu.close') : t('menu.open')}
        onClick={() => setOpen((v) => !v)}
      >
        <YarnBallIcon />
        {count > 0 && (
          <span className="yarn-menu__cart-dot" aria-hidden>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <nav
          id={panelId}
          className="yarn-menu__sheet"
          aria-label={t('menu.open')}
        >
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                isActive
                  ? 'yarn-menu__link yarn-menu__link--active'
                  : 'yarn-menu__link'
              }
              onClick={() => setOpen(false)}
            >
              <span>{t(link.key)}</span>
              {'cart' in link && link.cart && count > 0 ? (
                <span className="yarn-menu__badge">{count}</span>
              ) : null}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
