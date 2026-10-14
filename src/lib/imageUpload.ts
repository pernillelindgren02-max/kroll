import { isSupabaseConfigured, supabase } from './supabase'

const BUCKET = 'pattern-images'
const MAX_BYTES = 1_800_000

export type ImageUploadResult =
  | { ok: true; url: string; path: string; mode: 'storage' | 'local' }
  | { ok: false; message: string }

function friendlyError(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes('bucket') || lower.includes('not found')) {
    return 'Bildelageret er ikke satt opp ennå. Kjør Storage-oppsettet (se kroll-pattern-cms-schema.sql) eller bruk lokal forhåndsvisning.'
  }
  if (lower.includes('row-level security') || lower.includes('policy')) {
    return 'Ingen tilgang til å laste opp bilde. Sjekk at du er admin og at Storage-policy er satt.'
  }
  if (lower.includes('payload') || lower.includes('too large') || lower.includes('size')) {
    return 'Bildet er for stort. Prøv under ca. 1,5 MB.'
  }
  return 'Kunne ikke laste opp bildet. Prøv et annet bilde eller sjekk tilkoblingen.'
}

function extOf(file: File): string {
  const n = file.name.split('.').pop()?.toLowerCase()
  if (n && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(n)) {
    return n === 'jpeg' ? 'jpg' : n
  }
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return 'jpg'
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Kunne ikke lese filen.'))
    reader.readAsDataURL(file)
  })
}

/**
 * Upload a pattern image to Supabase Storage when configured;
 * otherwise persist a data URL in the local catalog for demo/admin UX.
 */
export async function uploadPatternImage(
  file: File,
  patternId: string,
  kind: 'cover' | 'gallery' | 'section',
): Promise<ImageUploadResult> {
  if (!file.type.startsWith('image/')) {
    return { ok: false, message: 'Velg et bildefil (JPG, PNG eller WebP).' }
  }
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      message: 'Bildet er for stort. Maks ca. 1,5 MB for stabil lagring.',
    }
  }

  const stamp = Date.now().toString(36)
  const path = `${patternId}/${kind}-${stamp}.${extOf(file)}`

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })
    if (error) {
      // Fall back to local data URL so admin can keep working offline.
      try {
        const url = await fileToDataUrl(file)
        return {
          ok: true,
          url,
          path: `local:${path}`,
          mode: 'local',
        }
      } catch {
        return { ok: false, message: friendlyError(error.message) }
      }
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return {
      ok: true,
      url: data.publicUrl,
      path,
      mode: 'storage',
    }
  }

  try {
    const url = await fileToDataUrl(file)
    return { ok: true, url, path: `local:${path}`, mode: 'local' }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Kunne ikke lese filen.',
    }
  }
}
