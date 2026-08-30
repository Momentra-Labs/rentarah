import type { Dayjs } from 'dayjs'

import { DEFAULT_SEARCH_LOCATION, isNationalLocationQuery } from '@/constants/geo'
import type { Car } from '@/types'

import { formatSearchDateTimeParam } from './dateUtils'

/** Full city / area label for “N vehicles in …” — keep aliases like “BGC, Taguig”. */
export function searchAreaLabel(location: string): string {
  const t = location.trim()
  if (!t) return DEFAULT_SEARCH_LOCATION
  if (isNationalLocationQuery(t)) return 'the Philippines'
  return t
}

export function isScopedCitySearch(location: string): boolean {
  const t = location.trim()
  return Boolean(t) && !isNationalLocationQuery(t)
}

function locationTokens(location: string): string[] {
  const parts = location
    .toLowerCase()
    .split(/[,/]/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3)

  const out = new Set<string>()
  for (const p of parts) {
    out.add(p)
    for (const w of p.split(/\s+/)) {
      if (w.length >= 4 && w !== 'city' && w !== 'metro') out.add(w)
    }
  }
  return [...out]
}

export function locationsOverlap(a: string, b: string): boolean {
  const ta = locationTokens(a)
  const tb = locationTokens(b)
  const la = a.toLowerCase()
  const lb = b.toLowerCase()
  return ta.some((t) => lb.includes(t)) || tb.some((t) => la.includes(t))
}

/** Other listings whose pickup area shares a city / neighborhood token. */
export function sameAreaListings(car: Car, all: readonly Car[], limit = 3): Car[] {
  const hits: Car[] = []
  for (const other of all) {
    if (other.id === car.id) continue
    if (!locationsOverlap(car.location, other.location)) continue
    hits.push(other)
    if (hits.length >= limit) break
  }
  return hits
}

/** Browse URL with the same location + trip dates as home / edit-search. */
export function searchResultsPath(opts: {
  location?: string | null
  pickup?: Dayjs | null
  dropoff?: Dayjs | null
}): string {
  const params = new URLSearchParams()
  const loc = opts.location?.trim()
  if (loc) params.set('location', loc)
  if (opts.pickup?.isValid()) params.set('pickup', formatSearchDateTimeParam(opts.pickup))
  if (opts.dropoff?.isValid()) params.set('dropoff', formatSearchDateTimeParam(opts.dropoff))
  const q = params.toString()
  return q ? `/search?${q}` : '/search'
}
