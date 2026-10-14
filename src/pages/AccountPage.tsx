import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import './AccountPage.css'

export function AccountPage() {
  const { t, locale, setLocale } = useLocale()
  const {
    configured,
    user,
    loading,
    isAdmin,
    isLocalDemo,
    enableLocalDemo,
    signIn,
    signUp,
    signOut,
  } = useAuth()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const err =
      mode === 'in'
        ? await signIn(email, password)
        : await signUp(email, password)
    setError(err)
    setBusy(false)
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>{t('account.title')}</h1>
        <p>{t('account.lead')}</p>
      </header>

      <section className="account-card stack">
        <h2>{t('account.language')}</h2>
        <div className="lang-toggle">
          <button
            type="button"
            className={locale === 'no' ? 'btn btn--primary' : 'btn btn--ghost'}
            onClick={() => void setLocale('no')}
          >
            {t('lang.no')}
          </button>
          <button
            type="button"
            className={locale === 'en' ? 'btn btn--primary' : 'btn btn--ghost'}
            onClick={() => void setLocale('en')}
          >
            {t('lang.en')}
          </button>
        </div>
      </section>

      <section className="account-card stack">
        {loading ? (
          <p>{t('common.loading')}</p>
        ) : user ? (
          <>
            <p>
              <strong>{user.email}</strong>
            </p>
            <p className="muted">
              Shared login with Fra gryte til gaffel (same Supabase Auth /
              profiles).
            </p>
            {isAdmin && (
              <Link to="/admin" className="btn btn--sage">
                Admin
              </Link>
            )}
            <button type="button" className="btn btn--ghost" onClick={() => void signOut()}>
              {t('account.signOut')}
            </button>
          </>
        ) : isLocalDemo ? (
          <>
            <p className="demo-banner">{t('account.demoUser')}</p>
            {isAdmin && (
              <Link to="/admin" className="btn btn--sage">
                Admin
              </Link>
            )}
            <button type="button" className="btn btn--ghost" onClick={() => void signOut()}>
              {t('account.signOut')}
            </button>
          </>
        ) : (
          <>
            <p className="muted">{t('account.guest')}</p>
            {!configured && (
              <p className="muted">{t('account.configuredOff')}</p>
            )}

            {configured && (
              <form className="stack" onSubmit={onSubmit}>
                <div className="lang-toggle">
                  <button
                    type="button"
                    className={mode === 'in' ? 'btn btn--primary' : 'btn btn--ghost'}
                    onClick={() => setMode('in')}
                  >
                    {t('account.signIn')}
                  </button>
                  <button
                    type="button"
                    className={mode === 'up' ? 'btn btn--primary' : 'btn btn--ghost'}
                    onClick={() => setMode('up')}
                  >
                    {t('account.signUp')}
                  </button>
                </div>
                <label className="field">
                  <span>{t('account.email')}</span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>{t('account.password')}</span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                {error && <p className="account-error">{error}</p>}
                <button
                  type="submit"
                  className="btn btn--primary btn--block"
                  disabled={busy}
                >
                  {mode === 'in' ? t('account.signIn') : t('account.signUp')}
                </button>
              </form>
            )}

            <button
              type="button"
              className="btn btn--ghost btn--block"
              onClick={enableLocalDemo}
            >
              {t('account.demoUser')}
            </button>
          </>
        )}
      </section>
    </main>
  )
}
