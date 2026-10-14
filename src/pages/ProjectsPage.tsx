import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext'
import { useOwnership } from '../context/OwnershipContext'
import { usePatterns } from '../context/PatternsContext'
import { useProjects } from '../context/ProjectsContext'
import { useStash } from '../context/StashContext'
import { trackEvent } from '../lib/analytics'
import { lt } from '../lib/localeText'
import type { ProjectStatus } from '../types/models'
import './ProjectsPage.css'

export function ProjectsPage() {
  const { locale, t } = useLocale()
  const { projects, addProject, updateProject, removeProject } = useProjects()
  const { ownerships } = useOwnership()
  const { getPattern, getYarn } = usePatterns()
  const { items: stashItems } = useStash()
  const [creating, setCreating] = useState(false)
  const [patternId, setPatternId] = useState('')
  const [title, setTitle] = useState('')
  const [sizeId, setSizeId] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('planned')
  const [notes, setNotes] = useState('')
  const [stashItemIds, setStashItemIds] = useState<string[]>([])

  const ownedPatterns = ownerships
    .map((o) => getPattern(o.patternId))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))

  const selectedPattern = patternId ? getPattern(patternId) : undefined

  useEffect(() => {
    trackEvent('projects_viewed', {
      source: 'projects',
      properties: { result_count: projects.length },
    })
  }, [projects.length])

  function reset() {
    setCreating(false)
    setPatternId('')
    setTitle('')
    setSizeId('')
    setStatus('planned')
    setNotes('')
    setStashItemIds([])
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>{t('projects.title')}</h1>
        <p>{t('projects.lead')}</p>
      </header>

      {!creating && (
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={() => setCreating(true)}
          disabled={ownedPatterns.length === 0}
        >
          {t('projects.new')}
        </button>
      )}

      {creating && (
        <form
          className="project-form stack"
          onSubmit={(e) => {
            e.preventDefault()
            if (!patternId || !title.trim()) return
            void addProject({
              patternId,
              title: title.trim(),
              sizeId: sizeId || null,
              status,
              notes,
              stashItemIds,
            }).then(() => {
              trackEvent('project_created', {
                patternId,
                source: 'projects',
                properties: {
                  status,
                  // Never send notes / stash contents
                  has_size: Boolean(sizeId),
                  stash_link_count: stashItemIds.length,
                },
              })
              reset()
            })
          }}
        >
          <label className="field">
            <span>Pattern</span>
            <select
              required
              value={patternId}
              onChange={(e) => {
                const id = e.target.value
                setPatternId(id)
                const p = getPattern(id)
                if (p) setTitle(lt(p.title, locale))
              }}
            >
              <option value="">—</option>
              {ownedPatterns.map((p) => (
                <option key={p.id} value={p.id}>
                  {lt(p.title, locale)}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Title</span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          {selectedPattern && selectedPattern.sizes.length > 0 && (
            <label className="field">
              <span>{t('pattern.sizes')}</span>
              <select
                value={sizeId}
                onChange={(e) => setSizeId(e.target.value)}
              >
                <option value="">—</option>
                {selectedPattern.sizes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {lt(s.label, locale)}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="field">
            <span>Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            >
              <option value="planned">{t('projects.status.planned')}</option>
              <option value="in_progress">
                {t('projects.status.in_progress')}
              </option>
              <option value="finished">{t('projects.status.finished')}</option>
            </select>
          </label>

          {stashItems.length > 0 && (
            <fieldset className="stash-pick">
              <legend>{t('nav.stash')}</legend>
              {stashItems.map((item) => {
                const yarn = item.yarnId ? getYarn(item.yarnId) : undefined
                const label = yarn
                  ? `${yarn.brand} ${lt(yarn.name, locale)}`
                  : (item.customName ?? item.id)
                return (
                  <label key={item.id} className="stash-pick__row">
                    <input
                      type="checkbox"
                      checked={stashItemIds.includes(item.id)}
                      onChange={(e) => {
                        setStashItemIds((prev) =>
                          e.target.checked
                            ? [...prev, item.id]
                            : prev.filter((x) => x !== item.id),
                        )
                      }}
                    />
                    <span>{label}</span>
                  </label>
                )
              })}
            </fieldset>
          )}

          <label className="field">
            <span>{t('projects.notes')}</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          <button type="submit" className="btn btn--primary">
            {t('projects.save')}
          </button>
          <button type="button" className="btn btn--ghost" onClick={reset}>
            {t('common.cancel')}
          </button>
        </form>
      )}

      {projects.length === 0 && !creating ? (
        <p className="empty" style={{ marginTop: '1rem' }}>
          {ownedPatterns.length === 0 ? (
            <>
              {t('myPatterns.empty')}{' '}
              <Link to="/">{t('explore.title')}</Link>
            </>
          ) : (
            t('projects.empty')
          )}
        </p>
      ) : (
        <ul className="project-list">
          {projects.map((project) => {
            const pattern = getPattern(project.patternId)
            return (
              <li key={project.id} className="project-card">
                <div className="project-card__top">
                  <h2>{project.title}</h2>
                  <select
                    value={project.status}
                    onChange={(e) => {
                      const next = e.target.value as ProjectStatus
                      void updateProject(project.id, { status: next })
                      trackEvent('project_status_changed', {
                        patternId: project.patternId,
                        source: 'projects',
                        properties: { status: next },
                      })
                    }}
                    aria-label="Status"
                  >
                    <option value="planned">
                      {t('projects.status.planned')}
                    </option>
                    <option value="in_progress">
                      {t('projects.status.in_progress')}
                    </option>
                    <option value="finished">
                      {t('projects.status.finished')}
                    </option>
                  </select>
                </div>
                {pattern && (
                  <p className="muted">
                    {lt(pattern.title, locale)}
                    {project.sizeId
                      ? ` · ${lt(
                          pattern.sizes.find((s) => s.id === project.sizeId)
                            ?.label ?? { no: '', en: '' },
                          locale,
                        )}`
                      : ''}
                  </p>
                )}
                {project.notes && <p>{project.notes}</p>}
                <p className="project-card__dates muted">
                  {project.startedAt
                    ? `Start: ${project.startedAt.slice(0, 10)}`
                    : ''}
                  {project.finishedAt
                    ? ` · Done: ${project.finishedAt.slice(0, 10)}`
                    : ''}
                </p>
                <div className="project-card__actions">
                  {pattern && (
                    <Link
                      to={`/oppskrift/${pattern.id}/les`}
                      className="btn btn--sage"
                    >
                      {t('pattern.read')}
                    </Link>
                  )}
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => void removeProject(project.id)}
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
