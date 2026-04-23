import type { LatLng } from './distance'

export type DrivingRoute = {
  /** Leaflet / react-leaflet positions: [lat, lng][] */
  positions: [number, number][]
  /** Route length along roads (km), 1 decimal */
  distanceKm: number
}

/**
 * Driving geometry via OSRM demo server (OSM road network). Same family of data Google Maps uses for routing.
 * @see https://project-osrm.org/
 */
export async function fetchOsrmDrivingRoute(
  from: LatLng,
  to: LatLng,
  signal?: AbortSignal,
): Promise<DrivingRoute | null> {
  const path = `${from.lng},${from.lat};${to.lng},${to.lat}`
  const url = `https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson`
  const res = await fetch(url, { signal })
  if (!res.ok) return null
  const data = (await res.json()) as {
    code: string
    routes?: Array<{ distance: number; geometry: { coordinates: [number, number][] } }>
  }
  if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates?.length) return null
  const r = data.routes[0]
  const positions: [number, number][] = r.geometry.coordinates.map(([lng, lat]) => [lat, lng])
  if (positions.length < 2) return null
  const distanceKm = Math.round((r.distance / 1000) * 10) / 10
  return { positions, distanceKm }
}
