import type { ReactNode } from 'react'

import { canProceedToBookingCheckout } from '@/lib/trustOnboarding'

import TrustGate from './TrustGate'

/** Blocks `/booking/:id` until legal + renter safeguards are accepted (and email verified for Firebase SSO). */
export default function BookingTrustGate({ children }: { children: ReactNode }) {
  return (
    <TrustGate canAccess={canProceedToBookingCheckout} intent="booking" includePendingBookCarId>
      {children}
    </TrustGate>
  )
}
