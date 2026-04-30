import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { canAccessHostOperatingTools } from '../../lib/trustOnboarding'
import { useAuthStore } from '../../store/useAuthStore'
import type { TrustOnboardingLocationState } from '../../types/authFlow'

/** Blocks `/host` until traveler trust + host standards (and Firebase email verified) all pass. */
export default function HostTrustGate({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  const back = `${location.pathname}${location.search}`
  const state: TrustOnboardingLocationState = {
    from: back,
    intent: 'host',
  }

  if (!canAccessHostOperatingTools(user)) {
    return <Navigate to="/trust-onboarding" replace state={state} />
  }

  return <>{children}</>
}
