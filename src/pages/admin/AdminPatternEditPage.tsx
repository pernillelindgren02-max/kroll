import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  BilingualTextInput,
  LangTabs,
  type ContentLangTab,
} from '../../components/admin/BilingualFields'
import { ImageUploadField } from '../../components/admin/ImageUploadField'
import { useLocale } from '../../context/LocaleContext'
import { usePatterns } from '../../context/PatternsContext'
import { lt } from '../../lib/localeText'
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
import { PATTERN_SECTION_KINDS } from '../../types/models'
import {
  estimateMetresFromGrams,
  withDerivedYarnTotals,
} from '../../lib/yarnQuantity'

const emptyText = (): LocaleText => ({ no: '', en: '' })

function friendlySaveError(raw: string): string {
  if (/demo/i.test(raw) && /pris|price|sell/i.test(raw)) return raw
  if (/network|fetch/i.test(raw)) {
    return 'Kunne ikke lagre — sjekk nettverket og prøv igjen.'
  }
  if (/duplicate|unique/i.test(raw)) {
    return 'Noe med samme ID eller slug finnes allerede.'
  }
  if (/row-level security|permission|policy/i.test(raw)) {
    return 'Ingen tilgang til å lagre. Sjekk at du er admin.'
  }
  return raw.length > 160 ? 'Kunne ikke lagre endringene. Prøv igjen.' : raw
}

