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
import { fetchProgress, upsertProgressRemote } from '../lib/krollApi'
import { mergeProgress } from '../lib/mergeUserData'
import { guestUserId, storageGet, storageSet } from '../lib/storage'
import type { PatternProgress } from '../types/models'

type ProgressContextValue = {
  loading: boolean
  getProgress: (patternId: string) => PatternProgress | undefined
  saveProgress: (
    patternId: string,
    patch: Partial<
      Pick<PatternProgress, 'sectionId' | 'rowNumber' | 'stepIndex'>
    >,
  ) => Promise<void>
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

function keyFor(userId: string) {
  return `progress:${userId}`
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user, userId } = useAuth()
  const signedIn = Boolean(user)
  const [rows, setRows] = useState<PatternProgress[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    if (!signedIn) {
      setRows(storageGet(keyFor(userId), []))
      setLoading(false)
      return
    }

    const guestLocal = storageGet<PatternProgress[]>(
      keyFor(guestUserId()),
      [],
    )
    const authLocal = storageGet<PatternProgress[]>(keyFor(userId), [])
    const localUnion = mergeProgress(guestLocal, authLocal, userId).merged
    const remote = (await fetchProgress(userId)) ?? []
    const { merged, toUpload } = mergeProgress(localUnion, remote, userId)

    for (const row of toUpload) {
      const err = await upsertProgressRemote(row)
      if (err) console.warn('[Krøll] progress merge upload:', err)
    }

    setRows(merged)
    storageSet(keyFor(userId), merged)
    setLoading(false)
  }, [signedIn, userId])

  useEffect(() => {
    void load()
  }, [load])

  const value = useMemo<ProgressContextValue>(
    () => ({
      loading,
      getProgress(patternId) {
        return rows.find((r) => r.patternId === patternId)
      },
      async saveProgress(patternId, patch) {
        const existing = rows.find((r) => r.patternId === patternId)
        const nextRow: PatternProgress = {
          userId,
          patternId,
          sectionId: patch.sectionId ?? existing?.sectionId ?? null,
          rowNumber: patch.rowNumber ?? existing?.rowNumber ?? null,
          stepIndex: patch.stepIndex ?? existing?.stepIndex ?? null,
          updatedAt: new Date().toISOString(),
        }
        const next = [
          ...rows.filter((r) => r.patternId !== patternId),
          nextRow,
        ]
        setRows(next)
        storageSet(keyFor(userId), next)

        if (signedIn) {
          const err = await upsertProgressRemote(nextRow)
          if (err) console.warn('[Krøll] progress save:', err)
        }
      },
    }),
    [rows, userId, signedIn, loading],
  )

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider')
  return ctx
}
