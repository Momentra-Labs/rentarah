import { isNationalLocationQuery, DEFAULT_SEARCH_LOCATION } from '../constants/geo'
import { resolveCityHallCoords } from '../data/ncrCityHalls'
import type { Car, SearchFilters, VehicleType } from '../types'
import { haversineKm, type LatLng } from '../utils/distance'
import { getCarPickupLatLng } from '../utils/mapPickupLocation'
import { rangeConflictsBooked } from '../utils/bookingCalendar'
import { matchesVehicleTypeFilter } from '../utils/vehicleUtils'
import { USE_MOCK_API } from './config'

/** Simulated network latency for catalog search (mock only). `0` = run at full speed. */
const MOCK_SEARCH_DELAY_MS = 0

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const t = window.setTimeout(() => {
      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }
      resolve()
    }, ms)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(t)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })

export interface ListingModelKey {
  make: string
  model: string
  vehicleType: VehicleType
}

export interface ListingSearchParams {
  locationQuery: string
  pickupDate: string | null
  dropoffDate: string | null
  filters: SearchFilters
  sortBy: 'recommended' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'distance_asc'
  /** When set, restrict to the same make / model / platform category (multi-host comparison). */
  modelKey?: ListingModelKey | null
}

export interface ListingHostDto {
  id: string
  displayName: string
  avatarLabel: string
  tripsCompleted: number
  responseTimeLabel: string
}

export interface ListingSearchHit {
  vehicle: Car
  host: ListingHostDto
  availability: {
    checked: boolean
    availableForRange: boolean
    conflictingDates: string[]
  }
  pricing: {
    currency: 'PHP'
    pricePerDay: number
  }
  /** Distance from the user’s search area (city-hall centroid); null if coordinates missing. */
  distanceKm: number | null
}

function hostFromCar(car: Car): ListingHostDto {
  return {
    id: car.hostId,
    displayName: car.hostName,
    avatarLabel: car.hostAvatar,
    tripsCompleted: car.hostTrips,
    responseTimeLabel: car.hostResponseTime,
  }
}

function matchesModelKey(car: Car, key: ListingModelKey): boolean {
  return (
    car.make.trim().toLowerCase() === key.make.trim().toLowerCase() &&
    car.model.trim().toLowerCase() === key.model.trim().toLowerCase() &&
    car.vehicleType === key.vehicleType
  )
}

/**
 * Single-pass catalog search: filters, availability for range, distance, sort.
 * Designed to mirror a batched `GET /listings/search` (no N+1 per card).
 */
export function runListingSearch(cars: readonly Car[], params: ListingSearchParams): ListingSearchHit[] {
  const locQuery = params.locationQuery.trim() || DEFAULT_SEARCH_LOCATION
  const ref: LatLng = resolveCityHallCoords(locQuery)
  const q = locQuery.toLowerCase()
  const rangeActive = Boolean(
    params.pickupDate &&
      params.dropoffDate &&
      params.pickupDate <= params.dropoffDate,
  )

  let list = [...cars]

  if (params.modelKey) {
    list = list.filter((c) => matchesModelKey(c, params.modelKey!))
  }

  if (q && !isNationalLocationQuery(locQuery)) {
    list = list.filter(
      (c) =>
        c.location.toLowerCase().includes(q) || `${c.make} ${c.model}`.toLowerCase().includes(q),
    )
  }

  const [minP, maxP] = params.filters.priceRange
  list = list.filter((c) => c.pricePerDay >= minP && c.pricePerDay <= maxP)
  list = list.filter((c) => matchesVehicleTypeFilter(c, params.filters.vehicleType))

  if (params.filters.types.length > 0) {
    list = list.filter((c) => params.filters.types.includes(c.type))
  }

  if (params.filters.transmission !== 'all') {
    list = list.filter((c) => c.transmission === params.filters.transmission)
  }

  if (params.filters.fuel !== 'all') {
    list = list.filter((c) => c.fuel === params.filters.fuel)
  }

  if (params.filters.seats > 0) {
    list = list.filter((c) => (params.filters.seats >= 7 ? c.seats >= 7 : c.seats === params.filters.seats))
  }

  if (params.filters.availableOnly) {
    list = list.filter((c) => c.available)
  }

  const hits: ListingSearchHit[] = []

  for (const car of list) {
    let availability: ListingSearchHit['availability']
    if (rangeActive && params.pickupDate && params.dropoffDate) {
      const { conflictingDates, availableForRange } = rangeConflictsBooked(
        car.bookedDates,
        params.pickupDate,
        params.dropoffDate,
      )
      availability = {
        checked: true,
        availableForRange,
        conflictingDates,
      }
      if (!availableForRange) continue
    } else {
      availability = {
        checked: false,
        availableForRange: true,
        conflictingDates: [],
      }
    }

    const pickup = getCarPickupLatLng(car)
    const distanceKm = Number.isFinite(pickup.lat) && Number.isFinite(pickup.lng)
      ? haversineKm(ref, pickup)
      : null

    hits.push({
      vehicle: car,
      host: hostFromCar(car),
      availability,
      pricing: { currency: 'PHP', pricePerDay: car.pricePerDay },
      distanceKm,
    })
  }

  const sorted = [...hits].sort((a, b) => {
    const va = a.vehicle
    const vb = b.vehicle
    const da = a.distanceKm
    const db = b.distanceKm

    switch (params.sortBy) {
      case 'price_asc':
        return va.pricePerDay - vb.pricePerDay
      case 'price_desc':
        return vb.pricePerDay - va.pricePerDay
      case 'rating':
        return vb.rating - va.rating
      case 'newest':
        return vb.year - va.year
      case 'distance_asc':
        if (da != null && db != null) return da - db
        if (da != null) return -1
        if (db != null) return 1
        return 0
      case 'recommended':
      default: {
        const score = (h: ListingSearchHit) => {
          const v = h.vehicle
          let s = v.hostTrips + v.rating * 10
          if (h.distanceKm != null) s -= h.distanceKm * 1.5
          return s
        }
        return score(b) - score(a)
      }
    }
  })

  return sorted
}

export async function fetchListingSearch(
  cars: readonly Car[],
  params: ListingSearchParams,
  signal?: AbortSignal,
): Promise<ListingSearchHit[]> {
  if (USE_MOCK_API && MOCK_SEARCH_DELAY_MS > 0) {
    await delay(MOCK_SEARCH_DELAY_MS, signal)
  }
  return runListingSearch(cars, params)
}
