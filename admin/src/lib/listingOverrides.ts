/** Local-only tweaks when API PATCH is not wired (session-scoped demo). */

const STORAGE_KEY = 'rentarah-admin-listing-overrides'

export type ListingAvailabilityOverrides = Record<string, { available: boolean }>

function safeParse(raw: string | null): ListingAvailabilityOverrides {
  if (!raw) return {}
  try {
    const v = JSON.parse(raw) as unknown
    if (!v || typeof v !== 'object') return {}
    return v as ListingAvailabilityOverrides
  } catch {
    return {}
  }
}

export function loadListingOverrides(): ListingAvailabilityOverrides {
  if (typeof sessionStorage === 'undefined') return {}
  return safeParse(sessionStorage.getItem(STORAGE_KEY))
}

export function saveListingOverrides(next: ListingAvailabilityOverrides): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}
