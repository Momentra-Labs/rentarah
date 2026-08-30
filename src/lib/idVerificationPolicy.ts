/**
 * Client-only ID uploads.
 * - Explicit `true` / `false` wins.
 * - Production builds default to **manual review** (`pending_review`).
 * - Dev/demo defaults to instant approve so static demos remain usable.
 */
export function shouldInstantApproveIdVerification(): boolean {
  const raw = String(import.meta.env.VITE_ID_VERIFICATION_INSTANT_APPROVE ?? '').toLowerCase()
  if (raw === 'true') return true
  if (raw === 'false') return false
  return import.meta.env.PROD !== true
}
