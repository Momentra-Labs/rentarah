export type LatLng = { lat: number; lng: number }

const EARTH_RADIUS_KM = 6371

/**
 * Haversine distance between two WGS84 points (kilometers).
 */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = deg2rad(b.lat - a.lat)
  const dLng = deg2rad(b.lng - a.lng)
  const lat1 = deg2rad(a.lat)
  const lat2 = deg2rad(b.lat)
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return Math.round(EARTH_RADIUS_KM * c * 10) / 10
}

function deg2rad(d: number): number {
  return (d * Math.PI) / 180
}
