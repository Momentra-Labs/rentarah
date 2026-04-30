/**
 * Client-only ID uploads: when `false`, submissions stay `pending_review` until a backend admin approves.
 * Default unset / any value except `"false"` auto-approves so static demos remain usable without an API.
 *
 * `.env.example`: `VITE_ID_VERIFICATION_INSTANT_APPROVE=false` for staging manual review simulations.
 */
export function shouldInstantApproveIdVerification(): boolean {
  return String(import.meta.env.VITE_ID_VERIFICATION_INSTANT_APPROVE ?? '').toLowerCase() !== 'false'
}
