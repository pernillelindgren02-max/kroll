/**
 * Stripe Checkout architecture (planned — not live).
 *
 * Flow:
 * 1. Cart (client) → Checkout page requires signed-in user for paid lines.
 * 2. Client calls Edge Function `create-checkout-session` with patternIds only
 *    (never trusted prices from the client).
 * 3. Edge Function loads catalog prices from knitting_patterns, rejects
 *    demo_pattern / price_nok=0 from Stripe charge, creates Stripe Checkout
 *    Session in NOK, inserts purchases row status=pending.
 * 4. User pays on Stripe-hosted page.
 * 5. Stripe webhook → Edge Function `stripe-webhook` verifies signature,
 *    marks purchase paid, upserts pattern_ownership (service role),
 *    enqueues email with secure download links.
 * 6. Success URL → /checkout/success?session_id=… refreshes ownership from
 *    Supabase (never grants from query params alone).
 *
 * Security:
 * - Ownership ONLY after webhook verification.
 * - Frontend "payment successful" flag is never trusted.
 * - Duplicate: unique (user_id, pattern_id) on pattern_ownership;
 *   webhook is idempotent on stripe session / payment_intent id.
 * - Price integrity: server re-reads price_nok; demo_pattern forced to 0
 *   and excluded from Stripe line items (claimed free instead).
 */

export type CheckoutSessionRequest = {
  patternIds: string[]
  successUrl: string
  cancelUrl: string
}

export type CheckoutSessionResponse = {
  /** Present only when Stripe is connected. */
  url?: string
  error?: string
  code?:
    | 'stripe_not_configured'
    | 'auth_required'
    | 'empty_cart'
    | 'already_owned'
    | 'demo_only'
    | 'price_mismatch'
}

/** Client helper — returns not-configured until Edge Functions are deployed. */
export async function startStripeCheckout(
  _req: CheckoutSessionRequest,
): Promise<CheckoutSessionResponse> {
  return {
    error:
      'Stripe Checkout is not connected yet. Architecture is ready; no live keys.',
    code: 'stripe_not_configured',
  }
}

export function isPayablePattern(p: {
  demoPattern: boolean
  priceNok: number
}): boolean {
  return !p.demoPattern && p.priceNok > 0
}

export function isFreeClaimPattern(p: {
  demoPattern: boolean
  priceNok: number
}): boolean {
  return p.demoPattern || p.priceNok === 0
}
