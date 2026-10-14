import { Link } from 'react-router-dom'
import { useLocale } from '../../context/LocaleContext'
import { usePatterns } from '../../context/PatternsContext'

export function AdminOverviewPage() {
  const { t } = useLocale()
  const { patterns, yarns } = usePatterns()
  const published = patterns.filter((p) => p.status === 'published').length

  return (
    <div>
      <h1>{t('admin.overview')}</h1>
      <p className="muted">
        {published} published · {patterns.length} total patterns · {yarns.length}{' '}
        yarns
      </p>
      <div className="admin-actions">
        <Link to="/admin/oppskrifter" className="btn btn--primary">
          {t('admin.patterns')}
        </Link>
        <Link to="/admin/garn" className="btn btn--ghost">
          {t('admin.yarns')}
        </Link>
      </div>
      <p className="muted">
        PDF attach + download is wired as a URL field on patterns. Real file
        upload can plug into Supabase Storage later without changing the reader.
      </p>
    </div>
  )
}
