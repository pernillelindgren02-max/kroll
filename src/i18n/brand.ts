import type { AppLocale } from './types'

export type BrandIdentity = {
  /** Public brand — same in NO and EN. */
  name: string
  logoUrl: string | null
  filenamePrefix: string
  siteOriginLabel: string
}

/** Brand stays Krøll in every locale. */
export function getBrand(_locale: AppLocale): BrandIdentity {
  return {
    name: 'Krøll',
    logoUrl: null,
    filenamePrefix: 'kroll',
    siteOriginLabel: 'kroll.app',
  }
}
