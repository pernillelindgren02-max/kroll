/** Local persistence for demo / offline until Supabase tables are wired. */

const PREFIX = 'kroll-v1:'

export function storageGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function storageSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* ignore quota */
  }
}

export function guestUserId(): string {
  const existing = storageGet<string | null>('guest-user-id', null)
  if (existing) return existing
  const id = `guest-${crypto.randomUUID()}`
  storageSet('guest-user-id', id)
  return id
}
