/**
 * App-specific data model for Krøll.
 * Shared later: Auth users + `profiles`.
 * Separate: all knitting_* / yarn / project tables below.
 */

import type { AppLocale } from '../i18n/types'

/** Stable IDs — never derived from translated titles. */
export type PatternId = string
export type YarnId = string
export type ProjectId = string
export type SectionId = string

export type LocaleText = Record<AppLocale, string>

export type YarnWeight =
  | 'lace'
  | 'fingering'
  | 'sport'
  | 'dk'
  | 'worsted'
  | 'bulky'
  | 'super_bulky'

export type QuantityUnit = 'skeins' | 'g' | 'm'

export type ProjectStatus = 'planned' | 'in_progress' | 'finished'

/** Structured size row — measurements are numeric, not prose. */
export type PatternSize = {
  id: string
  label: LocaleText
  /** Garment chest / finished body circumference (cm) */
  chestCm?: number
  /** Finished garment length (cm) */
  lengthCm?: number
  /** Sleeve length from underarm (cm) */
  sleeveLengthCm?: number
  /** Head circumference range for hats/bands */
  headCircumferenceMinCm?: number
  headCircumferenceMaxCm?: number
  /** Finished hat/band circumference (cm) */
  finishedCircumferenceCm?: number
  /** Hand circumference for mittens (cm) */
  handCircumferenceCm?: number
  /** Foot length for slippers (cm) */
  footLengthCm?: number
  /**
   * Body measurement range used in size guide (e.g. bust to choose size).
   * Distinct from finished garment chest.
   */
  bodyBustMinCm?: number
  bodyBustMaxCm?: number
}

export type NeedleSpec = {
  mm: number
  notes: LocaleText
}

/**
 * One yarn / material line. User-facing quantity is grams-by-size;
 * metres are stored/calculated for stash matching (never treat g as
 * equivalent across different m/g).
 */
export type YarnRequirement = {
  /** Stable id within the pattern (multi-yarn / held-together) */
  id?: string
  yarnId?: YarnId
  label: LocaleText
  brand?: string
  colour?: LocaleText
  weight?: YarnWeight
  /** Skein reference for m/g conversion */
  gramsPerSkein?: number
  metresPerSkein?: number
  /**
   * Primary user-facing requirement — grams per size
   * (same order as pattern.sizes).
   */
  gramsBySize: number[]
  /** Overall min/max grams (derived from gramsBySize when present) */
  gramsMin?: number
  gramsMax?: number
  /**
   * Internal metres per size. When `metresManualOverride` is false/absent,
   * prefer calculating from grams × (metresPerSkein / gramsPerSkein).
   */
  metresBySize?: number[]
  /** When true, metresBySize is authoritative (not auto from grams). */
  metresManualOverride?: boolean
  /** Overall minimum metres (smallest size) — for matching */
  metresMin: number
  metresMax?: number
  /**
   * Yarns sharing the same group id are held together
   * (e.g. wool + mohair worked as one fabric).
   */
  heldTogetherGroupId?: string | null
  substituteNote?: LocaleText
  skeinsHint?: number
  needleMm?: number
  gaugeStitches?: number
  gaugeRows?: number
  gaugePerCm?: number
  notions?: LocaleText
}

export type PatternSectionKind =
  | 'overview'
  | 'intro'
  | 'construction'
  | 'sizes'
  | 'size_guide'
  | 'measurements'
  | 'materials'
  | 'gauge'
  | 'needles'
  | 'yarn'
  | 'techniques'
  | 'abbreviations'
  | 'before_you_begin'
  | 'cast_on'
  | 'neck'
  | 'yoke'
  | 'raglan'
  | 'short_rows'
  | 'stitch_distribution'
  | 'body'
  | 'sleeves'
  | 'cuffs'
  | 'hood'
  | 'button_band'
  | 'placket'
  | 'side_closure'
  | 'thumb'
  | 'heel'
  | 'toe'
  | 'ear_flap'
  | 'crown'
  | 'stripes'
  | 'hand'
  | 'finishing'
  | 'assembly'
  | 'blocking'
  | 'bind_off'
  | 'steps'
  | 'chart'
  | 'notes'

export type PatternSection = {
  id: SectionId
  patternId: PatternId
  kind: PatternSectionKind
  sortOrder: number
  title: LocaleText
  body: LocaleText
  imageUrl?: string | null
  /** For instruction sections — rows can be bookmarked */
  rowCount?: number
  /** Default open in collapsible reader */
  defaultOpen?: boolean
  /** Hidden from reader / product preview until shown again */
  hidden?: boolean
}

