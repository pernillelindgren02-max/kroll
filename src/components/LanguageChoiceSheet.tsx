import { useLocale } from '../context/LocaleContext'
import { getBrand } from '../i18n/brand'
import './LanguageChoiceSheet.css'

export function LanguageChoiceSheet() {
  const { needsLanguageChoice, setLocale, t, locale } = useLocale()
  const brand = getBrand(locale)

  if (!needsLanguageChoice) return null

  return (
    <div className="lang-sheet" role="dialog" aria-modal="true">
      <div className="lang-sheet__card">
        <p className="lang-sheet__brand">{brand.name}</p>
        <h2>{t('lang.chooseTitle')}</h2>
        <p className="lang-sheet__lead">{t('lang.chooseLead')}</p>
        <div className="lang-sheet__actions">
          <button type="button" onClick={() => void setLocale('no')}>
            {t('lang.no')}
          </button>
          <button type="button" onClick={() => void setLocale('en')}>
            {t('lang.en')}
          </button>
        </div>
      </div>
    </div>
  )
}
