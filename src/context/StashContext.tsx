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
import {
  deleteStashRemote,
  fetchStash,
  upsertStashRemote,
} from '../lib/krollApi'
import { mergeStash } from '../lib/mergeUserData'
import { guestUserId, storageGet, storageSet } from '../lib/storage'
import type { UserYarnStashItem } from '../types/models'

type StashContextValue = {
  items: UserYarnStashItem[]
  loading: boolean
  addItem: (
    item: Omit<UserYarnStashItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  ) => Promise<void>
  removeItem: (id: string) => Promise<void>
  updateItem: (id: string, patch: Partial<UserYarnStashItem>) => Promise<void>
}

const StashContext = createContext<StashContextValue | null>(null)

function keyFor(userId: string) {
  return `stash:${userId}`
}

export function StashProvider({ children }: { children: ReactNode }) {
  const { user, userId } = useAuth()
  const signedIn = Boolean(user)
  const [items, setItems] = useState<UserYarnStashItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    if (!signedIn) {
      setItems(storageGet(keyFor(userId), []))
      setLoading(false)
      return
    }

    const guestLocal = storageGet<UserYarnStashItem[]>(
      keyFor(guestUserId()),
      [],
    )
    const authLocal = storageGet<UserYarnStashItem[]>(keyFor(userId), [])
    const localUnion = mergeStash(guestLocal, authLocal, userId).merged
    const remote = (await fetchStash(userId)) ?? []
    const { merged, toUpload } = mergeStash(localUnion, remote, userId)

    for (const row of toUpload) {
      const err = await upsertStashRemote(row)
      if (err) console.warn('[Krøll] stash merge upload:', err)
    }

    setItems(merged)
    storageSet(keyFor(userId), merged)
    setLoading(false)
  }, [signedIn, userId])

  useEffect(() => {
    void load()
  }, [load])

  const value = useMemo<StashContextValue>(
    () => ({
      items,
      loading,
      async addItem(partial) {
        const now = new Date().toISOString()
        const row: UserYarnStashItem = {
          ...partial,
          id: crypto.randomUUID(),
          userId,
          createdAt: now,
          updatedAt: now,
        }
        const next = [...items, row]
        setItems(next)
        storageSet(keyFor(userId), next)
        if (signedIn) {
          const err = await upsertStashRemote(row)
          if (err) console.warn('[Krøll] stash save:', err)
        }
      },
      async removeItem(id) {
        const next = items.filter((i) => i.id !== id)
        setItems(next)
        storageSet(keyFor(userId), next)
        if (signedIn) {
          const err = await deleteStashRemote(id)
          if (err) console.warn('[Krøll] stash delete:', err)
        }
      },
      async updateItem(id, patch) {
        const next = items.map((i) =>
          i.id === id
            ? { ...i, ...patch, updatedAt: new Date().toISOString() }
            : i,
        )
        setItems(next)
        storageSet(keyFor(userId), next)
        const row = next.find((i) => i.id === id)
        if (signedIn && row) {
          const err = await upsertStashRemote(row)
          if (err) console.warn('[Krøll] stash update:', err)
        }
      },
    }),
    [items, userId, signedIn, loading],
  )

  return (
    <StashContext.Provider value={value}>{children}</StashContext.Provider>
  )
}

export function useStash() {
  const ctx = useContext(StashContext)
  if (!ctx) throw new Error('useStash must be used within StashProvider')
  return ctx
}
