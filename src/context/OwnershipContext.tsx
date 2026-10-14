import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import { usePatterns } from './PatternsContext'
import {
  fetchOwnership,
  upsertOwnershipRemote,
} from '../lib/krollApi'
import { isFreeClaimPattern } from '../lib/checkoutArchitecture'
import { mergeOwnership } from '../lib/mergeUserData'
import { guestUserId, storageGet, storageSet } from '../lib/storage'
import type { PatternOwnership } from '../types/models'

/**
 * Hybrid ownership:
 * - Anonymous / local demo → localStorage
 * - Signed in → Supabase `pattern_ownership`
 *
 * Paid Stripe ownership is granted ONLY by verified webhook (service role).
 * Client may claim free/demo patterns (price 0) for library testing.
 * Never trust a frontend "payment successful" flag for paid patterns.
 */

type OwnershipContextValue = {
  ownedIds: Set<string>
  ownerships: PatternOwnership[]
  loading: boolean
  owns: (patternId: string) => boolean
  getOwnership: (patternId: string) => PatternOwnership | undefined
  /** Free / demo library claim — never a paid Stripe path. */
  claimFreePattern: (
    patternId: string,
  ) => Promise<{ ok: boolean; error?: string }>
  /** Claim all free/demo ids; skips already owned and paid patterns. */
  claimFreePatterns: (
    patternIds: string[],
  ) => Promise<{ claimed: string[]; skipped: string[] }>
}

const OwnershipContext = createContext<OwnershipContextValue | null>(null)

function keyFor(userId: string) {
  return `ownership:${userId}`
}

export function OwnershipProvider({ children }: { children: ReactNode }) {
  const { user, userId } = useAuth()
  const { getPattern } = usePatterns()
  const signedIn = Boolean(user)
  const [ownerships, setOwnerships] = useState<PatternOwnership[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    if (!signedIn) {
      setOwnerships(storageGet<PatternOwnership[]>(keyFor(userId), []))
      setLoading(false)
      return
    }

    const guestKey = keyFor(guestUserId())
    const guestLocal = storageGet<PatternOwnership[]>(guestKey, [])
    const authLocal = storageGet<PatternOwnership[]>(keyFor(userId), [])
    const localUnion = mergeOwnership(guestLocal, authLocal, userId).merged

    const remote = (await fetchOwnership(userId)) ?? []
    const { merged, toUpload } = mergeOwnership(localUnion, remote, userId)

    for (const row of toUpload) {
      const err = await upsertOwnershipRemote(row)
      if (err) console.warn('[Krøll] ownership merge upload:', err)
    }

    setOwnerships(merged)
    storageSet(keyFor(userId), merged)
    setLoading(false)
  }, [signedIn, userId])

  useEffect(() => {
    void load()
  }, [load])

  const persistOwnerships = useCallback(
    async (next: PatternOwnership[], uploaded: PatternOwnership[]) => {
      setOwnerships(next)
      storageSet(keyFor(userId), next)
      if (signedIn) {
        for (const row of uploaded) {
          const err = await upsertOwnershipRemote(row)
          if (err) console.warn('[Krøll] ownership save:', err)
        }
      }
    },
    [userId, signedIn],
  )

  const value = useMemo<OwnershipContextValue>(() => {
    const ownedIds = new Set(ownerships.map((o) => o.patternId))
    return {
      ownedIds,
      ownerships,
      loading,
      owns: (patternId) => ownedIds.has(patternId),
      getOwnership: (patternId) =>
        ownerships.find((o) => o.patternId === patternId),
      async claimFreePattern(patternId) {
        if (ownedIds.has(patternId)) return { ok: true }
        const pattern = getPattern(patternId)
        if (!pattern) return { ok: false, error: 'Pattern not found' }
        if (!isFreeClaimPattern(pattern)) {
          return {
            ok: false,
            error:
              'Paid patterns require verified Stripe payment — cannot claim from the client.',
          }
        }
        const row: PatternOwnership = {
          userId,
          patternId,
          purchasedAt: new Date().toISOString(),
          purchaseKind: 'demo_claim',
          pricePaidNok: 0,
        }
        const next = [
          ...ownerships.filter((o) => o.patternId !== patternId),
          row,
        ]
        await persistOwnerships(next, [row])
        return { ok: true }
      },
      async claimFreePatterns(patternIds) {
        const claimed: string[] = []
        const skipped: string[] = []
        const newRows: PatternOwnership[] = []
        const already = new Set(ownedIds)
        for (const id of patternIds) {
          if (already.has(id)) {
            skipped.push(id)
            continue
          }
          const pattern = getPattern(id)
          if (!pattern || !isFreeClaimPattern(pattern)) {
            skipped.push(id)
            continue
          }
          const row: PatternOwnership = {
            userId,
            patternId: id,
            purchasedAt: new Date().toISOString(),
            purchaseKind: 'demo_claim',
            pricePaidNok: 0,
          }
          newRows.push(row)
          claimed.push(id)
          already.add(id)
        }
        if (newRows.length) {
          const map = new Map<string, PatternOwnership>()
          for (const o of [...ownerships, ...newRows]) map.set(o.patternId, o)
          await persistOwnerships([...map.values()], newRows)
        }
        return { claimed, skipped }
      },
    }
  }, [ownerships, loading, getPattern, persistOwnerships, userId])

  return (
    <OwnershipContext.Provider value={value}>
      {children}
    </OwnershipContext.Provider>
  )
}

export function useOwnership() {
  const ctx = useContext(OwnershipContext)
  if (!ctx) throw new Error('useOwnership must be used within OwnershipProvider')
  return ctx
}
