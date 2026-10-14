import { useLocale } from '../context/LocaleContext'
import {
  formatQuantitySeries,
  formatSizeSeries,
  groupHeldTogether,
  resolveGramsBySize,
  yarnDisplayName,
} from '../lib/yarnQuantity'
import { lt } from '../lib/localeText'
import type { KnittingPattern } from '../types/models'
import './PatternTechOverview.css'

type Props = { pattern: KnittingPattern }

function primaryMeasure(pattern: KnittingPattern, locale: 'no' | 'en') {
  const sizes = pattern.sizes
  if (sizes.some((s) => s.chestCm != null)) {
    return {
      label: locale === 'no' ? 'Ferdig brystvidde' : 'Finished chest',
      series: formatQuantitySeries(
        sizes.map((s) => s.chestCm ?? 0),
        'cm',
      ),
    }
  }
  if (sizes.some((s) => s.finishedCircumferenceCm != null)) {
    return {
      label: locale === 'no' ? 'Ferdig omkrets' : 'Finished circumference',
      series: formatQuantitySeries(
        sizes.map((s) => s.finishedCircumferenceCm ?? 0),
        'cm',
      ),
    }
  }
  if (sizes.some((s) => s.headCircumferenceMinCm != null)) {
    return {
      label: locale === 'no' ? 'Hodeomkrets' : 'Head circumference',
      series: sizes
        .map((s, i) => {
          const v = `${s.headCircumferenceMinCm}–${s.headCircumferenceMaxCm}`
          return i % 2 === 1 ? `(${v})` : v
        })
        .join(' '),
    }
  }
  if (sizes.some((s) => s.handCircumferenceCm != null)) {
    return {
      label: locale === 'no' ? 'Håndomkrets' : 'Hand circumference',
      series: formatQuantitySeries(
        sizes.map((s) => s.handCircumferenceCm ?? 0),
        'cm',
      ),
    }
  }
  if (sizes.some((s) => s.footLengthCm != null)) {
    return {
      label: locale === 'no' ? 'Fotlengde' : 'Foot length',
      series: formatQuantitySeries(
        sizes.map((s) => s.footLengthCm ?? 0),
        'cm',
      ),
    }
  }
  return null
}

/** Compact professional technical block at top of product / reader. */
export function PatternTechOverview({ pattern }: Props) {
  const { locale, t } = useLocale()
  const sizeSeries = formatSizeSeries(pattern.sizes, locale)
  const primary = primaryMeasure(pattern, locale)
  const hasLength = pattern.sizes.some((s) => s.lengthCm != null)
  const groups = groupHeldTogether(pattern.yarnRequirements)

  return (
    <section className="tech-overview" aria-label={t('pattern.techOverview')}>
      <h2>{t('pattern.techOverview')}</h2>
      <dl className="tech-overview__dl">
        <div>
          <dt>{t('pattern.sizes')}</dt>
          <dd>{sizeSeries}</dd>
        </div>
        {primary && (
          <div>
            <dt>{primary.label}</dt>
            <dd>{primary.series}</dd>
          </div>
        )}
        {hasLength && (
          <div>
            <dt>{t('pattern.length')}</dt>
            <dd>
              {formatQuantitySeries(
                pattern.sizes.map((s) => s.lengthCm ?? 0),
                'cm',
              )}
            </dd>
          </div>
        )}
        <div>
          <dt>{t('pattern.gauge')}</dt>
          <dd>
            {pattern.gaugeStitches} m
            {pattern.gaugeRows > 0 ? ` × ${pattern.gaugeRows} r` : ''} ={' '}
            {pattern.gaugePerCm} × {pattern.gaugePerCm} cm
          </dd>
        </div>
        <div>
          <dt>{t('pattern.needlesSuggested')}</dt>
          <dd>
            {pattern.needles
              .map((n) => {
                const note = lt(n.notes, locale)
                return note ? `${n.mm} mm (${note})` : `${n.mm} mm`
              })
              .join(' · ')}
          </dd>
        </div>
        <div>
          <dt>{t('pattern.materials')}</dt>
          <dd>
            <ul className="tech-overview__yarns">
              {groups.map((g) => (
                <li key={g.groupId ?? g.yarns[0]?.id ?? g.yarns[0]?.label.no}>
                  {g.groupId && g.yarns.length > 1 && (
                    <strong className="tech-overview__held">
                      {t('pattern.heldTogether')}
                    </strong>
                  )}
                  {g.yarns.map((req) => {
                    const grams = resolveGramsBySize(req)
                    return (
                      <span key={req.id ?? yarnDisplayName(req, locale)} className="tech-overview__yarn-line">
                        {yarnDisplayName(req, locale)}
                        {req.gramsPerSkein && req.metresPerSkein
                          ? ` · ${req.gramsPerSkein} g / ${req.metresPerSkein} m`
                          : ''}
                        {': '}
                        {formatQuantitySeries(grams, 'g')}
                      </span>
                    )
                  })}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
    </section>
  )
}