export const PATTERN_SECTION_KINDS: PatternSectionKind[] = [
  'overview',
  'intro',
  'construction',
  'sizes',
  'size_guide',
  'measurements',
  'materials',
  'gauge',
  'needles',
  'yarn',
  'techniques',
  'abbreviations',
  'before_you_begin',
  'cast_on',
  'neck',
  'yoke',
  'raglan',
  'short_rows',
  'stitch_distribution',
  'body',
  'sleeves',
  'cuffs',
  'hood',
  'button_band',
  'placket',
  'side_closure',
  'thumb',
  'heel',
  'toe',
  'ear_flap',
  'crown',
  'stripes',
  'hand',
  'finishing',
  'assembly',
  'blocking',
  'bind_off',
  'steps',
  'chart',
  'notes',
]

export type KnittingPattern = {
  id: PatternId
  slug: string
  status: 'draft' | 'published'
  /**
   * Internal/demo flag. Demo patterns must never be sold as final paid stock.
   * Admin blocks paid publish while this is true.
   */
  demoPattern: boolean
  priceNok: number
  coverImageUrl: string | null
  /**
   * Legacy / public URL — must not be used for paid PDFs.
   * Prefer `pdfStoragePath` + signed download after ownership check.
   */
  pdfUrl: string | null
  /** Private Supabase Storage object path (bucket `pattern-pdfs`). */
  pdfStoragePath?: string | null
  title: LocaleText
  tagline: LocaleText
  description: LocaleText
  designer: string
  difficulty: 'beginner' | 'easy' | 'intermediate' | 'advanced'
  categories: string[]
  sizes: PatternSize[]
  recommendedEaseMinCm?: number
  recommendedEaseMaxCm?: number
  yarnRequirements: YarnRequirement[]
  /** Structured needle list */
  needles: NeedleSpec[]
  /** Convenience mm list for matching (derived from needles) */
  needleMm: number[]
  gaugeStitches: number
  gaugeRows: number
  gaugePerCm: number
  techniques: LocaleText[]
  abbreviations: { abbr: string; meaning: LocaleText }[]
  /** Extra product images (Storage URLs or local data URLs) */
  galleryImageUrls?: string[]
  /** Free-form tags for admin/filtering */
  tags?: string[]
  /** Highlighted as leftover / rest-yarn friendly */
  restYarnFriendly?: boolean
  sectionIds: SectionId[]
  createdAt: string
  updatedAt: string
}

export type CatalogYarn = {
  id: YarnId
  brand: string
  name: LocaleText
  weight: YarnWeight
  metresPerSkein: number
  gramsPerSkein: number
  fibre: LocaleText
  suggestedNeedleMm: number[]
  gaugeStitches?: number
  gaugeRows?: number
  gaugePerCm?: number
  colourways: { id: string; name: LocaleText; hex: string }[]
}

export type UserYarnStashItem = {
  id: string
  userId: string
  yarnId: YarnId | null
  customBrand?: string
  customName?: string
  weight?: YarnWeight
  fibre?: string
  colourName?: string
  colourHex?: string
  quantity: number
  unit: QuantityUnit
  metresTotal?: number
  gramsTotal?: number
  needleMm?: number
  gaugeStitches?: number
  gaugeRows?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

/** How the user gained permanent library access. */
export type PurchaseKind =
  | 'demo_claim'
  | 'stripe'
  | 'admin_grant'
  /** @deprecated local prototype only — never treat as paid verification */
  | 'mock'

export type PatternOwnership = {
  userId: string
  patternId: PatternId
  purchasedAt: string
  purchaseKind: PurchaseKind
  pricePaidNok: number
  /** FK to purchases.id when granted via verified Stripe payment */
  purchaseId?: string | null
  provider?: string | null
  providerRef?: string | null
}

export type CartLine = {
  patternId: PatternId
  addedAt: string
}

/**
 * Server-side purchase record (Stripe-verified). Frontend never marks paid.
 * See supabase/kroll-shopping-schema.sql.
 */
export type PurchaseRecord = {
  id: string
  userId: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  currency: 'nok'
  amountTotalNok: number
  stripeCheckoutSessionId?: string | null
  stripePaymentIntentId?: string | null
  createdAt: string
  paidAt?: string | null
}

export type PatternProgress = {
  userId: string
  patternId: PatternId
  sectionId: SectionId | null
  rowNumber: number | null
  stepIndex: number | null
  updatedAt: string
}

export type KnittingProject = {
  id: ProjectId
  userId: string
  patternId: PatternId
  title: string
  sizeId: string | null
  stashItemIds: string[]
  status: ProjectStatus
  notes: string
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type Profile = {
  id: string
  displayName: string | null
  preferred_locale: AppLocale | null
  is_admin: boolean
}
