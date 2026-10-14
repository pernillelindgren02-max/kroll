import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DEMO_CATALOG_VERSION,
  DEMO_PATTERNS,
  DEMO_SECTIONS,
} from '../data/demo/catalog'
import { MOCK_PATTERNS, MOCK_SECTIONS } from '../data/mockPatterns'
import { MOCK_YARNS } from '../data/mockYarns'
import { useAuth } from './AuthContext'
import {
  deleteYarnRemote,
  fetchCatalog,
  upsertPatternRemote,
  upsertYarnRemote,
} from '../lib/krollApi'
import { isSupabaseConfigured } from '../lib/supabase'
import { storageGet, storageSet } from '../lib/storage'
import type {
  CatalogYarn,
  KnittingPattern,
  PatternSection,
} from '../types/models'

type PatternsContextValue = {
  patterns: KnittingPattern[]
  sections: PatternSection[]
  yarns: CatalogYarn[]
  publishedPatterns: KnittingPattern[]
  loading: boolean
  source: 'local' | 'supabase'
  getPattern: (id: string) => KnittingPattern | undefined
  getSectionsFor: (patternId: string) => PatternSection[]
  getYarn: (id: string) => CatalogYarn | undefined
  yarnMap: Map<string, CatalogYarn>
  upsertPattern: (
    pattern: KnittingPattern,
    secs: PatternSection[],
  ) => Promise<string | null>
  upsertYarn: (yarn: CatalogYarn) => Promise<void>
  removeYarn: (id: string) => Promise<void>
}

const PatternsContext = createContext<PatternsContextValue | null>(null)

type Store = {
  version: string
  patterns: KnittingPattern[]
  sections: PatternSection[]
  yarns: CatalogYarn[]
}

/** Browser cache only — never the production source of truth. */
const STORAGE_KEY = 'catalog'

const DEMO_PATTERN_IDS = new Set(DEMO_PATTERNS.map((p) => p.id))

function freshStore(): Store {
  return {
    version: DEMO_CATALOG_VERSION,
    patterns: MOCK_PATTERNS,
    sections: MOCK_SECTIONS,
    yarns: MOCK_YARNS,
  }
}

/** Demo business rule: demos cannot be sold. Never force publish status. */
function applyDemoPriceGuard(p: KnittingPattern): KnittingPattern {
  if (p.demoPattern && p.priceNok !== 0) {
    return { ...p, priceNok: 0 }
  }
  return p
}

/**
 * Fill only missing seed demos / sections.
 * NEVER overwrite an existing pattern row (Supabase or admin-edited local)
 * with hard-coded demo content.
 */
function fillMissingDemos(store: Store): Store {
  const patterns = new Map(
    store.patterns.map((p) => [p.id, applyDemoPriceGuard(p)]),
  )
  for (const seed of DEMO_PATTERNS) {
    if (!patterns.has(seed.id)) {
      patterns.set(seed.id, applyDemoPriceGuard(seed))
    }
  }

  const sections = new Map(store.sections.map((s) => [s.id, s]))
  for (const seed of DEMO_SECTIONS) {
    if (!sections.has(seed.id)) sections.set(seed.id, seed)
  }

  return {
    version: DEMO_CATALOG_VERSION,
    patterns: [...patterns.values()],
    sections: [...sections.values()],
    yarns: store.yarns.length ? store.yarns : MOCK_YARNS,
  }
}

/**
 * Local cache load.
 * Version bumps migrate in place — they must NOT wipe patterns/images.
 */
function loadLocalStore(): Store {
  const stored = storageGet<Store | null>(STORAGE_KEY, null)
  if (!stored?.patterns?.length) {
    const fresh = fillMissingDemos(freshStore())
    storageSet(STORAGE_KEY, fresh)
    return fresh
  }

  const migrated: Store = {
    version: DEMO_CATALOG_VERSION,
    patterns: stored.patterns.map(applyDemoPriceGuard),
    sections: stored.sections ?? [],
    yarns: stored.yarns?.length ? stored.yarns : MOCK_YARNS,
  }
  const filled = fillMissingDemos(migrated)
  if (
    filled.version !== stored.version ||
    filled.patterns.length !== stored.patterns.length ||
    filled.sections.length !== (stored.sections?.length ?? 0)
  ) {
    storageSet(STORAGE_KEY, filled)
  }
  return filled
}

/**
 * Merge remote (Supabase) with local cache.
 * Remote rows always win for their IDs — production CMS is source of truth.
 * Local seed demos never replace a Supabase pattern.
 * Local-only non-seed drafts (ids not in remote) are kept for offline work.
 */
