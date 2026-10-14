import { writeFileSync } from 'node:fs'
import { DEMO_PATTERNS, DEMO_SECTIONS } from '../src/data/demo/catalog.ts'

function esc(s: string): string {
  return s.replace(/'/g, "''")
}
function j(v: unknown): string {
  return `'${esc(JSON.stringify(v))}'::jsonb`
}

const lines: string[] = []
lines.push(`-- =============================================================================`)
lines.push(`-- Krøll demo catalog seed (9 complete demo patterns)`)
lines.push(`-- INSERT-ONLY / safe for re-run against edited production data.`)
lines.push(`-- Requires knitting_patterns + pattern_sections.`)
lines.push(`-- Does NOT touch FGTG tables. Do NOT auto-run from the app.`)
lines.push(`--`)
lines.push(`-- SAFETY: on conflict do nothing — never overwrite admin CMS edits,`)
lines.push(`-- cover images, gallery, PDFs, or section content.`)
lines.push(`-- Do NOT delete existing demo sections (preserves Admin changes).`)
lines.push(`-- =============================================================================`)
lines.push(``)
lines.push(`alter table public.knitting_patterns`)
lines.push(`  add column if not exists demo_pattern boolean not null default false;`)
lines.push(`alter table public.knitting_patterns`)
lines.push(`  add column if not exists needles jsonb not null default '[]'::jsonb;`)
lines.push(`alter table public.knitting_patterns`)
lines.push(`  add column if not exists recommended_ease_min_cm numeric;`)
lines.push(`alter table public.knitting_patterns`)
lines.push(`  add column if not exists recommended_ease_max_cm numeric;`)
lines.push(``)
lines.push(`-- Remove previous placeholder seed rows only (safe: known retired IDs)`)
lines.push(`delete from public.pattern_sections where pattern_id in (`)
lines.push(`  'pat-fjord-cowl','pat-lumen-hat','pat-tide-socks','pat-draft-cardigan'`)
lines.push(`);`)
lines.push(`delete from public.knitting_patterns where id in (`)
lines.push(`  'pat-fjord-cowl','pat-lumen-hat','pat-tide-socks','pat-draft-cardigan'`)
lines.push(`);`)
lines.push(``)

for (const p of DEMO_PATTERNS) {
  lines.push(`insert into public.knitting_patterns (`)
  lines.push(`  id, slug, status, demo_pattern, price_nok, title_no, title_en, tagline_no, tagline_en,`)
  lines.push(`  description_no, description_en, designer, difficulty, categories,`)
  lines.push(`  sizes, yarn_requirements, needles, recommended_ease_min_cm, recommended_ease_max_cm,`)
  lines.push(`  needle_mm, gauge_stitches, gauge_rows, gauge_per_cm, techniques, abbreviations`)
  lines.push(`) values (`)
  lines.push(`  '${esc(p.id)}', '${esc(p.slug)}', '${p.status}', true, 0,`)
  lines.push(`  '${esc(p.title.no)}', '${esc(p.title.en)}',`)
  lines.push(`  '${esc(p.tagline.no)}', '${esc(p.tagline.en)}',`)
  lines.push(`  '${esc(p.description.no)}', '${esc(p.description.en)}',`)
  lines.push(`  '${esc(p.designer)}', '${esc(p.difficulty)}',`)
  lines.push(
    `  array[${p.categories.map((c) => `'${esc(c)}'`).join(',')}]::text[],`,
  )
  lines.push(`  ${j(p.sizes)},`)
  lines.push(`  ${j(p.yarnRequirements)},`)
  lines.push(`  ${j(p.needles)},`)
  lines.push(
    `  ${p.recommendedEaseMinCm ?? 'null'}, ${p.recommendedEaseMaxCm ?? 'null'},`,
  )
  lines.push(`  array[${p.needleMm.join(',')}]::numeric[],`)
  lines.push(`  ${p.gaugeStitches}, ${p.gaugeRows}, ${p.gaugePerCm},`)
  lines.push(`  ${j(p.techniques)},`)
  lines.push(`  ${j(p.abbreviations)}`)
  lines.push(`)`)
  lines.push(`on conflict (id) do nothing;`)
  lines.push(``)
}

lines.push(
  `-- Sections: insert missing only. Never delete demo sections (Admin may have edited).`,
)
lines.push(``)

for (const s of DEMO_SECTIONS) {
  lines.push(`insert into public.pattern_sections (`)
  lines.push(
    `  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count`,
  )
  lines.push(`) values (`)
  lines.push(
    `  '${esc(s.id)}', '${esc(s.patternId)}', '${esc(s.kind)}', ${s.sortOrder},`,
  )
  lines.push(`  '${esc(s.title.no)}', '${esc(s.title.en)}',`)
  lines.push(`  '${esc(s.body.no)}', '${esc(s.body.en)}',`)
  lines.push(`  ${s.rowCount ?? 'null'}`)
  lines.push(`)`)
  lines.push(`on conflict (id) do nothing;`)
  lines.push(``)
}

lines.push(
  `comment on column public.knitting_patterns.demo_pattern is 'Internal demo flag — never sell as final paid production';`,
)

writeFileSync(
  new URL('../supabase/kroll-demo-seed.sql', import.meta.url),
  lines.join('\n') + '\n',
)
console.log(
  'Wrote kroll-demo-seed.sql',
  DEMO_PATTERNS.length,
  'patterns',
  DEMO_SECTIONS.length,
  'sections',
)
