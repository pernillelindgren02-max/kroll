import type { AppLocale } from '../i18n/types'
import type { LocaleText } from '../types/models'

export function lt(text: LocaleText, locale: AppLocale): string {
  return text[locale] || text.no || text.en || ''
}