function mergeRemoteAsTruth(remote: Store, local: Store): Store {
  const patterns = new Map<string, KnittingPattern>()
  for (const p of remote.patterns) {
    patterns.set(p.id, applyDemoPriceGuard(p))
  }

  for (const p of local.patterns) {
    if (patterns.has(p.id)) continue
    // Do not resurrect hard-coded demos from a stale cache when absent remotely;
    // fillMissingDemos will add seeds only if still missing after this pass.
    if (DEMO_PATTERN_IDS.has(p.id)) continue
    patterns.set(p.id, applyDemoPriceGuard(p))
  }

  const sections = new Map<string, PatternSection>()
  for (const s of remote.sections) sections.set(s.id, s)
  for (const s of local.sections) {
    if (sections.has(s.id)) continue
    // Skip seed section ids that belong to demos already present remotely
    // (admin may have replaced section set). Allow truly local-only sections.
    const isSeedSection = DEMO_SECTIONS.some((d) => d.id === s.id)
    if (isSeedSection) continue
    sections.set(s.id, s)
  }

  const yarns = new Map<string, CatalogYarn>()
  for (const y of remote.yarns) yarns.set(y.id, y)
  for (const y of local.yarns) {
    if (!yarns.has(y.id)) yarns.set(y.id, y)
  }

  // Only inject hard-coded demos when that demo id is absent from Supabase.
  // Existing Supabase rows are left untouched.
  return fillMissingDemos({
    version: DEMO_CATALOG_VERSION,
    patterns: [...patterns.values()],
    sections: [...sections.values()],
    yarns: [...yarns.values()],
  })
}

export function PatternsProvider({ children }: { children: ReactNode }) {
  const { isAdmin, user } = useAuth()
  const [store, setStore] = useState<Store>(() => loadLocalStore())
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [source, setSource] = useState<'local' | 'supabase'>('local')

  useEffect(() => {
    let active = true
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    void fetchCatalog().then((remote) => {
      if (!active) return
      if (remote && remote.patterns.length > 0) {
        const merged = mergeRemoteAsTruth(
          {
            version: DEMO_CATALOG_VERSION,
            patterns: remote.patterns,
            sections: remote.sections,
            yarns: remote.yarns,
          },
          loadLocalStore(),
        )
        setStore(merged)
        // Cache for offline paint only — never authority over Supabase.
        storageSet(STORAGE_KEY, merged)
        setSource('supabase')
      } else {
        // Empty DB or fetch failure: keep local fallback. Never upsert seeds
        // into Supabase from the client.
        setSource('local')
      }
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [user?.id])

  const persistLocal = useCallback((next: Store) => {
    setStore(next)
    storageSet(STORAGE_KEY, next)
  }, [])

  const value = useMemo<PatternsContextValue>(() => {
    const yarnMap = new Map(store.yarns.map((y) => [y.id, y]))
    return {
      patterns: store.patterns,
      sections: store.sections,
      yarns: store.yarns,
      publishedPatterns: store.patterns.filter((p) => p.status === 'published'),
      loading,
      source,
      getPattern: (id) => store.patterns.find((p) => p.id === id),
      getSectionsFor: (patternId) =>
        store.sections
          .filter((s) => s.patternId === patternId)
          .sort((a, b) => a.sortOrder - b.sortOrder),
      getYarn: (id) => yarnMap.get(id),
      yarnMap,
      async upsertPattern(pattern, secs) {
        if (pattern.demoPattern && pattern.priceNok > 0) {
          return 'Demo-oppskrifter kan ikke selges (pris må være 0).'
        }
        if (
          pattern.demoPattern &&
          pattern.status === 'published' &&
          pattern.priceNok > 0
        ) {
          return 'Demo-oppskrifter kan ikke publiseres som betalt vare.'
        }

        const safe: KnittingPattern = pattern.demoPattern
          ? { ...pattern, priceNok: 0 }
          : pattern

        const patterns = [
          ...store.patterns.filter((p) => p.id !== safe.id),
          safe,
        ]
        const sections = [
          ...store.sections.filter((s) => s.patternId !== safe.id),
          ...secs,
        ]
        const next = {
          ...store,
          version: DEMO_CATALOG_VERSION,
          patterns,
          sections,
        }

        // Persist to Supabase first when admin + configured so production
        // CMS survives refresh / deploy. Local cache is secondary.
        if (isSupabaseConfigured && isAdmin) {
          const err = await upsertPatternRemote(safe, secs)
          if (err) {
            console.warn('[Krøll] pattern upsert:', err)
            persistLocal(next)
            return err
          }
          persistLocal(next)
          setSource('supabase')
          return null
        }

        persistLocal(next)
        return null
      },
      async upsertYarn(yarn) {
        const yarns = [...store.yarns.filter((y) => y.id !== yarn.id), yarn]
        const next = { ...store, yarns }
        if (isSupabaseConfigured && isAdmin) {
          const err = await upsertYarnRemote(yarn)
          if (err) console.warn('[Krøll] yarn upsert:', err)
          persistLocal(next)
          return
        }
        persistLocal(next)
      },
      async removeYarn(id) {
        const next = {
          ...store,
          yarns: store.yarns.filter((y) => y.id !== id),
        }
        if (isSupabaseConfigured && isAdmin) {
          const err = await deleteYarnRemote(id)
          if (err) console.warn('[Krøll] yarn delete:', err)
          persistLocal(next)
          return
        }
        persistLocal(next)
      },
    }
  }, [store, persistLocal, loading, source, isAdmin])

  return (
    <PatternsContext.Provider value={value}>
      {children}
    </PatternsContext.Provider>
  )
}

export function usePatterns() {
  const ctx = useContext(PatternsContext)
  if (!ctx) throw new Error('usePatterns must be used within PatternsProvider')
  return ctx
}
