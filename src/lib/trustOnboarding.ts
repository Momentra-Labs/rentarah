import type { AuthUser } from '../types'
import { isAuthProfileComplete } from './authProfile'

/** Firebase exposes `emailVerified`; credentials accounts omit field (trusted at signup until you add SMTP). */
export function isEmailVerificationReady(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  if (user.emailVerified === undefined || user.emailVerified === null) return true
  return user.emailVerified === true
}

/** User intends to list vehicles (explicit role or legacy `isHost` before role exists). */
export function wantsHostTrust(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  const r = user.accountRole
  if (r === 'host' || r === 'both') return true
  if (r === 'renter') return false
  return Boolean(user.isHost)
}

/** Terms + renter/community safety — required before booking or messaging as a traveler. */
export function isBookingTrustComplete(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  return !!(user.trustTermsAcceptedAt && user.trustRenterGuidelinesAcceptedAt)
}

/** Host pledge — required before opening the host dashboard when role implies hosting. */
export function isHostTrustComplete(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  if (!wantsHostTrust(user)) return true
  return !!user.trustHostStandardsAcceptedAt
}

/** Legal checkboxes + email + host pledge — before ID upload step. */
export function isLegalAndSafetyOnboardingComplete(user: AuthUser | null | undefined): boolean {
  return (
    isAuthProfileComplete(user) &&
    isBookingTrustComplete(user) &&
    isHostTrustComplete(user) &&
    isEmailVerificationReady(user)
  )
}

export function isIdentityVerificationApproved(user: AuthUser | null | undefined): boolean {
  return user?.identityVerification?.status === 'approved'
}

export function canProceedToBookingCheckout(user: AuthUser | null | undefined): boolean {
  return isLegalAndSafetyOnboardingComplete(user) && isIdentityVerificationApproved(user)
}

export function canAccessHostOperatingTools(user: AuthUser | null | undefined): boolean {
  return canProceedToBookingCheckout(user)
}

export type TrustOnboardingIntent = 'booking' | 'host'
