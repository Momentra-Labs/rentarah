/** Selectors for optional product tour (landing page only). Hero is last so users land on main CTAs. */
export const ONBOARDING_TOUR_SELECTORS = [
  '[data-onboarding="search"]',
  '[data-onboarding="hero"]',
] as const

export type OnboardingTourIndex = 0 | 1
