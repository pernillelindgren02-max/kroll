import { useState } from 'react'
import {
  BilingualTextInput,
  LangTabs,
  type ContentLangTab,
} from '../../components/admin/BilingualFields'
import { useLocale } from '../../context/LocaleContext'
import { usePatterns } from '../../context/PatternsContext'
import { lt } from '../../lib/localeText'
import type { CatalogYarn, LocaleText, YarnWeight } from '../../types/models'

const emptyText = (): LocaleText => ({ no: '', en: '' })

export function AdminYarnsPage() {
  const { locale, t } = useLocale()
  const { yarns, upsertYarn, removeYarn } = usePatterns()
  const [lang, setLang] = useState<ContentLangTab>('no')
  const [brand, setBrand] = useState('')
  const [name, setName] = useState<LocaleText>(emptyText())
  const [weight, setWeight] = useState<YarnWeight>('worsted')
  const [metres, setMetres] = useState(100)
  const [grams, setGrams] = useState(50)

  async function save() {
    if (!brand.trim() || !name.no.trim()) return
    const yarn: CatalogYarn = {
      id: `yarn-${crypto.randomUUID().slice(0, 8)}`,
      brand: brand.trim(),
      name,
      weight,
      metresPerSkein: metres,
      gramsPerSkein: grams,
      fibre: { no: '', en: '' },
      suggestedNeedleMm: [4],
      colourways: [],
    }
    await upsertYarn(yarn)
    setBrand('')
    setName(emptyText())
  }

  return (
    <div>
      <h1>{t('admin.yarns')}</h1>

      <div className="admin-card-list admin-card-list--mobile-only">
        {yarns.map((y) => (
          <article key={y.id} className="admin-card-list__item">
            <h2 className="admin-card-list__title">
              {y.brand} — {lt(y.name, locale)}
            </h2>
            <p className="admin-card-list__meta">
              <span>{y.weight}</span>
              <span>
                {y.metresPerSkein} m / {y.gramsPerSkein} g
              </span>
            </p>
            <div className="admin-card-list__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => void removeYarn(y.id)}
              >
                {t('common.delete')}
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="admin-table-wrap admin-table-wrap--desktop">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Name</th>
              <th>Weight</th>
              <th>m / g</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {yarns.map((y) => (
              <tr key={y.id}>
                <td>{y.brand}</td>
                <td>{lt(y.name, locale)}</td>
                <td>{y.weight}</td>
                <td>
                  {y.metresPerSkein} / {y.gramsPerSkein}
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => void removeYarn(y.id)}
                  >
                    {t('common.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: '1.5rem', fontSize: '1.35rem' }}>Add yarn</h2>
      <LangTabs value={lang} onChange={setLang} />
      <label className="admin-field">
        <span>Brand</span>
        <input value={brand} onChange={(e) => setBrand(e.target.value)} />
      </label>
      <BilingualTextInput
        label="Name"
        value={name}
        lang={lang}
        onChange={setName}
      />
      <label className="admin-field">
        <span>Weight</span>
        <select
          value={weight}
          onChange={(e) => setWeight(e.target.value as YarnWeight)}
        >
          <option value="fingering">fingering</option>
          <option value="sport">sport</option>
          <option value="dk">dk</option>
          <option value="worsted">worsted</option>
          <option value="bulky">bulky</option>
        </select>
      </label>
      <label className="admin-field">
        <span>Metres / skein</span>
        <input
          type="number"
          value={metres}
          onChange={(e) => setMetres(Number(e.target.value))}
        />
      </label>
      <label className="admin-field">
        <span>Grams / skein</span>
        <input
          type="number"
          value={grams}
          onChange={(e) => setGrams(Number(e.target.value))}
        />
      </label>
      <button
        type="button"
        className="btn btn--primary"
        onClick={() => void save()}
      >
        {t('common.save')}
      </button>
    </div>
  )
}
