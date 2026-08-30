import type { ReactNode } from 'react'

import { canAccessHostOperatingTools } from '@/lib/trustOnboarding'

import TrustGate from './TrustGate'

/** Blocks `/host` until traveler trust + host standards (and Firebase email verified) all pass. */
export default function HostTrustGate({ children }: { children: ReactNode }) {
  return (
    <TrustGate canAccess={canAccessHostOperatingTools} intent="host">
      {children}
    </TrustGate>
  )
}
