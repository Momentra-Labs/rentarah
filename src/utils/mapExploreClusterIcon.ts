import L from 'leaflet'

import { formatExplorePriceDayShort } from './mapExplorePriceBadge'
import { exploreMapVehicleGlyphSvg } from './mapExploreMarkerGlyph'

/** Show individual price-tag pins starting at this map zoom (≥). Leaflet.markercluster uses `− 1` for its internal grid ceiling. */
export const RENTARA_CLUSTER_DISABLE_AT_MAP_ZOOM = 17

/**
 * After a cluster click, we may add extra zoom (see `mapExploreClusterZoomPatch`) so stacked ₱
 * badges separate; stop nudging at this level to match explore “street” framing.
 */
export const RENTARA_EXPLORE_STREET_ZOOM_AFTER_CLUSTER = 18

/**
 * Only apply the post-click zoom nudge once the map was already this far in — avoids stacking
 * extra zoom on coarse (country‑wide) cluster steps.
 */
export const RENTARA_CLUSTER_CLICK_BOOST_MIN_PREV_ZOOM = 12

/** Bonus zoom applied after a tight leaflet.markercluster `zoomToBounds(+1)` step. */
export const RENTARA_CLUSTER_CLICK_EXTRA_ZOOM_LEVELS = 1

/**
 * Pixel radius used by DistanceGrid: larger ⇒ nearby pins merge into a cluster sooner (more
 * clustering). Sized so ~100px-wide cluster pills (count + "from ₱X" + mix) don't overlap neighbours.
 */
export const RENTARA_CLUSTER_MAX_RADIUS_PX = 92

/**
 * leaflet.markercluster `iconCreateFunction(cluster)` receives a MarkerClusterGroup-compatible cluster.
 */
export interface RentaraClusterLike {
  getChildCount(): number
  getAllChildMarkers(): L.Marker[]
}

/** Size tier: drives the count bubble size and the density halo (see `.rentara-cluster` in index.css). */
function clusterTier(n: number): 'sm' | 'md' | 'lg' {
  if (n < 5) return 'sm'
  if (n < 15) return 'md'
  return 'lg'
}

const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** Most common pickup area among children, trimmed to the city part ("Makati, Metro Manila" → "Makati"). */
function dominantArea(markers: L.Marker[]): string | null {
  const counts = new Map<string, number>()
  for (const m of markers) {
    const label = m.options.explorePickupAreaLabel?.split(',')[0]?.trim()
    if (label) counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  let best: string | null = null
  let bestN = 0
  for (const [label, c] of counts) {
    if (c > bestN) {
      best = label
      bestN = c
    }
  }
  return best
}

/**
 * Cluster pill: count bubble + "from ₱X" (cheapest inside) + car / two-wheeler mix, so a cluster answers
 * "how many, how cheap, what kind" before the user zooms in. One style for every size; bigger groups get a halo.
 */
export function createRentaraDensityClusterIcon(cluster: RentaraClusterLike): L.DivIcon {
  const n = cluster.getChildCount()
  const markers = cluster.getAllChildMarkers()

  let cars = 0
  let bikes = 0
  let minPrice = Infinity
  for (const m of markers) {
    if (m.options.exploreVehicleBucket === 'two_wheeler') bikes += 1
    else cars += 1
    const p = m.options.explorePricePerDay
    if (typeof p === 'number' && p < minPrice) minPrice = p
  }
  const hasPrice = Number.isFinite(minPrice)
  const priceShort = hasPrice ? formatExplorePriceDayShort(minPrice) : null
  const area = dominantArea(markers)

  const mixPart = (bucket: 'car' | 'two_wheeler', label: string) =>
    `<span class="rentara-cluster__mix-item">${exploreMapVehicleGlyphSvg(bucket, 12)}${label}</span>`
  const mix =
    cars && bikes
      ? mixPart('car', String(cars)) + mixPart('two_wheeler', String(bikes))
      : bikes
        ? mixPart('two_wheeler', bikes === 1 ? 'Bike' : 'Bikes')
        : mixPart('car', cars === 1 ? 'Car' : 'Cars')

  const carsText = `${cars} car${cars === 1 ? '' : 's'}`
  const bikesText = `${bikes} two-wheeler${bikes === 1 ? '' : 's'}`
  const what = cars && bikes ? `${carsText} and ${bikesText}` : bikes ? bikesText : carsText
  const summary = [
    `${n} rental${n === 1 ? '' : 's'}${area ? ` around ${area}` : ''}`,
    what,
    priceShort ? `from ${priceShort}/day` : null,
  ]
    .filter(Boolean)
    .join(' · ')
  const label = `${summary}. Click to zoom in.`

  const html = `<div class="rentara-cluster" data-tier="${clusterTier(n)}" role="button" aria-label="${escapeAttr(label)}" title="${escapeAttr(label)}">
  <span class="rentara-cluster__count">${n}</span>
  <span class="rentara-cluster__body">
    ${priceShort ? `<span class="rentara-cluster__price"><span class="rentara-cluster__from">from</span>${priceShort}</span>` : ''}
    <span class="rentara-cluster__mix">${mix}</span>
  </span>
</div>`

  // Zero-size anchor at the cluster centre; the pill centres itself with CSS so its width can follow its content.
  return L.divIcon({
    className: 'rentara-cluster-marker rentara-cluster-marker--pill',
    html,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}
