/**
 * Krøll Supabase access — app-specific tables only.
 * Shared identity: auth.users + profiles (read is_admin / preferred_locale elsewhere).
 * No imports from Fra gryte til gaffel.
 */

import { supabase } from './supabase'
import type {
  CatalogYarn,
  KnittingPattern,
  KnittingProject,
  LocaleText,
  PatternOwnership,
  PatternProgress,
  PatternSection,
  ProjectStatus,
  PurchaseKind,
  QuantityUnit,
  UserYarnStashItem,
  YarnWeight,
} from '../types/models'

function client() {
  return supabase
}

function localeText(no: string, en: string): LocaleText {
  return { no: no ?? '', en: en ?? '' }
}

// ---- Row mappers -----------------------------------------------------------

type PatternRow = {
  id: string
  slug: string
  status: 'draft' | 'published'
  demo_pattern?: boolean
  price_nok: number
  cover_image_url: string | null
  pdf_url: string | null
  pdf_storage_path?: string | null
  title_no: string
  title_en: string
  tagline_no: string
  tagline_en: string
  description_no: string
  description_en: string
  designer: string
  difficulty: KnittingPattern['difficulty']
  categories: string[]
  sizes: KnittingPattern['sizes']
  yarn_requirements: KnittingPattern['yarnRequirements']
  needles?: KnittingPattern['needles']
  recommended_ease_min_cm?: number | null
  recommended_ease_max_cm?: number | null
  needle_mm: number[]
  gauge_stitches: number
  gauge_rows: number
  gauge_per_cm: number
  techniques: LocaleText[]
  abbreviations: KnittingPattern['abbreviations']
  gallery_image_urls?: string[] | null
  tags?: string[] | null
  rest_yarn_friendly?: boolean | null
  created_at: string
  updated_at: string
}

type SectionRow = {
  id: string
  pattern_id: string
  kind: PatternSection['kind']
  sort_order: number
  title_no: string
  title_en: string
  body_no: string
  body_en: string
  image_url: string | null
  row_count: number | null
  hidden?: boolean | null
  default_open?: boolean | null
}

type YarnRow = {
  id: string
  brand: string
  name_no: string
  name_en: string
  weight: YarnWeight
  metres_per_skein: number
  grams_per_skein: number
  fibre_no: string
  fibre_en: string
  suggested_needle_mm: number[]
  gauge_stitches: number | null
  gauge_rows: number | null
  gauge_per_cm: number | null
  colourways: CatalogYarn['colourways']
}

type OwnershipRow = {
  user_id: string
  pattern_id: string
  purchased_at: string
  purchase_kind: PurchaseKind
  price_paid_nok: number
  purchase_id?: string | null
  provider?: string | null
  provider_ref?: string | null
}

type ProgressRow = {
  user_id: string
  pattern_id: string
  section_id: string | null
  row_number: number | null
  step_index: number | null
  updated_at: string
}

