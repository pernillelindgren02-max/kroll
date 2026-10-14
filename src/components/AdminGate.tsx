import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'

/**
 * Never renders admin UI for non-admins.
 * No consumer nav links — route is typed in manually (/admin).
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const { configured, loading, user, isAdmin, adminChecked, isLocalDemo } =
    useAuth()
  const { t } = useLocale()

  // DEV local-demo only when not signed in — signed-in admins use profiles.is_admin
  if (import.meta.env.DEV && !user && isLocalDemo && isAdmin) {
    return <>{children}</>
  }

  if (!configured && !isLocalDemo) {
    return <Navigate to="/" replace />
  }

  if (loading || !adminChecked) {
    return (
      <div className="admin-gate">
        <p>{t('admin.gate')}</p>
      </div>
    )
  }

  if (!user && !isLocalDemo) {
    return <Navigate to="/konto" replace state={{ from: '/admin' }} />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
