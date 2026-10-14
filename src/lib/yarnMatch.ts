import type {
  CatalogYarn,
  KnittingPattern,
  UserYarnStashItem,
  YarnRequirement,
  YarnWeight,
} from '../types/models'
import {
  resolveGramsBySize,
  resolveMetresBySize,
} from './yarnQuantity'

export type MatchStrength = 'strong' | 'soft' | 'none'

export type YarnMatchResult = {
  strength: MatchStrength
  reasons: string[]
  stashItemId: string | null
}

function stashMetres(item: UserYarnStashItem, catalog?: CatalogYarn | null): number {
  if (item.metresTotal != null) return item.metresTotal
  if (item.unit === 'm') return item.quantity
  if (item.unit === 'skeins' && catalog) {
    return item.quantity * catalog.metresPerSkein
  }
  if (item.unit === 'g' && catalog && catalog.gramsPerSkein > 0) {
    return (item.quantity / catalog.gramsPerSkein) * catalog.metresPerSkein
  }
  return 0
}

function stashGrams(item: UserYarnStashItem, catalog?: CatalogYarn | null): number {
  if (item.gramsTotal != null) return item.gramsTotal
  if (item.unit === 'g') return item.quantity
  if (item.unit === 'skeins' && catalog) {
    return item.quantity * catalog.gramsPerSkein
  }
  if (item.unit === 'm' && catalog && catalog.metresPerSkein > 0) {
    return (item.quantity / catalog.metresPerSkein) * catalog.gramsPerSkein
  }
  return 0
}

function itemWeight(
  item: UserYarnStashItem,
  catalog?: CatalogYarn | null,
): YarnWeight | undefined {
  return item.weight ?? catalog?.weight
}

/**
 * Match one requirement against one stash item.
 * Grams and metres are BOTH checked when known — never treat grams as
 * equivalent across different m/g (metres must also cover the pattern).
 */
function scoreRequirement(
  req: YarnRequirement,
  item: UserYarnStashItem,
  catalog: CatalogYarn | undefined,
): YarnMatchResult {
  const reasons: string[] = []
  let soft = false
  let fail = false

  const metres = stashMetres(item, catalog)
  const grams = stashGrams(item, catalog)
  const weight = itemWeight(item, catalog)
  const needGrams = Math.min(
    ...(resolveGramsBySize(req).length
      ? resolveGramsBySize(req)
      : [req.gramsMin ?? Infinity]),
  )
  const needMetres = Math.min(
    ...(resolveMetresBySize(req).length
      ? resolveMetresBySize(req)
      : [req.metresMin || Infinity]),
  )

  if (req.yarnId && item.yarnId && req.yarnId === item.yarnId) {
    reasons.push('Same catalog yarn')
  }

  if (req.weight && weight) {
    if (req.weight === weight) reasons.push(`Weight: ${weight}`)
    else {
      reasons.push(`Weight differs (${weight} vs ${req.weight})`)
      fail = true
    }
  } else if (req.weight && !weight) {
    reasons.push('Weight unknown — soft match')
    soft = true
  }

  const hasNeedGrams = Number.isFinite(needGrams)
  const hasNeedMetres = Number.isFinite(needMetres) && needMetres > 0

  if (hasNeedGrams) {
    if (grams > 0) {
      if (grams >= needGrams) {
        reasons.push(`${Math.round(grams)} g ≥ ${Math.round(needGrams)} g`)
      } else {
        reasons.push(`${Math.round(grams)} g < ${Math.round(needGrams)} g needed`)
        fail = true
      }
    } else {
      reasons.push('Grams unknown — soft match')
      soft = true
    }
  }

  if (hasNeedMetres) {
    if (metres > 0) {
      if (metres >= needMetres) {
        reasons.push(`${Math.round(metres)} m ≥ ${Math.round(needMetres)} m`)
      } else {
        reasons.push(
          `${Math.round(metres)} m < ${Math.round(needMetres)} m needed (m/g matters)`,
        )
        fail = true
      }
    } else {
      reasons.push('Metres unknown — soft match')
      soft = true
    }
  }

  // If only one of g/m is known on the requirement, soft-flag the gap.
  if (hasNeedGrams && !hasNeedMetres) {
    reasons.push('Pattern metres incomplete — soft')
    soft = true
  }
  if (hasNeedMetres && !hasNeedGrams) {
    reasons.push('Pattern grams incomplete — soft')
    soft = true
  }

  if (req.needleMm != null) {
    const needle = item.needleMm ?? catalog?.suggestedNeedleMm[0]
    if (needle != null) {
      if (Math.abs(needle - req.needleMm) <= 0.5) {
        reasons.push(`Needle ~${needle} mm`)
      } else {
        reasons.push(`Needle ${needle} mm vs ${req.needleMm} mm`)
        soft = true
      }
    } else {
      soft = true
    }
  }

  if (req.gaugeStitches != null) {
    const g = item.gaugeStitches ?? catalog?.gaugeStitches
    if (g != null) {
      if (Math.abs(g - req.gaugeStitches) <= 1) {
        reasons.push(`Gauge ~${g} sts`)
      } else {
        reasons.push(`Gauge ${g} vs ${req.gaugeStitches} sts`)
        soft = true
      }
    } else {
      soft = true
    }
  }

  if (fail) {
    return { strength: 'none', reasons, stashItemId: item.id }
  }
  if (soft) {
    return { strength: 'soft', reasons, stashItemId: item.id }
  }
  return { strength: 'strong', reasons, stashItemId: item.id }
}

/**
 * Explainable yarn → pattern matching on grams + metres.
 * Held-together yarns: each line is matched independently (user needs both).
 */
export function matchPatternToStash(
  pattern: KnittingPattern,
  stash: UserYarnStashItem[],
  catalogById: Map<string, CatalogYarn>,
): YarnMatchResult {
  if (pattern.yarnRequirements.length === 0 || stash.length === 0) {
    return {
      strength: 'none',
      reasons: ['No yarn requirements or empty stash'],
      stashItemId: null,
    }
  }

  const rank = { none: 0, soft: 1, strong: 2 } as const
  const perReq: YarnMatchResult[] = []

  for (const req of pattern.yarnRequirements) {
    let bestForReq: YarnMatchResult = {
      strength: 'none',
      reasons: [`No stash covers ${req.label.en || req.label.no}`],
      stashItemId: null,
    }
    for (const item of stash) {
      const catalog = item.yarnId ? catalogById.get(item.yarnId) : undefined
      const result = scoreRequirement(req, item, catalog)
      if (rank[result.strength] > rank[bestForReq.strength]) {
        bestForReq = result
      } else if (
        result.strength === bestForReq.strength &&
        result.reasons.length > bestForReq.reasons.length
      ) {
        bestForReq = result
      }
    }
    perReq.push(bestForReq)
  }

  // Overall = weakest requirement (all held-together / multi yarns must pass).
  let overall = perReq[0]
  for (const r of perReq) {
    if (rank[r.strength] < rank[overall.strength]) overall = r
  }
  return {
    strength: overall.strength,
    reasons: perReq.flatMap((r) => r.reasons),
    stashItemId: overall.stashItemId,
  }
}