type StashRow = {
  id: string
  user_id: string
  yarn_id: string | null
  custom_brand: string | null
  custom_name: string | null
  weight: YarnWeight | null
  fibre: string | null
  colour_name: string | null
  colour_hex: string | null
  quantity: number
  unit: QuantityUnit
  metres_total: number | null
  grams_total: number | null
  needle_mm: number | null
  gauge_stitches: number | null
  gauge_rows: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

type ProjectRow = {
  id: string
  user_id: string
  pattern_id: string
  title: string
  size_id: string | null
  stash_item_ids: string[]
  status: ProjectStatus
  notes: string
  started_at: string | null
  finished_at: string | null
  created_at: string
  updated_at: string
}

export function patternFromRow(row: PatternRow): KnittingPattern {
  const needleMm = (row.needle_mm ?? []).map(Number)
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    demoPattern: Boolean(row.demo_pattern),
    priceNok: row.demo_pattern ? 0 : row.price_nok,
    coverImageUrl: row.cover_image_url,
    pdfUrl: row.pdf_url,
    pdfStoragePath: row.pdf_storage_path ?? null,
    title: localeText(row.title_no, row.title_en),
    tagline: localeText(row.tagline_no, row.tagline_en),
    description: localeText(row.description_no, row.description_en),
    designer: row.designer,
    difficulty: row.difficulty,
    categories: row.categories ?? [],
    sizes: row.sizes ?? [],
    recommendedEaseMinCm: row.recommended_ease_min_cm ?? undefined,
    recommendedEaseMaxCm: row.recommended_ease_max_cm ?? undefined,
    yarnRequirements: row.yarn_requirements ?? [],
    needles:
      row.needles ??
      needleMm.map((mm) => ({ mm, notes: localeText('', '') })),
    needleMm,
    gaugeStitches: Number(row.gauge_stitches ?? 0),
    gaugeRows: Number(row.gauge_rows ?? 0),
    gaugePerCm: Number(row.gauge_per_cm ?? 10),
    techniques: row.techniques ?? [],
    abbreviations: row.abbreviations ?? [],
    galleryImageUrls: row.gallery_image_urls ?? [],
    tags: row.tags ?? [],
    restYarnFriendly: Boolean(row.rest_yarn_friendly),
    sectionIds: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function sectionFromRow(row: SectionRow): PatternSection {
  return {
    id: row.id,
    patternId: row.pattern_id,
    kind: row.kind,
    sortOrder: row.sort_order,
    title: localeText(row.title_no, row.title_en),
    body: localeText(row.body_no, row.body_en),
    imageUrl: row.image_url,
    rowCount: row.row_count ?? undefined,
    hidden: Boolean(row.hidden),
    defaultOpen: Boolean(row.default_open),
  }
}

export function yarnFromRow(row: YarnRow): CatalogYarn {
  return {
    id: row.id,
    brand: row.brand,
    name: localeText(row.name_no, row.name_en),
    weight: row.weight,
    metresPerSkein: Number(row.metres_per_skein),
    gramsPerSkein: Number(row.grams_per_skein),
    fibre: localeText(row.fibre_no, row.fibre_en),
    suggestedNeedleMm: (row.suggested_needle_mm ?? []).map(Number),
    gaugeStitches: row.gauge_stitches ?? undefined,
    gaugeRows: row.gauge_rows ?? undefined,
    gaugePerCm: row.gauge_per_cm ?? undefined,
    colourways: row.colourways ?? [],
  }
}

function ownershipFromRow(row: OwnershipRow): PatternOwnership {
  return {
    userId: row.user_id,
    patternId: row.pattern_id,
    purchasedAt: row.purchased_at,
    purchaseKind: row.purchase_kind ?? 'mock',
    pricePaidNok: row.price_paid_nok,
    purchaseId: row.purchase_id ?? null,
    provider: row.provider ?? null,
    providerRef: row.provider_ref ?? null,
  }
}

function progressFromRow(row: ProgressRow): PatternProgress {
  return {
    userId: row.user_id,
    patternId: row.pattern_id,
    sectionId: row.section_id,
    rowNumber: row.row_number,
    stepIndex: row.step_index,
    updatedAt: row.updated_at,
  }
}

function stashFromRow(row: StashRow): UserYarnStashItem {
  return {
    id: row.id,
    userId: row.user_id,
    yarnId: row.yarn_id,
    customBrand: row.custom_brand ?? undefined,
    customName: row.custom_name ?? undefined,
    weight: row.weight ?? undefined,
    fibre: row.fibre ?? undefined,
    colourName: row.colour_name ?? undefined,
    colourHex: row.colour_hex ?? undefined,
    quantity: Number(row.quantity),
    unit: row.unit,
    metresTotal: row.metres_total ?? undefined,
    gramsTotal: row.grams_total ?? undefined,
    needleMm: row.needle_mm ?? undefined,
    gaugeStitches: row.gauge_stitches ?? undefined,
    gaugeRows: row.gauge_rows ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function projectFromRow(row: ProjectRow): KnittingProject {
  return {
    id: row.id,
    userId: row.user_id,
    patternId: row.pattern_id,
    title: row.title,
    sizeId: row.size_id,
    stashItemIds: (row.stash_item_ids ?? []).map(String),
    status: row.status,
    notes: row.notes ?? '',
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function patternToRow(p: KnittingPattern) {
  return {
    id: p.id,
    slug: p.slug,
    status: p.status,
    demo_pattern: p.demoPattern,
    price_nok: p.demoPattern ? 0 : p.priceNok,
    cover_image_url: p.coverImageUrl,
    pdf_url: p.pdfUrl,
    pdf_storage_path: p.pdfStoragePath ?? null,
    title_no: p.title.no,
    title_en: p.title.en,
    tagline_no: p.tagline.no,
    tagline_en: p.tagline.en,
    description_no: p.description.no,
    description_en: p.description.en,
    designer: p.designer,
    difficulty: p.difficulty,
    categories: p.categories,
    sizes: p.sizes,
    yarn_requirements: p.yarnRequirements,
    needles: p.needles,
    recommended_ease_min_cm: p.recommendedEaseMinCm ?? null,
    recommended_ease_max_cm: p.recommendedEaseMaxCm ?? null,
    needle_mm: p.needleMm,
    gauge_stitches: p.gaugeStitches,
    gauge_rows: p.gaugeRows,
    gauge_per_cm: p.gaugePerCm,
    techniques: p.techniques,
    abbreviations: p.abbreviations,
    gallery_image_urls: p.galleryImageUrls ?? [],
    tags: p.tags ?? [],
    rest_yarn_friendly: Boolean(p.restYarnFriendly),
    updated_at: p.updatedAt,
    created_at: p.createdAt,
  }
}

function sectionToRow(s: PatternSection) {
  return {
    id: s.id,
    pattern_id: s.patternId,
    kind: s.kind,
    sort_order: s.sortOrder,
    title_no: s.title.no,
    title_en: s.title.en,
    body_no: s.body.no,
    body_en: s.body.en,
    image_url: s.imageUrl ?? null,
    row_count: s.rowCount ?? null,
    hidden: Boolean(s.hidden),
    default_open: Boolean(s.defaultOpen),
  }
}

function yarnToRow(y: CatalogYarn) {
  return {
    id: y.id,
    brand: y.brand,
    name_no: y.name.no,
    name_en: y.name.en,
    weight: y.weight,
    metres_per_skein: y.metresPerSkein,
    grams_per_skein: y.gramsPerSkein,
    fibre_no: y.fibre.no,
    fibre_en: y.fibre.en,
    suggested_needle_mm: y.suggestedNeedleMm,
    gauge_stitches: y.gaugeStitches ?? null,
    gauge_rows: y.gaugeRows ?? null,
    gauge_per_cm: y.gaugePerCm ?? null,
    colourways: y.colourways,
  }
}

function stashToRow(item: UserYarnStashItem) {
  return {
    id: item.id,
    user_id: item.userId,
    yarn_id: item.yarnId,
    custom_brand: item.customBrand ?? null,
    custom_name: item.customName ?? null,
    weight: item.weight ?? null,
    fibre: item.fibre ?? null,
    colour_name: item.colourName ?? null,
    colour_hex: item.colourHex ?? null,
    quantity: item.quantity,
    unit: item.unit,
    metres_total: item.metresTotal ?? null,
    grams_total: item.gramsTotal ?? null,
    needle_mm: item.needleMm ?? null,
    gauge_stitches: item.gaugeStitches ?? null,
    gauge_rows: item.gaugeRows ?? null,
    notes: item.notes ?? null,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }
}

function projectToRow(p: KnittingProject) {
  return {
    id: p.id,
    user_id: p.userId,
    pattern_id: p.patternId,
    title: p.title,
    size_id: p.sizeId,
    stash_item_ids: p.stashItemIds,
    status: p.status,
    notes: p.notes,
    started_at: p.startedAt,
    finished_at: p.finishedAt,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  }
}

// ---- Catalog ---------------------------------------------------------------

export async function fetchCatalog(): Promise<{
  patterns: KnittingPattern[]
  sections: PatternSection[]
  yarns: CatalogYarn[]
} | null> {
  const db = client()
  if (!db) return null

  const [patternsRes, sectionsRes, yarnsRes] = await Promise.all([
    db.from('knitting_patterns').select('*'),
    db.from('pattern_sections').select('*'),
    db.from('yarns').select('*'),
  ])

  if (patternsRes.error || sectionsRes.error || yarnsRes.error) {
    console.warn(
      '[Krøll] Catalog fetch failed (tables missing or RLS). Using local mocks.',
      patternsRes.error?.message ??
        sectionsRes.error?.message ??
        yarnsRes.error?.message,
    )
    return null
  }

  const patterns = (patternsRes.data as PatternRow[]).map(patternFromRow)
  const sections = (sectionsRes.data as SectionRow[]).map(sectionFromRow)
  const yarns = (yarnsRes.data as YarnRow[]).map(yarnFromRow)

  for (const p of patterns) {
    p.sectionIds = sections
      .filter((s) => s.patternId === p.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => s.id)
  }

  return { patterns, sections, yarns }
}

export async function upsertPatternRemote(
  pattern: KnittingPattern,
  sections: PatternSection[],
): Promise<string | null> {
  const db = client()
  if (!db) return 'Supabase not configured'

  const { error: pErr } = await db
    .from('knitting_patterns')
    .upsert(patternToRow(pattern), { onConflict: 'id' })
  if (pErr) return pErr.message

  const { error: delErr } = await db
    .from('pattern_sections')
    .delete()
    .eq('pattern_id', pattern.id)
  if (delErr) return delErr.message

  if (sections.length) {
    const { error: sErr } = await db
      .from('pattern_sections')
      .insert(sections.map(sectionToRow))
    if (sErr) return sErr.message
  }
  return null
}

export async function upsertYarnRemote(yarn: CatalogYarn): Promise<string | null> {
  const db = client()
  if (!db) return 'Supabase not configured'
  const { error } = await db.from('yarns').upsert(yarnToRow(yarn), {
    onConflict: 'id',
  })
  return error?.message ?? null
}

export async function deleteYarnRemote(id: string): Promise<string | null> {
  const db = client()
  if (!db) return 'Supabase not configured'
  const { error } = await db.from('yarns').delete().eq('id', id)
  return error?.message ?? null
}

// ---- Ownership -------------------------------------------------------------

export async function fetchOwnership(
  userId: string,
): Promise<PatternOwnership[] | null> {
  const db = client()
  if (!db) return null
  const { data, error } = await db
    .from('pattern_ownership')
    .select('*')
    .eq('user_id', userId)
  if (error) {
    console.warn('[Krøll] ownership fetch:', error.message)
    return null
  }
  return (data as OwnershipRow[]).map(ownershipFromRow)
}

export async function upsertOwnershipRemote(
  row: PatternOwnership,
): Promise<string | null> {
  const db = client()
  if (!db) return 'Supabase not configured'
  const { error } = await db.from('pattern_ownership').upsert(
    {
      user_id: row.userId,
      pattern_id: row.patternId,
      purchased_at: row.purchasedAt,
      purchase_kind: row.purchaseKind,
      price_paid_nok: row.pricePaidNok,
      purchase_id: row.purchaseId ?? null,
      provider: row.provider ?? null,
      provider_ref: row.providerRef ?? null,
    },
    { onConflict: 'user_id,pattern_id' },
  )
  return error?.message ?? null
}

// ---- Progress --------------------------------------------------------------

export async function fetchProgress(
  userId: string,
): Promise<PatternProgress[] | null> {
  const db = client()
  if (!db) return null
  const { data, error } = await db
    .from('pattern_progress')
    .select('*')
    .eq('user_id', userId)
  if (error) {
    console.warn('[Krøll] progress fetch:', error.message)
    return null
  }
  return (data as ProgressRow[]).map(progressFromRow)
}

export async function upsertProgressRemote(
  row: PatternProgress,
): Promise<string | null> {
  const db = client()
  if (!db) return 'Supabase not configured'
  const { error } = await db.from('pattern_progress').upsert(
    {
      user_id: row.userId,
      pattern_id: row.patternId,
      section_id: row.sectionId,
      row_number: row.rowNumber,
      step_index: row.stepIndex,
      updated_at: row.updatedAt,
    },
    { onConflict: 'user_id,pattern_id' },
  )
  return error?.message ?? null
}

// ---- Stash -----------------------------------------------------------------

export async function fetchStash(
  userId: string,
): Promise<UserYarnStashItem[] | null> {
  const db = client()
  if (!db) return null
  const { data, error } = await db
    .from('user_yarn_stash')
    .select('*')
    .eq('user_id', userId)
  if (error) {
    console.warn('[Krøll] stash fetch:', error.message)
    return null
  }
  return (data as StashRow[]).map(stashFromRow)
}

export async function upsertStashRemote(
  item: UserYarnStashItem,
): Promise<string | null> {
  const db = client()
  if (!db) return 'Supabase not configured'
  const { error } = await db
    .from('user_yarn_stash')
    .upsert(stashToRow(item), { onConflict: 'id' })
  return error?.message ?? null
}

export async function deleteStashRemote(id: string): Promise<string | null> {
  const db = client()
  if (!db) return 'Supabase not configured'
  const { error } = await db.from('user_yarn_stash').delete().eq('id', id)
  return error?.message ?? null
}

// ---- Projects --------------------------------------------------------------

export async function fetchProjects(
  userId: string,
): Promise<KnittingProject[] | null> {
  const db = client()
  if (!db) return null
  const { data, error } = await db
    .from('knitting_projects')
    .select('*')
    .eq('user_id', userId)
  if (error) {
    console.warn('[Krøll] projects fetch:', error.message)
    return null
  }
  return (data as ProjectRow[]).map(projectFromRow)
}

export async function upsertProjectRemote(
  project: KnittingProject,
): Promise<string | null> {
  const db = client()
  if (!db) return 'Supabase not configured'
  const { error } = await db
    .from('knitting_projects')
    .upsert(projectToRow(project), { onConflict: 'id' })
  return error?.message ?? null
}

export async function deleteProjectRemote(id: string): Promise<string | null> {
  const db = client()
  if (!db) return 'Supabase not configured'
  const { error } = await db.from('knitting_projects').delete().eq('id', id)
  return error?.message ?? null
}
