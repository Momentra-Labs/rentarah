import { describe, expect, it } from 'vitest'

import type { AuthUser } from '@/types'

import {
  canProceedToBookingCheckout,
  isBookingTrustComplete,
  isIdentityVerificationApproved,
} from './trustOnboarding'

function user(partial: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'u1',
    firstName: 'Ana',
    lastName: 'Reyes',
    email: 'a@b.com',
    phone: '+639171234567',
    licenseNumber: 'N12345678',
    isHost: false,
    avatar: 'AB',
    createdAt: '2026-01-01T00:00:00.000Z',
    accountRole: 'renter',
    emailVerified: true,
    trustTermsAcceptedAt: '2026-01-02T00:00:00.000Z',
    trustRenterGuidelinesAcceptedAt: '2026-01-02T00:00:00.000Z',
    identityVerification: { status: 'approved', submittedAt: '2026-01-03T00:00:00.000Z' },
    ...partial,
  }
}

describe('trust onboarding predicates', () => {
  it('requires terms + renter guidelines for booking trust', () => {
    expect(isBookingTrustComplete(user({ trustTermsAcceptedAt: undefined }))).toBe(false)
    expect(isBookingTrustComplete(user())).toBe(true)
  })

  it('requires approved identity for checkout', () => {
    expect(
      canProceedToBookingCheckout(
        user({ identityVerification: { status: 'pending_review', submittedAt: '2026-01-03T00:00:00.000Z' } }),
      ),
    ).toBe(false)
    expect(isIdentityVerificationApproved(user())).toBe(true)
    expect(canProceedToBookingCheckout(user())).toBe(true)
  })
})
