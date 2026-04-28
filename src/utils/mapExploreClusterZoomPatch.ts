import L from 'leaflet'
import 'leaflet.markercluster'

import {
  RENTARA_CLUSTER_CLICK_BOOST_MIN_PREV_ZOOM,
  RENTARA_CLUSTER_CLICK_EXTRA_ZOOM_LEVELS,
  RENTARA_EXPLORE_STREET_ZOOM_AFTER_CLUSTER,
} from './mapExploreClusterIcon'

let zoomBoundsPatched = false

type MarkerLike = L.Marker & {
  _group?: { _map?: L.Map | null }
  zoomToBounds(opts?: L.FitBoundsOptions): void
}

/**
 * leaflet.markercluster’s MarkerCluster `#zoomToBounds` only bumps +1 zoom when markers are
 * still spatially tight (see library source ~1483). That leaves ₱ pills stacked. After the
 * canonical zoom animation, optionally add one extra level — but only once the user is already
 * “late” in the zoom range (near street level), so early cluster clicks behave normally.
 *
 * Safe to call once per app surface that mounts clustering (idempotent).
 */
export function installExploreMarkerClusterZoomBoundsBoost(): void {
  if (zoomBoundsPatched) return
  const Mc = (
    L as unknown as {
      MarkerCluster?: { prototype: MarkerLike & { zoomToBounds: (opts?: L.FitBoundsOptions) => void } }
    }
  ).MarkerCluster
  const proto = Mc?.prototype
  if (!proto?.zoomToBounds) return

  const original = proto.zoomToBounds as (this: MarkerLike, opts?: L.FitBoundsOptions) => void

  proto.zoomToBounds = function patchedZoomToBounds(fitBoundsOptions?: L.FitBoundsOptions) {
    const map = this._group?._map
    const prevZ = map?.getZoom()
    original.call(this, fitBoundsOptions)
    if (map == null || prevZ === undefined || Number.isNaN(prevZ)) return

    map.once('moveend', () => {
      const z = map.getZoom()
      const maxZ = typeof map.getMaxZoom() === 'number' ? map.getMaxZoom() : 18
      const delta = z - prevZ
      const tightSingleStep = delta === 1
      const alreadyDeepEnough = prevZ >= RENTARA_CLUSTER_CLICK_BOOST_MIN_PREV_ZOOM
      const roomBeforeStreetCap = z < RENTARA_EXPLORE_STREET_ZOOM_AFTER_CLUSTER
      const canZoomMore = z + RENTARA_CLUSTER_CLICK_EXTRA_ZOOM_LEVELS <= maxZ

      if (tightSingleStep && alreadyDeepEnough && roomBeforeStreetCap && canZoomMore) {
        map.setZoom(Math.min(maxZ, z + RENTARA_CLUSTER_CLICK_EXTRA_ZOOM_LEVELS), { animate: true })
      }
    })
  }

  zoomBoundsPatched = true
}
