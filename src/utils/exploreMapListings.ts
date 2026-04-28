import { isNationalLocationQuery } from '../constants/geo'
import { resolveCityHallCoords } from '../data/ncrCityHalls'
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
    rating: number
    reviewCount: number
  }
  /** Client-only: source row for navigation; omit when wiring a real API. */
  _source: Car
}

export type ExploreMapFilterMode = 'all' | 'cars' | 'motorcycles' | 'nearby'

function exploreListingPickupHubKey(listing: ExploreMapListing): string {
  const c = resolveCityHallCoords(listing.vehicle.locationName)
  return `${c.lat.toFixed(6)},${c.lng.toFixed(6)}`
}

/** ~Earth meters per degree latitude (middle lat OK for PH ~10–17°). */
const METERS_PER_DEG_LAT = 111_320
const GOLDEN_ANGLE_SPREAD_RAD = Math.PI * (3 - Math.sqrt(5))

function offsetMetersToLatLng(
  latitude: number,
  eastMeters: number,
  northMeters: number,
): { dLat: number; dLng: number } {
  const cosLat = Math.cos((latitude * Math.PI) / 180)
  const clampedCos = Math.max(0.15, Math.abs(cosLat))
  return {
    dLat: northMeters / METERS_PER_DEG_LAT,
    dLng: eastMeters / (METERS_PER_DEG_LAT * clampedCos),
  }
}

/**
 * Multiple listings at the same pickup hub used to stack identical ₱ pills (micro-jitter is ~1 m;
 * badges are ~50–100 px). Place pins on a golden-angle spiral in meters around the hub center.
 */
function spreadExploreListingsByPickupHub(listings: ExploreMapListing[]): ExploreMapListing[] {
  const buckets = new Map<string, ExploreMapListing[]>()
  for (const l of listings) {
    const k = exploreListingPickupHubKey(l)
    const arr = buckets.get(k) ?? []
    arr.push(l)
    buckets.set(k, arr)
  }

  const out: ExploreMapListing[] = []
  for (const group of buckets.values()) {
    if (group.length === 1) {
      out.push(group[0]!)
      continue
    }
    const sorted = [...group].sort((a, b) => a.id.localeCompare(b.id))
    const hub = resolveCityHallCoords(sorted[0]!.vehicle.locationName)
    const n = sorted.length
    for (let i = 0; i < n; i++) {
      const listing = sorted[i]!
      const spiralM = 14 + 11 * Math.sqrt(i + 1)
      const theta = i * GOLDEN_ANGLE_SPREAD_RAD
      const eastM = spiralM * Math.cos(theta)
      const northM = spiralM * Math.sin(theta)
      const { dLat, dLng } = offsetMetersToLatLng(hub.lat, eastM, northM)
      out.push({
        ...listing,
        latitude: hub.lat + dLat,
        longitude: hub.lng + dLng,
      })
    }
  }
  return out
}

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
  const base = cars.map((car) => {
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
        rating: car.rating,
        reviewCount: car.reviewCount,
      },
      _source: car,
    }
  })
  return spreadExploreListingsByPickupHub(base)
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
/** Evenly sample listings so map previews stay light with large catalogs. */
export function sampleListingsForPreview<T>(items: T[], max: number): T[] {
  if (items.length <= max) return items
  const out: T[] = []
  const n = items.length
  for (let i = 0; i < max; i++) {
    out.push(items[Math.floor((i * n) / max)]!)
  }
  return out
}

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
  const qRaw = locationQuery.trim()
  const q = qRaw.toLowerCase()
  if (q && !isNationalLocationQuery(qRaw)) {
    out = out.filter((l) => l.vehicle.locationName.toLowerCase().includes(q))
  }
  return out
}

/**
 * Radius for strict geographic “nearby” helpers (e.g. future tight-radius UX).
 * Map prev/next uses {@link listingsInSamePickupCitySorted}.
 */
export const NEARBY_LISTINGS_RADIUS_KM = 6

function samePickupCityHall(a: ExploreMapListing, b: ExploreMapListing): boolean {
  const ca = resolveCityHallCoords(a.vehicle.locationName)
  const cb = resolveCityHallCoords(b.vehicle.locationName)
  return ca.lat === cb.lat && ca.lng === cb.lng
}

/**
 * Listings whose pickup location maps to the same hub as `center` ({@link resolveCityHallCoords}),
 * ordered by distance from `center` for map prev/next.
 */
export function listingsInSamePickupCitySorted(
  center: ExploreMapListing,
  listings: ExploreMapListing[],
): ExploreMapListing[] {
  const inCity = listings.filter((l) => samePickupCityHall(center, l))
  return listingsSortedByDistanceFrom(center, inCity)
}

/** Stable key for resolved pickup hub — used for marker metadata and same-city grouping helpers. */
export function pickupHubKeyForExploreListing(listing: ExploreMapListing): string {
  return exploreListingPickupHubKey(listing)
}

/** Truncated pickup line for marker metadata (same source as listing card location). */
export function shortPickupCityLineForCluster(locationName: string): string {
  const t = locationName.trim()
  if (!t) return 'this area'
  return t.length > 36 ? `${t.slice(0, 33)}…` : t
}

/**
 * All listings within `radiusKm` of `center` (inclusive), sorted by distance ascending (ties by id).
 * Includes `center` when it appears in `listings` (distance 0).
 */
export function listingsWithinRadiusKm(
  center: ExploreMapListing,
  listings: ExploreMapListing[],
  radiusKm: number = NEARBY_LISTINGS_RADIUS_KM,
): ExploreMapListing[] {
  const o: LatLng = { lat: center.latitude, lng: center.longitude }
  return listings
    .map((l) => ({
      l,
      d: haversineKm(o, { lat: l.latitude, lng: l.longitude }),
    }))
    .filter((x) => x.d <= radiusKm)
    .sort((a, b) => (a.d !== b.d ? a.d - b.d : a.l.id.localeCompare(b.l.id)))
    .map((x) => x.l)
}

/**
 * Every listing in `listings`, ordered by distance from `center` (ties by id).
 * Used by {@link listingsInSamePickupCitySorted}; also useful for generic distance ordering.
 */
export function listingsSortedByDistanceFrom(
  center: ExploreMapListing,
  listings: ExploreMapListing[],
): ExploreMapListing[] {
  const o: LatLng = { lat: center.latitude, lng: center.longitude }
  return [...listings]
    .map((l) => ({
      l,
      d: haversineKm(o, { lat: l.latitude, lng: l.longitude }),
    }))
    .sort((a, b) => (a.d !== b.d ? a.d - b.d : a.l.id.localeCompare(b.l.id)))
    .map((x) => x.l)
}
