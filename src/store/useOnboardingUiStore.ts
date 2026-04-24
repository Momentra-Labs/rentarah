import { create } from 'zustand'

import { isOnboardingDone } from '../constants/onboardingStorage'

function initialSuppressGeo(): boolean {
  if (typeof window === 'undefined') return false
  /** True before React mounts so landing auto-prompt cannot race ahead of OnboardingFlow. */
  return !isOnboardingDone()
}

/**
 * While FTUX modal or tour is active, geo opt-in must not open in parallel.
 */
type OnboardingUiState = {
  suppressGeoDialog: boolean
  setSuppressGeoDialog: (v: boolean) => void
}

export const useOnboardingUiStore = create<OnboardingUiState>((set) => ({
  suppressGeoDialog: initialSuppressGeo(),
  setSuppressGeoDialog: (suppressGeoDialog) => set({ suppressGeoDialog }),
}))
