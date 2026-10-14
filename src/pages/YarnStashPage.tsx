import { useEffect, useMemo, useState } from 'react'
import { useLocale } from '../context/LocaleContext'
import { usePatterns } from '../context/PatternsContext'
import { useStash } from '../context/StashContext'
import { trackEvent } from '../lib/analytics'
import { lt } from '../lib/localeText'
import type { QuantityUnit, YarnWeight } from '../types/models'
import './YarnStashPage.css'

type Mode = 'list' | 'known' | 'unknown'

export function YarnStashPage() {
  const { locale, t } = useLocale()
  const { yarns, getYarn } = usePatterns()
  const { items, addItem, removeItem } = useStash()
  const [mode, setMode] = useState<Mode>('list')
  const [query, setQuery] = useState('')
  const [selectedYarnId, setSelectedYarnId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(2)
  const [unit, setUnit] = useState<QuantityUnit>('skeins')
  const [colourName, setColourName] = useState('')
  const [customBrand, setCustomBrand] = useState('')
  const [customName, setCustomName] = useState('')
  const [weight, setWeight] = useState<YarnWeight>('worsted')
  const [metresTotal, setMetresTotal] = useState<number | ''>('')
  const [gramsTotal, setGramsTotal] = useState<number | ''>('')
  const [notes, setNotes] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return yarns
    return yarns.filter(
      (y) =>
        y.brand.toLowerCase().includes(q) ||
        lt(y.name, locale).toLowerCase().includes(q),
    )
  }, [yarns, query, locale])

  useEffect(() => {
    trackEvent('stash_viewed', {
      source: 'stash',
      properties: {
        // Count only — never stash contents
        item_count: items.length,
      },
    })
  }, [items.length])

  function resetForm() {
    setSelectedYarnId(null)
    setQuantity(2)
    setUnit('skeins')
    setColourName('')
    setCustomBrand('')
    setCustomName('')
    setWeight('worsted')
    setMetresTotal('')
    setGramsTotal('')
    setNotes('')
    setMode('list')
  }

  async function saveKnown() {
    if (!selectedYarnId) return
    const yarn = getYarn(selectedYarnId)
    await addItem({
      yarnId: selectedYarnId,
      quantity,
      unit,
      colourName: colourName || undefined,
      metresTotal:
        metresTotal === ''
          ? yarn && unit === 'skeins'
            ? quantity * yarn.metresPerSkein
            : undefined
          : Number(metresTotal),
      gramsTotal:
        gramsTotal === ''
          ? yarn && unit === 'skeins'
            ? quantity * yarn.gramsPerSkein
            : undefined
          : Number(gramsTotal),
      weight: yarn?.weight,
      notes: notes || undefined,
    })
    trackEvent('stash_item_added', {
      source: 'stash',
      properties: {
        known_yarn: true,
        unit,
        weight: yarn?.weight ?? null,
      },
    })
    resetForm()
  }

  async function saveUnknown() {
    if (!customName.trim()) return
    await addItem({
      yarnId: null,
      customBrand: customBrand || undefined,
      customName: customName.trim(),
      weight,
      quantity,
      unit,
      colourName: colourName || undefined,
      metresTotal: metresTotal === '' ? undefined : Number(metresTotal),
      gramsTotal: gramsTotal === '' ? undefined : Number(gramsTotal),
      notes: notes || undefined,
    })
    trackEvent('stash_item_added', {
      source: 'stash',
      properties: {
        known_yarn: false,
        unit,
        weight,
        // Never customName / brand / colour / notes
      },
    })
    resetForm()
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>{t('stash.title')}</h1>
        <p>{t('stash.lead')}</p>
      </header>

      {mode === 'list' && (
        <>
          <div className="stash-actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setMode('known')}
            >
              {t('stash.addKnown')}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setMode('unknown')}
            >
              {t('stash.addUnknown')}
            </button>
          </div>

          {items.length === 0 ? (
            <p className="empty">{t('stash.empty')}</p>
          ) : (
            <ul className="stash-list">
              {items.map((item) => {
                const yarn = item.yarnId ? getYarn(item.yarnId) : undefined
                const name = yarn
                  ? `${yarn.brand} ${lt(yarn.name, locale)}`
                  : `${item.customBrand ?? ''} ${item.customName ?? ''}`.trim()
                return (
                  <li key={item.id} className="stash-item">
                    <div
                      className="stash-item__swatch"
                      style={{
                        background: item.colourHex || '#d9cfc0',
                      }}
                    />
                    <div className="stash-item__body">
                      <strong>{name}</strong>
                      <p>
                        {item.quantity}{' '}
                        {t(`stash.unit.${item.unit}` as const)}
                        {item.colourName ? ` · ${item.colourName}` : ''}
                        {item.metresTotal != null
                          ? ` · ${Math.round(item.metresTotal)} m`
                          : ''}
                        {item.gramsTotal != null
                          ? ` · ${Math.round(item.gramsTotal)} g`
                          : ''}
                      </p>
                      {item.notes && <p className="muted">{item.notes}</p>}
                    </div>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => {
                        void removeItem(item.id)
                        trackEvent('stash_item_removed', {
                          source: 'stash',
                          properties: { known_yarn: Boolean(item.yarnId) },
                        })
                      }}
                    >
                      {t('stash.remove')}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}

      {(mode === 'known' || mode === 'unknown') && (
        <form
          className="stash-form stack"
          onSubmit={(e) => {
            e.preventDefault()
            void (mode === 'known' ? saveKnown() : saveUnknown())
          }}
        >
          {mode === 'known' ? (
            <>
              <label className="field">
                <span>{t('stash.search')}</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('stash.search')}
                />
              </label>
              <div className="yarn-pick-list">
                {filtered.map((y) => (
                  <button
                    key={y.id}
                    type="button"
                    className={
                      selectedYarnId === y.id
                        ? 'yarn-pick yarn-pick--active'
                        : 'yarn-pick'
                    }
                    onClick={() => setSelectedYarnId(y.id)}
                  >
                    <strong>
                      {y.brand} {lt(y.name, locale)}
                    </strong>
                    <span>
                      {y.weight} · {y.metresPerSkein} m / {y.gramsPerSkein} g
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <label className="field">
                <span>Brand</span>
                <input
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                />
              </label>
              <label className="field">
                <span>Name</span>
                <input
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </label>
              <label className="field">
                <span>Weight</span>
                <select
                  value={weight}
                  onChange={(e) => setWeight(e.target.value as YarnWeight)}
                >
                  {(
                    [
                      'lace',
                      'fingering',
                      'sport',
                      'dk',
                      'worsted',
                      'bulky',
                      'super_bulky',
                    ] as YarnWeight[]
                  ).map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          <div className="stash-form__row">
            <label className="field">
              <span>{t('stash.quantity')}</span>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </label>
            <label className="field">
              <span>Unit</span>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as QuantityUnit)}
              >
                <option value="skeins">{t('stash.unit.skeins')}</option>
                <option value="g">{t('stash.unit.g')}</option>
                <option value="m">{t('stash.unit.m')}</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>{t('stash.colour')}</span>
            <input
              value={colourName}
              onChange={(e) => setColourName(e.target.value)}
            />
          </label>

          <div className="stash-form__row">
            <label className="field">
              <span>Metres (optional)</span>
              <input
                type="number"
                value={metresTotal}
                onChange={(e) =>
                  setMetresTotal(
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
              />
            </label>
            <label className="field">
              <span>Grams (optional)</span>
              <input
                type="number"
                value={gramsTotal}
                onChange={(e) =>
                  setGramsTotal(
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
              />
            </label>
          </div>

          <label className="field">
            <span>{t('stash.notes')}</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          <button type="submit" className="btn btn--primary btn--block">
            {t('stash.save')}
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--block"
            onClick={resetForm}
          >
            {t('common.cancel')}
          </button>
        </form>
      )}
    </main>
  )
}
