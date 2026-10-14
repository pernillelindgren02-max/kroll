import type { ReactNode } from 'react'
import type { AppLocale } from '../../i18n/types'
import type { LocaleText } from '../../types/models'

export type ContentLangTab = AppLocale

export function LangTabs({
  value,
  onChange,
  label = 'Language',
}: {
  value: ContentLangTab
  onChange: (next: ContentLangTab) => void
  label?: string
}) {
  return (
    <div className="admin-filter-tabs" role="tablist" aria-label={label}>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'no'}
        className={
          value === 'no'
            ? 'admin-filter-tabs__btn admin-filter-tabs__btn--active'
            : 'admin-filter-tabs__btn'
        }
        onClick={() => onChange('no')}
      >
        Norsk
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'en'}
        className={
          value === 'en'
            ? 'admin-filter-tabs__btn admin-filter-tabs__btn--active'
            : 'admin-filter-tabs__btn'
        }
        onClick={() => onChange('en')}
      >
        English
      </button>
    </div>
  )
}

export function BilingualTextInput({
  label,
  value,
  lang,
  onChange,
  multiline,
}: {
  label: string
  value: LocaleText
  lang: ContentLangTab
  onChange: (next: LocaleText) => void
  multiline?: boolean
}) {
  const field = (
    multiline ? (
      <textarea
        rows={4}
        value={value[lang]}
        onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
      />
    ) : (
      <input
        type="text"
        value={value[lang]}
        onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
      />
    )
  ) as ReactNode

  return (
    <label className="admin-field">
      <span>
        {label} ({lang.toUpperCase()})
      </span>
      {field}
    </label>
  )
}
