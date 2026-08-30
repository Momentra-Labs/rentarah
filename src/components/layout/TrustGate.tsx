import type { ReactNode } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'

import { useAuthStore } from '@/store/useAuthStore'
import type { AuthUser } from '@/types'
import type { TrustOnboardingLocationState } from '@/types/authFlow'

export type TrustGateProps = {
  children: ReactNode
  /** Return true when the user may proceed. */
  canAccess: (user: AuthUser | null) => boolean
  intent: TrustOnboardingLocationState['intent']
  /** When true, attach `pendingBookCarId` from the `:carId` route param. */
  includePendingBookCarId?: boolean
}

/** Configurable trust redirect — use thin wrappers for booking/host routes. */
export default function TrustGate({
  children,
  canAccess,
  intent,
  includePendingBookCarId = false,
}: TrustGateProps) {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  const { carId } = useParams<{ carId: string }>()
  const back = `${location.pathname}${location.search}`
  const state: TrustOnboardingLocationState = {
    from: back,
    intent,
    ...(includePendingBookCarId && carId ? { pendingBookCarId: carId } : {}),
  }

  if (!canAccess(user)) {
    return <Navigate to="/trust-onboarding" replace state={state} />
  }

  return <>{children}</>
}