export function AdminPatternEditPage() {
  const { id } = useParams()
  const isNew = id === 'new' || !id
  const { t, locale } = useLocale()
  const { getPattern, getSectionsFor, upsertPattern } = usePatterns()
  const existing = !isNew ? getPattern(id) : undefined
  const existingSections = !isNew ? getSectionsFor(id!) : []

  const patternId = useMemo(
    () => existing?.id ?? `pat-${crypto.randomUUID().slice(0, 8)}`,
    [existing?.id],
  )

  const [lang, setLang] = useState<ContentLangTab>('no')
  const [title, setTitle] = useState<LocaleText>(existing?.title ?? emptyText())
  const [tagline, setTagline] = useState<LocaleText>(
    existing?.tagline ?? emptyText(),
  )
  const [description, setDescription] = useState<LocaleText>(
    existing?.description ?? emptyText(),
  )
  const [designer, setDesigner] = useState(existing?.designer ?? 'Krøll Studio')
  const [demoPattern, setDemoPattern] = useState(existing?.demoPattern ?? true)
  const [priceNok, setPriceNok] = useState(
    existing?.demoPattern ? 0 : (existing?.priceNok ?? 0),
  )
  const [status, setStatus] = useState<'draft' | 'published'>(
    existing?.status ?? 'draft',
  )
  const [difficulty, setDifficulty] = useState<KnittingPattern['difficulty']>(
    existing?.difficulty ?? 'easy',
  )
  const [categories, setCategories] = useState(
    (existing?.categories ?? []).join(', '),
  )
  const [tags, setTags] = useState((existing?.tags ?? []).join(', '))
  const [restYarnFriendly, setRestYarnFriendly] = useState(
    existing?.restYarnFriendly ?? false,
  )
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    existing?.coverImageUrl ?? null,
  )
  const [gallery, setGallery] = useState<string[]>(
    existing?.galleryImageUrls ?? [],
  )
  const [pdfUrl, setPdfUrl] = useState(existing?.pdfUrl ?? '')
  const [pdfStoragePath, setPdfStoragePath] = useState(
    existing?.pdfStoragePath ?? '',
  )
  const [easeMin, setEaseMin] = useState(
    existing?.recommendedEaseMinCm ?? undefined,
  )
  const [easeMax, setEaseMax] = useState(
    existing?.recommendedEaseMaxCm ?? undefined,
  )
  const [gaugeStitches, setGaugeStitches] = useState(
    existing?.gaugeStitches ?? 22,
  )
  const [gaugeRows, setGaugeRows] = useState(existing?.gaugeRows ?? 30)
  const [gaugePerCm, setGaugePerCm] = useState(existing?.gaugePerCm ?? 10)
  const [sizes, setSizes] = useState<PatternSize[]>(
    existing?.sizes?.length
      ? existing.sizes
      : [{ id: 'size-one', label: { no: 'One size', en: 'One size' } }],
  )
  const [needles, setNeedles] = useState<NeedleSpec[]>(
    existing?.needles?.length
      ? existing.needles
      : [{ mm: 4, notes: emptyText() }],
  )
  const [yarnReqs, setYarnReqs] = useState<YarnRequirement[]>(() => {
    const sizeCount = existing?.sizes?.length || 1
    if (existing?.yarnRequirements?.length) {
      return existing.yarnRequirements.map((y) =>
        withDerivedYarnTotals({
          ...y,
          gramsBySize: y.gramsBySize?.length
            ? y.gramsBySize
            : Array.from({ length: sizeCount }, () => y.gramsMin ?? 100),
        }),
      )
    }
    return [
      withDerivedYarnTotals({
        id: 'yarn-1',
        label: { no: 'Garnkrav', en: 'Yarn requirement' },
        weight: 'worsted',
        gramsBySize: Array.from({ length: sizeCount }, () => 100),
        gramsPerSkein: 50,
        metresPerSkein: 115,
        metresMin: 0,
        notions: emptyText(),
      }),
    ]
  })
  const [techniques, setTechniques] = useState<LocaleText[]>(
    existing?.techniques?.length ? existing.techniques : [],
  )
  const [abbreviations, setAbbreviations] = useState(
    existing?.abbreviations?.length ? existing.abbreviations : [],
  )
  const [sections, setSections] = useState<PatternSection[]>(() => {
    if (existingSections.length) {
      return [...existingSections].sort((a, b) => a.sortOrder - b.sortOrder)
    }
    return [
      {
        id: `${patternId}-sec-overview-1`,
        patternId,
        kind: 'overview',
        sortOrder: 1,
        title: { no: 'Oversikt', en: 'Overview' },
        body: emptyText(),
        defaultOpen: true,
        hidden: false,
      },
    ]
  })
  const [previewSectionId, setPreviewSectionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function renumber(next: PatternSection[]): PatternSection[] {
    return next.map((s, i) => ({ ...s, sortOrder: i + 1, patternId }))
  }

  function moveSection(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= sections.length) return
    const copy = [...sections]
    const [row] = copy.splice(index, 1)
    copy.splice(target, 0, row)
    setSections(renumber(copy))
  }

  function addSection() {
    const kind: PatternSectionKind = 'notes'
    setSections(
      renumber([
        ...sections,
        {
          id: `${patternId}-sec-${kind}-${crypto.randomUUID().slice(0, 6)}`,
          patternId,
          kind,
          sortOrder: sections.length + 1,
          title: { no: 'Ny seksjon', en: 'New section' },
          body: emptyText(),
          hidden: false,
          defaultOpen: false,
        },
      ]),
    )
  }

  async function save() {
    setError(null)
    setSavedMsg(null)
    if (!title.no.trim() && !title.en.trim()) {
      setError('Tittel mangler (norsk eller engelsk).')
      return
    }
    if (demoPattern && priceNok > 0) {
      setError(
        'Demo-oppskrifter kan ikke ha pris > 0. Fjern demo-flagget først hvis dette skal bli en betalt vare.',
      )
      return
    }

    setSaving(true)
    const now = new Date().toISOString()
    const fromTitle = (title.en || title.no)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    const slug = existing?.slug ?? (fromTitle || patternId)
    const safePrice = demoPattern ? 0 : priceNok
    const ordered = renumber(sections)
    const derivedYarns = yarnReqs.map((y) => {
      const grams = sizes.map(
        (_, i) => y.gramsBySize?.[i] ?? y.gramsMin ?? 0,
      )
      return withDerivedYarnTotals({
        ...y,
        gramsBySize: grams,
        metresBySize: y.metresManualOverride
          ? sizes.map((_, i) => y.metresBySize?.[i] ?? 0)
          : estimateMetresFromGrams(
              grams,
              y.gramsPerSkein,
              y.metresPerSkein,
            ),
      })
    })

    const pattern: KnittingPattern = {
      id: patternId,
      slug,
      status,
      demoPattern,
      priceNok: safePrice,
      coverImageUrl,
      galleryImageUrls: gallery.filter(Boolean),
      pdfUrl: pdfUrl.trim() || null,
      pdfStoragePath: pdfStoragePath.trim() || null,
      title,
      tagline,
      description,
      designer: designer.trim() || 'Krøll Studio',
      difficulty,
      categories: categories
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      tags: tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      restYarnFriendly,
      sizes,
      recommendedEaseMinCm: easeMin,
      recommendedEaseMaxCm: easeMax,
      yarnRequirements: derivedYarns,
      needles,
      needleMm: [...new Set(needles.map((n) => n.mm))],
      gaugeStitches,
      gaugeRows,
      gaugePerCm,
      techniques,
      abbreviations,
      sectionIds: ordered.map((s) => s.id),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }

    const err = await upsertPattern(pattern, ordered)
    setSaving(false)
    if (err) {
      setError(friendlySaveError(err))
      return
    }
    setSavedMsg('Lagret')
    setSections(ordered)
  }

  const previewSection = sections.find((s) => s.id === previewSectionId)

  return (
    <div className="admin-cms">
      <Link to="/admin/oppskrifter" className="back-link">
        ← {t('admin.patterns')}
      </Link>
      <h1>{isNew ? 'Ny oppskrift' : 'Rediger oppskrift'}</h1>
      <p className="muted">
        Stabil ID: `{patternId}`. Alle felt og seksjoner lagres samlet — urørte
        verdier beholdes.
      </p>

      {(demoPattern || existing?.demoPattern) && (
        <p className="demo-banner">
          Demo-oppskrift — kan redigeres (tekst/bilder), men kan ikke selges som
          betalt vare mens flagget er på (pris låst til 0).
        </p>
      )}

      <LangTabs value={lang} onChange={setLang} />

      <h2 className="admin-cms__h2">Grunnleggende</h2>
      <BilingualTextInput label="Tittel" value={title} lang={lang} onChange={setTitle} />
      <BilingualTextInput
        label="Undertittel / kort beskrivelse"
        value={tagline}
        lang={lang}
        onChange={setTagline}
      />
      <BilingualTextInput
        label="Full beskrivelse"
        value={description}
        lang={lang}
        onChange={setDescription}
        multiline
      />
      <label className="admin-field">
        <span>Designer</span>
        <input value={designer} onChange={(e) => setDesigner(e.target.value)} />
      </label>

      <div className="admin-cms__row">
        <label className="admin-field">
          <span>Status</span>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as 'draft' | 'published')
            }
          >
            <option value="draft">{t('admin.draft')}</option>
            <option value="published">{t('admin.publish')}</option>
          </select>
        </label>
        <label className="admin-field">
          <span>Vanskelighetsgrad</span>
          <select
            value={difficulty}
            onChange={(e) =>
              setDifficulty(e.target.value as KnittingPattern['difficulty'])
            }
          >
            <option value="beginner">beginner</option>
            <option value="easy">easy</option>
            <option value="intermediate">intermediate</option>
            <option value="advanced">advanced</option>
          </select>
        </label>
      </div>

      <label className="admin-field">
        <span>
          <input
            type="checkbox"
            checked={demoPattern}
            onChange={(e) => {
              setDemoPattern(e.target.checked)
              if (e.target.checked) setPriceNok(0)
            }}
          />{' '}
          Demo-oppskrift (aldri betalt produksjon)
        </span>
      </label>
      <label className="admin-field">
        <span>Pris (NOK){demoPattern ? ' — låst til 0' : ''}</span>
        <input
          type="number"
          min={0}
          value={demoPattern ? 0 : priceNok}
          disabled={demoPattern}
          onChange={(e) => setPriceNok(Number(e.target.value))}
        />
      </label>
      <label className="admin-field">
        <span>
          <input
            type="checkbox"
            checked={restYarnFriendly}
            onChange={(e) => setRestYarnFriendly(e.target.checked)}
          />{' '}
          Restegarn-vennlig
        </span>
      </label>
      <label className="admin-field">
        <span>Kategorier (kommaseparert)</span>
        <input value={categories} onChange={(e) => setCategories(e.target.value)} />
      </label>
      <label className="admin-field">
        <span>Tags (kommaseparert)</span>
        <input value={tags} onChange={(e) => setTags(e.target.value)} />
      </label>

      <h2 className="admin-cms__h2">Bilder</h2>
      <ImageUploadField
        label="Forsidebilde"
        value={coverImageUrl}
        patternId={patternId}
        kind="cover"
        onChange={setCoverImageUrl}
      />
      <div className="admin-cms__gallery">
        {gallery.map((url, i) => (
          <ImageUploadField
            key={`${url.slice(0, 24)}-${i}`}
            label={`Ekstra bilde ${i + 1}`}
            value={url}
            patternId={patternId}
            kind="gallery"
            onChange={(next) => {
              if (!next) {
                setGallery(gallery.filter((_, j) => j !== i))
              } else {
                setGallery(gallery.map((u, j) => (j === i ? next : u)))
              }
            }}
          />
        ))}
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => setGallery([...gallery, ''])}
        >
          + Legg til bildeplass
        </button>
      </div>

      <h2 className="admin-cms__h2">PDF</h2>
      <label className="admin-field">
        <span>PDF storage path (privat bucket pattern-pdfs)</span>
        <input
          value={pdfStoragePath}
          onChange={(e) => setPdfStoragePath(e.target.value)}
          placeholder="patterns/pat-xxx/v1.pdf"
        />
      </label>
      <label className="admin-field">
        <span>Legacy offentlig PDF-URL (kun demo/gratis)</span>
        <input
          type="url"
          value={pdfUrl}
          onChange={(e) => setPdfUrl(e.target.value)}
        />
      </label>

      <h2 className="admin-cms__h2">Størrelser & mål</h2>
      <div className="admin-cms__row">
        <label className="admin-field">
          <span>Ease min (cm)</span>
          <input
            type="number"
            value={easeMin ?? ''}
            onChange={(e) =>
              setEaseMin(e.target.value === '' ? undefined : Number(e.target.value))
            }
          />
        </label>
        <label className="admin-field">
          <span>Ease max (cm)</span>
          <input
            type="number"
            value={easeMax ?? ''}
            onChange={(e) =>
              setEaseMax(e.target.value === '' ? undefined : Number(e.target.value))
            }
          />
        </label>
      </div>
      {sizes.map((size, i) => (
        <div key={size.id} className="admin-cms__card">
          <BilingualTextInput
            label="Størrelsesetikett"
            value={size.label}
            lang={lang}
            onChange={(label) =>
              setSizes(sizes.map((s, j) => (j === i ? { ...s, label } : s)))
            }
          />
          <div className="admin-cms__grid admin-cms__size-fields">
            {(
              [
                ['chestCm', 'Ferdig bryst'],
                ['bodyBustMinCm', 'Kropp bryst min'],
                ['bodyBustMaxCm', 'Kropp bryst max'],
                ['lengthCm', 'Lengde'],
                ['sleeveLengthCm', 'Erme'],
                ['headCircumferenceMinCm', 'Hode min'],
                ['headCircumferenceMaxCm', 'Hode max'],
                ['finishedCircumferenceCm', 'Ferdig omkrets'],
                ['handCircumferenceCm', 'Hånd'],
                ['footLengthCm', 'Fot'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="admin-field">
                <span>{label}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={size[key] ?? ''}
                  onChange={(e) => {
                    const v =
                      e.target.value === '' ? undefined : Number(e.target.value)
                    setSizes(
                      sizes.map((s, j) =>
                        j === i ? { ...s, [key]: v } : s,
                      ),
                    )
                  }}
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setSizes(sizes.filter((_, j) => j !== i))}
          >
            Slett størrelse
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn--ghost"
        onClick={() =>
          setSizes([
            ...sizes,
            {
              id: `size-${crypto.randomUUID().slice(0, 6)}`,
              label: { no: 'Ny', en: 'New' },
            },
          ])
        }
      >
        + Størrelse
      </button>

      <h2 className="admin-cms__h2">Strikkefasthet</h2>
      <div className="admin-cms__grid">
        <label className="admin-field">
          <span>Masker</span>
          <input
            type="number"
            value={gaugeStitches}
            onChange={(e) => setGaugeStitches(Number(e.target.value))}
          />
        </label>
        <label className="admin-field">
          <span>Rader</span>
          <input
            type="number"
            value={gaugeRows}
            onChange={(e) => setGaugeRows(Number(e.target.value))}
          />
        </label>
        <label className="admin-field">
          <span>Per cm</span>
          <input
            type="number"
            value={gaugePerCm}
            onChange={(e) => setGaugePerCm(Number(e.target.value))}
          />
        </label>
      </div>

      <h2 className="admin-cms__h2">Pinner</h2>
      {needles.map((n, i) => (
        <div key={i} className="admin-cms__card">
          <label className="admin-field">
            <span>mm</span>
            <input
              type="number"
              step="0.5"
              value={n.mm}
              onChange={(e) =>
                setNeedles(
                  needles.map((row, j) =>
                    j === i ? { ...row, mm: Number(e.target.value) } : row,
                  ),
                )
              }
            />
          </label>
          <BilingualTextInput
            label="Notater"
            value={n.notes}
            lang={lang}
            onChange={(notes) =>
              setNeedles(
                needles.map((row, j) => (j === i ? { ...row, notes } : row)),
              )
            }
          />
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setNeedles(needles.filter((_, j) => j !== i))}
          >
            Slett pinne
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn--ghost"
        onClick={() =>
          setNeedles([...needles, { mm: 4, notes: emptyText() }])
        }
      >
        + Pinne
      </button>

      <h2 className="admin-cms__h2">Garn & materialer (gram først)</h2>
      <p className="muted">
        Bruker ser gram per størrelse. Meter beregnes fra nøste g/m — eller
        overstyres manuelt. Flere garn med samme «Holdt sammen»-gruppe strikkes
        sammen.
      </p>
      {yarnReqs.map((yarnReq, yi) => {
        const est = estimateMetresFromGrams(
          sizes.map((_, i) => yarnReq.gramsBySize?.[i] ?? 0),
          yarnReq.gramsPerSkein,
          yarnReq.metresPerSkein,
        )
        return (
          <div key={yarnReq.id ?? yi} className="admin-cms__card">
            <strong>Garn {yi + 1}</strong>
            <BilingualTextInput
              label="Navn / etikett"
              value={yarnReq.label}
              lang={lang}
              onChange={(label) =>
                setYarnReqs(
                  yarnReqs.map((y, j) => (j === yi ? { ...y, label } : y)),
                )
              }
            />
            <label className="admin-field">
              <span>Merke</span>
              <input
                value={yarnReq.brand ?? ''}
                onChange={(e) =>
                  setYarnReqs(
                    yarnReqs.map((y, j) =>
                      j === yi ? { ...y, brand: e.target.value } : y,
                    ),
                  )
                }
              />
            </label>
            <label className="admin-field">
              <span>Garnvekt</span>
              <select
                value={yarnReq.weight ?? 'worsted'}
                onChange={(e) =>
                  setYarnReqs(
                    yarnReqs.map((y, j) =>
                      j === yi
                        ? { ...y, weight: e.target.value as YarnWeight }
                        : y,
                    ),
                  )
                }
              >
                {[
                  'lace',
                  'fingering',
                  'sport',
                  'dk',
                  'worsted',
                  'bulky',
                  'super_bulky',
                ].map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </label>
            <div className="admin-cms__grid">
              <label className="admin-field">
                <span>g / nøste</span>
                <input
                  type="number"
                  value={yarnReq.gramsPerSkein ?? ''}
                  onChange={(e) =>
                    setYarnReqs(
                      yarnReqs.map((y, j) =>
                        j === yi
                          ? { ...y, gramsPerSkein: Number(e.target.value) }
                          : y,
                      ),
                    )
                  }
                />
              </label>
              <label className="admin-field">
                <span>m / nøste</span>
                <input
                  type="number"
                  value={yarnReq.metresPerSkein ?? ''}
                  onChange={(e) =>
                    setYarnReqs(
                      yarnReqs.map((y, j) =>
                        j === yi
                          ? { ...y, metresPerSkein: Number(e.target.value) }
                          : y,
                      ),
                    )
                  }
                />
              </label>
            </div>
            <label className="admin-field">
              <span>Holdt sammen-gruppe (valgfritt id)</span>
              <input
                value={yarnReq.heldTogetherGroupId ?? ''}
                placeholder="f.eks. held-1"
                onChange={(e) =>
                  setYarnReqs(
                    yarnReqs.map((y, j) =>
                      j === yi
                        ? {
                            ...y,
                            heldTogetherGroupId: e.target.value || null,
                          }
                        : y,
                    ),
                  )
                }
              />
            </label>
            <p className="muted">Gram per størrelse (primært):</p>
            {sizes.map((s, i) => (
              <div key={s.id} className="admin-cms__yarn-size">
                <strong>{lt(s.label, locale)}</strong>
                <label className="admin-field">
                  <span>Gram</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={yarnReq.gramsBySize?.[i] ?? ''}
                    onChange={(e) => {
                      const next = [...(yarnReq.gramsBySize ?? [])]
                      while (next.length < sizes.length) next.push(0)
                      next[i] = Number(e.target.value)
                      setYarnReqs(
                        yarnReqs.map((y, j) =>
                          j === yi ? { ...y, gramsBySize: next } : y,
                        ),
                      )
                    }}
                  />
                </label>
              </div>
            ))}
            <label className="admin-field">
              <span>
                <input
                  type="checkbox"
                  checked={Boolean(yarnReq.metresManualOverride)}
                  onChange={(e) =>
                    setYarnReqs(
                      yarnReqs.map((y, j) =>
                        j === yi
                          ? { ...y, metresManualOverride: e.target.checked }
                          : y,
                      ),
                    )
                  }
                />{' '}
                Manuell meter-overstyring
              </span>
            </label>
            {yarnReq.metresManualOverride ? (
              sizes.map((s, i) => (
                <div key={`m-${s.id}`} className="admin-cms__yarn-size">
                  <strong>{lt(s.label, locale)}</strong>
                  <label className="admin-field">
                    <span>Meter (manuell)</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={yarnReq.metresBySize?.[i] ?? ''}
                      onChange={(e) => {
                        const next = [...(yarnReq.metresBySize ?? [])]
                        while (next.length < sizes.length) next.push(0)
                        next[i] = Number(e.target.value)
                        setYarnReqs(
                          yarnReqs.map((y, j) =>
                            j === yi ? { ...y, metresBySize: next } : y,
                          ),
                        )
                      }}
                    />
                  </label>
                </div>
              ))
            ) : (
              <p className="muted">
                Estimert meter:{' '}
                {est
                  .map((m, i) => (i % 2 === 1 ? `(${m})` : String(m)))
                  .join(' ')}{' '}
                m
              </p>
            )}
            <BilingualTextInput
              label="Tilbehør / notions"
              value={yarnReq.notions ?? emptyText()}
              lang={lang}
              onChange={(notions) =>
                setYarnReqs(
                  yarnReqs.map((y, j) => (j === yi ? { ...y, notions } : y)),
                )
              }
              multiline
            />
            <BilingualTextInput
              label="Substitutt-notat"
              value={yarnReq.substituteNote ?? emptyText()}
              lang={lang}
              onChange={(substituteNote) =>
                setYarnReqs(
                  yarnReqs.map((y, j) =>
                    j === yi ? { ...y, substituteNote } : y,
                  ),
                )
              }
              multiline
            />
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setYarnReqs(yarnReqs.filter((_, j) => j !== yi))}
            >
              Slett garnlinje
            </button>
          </div>
        )
      })}
      <button
        type="button"
        className="btn btn--ghost"
        onClick={() =>
          setYarnReqs([
            ...yarnReqs,
            withDerivedYarnTotals({
              id: `yarn-${crypto.randomUUID().slice(0, 6)}`,
              label: { no: 'Nytt garn', en: 'New yarn' },
              weight: 'dk',
              gramsBySize: sizes.map(() => 50),
              gramsPerSkein: 50,
              metresPerSkein: 115,
              metresMin: 0,
            }),
          ])
        }
      >
        + Garnlinje
      </button>

      <h2 className="admin-cms__h2">Teknikker</h2>
      {techniques.map((tech, i) => (
        <div key={i} className="admin-cms__card">
          <BilingualTextInput
            label={`Teknikk ${i + 1}`}
            value={tech}
            lang={lang}
            onChange={(v) =>
              setTechniques(techniques.map((row, j) => (j === i ? v : row)))
            }
          />
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setTechniques(techniques.filter((_, j) => j !== i))}
          >
            Slett
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => setTechniques([...techniques, emptyText()])}
      >
        + Teknikk
      </button>

      <h2 className="admin-cms__h2">Forkortelser</h2>
      {abbreviations.map((abbr, i) => (
        <div key={i} className="admin-cms__card">
          <label className="admin-field">
            <span>Forkortelse</span>
            <input
              value={abbr.abbr}
              onChange={(e) =>
                setAbbreviations(
                  abbreviations.map((row, j) =>
                    j === i ? { ...row, abbr: e.target.value } : row,
                  ),
                )
              }
            />
          </label>
          <BilingualTextInput
            label="Betydning"
            value={abbr.meaning}
            lang={lang}
            onChange={(meaning) =>
              setAbbreviations(
                abbreviations.map((row, j) =>
                  j === i ? { ...row, meaning } : row,
                ),
              )
            }
          />
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() =>
              setAbbreviations(abbreviations.filter((_, j) => j !== i))
            }
          >
            Slett
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn--ghost"
        onClick={() =>
          setAbbreviations([
            ...abbreviations,
            { abbr: '', meaning: emptyText() },
          ])
        }
      >
        + Forkortelse
      </button>

      <h2 className="admin-cms__h2">
        Seksjoner ({sections.length}) — strukturert
      </h2>
      <p className="muted">
        Legg til, rediger, flytt, skjul eller slett. Forhåndsvis før
        publisering. Tekniske mål ligger fortsatt i feltene over — ikke flatet
        til én tekstblokk.
      </p>
      {sections.map((section, index) => (
        <div
          key={section.id}
          className={
            section.hidden
              ? 'admin-cms__card admin-cms__card--hidden'
              : 'admin-cms__card'
          }
        >
          <div className="admin-cms__section-head">
            <strong>
              {index + 1}. {lt(section.title, locale) || section.kind}
            </strong>
            {section.hidden && <span className="admin-badge">Skjult</span>}
          </div>
          <label className="admin-field">
            <span>Type</span>
            <select
              value={section.kind}
              onChange={(e) =>
                setSections(
                  sections.map((s, j) =>
                    j === index
                      ? { ...s, kind: e.target.value as PatternSectionKind }
                      : s,
                  ),
                )
              }
            >
              {PATTERN_SECTION_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <BilingualTextInput
            label="Seksjonstittel"
            value={section.title}
            lang={lang}
            onChange={(titleNext) =>
              setSections(
                sections.map((s, j) =>
                  j === index ? { ...s, title: titleNext } : s,
                ),
              )
            }
          />
          <BilingualTextInput
            label="Innhold"
            value={section.body}
            lang={lang}
            onChange={(body) =>
              setSections(
                sections.map((s, j) =>
                  j === index ? { ...s, body } : s,
                ),
              )
            }
            multiline
          />
          <label className="admin-field">
            <span>Radantall (valgfritt, for bokmerke)</span>
            <input
              type="number"
              value={section.rowCount ?? ''}
              onChange={(e) =>
                setSections(
                  sections.map((s, j) =>
                    j === index
                      ? {
                          ...s,
                          rowCount:
                            e.target.value === ''
                              ? undefined
                              : Number(e.target.value),
                        }
                      : s,
                  ),
                )
              }
            />
          </label>
          <ImageUploadField
            label="Seksjonsbilde"
            value={section.imageUrl ?? null}
            patternId={patternId}
            kind="section"
            onChange={(imageUrl) =>
              setSections(
                sections.map((s, j) =>
                  j === index ? { ...s, imageUrl } : s,
                ),
              )
            }
          />
          <label className="admin-field">
            <span>
              <input
                type="checkbox"
                checked={Boolean(section.defaultOpen)}
                onChange={(e) =>
                  setSections(
                    sections.map((s, j) =>
                      j === index
                        ? { ...s, defaultOpen: e.target.checked }
                        : s,
                    ),
                  )
                }
              />{' '}
              Åpen som standard i leser
            </span>
          </label>
          <label className="admin-field">
            <span>
              <input
                type="checkbox"
                checked={Boolean(section.hidden)}
                onChange={(e) =>
                  setSections(
                    sections.map((s, j) =>
                      j === index ? { ...s, hidden: e.target.checked } : s,
                    ),
                  )
                }
              />{' '}
              Skjul i leser / forhåndsvisning
            </span>
          </label>
          <div className="admin-actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => moveSection(index, -1)}
              disabled={index === 0}
            >
              Opp
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => moveSection(index, 1)}
              disabled={index === sections.length - 1}
            >
              Ned
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() =>
                setPreviewSectionId(
                  previewSectionId === section.id ? null : section.id,
                )
              }
            >
              Forhåndsvis
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() =>
                setSections(renumber(sections.filter((_, j) => j !== index)))
              }
            >
              Slett seksjon
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="btn btn--sage" onClick={addSection}>
        + Legg til seksjon
      </button>

      {previewSection && (
        <aside className="admin-cms__preview" aria-live="polite">
          <h3>Forhåndsvisning · {lt(previewSection.title, locale)}</h3>
          {previewSection.hidden && (
            <p className="muted">Denne seksjonen er skjult for leseren.</p>
          )}
          {previewSection.imageUrl && (
            <img
              src={previewSection.imageUrl}
              alt=""
              className="admin-cms__preview-img"
            />
          )}
          <p style={{ whiteSpace: 'pre-wrap' }}>
            {lt(previewSection.body, locale)}
          </p>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setPreviewSectionId(null)}
          >
            Lukk forhåndsvisning
          </button>
        </aside>
      )}

      {error && <p className="account-error">{error}</p>}
      {savedMsg && (
        <p className="admin-cms__saved" role="status">
          {savedMsg}
        </p>
      )}

      <div className="admin-actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={saving}
          onClick={() => void save()}
        >
          {saving ? t('common.loading') : t('common.save')}
        </button>
        <Link to="/admin/oppskrifter" className="btn btn--ghost">
          {t('common.cancel')}
        </Link>
      </div>
    </div>
  )
}
