import type {
  KnittingPattern,
  LocaleText,
  NeedleSpec,
  PatternSection,
  PatternSectionKind,
  PatternSize,
  YarnRequirement,
  YarnWeight,
} from '../../types/models'
import { withDerivedYarnTotals } from '../../lib/yarnQuantity'

const NOW = '2026-04-01T12:00:00.000Z'

export function t(no: string, en: string): LocaleText {
  return { no, en }
}

export function sizeLabels(
  labels: string[],
): { id: string; label: LocaleText }[] {
  return labels.map((label) => ({
    id: `size-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    label: t(label, label),
  }))
}

export type DemoYarnLine = {
  id?: string
  labelNo: string
  labelEn: string
  brand?: string
  colourNo?: string
  colourEn?: string
  weight: YarnWeight
  /** Primary: grams per size */
  gramsBySize: number[]
  gramsPerSkein: number
  metresPerSkein: number
  /** Optional manual metre override (demo usually auto-calculates) */
  metresBySize?: number[]
  metresManualOverride?: boolean
  heldTogetherGroupId?: string
  substituteNo?: string
  substituteEn?: string
  notionsNo?: string
  notionsEn?: string
}

type BuildArgs = {
  id: string
  slug: string
  titleNo: string
  titleEn: string
  descriptionNo: string
  descriptionEn: string
  categories: string[]
  difficulty: KnittingPattern['difficulty']
  sizes: PatternSize[]
  easeMin?: number
  easeMax?: number
  yarns: DemoYarnLine[]
  needles: NeedleSpec[]
  gaugeStitches: number
  gaugeRows: number
  techniques: LocaleText[]
  abbreviations: { abbr: string; meaning: LocaleText }[]
  sections: Omit<PatternSection, 'patternId' | 'id'>[]
  restYarnFriendly?: boolean
}

function toYarnReq(line: DemoYarnLine, index: number): YarnRequirement {
  const base: YarnRequirement = {
    id: line.id ?? `yarn-${index + 1}`,
    label: t(line.labelNo, line.labelEn),
    brand: line.brand,
    colour:
      line.colourNo || line.colourEn
        ? t(line.colourNo ?? '', line.colourEn ?? '')
        : undefined,
    weight: line.weight,
    gramsBySize: line.gramsBySize,
    gramsPerSkein: line.gramsPerSkein,
    metresPerSkein: line.metresPerSkein,
    metresBySize: line.metresBySize,
    metresManualOverride: line.metresManualOverride,
    metresMin: 0,
    heldTogetherGroupId: line.heldTogetherGroupId ?? null,
    substituteNote:
      line.substituteNo || line.substituteEn
        ? t(line.substituteNo ?? '', line.substituteEn ?? '')
        : undefined,
    notions:
      line.notionsNo || line.notionsEn
        ? t(line.notionsNo ?? '', line.notionsEn ?? '')
        : undefined,
  }
  return withDerivedYarnTotals(base)
}

export function buildDemoPattern(args: BuildArgs): {
  pattern: KnittingPattern
  sections: PatternSection[]
} {
  const yarnRequirements = args.yarns.map(toYarnReq)
  const sections: PatternSection[] = args.sections.map((s, i) => ({
    ...s,
    id: `${args.id}-sec-${s.kind}-${i + 1}`,
    patternId: args.id,
    sortOrder: s.sortOrder || i + 1,
  }))

  const pattern: KnittingPattern = {
    id: args.id,
    slug: args.slug,
    status: 'published',
    demoPattern: true,
    priceNok: 0,
    coverImageUrl: null,
    galleryImageUrls: [],
    tags: [],
    restYarnFriendly: Boolean(args.restYarnFriendly),
    pdfUrl: null,
    pdfStoragePath: null,
    title: t(args.titleNo, args.titleEn),
    tagline: t(args.descriptionNo, args.descriptionEn),
    description: t(args.descriptionNo, args.descriptionEn),
    designer: 'Krøll Demo',
    difficulty: args.difficulty,
    categories: args.categories,
    sizes: args.sizes,
    recommendedEaseMinCm: args.easeMin,
    recommendedEaseMaxCm: args.easeMax,
    yarnRequirements,
    needles: args.needles,
    needleMm: [...new Set(args.needles.map((n) => n.mm))],
    gaugeStitches: args.gaugeStitches,
    gaugeRows: args.gaugeRows,
    gaugePerCm: 10,
    techniques: args.techniques,
    abbreviations: args.abbreviations,
    sectionIds: sections.map((s) => s.id),
    createdAt: NOW,
    updatedAt: NOW,
  }

  return { pattern, sections }
}

export function sec(
  kind: PatternSectionKind,
  titleNo: string,
  titleEn: string,
  bodyNo: string,
  bodyEn: string,
  opts?: { rowCount?: number; defaultOpen?: boolean; sortOrder?: number },
): Omit<PatternSection, 'patternId' | 'id'> {
  return {
    kind,
    sortOrder: opts?.sortOrder ?? 0,
    title: t(titleNo, titleEn),
    body: t(bodyNo, bodyEn),
    rowCount: opts?.rowCount,
    defaultOpen: opts?.defaultOpen,
  }
}

/** Format grams series for section prose: 350 (400) 450 g */
export function gramsProse(grams: number[]): string {
  return grams
    .map((g, i) => (i % 2 === 1 ? `(${g})` : String(g)))
    .join(' ')
}
