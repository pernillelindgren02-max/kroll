import { Link } from 'react-router-dom'
import { useLocale } from '../../context/LocaleContext'
import { usePatterns } from '../../context/PatternsContext'
import { lt } from '../../lib/localeText'

export function AdminPatternsPage() {
  const { locale, t } = useLocale()
  const { patterns } = usePatterns()

  return (
    <div>
      <h1>{t('admin.patterns')}</h1>
      <div className="admin-actions">
        <Link to="/admin/oppskrifter/new" className="btn btn--primary">
          New pattern
        </Link>
      </div>

      <div className="admin-card-list admin-card-list--mobile-only">
        {patterns.map((p) => (
          <article key={p.id} className="admin-card-list__item">
            <h2 className="admin-card-list__title">{lt(p.title, locale)}</h2>
            <div className="admin-card-list__meta">
              <span
                className={
                  p.status === 'published'
                    ? 'admin-badge admin-badge--pub'
                    : 'admin-badge'
                }
              >
                {p.status === 'published'
                  ? t('admin.publish')
                  : t('admin.draft')}
              </span>
              {p.demoPattern && <span className="admin-badge">demo</span>}
              <span>
                {p.demoPattern ? '0 (demo)' : `${p.priceNok} kr`}
              </span>
            </div>
            <div className="admin-card-list__actions">
              <Link
                to={`/admin/oppskrifter/${p.id}`}
                className="btn btn--ghost"
              >
                {t('common.edit')}
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="admin-table-wrap admin-table-wrap--desktop">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Price</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {patterns.map((p) => (
              <tr key={p.id}>
                <td>{lt(p.title, locale)}</td>
                <td>
                  <span
                    className={
                      p.status === 'published'
                        ? 'admin-badge admin-badge--pub'
                        : 'admin-badge'
                    }
                  >
                    {p.status === 'published'
                      ? t('admin.publish')
                      : t('admin.draft')}
                  </span>
                  {p.demoPattern && (
                    <span className="admin-badge" style={{ marginLeft: 6 }}>
                      demo
                    </span>
                  )}
                </td>
                <td>{p.demoPattern ? '0 (demo)' : `${p.priceNok} kr`}</td>
                <td>
                  <Link to={`/admin/oppskrifter/${p.id}`}>
                    {t('common.edit')}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
