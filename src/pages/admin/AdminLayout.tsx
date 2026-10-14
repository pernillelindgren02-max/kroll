import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useLocale } from '../../context/LocaleContext'
import './Admin.css'

export function AdminLayout() {
  const { t } = useLocale()
  const navigate = useNavigate()

  const nav = [
    { to: '/admin', end: true, label: t('admin.overview') },
    { to: '/admin/innsikt', label: t('admin.innsikt') },
    { to: '/admin/oppskrifter', label: t('admin.patterns') },
    { to: '/admin/garn', label: t('admin.yarns') },
    { to: '/admin/innstillinger', label: t('admin.settings') },
  ]

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <p className="admin-sidebar__eyebrow">Krøll</p>
        <p className="admin-sidebar__title">Admin</p>
        <nav className="admin-sidebar__nav" aria-label="Admin">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive
                  ? 'admin-sidebar__link admin-sidebar__link--active'
                  : 'admin-sidebar__link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          className="admin-sidebar__back"
          onClick={() => navigate('/')}
        >
          {t('admin.back')}
        </button>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
