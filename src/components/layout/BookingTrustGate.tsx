import type { ReactNode } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'

import { canProceedToBookingCheckout } from '../../lib/trustOnboarding'
import { useAuthStore } from '../../store/useAuthStore'
import type { TrustOnboardingLocationState } from '../../types/authFlow'

/** Blocks `/booking/:id` until legal + renter safeguards are accepted (and email verified for Firebase SSO). */
export default function BookingTrustGate({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  const { carId } = useParams<{ carId: string }>()
  const back = `${location.pathname}${location.search}`
  const state: TrustOnboardingLocationState = {
    from: back,
    pendingBookCarId: carId,
    intent: 'booking',
  }

  if (!canProceedToBookingCheckout(user)) {
    return <Navigate to="/trust-onboarding" replace state={state} />
  }

  return <>{children}</>
}
