import { useLocale } from '../../context/LocaleContext'
import { usePatterns } from '../../context/PatternsContext'
import { isSupabaseConfigured } from '../../lib/supabase'

export function AdminSettingsPage() {
  const { t } = useLocale()
  const { source } = usePatterns()

  return (
    <div>
      <h1>{t('admin.settings')}</h1>
      <div className="info-block">
        <p>
          Supabase:{' '}
          <strong>{isSupabaseConfigured ? 'configured' : 'not configured'}</strong>
          {' · '}
          Catalog source: <strong>{source}</strong>
        </p>
        <p className="muted">
          Shared with Fra gryte til gaffel: Auth + `profiles` (`is_admin`,
          `preferred_locale`). Admin access is `profiles.is_admin` only.
        </p>
        <p className="muted">
          Base tables: `kroll/supabase/kroll-schema.sql`. Shopping:
          `kroll-shopping-schema.sql`. Admin CMS images/tags/section hide:
          `kroll-pattern-cms-schema.sql` + Storage bucket `pattern-images`.
          Run manually — the app does not auto-run SQL.
        </p>
        <p className="muted">
          Free/demo library claims use `purchase_kind = demo_claim`. Paid
          ownership is granted only after a verified Stripe webhook writes
          `purchases.status = paid` and upserts `pattern_ownership` (service
          role). Never trust a frontend payment flag.
        </p>
      </div>
    </div>
  )
}
