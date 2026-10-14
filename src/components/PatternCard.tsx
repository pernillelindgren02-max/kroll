import { Link } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext'
import type { MessageKey } from '../i18n/messages'
import { lt } from '../lib/localeText'
import type { KnittingPattern } from '../types/models'
import type { YarnMatchResult } from '../lib/yarnMatch'
import './PatternCard.css'

const DIFFICULTY_KEYS: Record<
  KnittingPattern['difficulty'],
  MessageKey
> = {
  beginner: 'pattern.difficulty.beginner',
  easy: 'pattern.difficulty.easy',
  intermediate: 'pattern.difficulty.intermediate',
  advanced: 'pattern.difficulty.advanced',
}

type Props = {
  pattern: KnittingPattern
  owned?: boolean
  match?: YarnMatchResult | null
  onOpen?: () => void
}

export function PatternCard({ pattern, owned, match, onOpen }: Props) {
  const { locale, t } = useLocale()

  return (
    <article className="pattern-card">
      <Link
        to={`/oppskrift/${pattern.id}`}
        className="pattern-card__link"
        onClick={() => onOpen?.()}
      >
        <div
          className="pattern-card__cover"
          style={
            pattern.coverImageUrl
              ? {
                  backgroundImage: `url(${pattern.coverImageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : { background: coverGradient(pattern.id) }
          }
          aria-hidden
        />
        <div className="pattern-card__body">
          <p className="pattern-card__designer">{pattern.designer}</p>
          <h2>{lt(pattern.title, locale)}</h2>
          <p className="pattern-card__tagline">{lt(pattern.tagline, locale)}</p>
          <div className="pattern-card__meta">
            <span>
              {t(DIFFICULTY_KEYS[pattern.difficulty])}
              {pattern.demoPattern ? ' · Demo' : ''}
            </span>
            {owned ? (
              <span className="pattern-card__owned">{t('explore.owned')}</span>
            ) : pattern.demoPattern || pattern.priceNok === 0 ? (
              <span className="pattern-card__owned">Gratis</span>
            ) : (
              <span>{t('explore.price', { price: pattern.priceNok })}</span>
            )}
          </div>
          {match && match.strength !== 'none' && (
            <p
              className={
                match.strength === 'strong'
                  ? 'pattern-card__match pattern-card__match--strong'
                  : 'pattern-card__match pattern-card__match--soft'
              }
              title={match.reasons.join(' · ')}
            >
              {match.strength === 'strong'
                ? t('pattern.match')
                : t('pattern.matchSoft')}
            </p>
          )}
        </div>
      </Link>
    </article>
  )
}

function coverGradient(id: string): string {
  const hues = [
    'linear-gradient(145deg, #ded0bd 0%, #ad360b 95%)',
    'linear-gradient(145deg, #a8ad86 0%, #7b700b 95%)',
    'linear-gradient(145deg, #f5ecdd 0%, #caaa4b 95%)',
    'linear-gradient(145deg, #e68783 0%, #5e3a52 95%)',
  ]
  let n = 0
  for (let i = 0; i < id.length; i++) n += id.charCodeAt(i)
  return hues[n % hues.length]
}
