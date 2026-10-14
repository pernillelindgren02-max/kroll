import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PatternTechOverview } from '../components/PatternTechOverview'
import { useLocale } from '../context/LocaleContext'
import { useOwnership } from '../context/OwnershipContext'
import { usePatterns } from '../context/PatternsContext'
import { useProgress } from '../context/ProgressContext'
import { trackEvent } from '../lib/analytics'
import { lt } from '../lib/localeText'
import './PatternReaderPage.css'

export function PatternReaderPage() {
  const { id = '' } = useParams()
  const { locale, t } = useLocale()
  const { getPattern, getSectionsFor } = usePatterns()
  const { owns } = useOwnership()
  const { getProgress, saveProgress } = useProgress()
  const pattern = getPattern(id)
  const sections = getSectionsFor(id).filter((s) => !s.hidden)
  const progress = getProgress(id)
  const [openIds, setOpenIds] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    for (const s of sections) {
      if (s.defaultOpen || s.id === progress?.sectionId) initial.add(s.id)
    }
    if (initial.size === 0 && sections[0]) initial.add(sections[0].id)
    return initial
  })
  const [rowNumber, setRowNumber] = useState(progress?.rowNumber ?? 1)
  const resumeRef = useRef<HTMLElement | null>(null)

  const owned = pattern ? owns(pattern.id) : false

  useEffect(() => {
    if (!pattern || !owned) return
    trackEvent('pattern_reader_opened', {
      patternId: pattern.id,
      source: 'reader',
      properties: { is_demo: Boolean(pattern.demoPattern) },
    })
    trackEvent('pattern_opened_owned', {
      patternId: pattern.id,
      source: 'reader',
      properties: { is_demo: Boolean(pattern.demoPattern) },
    })
  }, [pattern?.id, owned])

  useEffect(() => {
    if (!progress?.sectionId) return
    setOpenIds((prev) => new Set(prev).add(progress.sectionId!))
    const el = document.getElementById(`section-${progress.sectionId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [progress?.sectionId])

  const bookmarkable = useMemo(
    () =>
      new Set([
        'steps',
        'neck',
        'yoke',
        'raglan',
        'short_rows',
        'body',
        'sleeves',
        'hood',
        'cuffs',
        'cast_on',
        'stripes',
        'crown',
        'thumb',
        'heel',
        'toe',
        'ear_flap',
        'hand',
        'placket',
        'button_band',
      ]),
    [],
  )

  if (!pattern || (pattern.status !== 'published' && !pattern.demoPattern)) {
    return <Navigate to="/" replace />
  }

  if (!owned) {
    return <Navigate to={`/oppskrift/${pattern.id}`} replace />
  }

  const title = lt(pattern.title, locale)

  function toggle(sectionId: string) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  return (
    <main className="page reader">
      <Link to={`/oppskrift/${pattern.id}`} className="back-link">
        ← {title}
      </Link>

      <header className="reader__header">
        <h1>{title}</h1>
        {pattern.demoPattern && (
          <p className="demo-banner">Demo-oppskrift — ikke betalt produksjon</p>
        )}
        {progress?.sectionId && (
          <button
            type="button"
            className="btn btn--sage resume-pill"
            onClick={() => {
              resumeRef.current?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            {t('reader.resume')}
            {progress.rowNumber != null
              ? ` · ${t('reader.row', { row: progress.rowNumber })}`
              : ''}
            {` · ${lt(
              sections.find((s) => s.id === progress.sectionId)?.title ?? {
                no: '',
                en: '',
              },
              locale,
            )}`}
          </button>
        )}
      </header>

      <PatternTechOverview pattern={pattern} />

      <nav className="reader__toc" aria-label="Sections">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={
              openIds.has(section.id)
                ? 'reader__toc-btn reader__toc-btn--active'
                : 'reader__toc-btn'
            }
            onClick={() => {
              setOpenIds((prev) => new Set(prev).add(section.id))
              document
                .getElementById(`section-${section.id}`)
                ?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            {lt(section.title, locale)}
          </button>
        ))}
      </nav>

      <div className="reader__sections">
        {sections.map((section) => {
          const isOpen = openIds.has(section.id)
          const canBookmark = bookmarkable.has(section.kind)
          return (
            <section
              key={section.id}
              id={`section-${section.id}`}
              ref={
                section.id === progress?.sectionId ? resumeRef : undefined
              }
              className="reader__section"
            >
              <button
                type="button"
                className="reader__section-toggle"
                aria-expanded={isOpen}
                onClick={() => toggle(section.id)}
              >
                <h2>{lt(section.title, locale)}</h2>
                <span className="reader__chevron" aria-hidden>
                  {isOpen ? '−' : '+'}
                </span>
              </button>

              {isOpen && (
                <div className="reader__section-body">
                  {section.imageUrl && (
                    <img
                      src={section.imageUrl}
                      alt=""
                      className="reader__image"
                    />
                  )}
                  <div className="reader__body">
                    {lt(section.body, locale)
                      .split('\n')
                      .map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                  </div>

                  {canBookmark && (
                    <div className="reader__progress">
                      {section.rowCount != null && (
                        <label className="field">
                          <span>{t('reader.markRow')}</span>
                          <input
                            type="number"
                            min={1}
                            max={section.rowCount}
                            value={
                              progress?.sectionId === section.id
                                ? (progress.rowNumber ?? rowNumber)
                                : rowNumber
                            }
                            onChange={(e) =>
                              setRowNumber(Number(e.target.value) || 1)
                            }
                          />
                        </label>
                      )}
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => {
                          const row =
                            section.rowCount != null
                              ? rowNumber
                              : null
                          void saveProgress(pattern.id, {
                            sectionId: section.id,
                            rowNumber: row,
                            stepIndex: 0,
                          })
                        }}
                      >
                        {t('reader.bookmark')}
                      </button>
                    </div>
                  )}

                  {!canBookmark && (
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() =>
                        void saveProgress(pattern.id, {
                          sectionId: section.id,
                          rowNumber: null,
                          stepIndex: null,
                        })
                      }
                    >
                      {t('reader.bookmark')}
                    </button>
                  )}
                </div>
              )}
            </section>
          )
        })}
      </div>

      {pattern.abbreviations.length > 0 && (
        <section className="reader__section">
          <h2>{t('pattern.abbreviations')}</h2>
          <ul className="reader__abbr">
            {pattern.abbreviations.map((a) => (
              <li key={a.abbr}>
                <strong>{a.abbr}</strong> — {lt(a.meaning, locale)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
