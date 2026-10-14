import { isSupabaseConfigured, supabase } from './supabase'
import type { KnittingPattern, PatternOwnership } from '../types/models'

export type PdfAccessResult =
  | { ok: true; url: string; mode: 'signed' | 'legacy' }
  | { ok: false; reason: 'not_owned' | 'no_pdf' | 'not_configured' | 'error'; message: string }

/**
 * Resolve a PDF download URL only after ownership is confirmed.
 * Paid patterns must use private Storage (`pdfStoragePath`) + signed URL
 * (Edge Function `create-pdf-url` when wired). Never expose public URLs for paid PDFs.
 */
export async function requestPdfAccess(
  pattern: KnittingPattern,
  ownership: PatternOwnership | undefined,
): Promise<PdfAccessResult> {
  if (!ownership) {
    return {
      ok: false,
      reason: 'not_owned',
      message: 'Ownership required before PDF access.',
    }
  }

  // Preferred: private storage path → signed URL via backend.
  if (pattern.pdfStoragePath) {
    if (!isSupabaseConfigured) {
      return {
        ok: false,
        reason: 'not_configured',
        message: 'Private PDF storage requires Supabase + Edge Function.',
      }
    }
    if (!supabase) {
      return {
        ok: false,
        reason: 'not_configured',
        message: 'Supabase client unavailable.',
      }
    }
    // Edge Function will re-check pattern_ownership server-side before signing.
    const { data, error } = await supabase.functions.invoke('create-pdf-url', {
      body: { patternId: pattern.id },
    })
    if (error || !data?.url) {
      return {
        ok: false,
        reason: 'error',
        message: error?.message ?? 'Could not create signed PDF URL.',
      }
    }
    return { ok: true, url: data.url as string, mode: 'signed' }
  }

  // Demo / legacy only: public pdfUrl allowed for free demo patterns.
  if (pattern.pdfUrl && (pattern.demoPattern || pattern.priceNok === 0)) {
    return { ok: true, url: pattern.pdfUrl, mode: 'legacy' }
  }

  if (pattern.pdfUrl && pattern.priceNok > 0) {
    return {
      ok: false,
      reason: 'error',
      message:
        'Paid PDF must use private storage path — public pdfUrl blocked.',
    }
  }

  return {
    ok: false,
    reason: 'no_pdf',
    message: 'No PDF uploaded for this pattern yet.',
  }
}
