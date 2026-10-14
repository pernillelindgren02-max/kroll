import type { LocaleText, PatternSize, YarnRequirement } from '../types/models'
import { lt } from './localeText'
import type { AppLocale } from '../i18n/types'

/** XS (S) M (L) XL (2XL) 3XL — odd indices in parentheses. */
export function formatSizeSeries(
  sizes: PatternSize[],
  locale: AppLocale,
): string {
  return sizes
    .map((s, i) => {
      const label = lt(s.label, locale)
      return i % 2 === 1 ? `(${label})` : label
    })
    .join(' ')
}

/** 350 (400) 450 (500) 550 g */
export function formatQuantitySeries(
  values: number[],
  unit: string,
): string {
  if (!values.length) return `— ${unit}`
  const body = values
    .map((v, i) => (i % 2 === 1 ? `(${Math.round(v)})` : String(Math.round(v))))
    .join(' ')
  return `${body} ${unit}`
}

export function metresPerGram(req: Pick<YarnRequirement, 'gramsPerSkein' | 'metresPerSkein'>): number | null {
  if (
    req.gramsPerSkein != null &&
    req.gramsPerSkein > 0 &&
    req.metresPerSkein != null &&
    req.metresPerSkein > 0
  ) {
    return req.metresPerSkein / req.gramsPerSkein
  }
  return null
}

/** Estimate metres from grams using skein m/g. */
export function estimateMetresFromGrams(
  grams: number[],
  gramsPerSkein?: number,
  metresPerSkein?: number,
): number[] {
  const mpg = metresPerGram({ gramsPerSkein, metresPerSkein })
  if (mpg == null) return grams.map(() => 0)
  return grams.map((g) => Math.round(g * mpg))
}

/**
 * Resolved metres-by-size: manual override wins; else estimate from grams.
 * Falls back to stored metresBySize, then metresMin.
 */
export function resolveMetresBySize(req: YarnRequirement): number[] {
  if (req.metresManualOverride && req.metresBySize?.length) {
    return req.metresBySize
  }
  if (req.gramsBySize?.length) {
    const estimated = estimateMetresFromGrams(
      req.gramsBySize,
      req.gramsPerSkein,
      req.metresPerSkein,
    )
    if (estimated.some((m) => m > 0)) return estimated
  }
  if (req.metresBySize?.length) return req.metresBySize
  if (req.metresMin > 0) return [req.metresMin]
  return []
}

export function resolveGramsBySize(req: YarnRequirement): number[] {
  if (req.gramsBySize?.length) return req.gramsBySize
  if (req.gramsMin != null) return [req.gramsMin]
  return []
}

export function withDerivedYarnTotals(req: YarnRequirement): YarnRequirement {
  const grams = resolveGramsBySize(req)
  const metres = resolveMetresBySize(req)
  return {
    ...req,
    gramsBySize: grams,
    metresBySize: metres,
    gramsMin: grams.length ? Math.min(...grams) : req.gramsMin,
    gramsMax: grams.length ? Math.max(...grams) : req.gramsMax,
    metresMin: metres.length ? Math.min(...metres) : req.metresMin,
    metresMax: metres.length ? Math.max(...metres) : req.metresMax,
  }
}

export function groupHeldTogether(
  reqs: YarnRequirement[],
): { groupId: string | null; yarns: YarnRequirement[] }[] {
  const groups = new Map<string, YarnRequirement[]>()
  const singles: YarnRequirement[] = []
  for (const req of reqs) {
    if (req.heldTogetherGroupId) {
      const list = groups.get(req.heldTogetherGroupId) ?? []
      list.push(req)
      groups.set(req.heldTogetherGroupId, list)
    } else {
      singles.push(req)
    }
  }
  const out: { groupId: string | null; yarns: YarnRequirement[] }[] = []
  for (const [groupId, yarns] of groups) {
    out.push({ groupId, yarns })
  }
  for (const y of singles) out.push({ groupId: null, yarns: [y] })
  return out
}

export function yarnDisplayName(
  req: YarnRequirement,
  locale: AppLocale,
): string {
  const parts = [
    req.brand,
    lt(req.label, locale),
    req.colour ? lt(req.colour, locale) : '',
  ].filter(Boolean)
  return parts.join(' · ')
}

export function emptyLocale(): LocaleText {
  return { no: '', en: '' }
}
