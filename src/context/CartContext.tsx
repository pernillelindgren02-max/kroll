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
import { guestUserId, storageGet, storageSet } from '../lib/storage'
import type { CartLine, KnittingPattern } from '../types/models'

type CartContextValue = {
  lines: CartLine[]
  count: number
  patterns: KnittingPattern[]
  totalNok: number
  has: (patternId: string) => boolean
  add: (patternId: string) => { ok: boolean; reason?: 'duplicate' | 'owned' | 'missing' }
  remove: (patternId: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function storageKey(userId: string) {
  return `cart:${userId}`
}

function loadLines(userId: string): CartLine[] {
  return storageGet<CartLine[]>(storageKey(userId), [])
}

function saveLines(userId: string, lines: CartLine[]) {
  storageSet(storageKey(userId), lines)
}

/** Merge guest + account carts by patternId (keep earliest addedAt). */
export function mergeCartLines(a: CartLine[], b: CartLine[]): CartLine[] {
  const map = new Map<string, CartLine>()
  for (const line of [...a, ...b]) {
    const prev = map.get(line.patternId)
    if (!prev || line.addedAt < prev.addedAt) map.set(line.patternId, line)
  }
  return [...map.values()].sort((x, y) => x.addedAt.localeCompare(y.addedAt))
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, userId } = useAuth()
  const { getPattern } = usePatterns()
  const signedIn = Boolean(user)
  const [lines, setLines] = useState<CartLine[]>(() => loadLines(userId))

  // Load + safe merge on identity change (guest → signed-in).
  useEffect(() => {
    if (!signedIn) {
      setLines(loadLines(userId))
      return
    }
    const guest = loadLines(guestUserId())
    const account = loadLines(userId)
    const merged = mergeCartLines(guest, account)
    setLines(merged)
    saveLines(userId, merged)
    // Guest cart kept intentionally — never delete on merge.
  }, [signedIn, userId])

  const persist = useCallback(
    (next: CartLine[]) => {
      setLines(next)
      saveLines(userId, next)
    },
    [userId],
  )

  const value = useMemo<CartContextValue>(() => {
    const patterns = lines
      .map((l) => getPattern(l.patternId))
      .filter((p): p is KnittingPattern => Boolean(p))
    const totalNok = patterns.reduce((sum, p) => sum + (p.demoPattern ? 0 : p.priceNok), 0)

    return {
      lines,
      count: lines.length,
      patterns,
      totalNok,
      has: (patternId) => lines.some((l) => l.patternId === patternId),
      add(patternId) {
        const pattern = getPattern(patternId)
        if (!pattern) return { ok: false, reason: 'missing' as const }
        if (lines.some((l) => l.patternId === patternId)) {
          return { ok: false, reason: 'duplicate' as const }
        }
        persist([
          ...lines,
          { patternId, addedAt: new Date().toISOString() },
        ])
        return { ok: true }
      },
      remove(patternId) {
        persist(lines.filter((l) => l.patternId !== patternId))
      },
      clear() {
        persist([])
      },
    }
  }, [lines, getPattern, persist])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
