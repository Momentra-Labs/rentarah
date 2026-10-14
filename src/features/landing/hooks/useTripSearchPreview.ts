import type { Dayjs } from 'dayjs'
import { useMemo } from 'react'

import { PH_PICKUP_AREAS } from '@/data/phPickupAreas'
import { runListingSearch } from '@/services/listingSearchService'
import { useCarsStore } from '@/store/useCarsStore'
import { useSearchStore } from '@/store/useSearchStore'
import type { SearchFilters } from '@/types'

const POPULAR_LIMIT = 4

export type TripSearchPreview = {
  /** Listings the search page will show for these inputs; `null` until the catalog has loaded. */
  matchCount: number | null
  /** Vehicle classes that have at least one listing anywhere. */
  availableTypes: ReadonlySet<SearchFilters['vehicleType']>
  /** Pickup-area options with the most listings — always valid Autocomplete values. */
  popularAreas: string[]
}

/**
 * Runs the same matcher as the search page (location, type, dates, the user's saved filters)
 * so the landing button can promise an exact number before anyone navigates.
 */
export function useTripSearchPreview(
  location: string,
  vehicleType: SearchFilters['vehicleType'],
  pickup: Dayjs | null,
  dropoff: Dayjs | null,
): TripSearchPreview {
  const cars = useCarsStore((s) => s.cars)
  const savedFilters = useSearchStore((s) => s.filters)

  const matchCount = useMemo(() => {
    if (cars.length === 0) return null
    return runListingSearch(cars, {
      locationQuery: location,
      pickupDate: pickup?.isValid() ? pickup.format('YYYY-MM-DD') : null,
      dropoffDate: dropoff?.isValid() ? dropoff.format('YYYY-MM-DD') : null,
      // Mirrors LandingPage `search()`: body types reset, everything else carries over.
      filters: { ...savedFilters, types: [], vehicleType },
      sortBy: 'recommended',
    }).length
  }, [cars, location, vehicleType, pickup, dropoff, savedFilters])

  const availableTypes = useMemo(() => new Set(cars.map((c) => c.vehicleType)), [cars])

  const popularAreas = useMemo(() => {
    const byCity = new Map<string, number>()
    for (const c of cars) {
      const city = c.location.split(',')[0].trim()
      if (city) byCity.set(city, (byCity.get(city) ?? 0) + 1)
    }
    const out: string[] = []
    for (const [city] of [...byCity].sort((a, b) => b[1] - a[1])) {
      const lower = city.toLowerCase()
      const option = PH_PICKUP_AREAS.find(
        (o) => o.toLowerCase() === lower || o.toLowerCase().startsWith(`${lower},`),
      )
      if (option && !out.includes(option)) out.push(option)
      if (out.length >= POPULAR_LIMIT) break
    }
    return out
  }, [cars])

  return { matchCount, availableTypes, popularAreas }
}
