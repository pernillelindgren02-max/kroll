import { useEffect, useMemo } from 'react'
import { PatternCard } from '../components/PatternCard'
import { useLocale } from '../context/LocaleContext'
import { useOwnership } from '../context/OwnershipContext'
import { usePatterns } from '../context/PatternsContext'
import { useStash } from '../context/StashContext'
import { getBrand } from '../i18n/brand'
import {
  matchStateFromStrength,
  trackEvent,
} from '../lib/analytics'
import { matchPatternToStash } from '../lib/yarnMatch'
import './ExplorePage.css'

export function ExplorePage() {
  const { locale, t } = useLocale()
  const { publishedPatterns, yarnMap } = usePatterns()
  const { owns } = useOwnership()
  const { items } = useStash()
  const brand = getBrand(locale)

  const matches = useMemo(() => {
    const map = new Map<string, ReturnType<typeof matchPatternToStash>>()
    for (const p of publishedPatterns) {
      map.set(p.id, matchPatternToStash(p, items, yarnMap))
    }
    return map
  }, [publishedPatterns, items, yarnMap])

  useEffect(() => {
    trackEvent('explore_viewed', {
      source: 'explore',
      properties: {
        result_count: publishedPatterns.length,
        has_stash: items.length > 0,
      },
    })
  }, [publishedPatterns.length, items.length])

  useEffect(() => {
    if (!items.length) return
    for (const p of publishedPatterns.slice(0, 24)) {
      const m = matches.get(p.id)
      trackEvent('yarn_match_state', {
        patternId: p.id,
        source: 'explore',
        properties: {
          match_state: matchStateFromStrength(m?.strength, {
            hasStash: true,
          }),
          is_demo: Boolean(p.demoPattern),
        },
      })
    }
  }, [items.length, publishedPatterns, matches])

  return (
    <main className="page">
      <header className="page-header explore-hero">
        <p className="page-header__brand">{brand.name}</p>
        <h1>{t('explore.title')}</h1>
        <p>{t('brand.tagline')}</p>
      </header>

      {publishedPatterns.length === 0 ? (
        <p className="empty">{t('explore.empty')}</p>
      ) : (
        <div className="pattern-grid">
          {publishedPatterns.map((pattern) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              owned={owns(pattern.id)}
              match={items.length ? matches.get(pattern.id) : null}
              onOpen={() =>
                trackEvent('explore_pattern_click', {
                  patternId: pattern.id,
                  source: 'explore',
                  properties: {
                    is_demo: Boolean(pattern.demoPattern),
                    difficulty: pattern.difficulty,
                  },
                })
              }
            />
          ))}
        </div>
      )}
    </main>
  )
}
