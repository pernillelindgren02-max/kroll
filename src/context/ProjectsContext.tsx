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
  deleteProjectRemote,
  fetchProjects,
  upsertProjectRemote,
} from '../lib/krollApi'
import { mergeProjects } from '../lib/mergeUserData'
import { guestUserId, storageGet, storageSet } from '../lib/storage'
import type { KnittingProject, ProjectStatus } from '../types/models'

type ProjectsContextValue = {
  projects: KnittingProject[]
  loading: boolean
  addProject: (input: {
    patternId: string
    title: string
    sizeId?: string | null
    stashItemIds?: string[]
    status?: ProjectStatus
    notes?: string
  }) => Promise<void>
  updateProject: (
    id: string,
    patch: Partial<KnittingProject>,
  ) => Promise<void>
  removeProject: (id: string) => Promise<void>
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null)

function keyFor(userId: string) {
  return `projects:${userId}`
}

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const { user, userId } = useAuth()
  const signedIn = Boolean(user)
  const [projects, setProjects] = useState<KnittingProject[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    if (!signedIn) {
      setProjects(storageGet(keyFor(userId), []))
      setLoading(false)
      return
    }

    const guestLocal = storageGet<KnittingProject[]>(
      keyFor(guestUserId()),
      [],
    )
    const authLocal = storageGet<KnittingProject[]>(keyFor(userId), [])
    const localUnion = mergeProjects(guestLocal, authLocal, userId).merged
    const remote = (await fetchProjects(userId)) ?? []
    const { merged, toUpload } = mergeProjects(localUnion, remote, userId)

    for (const row of toUpload) {
      const err = await upsertProjectRemote(row)
      if (err) console.warn('[Krøll] projects merge upload:', err)
    }

    setProjects(merged)
    storageSet(keyFor(userId), merged)
    setLoading(false)
  }, [signedIn, userId])

  useEffect(() => {
    void load()
  }, [load])

  const value = useMemo<ProjectsContextValue>(
    () => ({
      projects,
      loading,
      async addProject(input) {
        const now = new Date().toISOString()
        const row: KnittingProject = {
          id: crypto.randomUUID(),
          userId,
          patternId: input.patternId,
          title: input.title,
          sizeId: input.sizeId ?? null,
          stashItemIds: input.stashItemIds ?? [],
          status: input.status ?? 'planned',
          notes: input.notes ?? '',
          startedAt: input.status === 'in_progress' ? now : null,
          finishedAt: input.status === 'finished' ? now : null,
          createdAt: now,
          updatedAt: now,
        }
        const next = [...projects, row]
        setProjects(next)
        storageSet(keyFor(userId), next)
        if (signedIn) {
          const err = await upsertProjectRemote(row)
          if (err) console.warn('[Krøll] project save:', err)
        }
      },
      async updateProject(id, patch) {
        const next = projects.map((p) => {
          if (p.id !== id) return p
          const merged = {
            ...p,
            ...patch,
            updatedAt: new Date().toISOString(),
          }
          if (patch.status === 'in_progress' && !merged.startedAt) {
            merged.startedAt = merged.updatedAt
          }
          if (patch.status === 'finished') {
            merged.finishedAt = merged.updatedAt
          }
          return merged
        })
        setProjects(next)
        storageSet(keyFor(userId), next)
        const row = next.find((p) => p.id === id)
        if (signedIn && row) {
          const err = await upsertProjectRemote(row)
          if (err) console.warn('[Krøll] project update:', err)
        }
      },
      async removeProject(id) {
        const next = projects.filter((p) => p.id !== id)
        setProjects(next)
        storageSet(keyFor(userId), next)
        if (signedIn) {
          const err = await deleteProjectRemote(id)
          if (err) console.warn('[Krøll] project delete:', err)
        }
      },
    }),
    [projects, userId, signedIn, loading],
  )

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  )
}

export function useProjects() {
  const ctx = useContext(ProjectsContext)
  if (!ctx) throw new Error('useProjects must be used within ProjectsProvider')
  return ctx
}
