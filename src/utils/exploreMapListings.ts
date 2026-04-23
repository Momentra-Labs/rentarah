import type { Car } from '../types'
import { haversineKm, type LatLng } from './distance'
import { getCarPickupLatLng } from './mapPickupLocation'
import { isTwoWheeler } from './vehicleUtils'

/**
 * Shape expected by the landing “Explore” map. Mirrors a future API payload
 * (`id`, `latitude`, `longitude`, nested `vehicle` DTO).
 */
export type ExploreMapListing = {
  id: string
  latitude: number
  longitude: number
  vehicle: {
    displayName: string
    pricePerDay: number
    thumbnailUrl: string
    locationName: string
    vehicleType: Car['vehicleType']
  }
  /** Client-only: source row for navigation; omit when wiring a real API. */
  _source: Car
}

export type ExploreMapFilterMode = 'all' | 'cars' | 'motorcycles' | 'nearby'

/** Slight jitter so many listings sharing one city hall stay individually tappable. */
function displayJitter(id: string, lat: number, lng: number): { lat: number; lng: number } {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0
  }
  const u = Math.abs(h)
  const dLat = ((u % 90) - 45) * 1.1e-5
  const dLng = (((u >> 9) % 90) - 45) * 1.1e-5
  return { lat: lat + dLat, lng: lng + dLng }
}

/** Build map pins from catalog `Car` rows (or swap for `fetch` + mapper). */
export function carsToExploreListings(cars: Car[]): ExploreMapListing[] {
  return cars.map((car) => {
    const { lat, lng } = getCarPickupLatLng(car)
    const j = displayJitter(car.id, lat, lng)
    return {
      id: car.id,
      latitude: j.lat,
      longitude: j.lng,
      vehicle: {
        displayName: `${car.year} ${car.make} ${car.model}`,
        pricePerDay: car.pricePerDay,
        thumbnailUrl: car.images[0] ?? '',
        locationName: car.location,
        vehicleType: car.vehicleType,
      },
      _source: car,
    }
  })
}

const NEARBY_MAX_KM = 12

export function filterExploreListings(
  listings: ExploreMapListing[],
  mode: ExploreMapFilterMode,
  userLocation: LatLng | null,
): ExploreMapListing[] {
  let out = listings
  if (mode === 'cars') {
    out = out.filter((l) => l.vehicle.vehicleType === 'car')
  }
  if (mode === 'motorcycles') {
    out = out.filter((l) => isTwoWheeler({ vehicleType: l.vehicle.vehicleType }))
  }
  if (mode === 'nearby' && userLocation) {
    out = out.filter(
      (l) => haversineKm(userLocation, { lat: l.latitude, lng: l.longitude }) <= NEARBY_MAX_KM,
    )
  }
  return out
}

export type ExploreMapAdvancedFilters = {
  /** Inclusive min daily price (PHP); omit or 0 to disable. */
  priceMin: number | null
  /** Inclusive max daily price (PHP); omit or very large to disable. */
  priceMax: number | null
  /** Case-insensitive substring match on {@link ExploreMapListing.vehicle.locationName}. */
  locationQuery: string
}

/**
 * Applies vehicle-type / nearby filters, then optional price and location search (for /map toolbar).
 */
export function applyExploreMapFilters(
  listings: ExploreMapListing[],
  mode: ExploreMapFilterMode,
  userLocation: LatLng | null,
  advanced?: ExploreMapAdvancedFilters,
): ExploreMapListing[] {
  let out = filterExploreListings(listings, mode, userLocation)
  if (!advanced) return out
  const { priceMin, priceMax, locationQuery } = advanced
  if (priceMin != null && priceMin > 0) {
    out = out.filter((l) => l.vehicle.pricePerDay >= priceMin)
  }
  if (priceMax != null && priceMax > 0) {
    out = out.filter((l) => l.vehicle.pricePerDay <= priceMax)
  }
  const q = locationQuery.trim().toLowerCase()
  if (q) {
    out = out.filter((l) => l.vehicle.locationName.toLowerCase().includes(q))
  }
  return out
}
