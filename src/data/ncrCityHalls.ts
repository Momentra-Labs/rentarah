/**
 * Approximate city / municipal hall coordinates (WGS84) for PH locations in
 * listing {@link Car.location} strings. Used for map pickup pins and distance sort.
 * Sources: public maps / OSM-style placemarks (not survey-grade).
 */
export type CityHallCoords = { lat: number; lng: number }

const MANILA: CityHallCoords = { lat: 14.5906, lng: 120.9829 }
const CEBU_CITY: CityHallCoords = { lat: 10.3157, lng: 123.8854 }
const DAVAO_CITY: CityHallCoords = { lat: 7.0731, lng: 125.6128 }
const ILOILO_CITY: CityHallCoords = { lat: 10.7202, lng: 122.5621 }
const BAGUIO: CityHallCoords = { lat: 16.4023, lng: 120.5931 }
const CAGAYAN_DE_ORO: CityHallCoords = { lat: 8.4542, lng: 124.6319 }
const CLARK_AREA: CityHallCoords = { lat: 15.1861, lng: 120.5594 }
const MAKATI: CityHallCoords = { lat: 14.5548, lng: 121.0247 }
const QUEZON_CITY: CityHallCoords = { lat: 14.6507, lng: 121.0499 }
const PASIG: CityHallCoords = { lat: 14.5765, lng: 121.0858 }
const TAGUIG: CityHallCoords = { lat: 14.5174, lng: 121.0509 }
const MUNTINLUPA: CityHallCoords = { lat: 14.4081, lng: 121.0415 }
const PARANAQUE: CityHallCoords = { lat: 14.4792, lng: 121.0198 }
const MANDALUYONG: CityHallCoords = { lat: 14.5777, lng: 121.0334 }
const SAN_JUAN: CityHallCoords = { lat: 14.6015, lng: 121.0295 }
const LAS_PINAS: CityHallCoords = { lat: 14.4496, lng: 120.9828 }

/**
 * Match `location` (e.g. `"Ortigas, Pasig"`, `"BGC, Taguig"`) to a city hall.
 * Longer / more specific patterns must come before looser ones.
 */
const RULES: ReadonlyArray<{ test: RegExp; coords: CityHallCoords }> = [
  { test: /cebu/i, coords: CEBU_CITY },
  { test: /davao/i, coords: DAVAO_CITY },
  { test: /iloilo/i, coords: ILOILO_CITY },
  { test: /baguio/i, coords: BAGUIO },
  { test: /cagayan\s*de\s*oro|\bcdo\b/i, coords: CAGAYAN_DE_ORO },
  { test: /clark|pampanga|angeles/i, coords: CLARK_AREA },
  { test: /quezon\s*city/i, coords: QUEZON_CITY },
  { test: /las\s*pi[ñn]as|las\s*pinas/i, coords: LAS_PINAS },
  { test: /san\s*juan/i, coords: SAN_JUAN },
  { test: /makati/i, coords: MAKATI },
  { test: /alabang|muntinlupa/i, coords: MUNTINLUPA },
  { test: /mandaluyong/i, coords: MANDALUYONG },
  { test: /para[ñn]aque|paranaque/i, coords: PARANAQUE },
  { test: /ortigas|pasig/i, coords: PASIG },
  { test: /bgc|taguig/i, coords: TAGUIG },
  /** City of Manila (avoid relying on "Metro Manila" alone before this rule). */
  { test: /(^|[^a-z])manila([^a-z]|$)/i, coords: MANILA },
]

function normalizeForMatch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

/**
 * Pickup map coordinates for a listing’s human-readable `location` field.
 */
export function resolveCityHallCoords(location: string): CityHallCoords {
  const n = normalizeForMatch(location.trim())
  if (!n) return MANILA

  for (const { test, coords } of RULES) {
    if (test.test(n)) return coords
  }

  /** Nationwide browse — use NCR centroid so distance sort stays stable for mostly-Luzon mock data. */
  if (n === 'philippines' || n === 'ph' || n === 'pilipinas') return MANILA

  /** e.g. unknown barangay but clearly NCR */
  if (n.includes('metro manila')) return MANILA

  return MANILA
}
