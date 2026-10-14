import { useLocale } from '../context/LocaleContext'
import { lt } from '../lib/localeText'
import type { KnittingPattern } from '../types/models'
import './PatternSizeGuide.css'

type Props = { pattern: KnittingPattern }

/** Structured size guide: ease, body ranges, finished measurements. */
export function PatternSizeGuide({ pattern }: Props) {
  const { locale, t } = useLocale()
  const sizes = pattern.sizes
  const showBustBody = sizes.some((s) => s.bodyBustMinCm != null)
  const showChest = sizes.some((s) => s.chestCm != null)
  const showLength = sizes.some((s) => s.lengthCm != null)
  const showSleeve = sizes.some((s) => s.sleeveLengthCm != null)
  const showHead = sizes.some((s) => s.headCircumferenceMinCm != null)
  const showFinished = sizes.some((s) => s.finishedCircumferenceCm != null)
  const showHand = sizes.some((s) => s.handCircumferenceCm != null)
  const showFoot = sizes.some((s) => s.footLengthCm != null)

  return (
    <section className="size-guide" aria-label={t('pattern.sizeGuide')}>
      <h2>{t('pattern.sizeGuide')}</h2>
      {(pattern.recommendedEaseMinCm != null ||
        pattern.recommendedEaseMaxCm != null) && (
        <p>
          {t('pattern.ease')}: {pattern.recommendedEaseMinCm ?? '—'}
          {pattern.recommendedEaseMaxCm != null
            ? `–${pattern.recommendedEaseMaxCm}`
            : ''}{' '}
          cm
        </p>
      )}
      <p className="muted">{t('pattern.sizeGuideLead')}</p>
      <div className="size-table-wrap">
        <table className="size-table">
          <thead>
            <tr>
              <th>{t('pattern.sizeCol')}</th>
              {showBustBody && <th>{t('pattern.bodyBust')}</th>}
              {showChest && <th>{t('pattern.chest')}</th>}
              {showLength && <th>{t('pattern.length')}</th>}
              {showSleeve && <th>{t('pattern.sleeve')}</th>}
              {showHead && <th>{t('pattern.head')}</th>}
              {showFinished && <th>{t('pattern.finished')}</th>}
              {showHand && <th>{t('pattern.hand')}</th>}
              {showFoot && <th>{t('pattern.foot')}</th>}
            </tr>
          </thead>
          <tbody>
            {sizes.map((s) => (
              <tr key={s.id}>
                <td>{lt(s.label, locale)}</td>
                {showBustBody && (
                  <td>
                    {s.bodyBustMinCm != null
                      ? `${s.bodyBustMinCm}–${s.bodyBustMaxCm}`
                      : '—'}
                  </td>
                )}
                {showChest && <td>{s.chestCm ?? '—'}</td>}
                {showLength && <td>{s.lengthCm ?? '—'}</td>}
                {showSleeve && <td>{s.sleeveLengthCm ?? '—'}</td>}
                {showHead && (
                  <td>
                    {s.headCircumferenceMinCm != null
                      ? `${s.headCircumferenceMinCm}–${s.headCircumferenceMaxCm}`
                      : '—'}
                  </td>
                )}
                {showFinished && <td>{s.finishedCircumferenceCm ?? '—'}</td>}
                {showHand && <td>{s.handCircumferenceCm ?? '—'}</td>}
                {showFoot && <td>{s.footLengthCm ?? '—'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted size-guide__caveat">{t('pattern.gaugeCaveat')}</p>
    </section>
  )
}
