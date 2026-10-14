/**
 * Safe merge of anonymous localStorage data with signed-in Supabase rows.
 * Never deletes guest local data. Remote wins on timestamp conflicts where noted.
 */

import type {
  KnittingProject,
  PatternOwnership,
  PatternProgress,
  UserYarnStashItem,
} from '../types/models'

/** Union by patternId — keep all purchases from both sides. */
export function mergeOwnership(
  local: PatternOwnership[],
  remote: PatternOwnership[],
  authUserId: string,
): { merged: PatternOwnership[]; toUpload: PatternOwnership[] } {
  const byPattern = new Map<string, PatternOwnership>()
  for (const row of remote) byPattern.set(row.patternId, row)

  const toUpload: PatternOwnership[] = []
  for (const row of local) {
    if (!byPattern.has(row.patternId)) {
      const next = { ...row, userId: authUserId }
      byPattern.set(row.patternId, next)
      toUpload.push(next)
    }
  }
  return { merged: [...byPattern.values()], toUpload }
}

/** Per patternId: newer updatedAt wins; upload local-only or newer-local. */
export function mergeProgress(
  local: PatternProgress[],
  remote: PatternProgress[],
  authUserId: string,
): { merged: PatternProgress[]; toUpload: PatternProgress[] } {
  const byPattern = new Map<string, PatternProgress>()
  for (const row of remote) byPattern.set(row.patternId, row)

  const toUpload: PatternProgress[] = []
  for (const row of local) {
    const existing = byPattern.get(row.patternId)
    const localRow = { ...row, userId: authUserId }
    if (!existing) {
      byPattern.set(row.patternId, localRow)
      toUpload.push(localRow)
      continue
    }
    if (new Date(localRow.updatedAt) > new Date(existing.updatedAt)) {
      byPattern.set(row.patternId, localRow)
      toUpload.push(localRow)
    }
  }
  return { merged: [...byPattern.values()], toUpload }
}

/** Union by id — reassign userId on upload; keep guest copy untouched in storage. */
export function mergeStash(
  local: UserYarnStashItem[],
  remote: UserYarnStashItem[],
  authUserId: string,
): { merged: UserYarnStashItem[]; toUpload: UserYarnStashItem[] } {
  const byId = new Map<string, UserYarnStashItem>()
  for (const row of remote) byId.set(row.id, row)

  const toUpload: UserYarnStashItem[] = []
  for (const row of local) {
    if (!byId.has(row.id)) {
      const next = { ...row, userId: authUserId }
      byId.set(row.id, next)
      toUpload.push(next)
    }
  }
  return { merged: [...byId.values()], toUpload }
}

export function mergeProjects(
  local: KnittingProject[],
  remote: KnittingProject[],
  authUserId: string,
): { merged: KnittingProject[]; toUpload: KnittingProject[] } {
  const byId = new Map<string, KnittingProject>()
  for (const row of remote) byId.set(row.id, row)

  const toUpload: KnittingProject[] = []
  for (const row of local) {
    const existing = byId.get(row.id)
    const localRow = { ...row, userId: authUserId }
    if (!existing) {
      byId.set(row.id, localRow)
      toUpload.push(localRow)
      continue
    }
    if (new Date(localRow.updatedAt) > new Date(existing.updatedAt)) {
      byId.set(row.id, localRow)
      toUpload.push(localRow)
    }
  }
  return { merged: [...byId.values()], toUpload }
}
