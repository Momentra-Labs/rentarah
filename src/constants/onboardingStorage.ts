/** Exact key requested for FTUX persistence (not under `rentara:` prefix). */
export const ONBOARDING_DONE_KEY = 'rentarah_onboarding_done'

export function isOnboardingDone(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_DONE_KEY) === '1'
  } catch {
    return false
  }
}

export function markOnboardingDone() {
  try {
    localStorage.setItem(ONBOARDING_DONE_KEY, '1')
  } catch {
    /* ignore */
  }
}
