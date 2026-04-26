/** Default area in search UI when none is set (capital region aggregate). */
export const DEFAULT_SEARCH_LOCATION = 'Metro Manila'

/**
 * Leaflet `maxBounds`: Philippines extent (WGS84), padded slightly so coastal pins stay inside.
 * Format: south-west corner, then north-east corner `[lat, lng]`.
 * Stops users from panning into other countries while zooming.
 */
export const PHILIPPINES_MAX_BOUNDS_CORNERS: [[number, number], [number, number]] = [
  [4.15, 115.7],
  [21.6, 127.2],
]

/** Minimum zoom when the map is locked to the Philippines (whole country still visible). */
export const PHILIPPINES_MAP_MIN_ZOOM = 5

/** True when the query should match every listing’s city (nationwide browse). */
export function isNationalLocationQuery(raw: string): boolean {
  const n = raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
  return n === 'philippines' || n === 'ph' || n === 'pilipinas'
}
