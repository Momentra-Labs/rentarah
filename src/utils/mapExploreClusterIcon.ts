import L from 'leaflet'

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
 * clustering). Default in leaflet.markercluster is 80 — we stayed below that for readability.
 */
export const RENTARA_CLUSTER_MAX_RADIUS_PX = 76

/** Macro vs micro cluster styling: fewer than this many markers ⇒ micro style. */
export const RENTARA_CLUSTER_MICRO_STYLE_BELOW_N = 5

/**
 * leaflet.markercluster `iconCreateFunction(cluster)` receives a MarkerClusterGroup-compatible cluster.
 */
export interface RentaraClusterLike {
  getChildCount(): number
}

/** Light sky → deep Renta blue — macro clusters (density). */
export function densityBlueGradient(childCount: number): { fill: string; stroke: string } {
  const t = Math.min(1, Math.log1p(childCount) / Math.log1p(80))
  const r = Math.round(147 + (26 - 147) * t)
  const g = Math.round(197 + (86 - 197) * t)
  const b = Math.round(253 + (219 - 253) * t)
  const fill = `rgb(${r}, ${g}, ${b})`
  const stroke = `rgba(15, 23, 42, ${0.2 + t * 0.25})`
  return { fill, stroke }
}

function microClusterDims(n: number): {
  fill: string
  stroke: string
  w: number
  h: number
  numFs: number
  capFs: number
} {
  return {
    fill: '#0d9488',
    stroke: 'rgba(13,148,136,0.95)',
    w: Math.max(40, Math.min(52, 30 + String(n).length * 12)),
    h: 38,
    numFs: n >= 100 ? 12 : 13,
    capFs: 7,
  }
}

function macroClusterDims(n: number): {
  fill: string
  stroke: string
  w: number
  h: number
  numFs: number
  capFs: number
} {
  const { fill, stroke } = densityBlueGradient(n)
  const digits = String(n).length
  const w = Math.min(76, Math.max(52, 38 + digits * 10))
  const h = 46
  const numFs = n >= 100 ? 14 : n >= 10 ? 15 : 16
  return { fill, stroke, w, h, numFs, capFs: digits >= 3 ? 7 : 8 }
}

/**
 * Cluster “mini card”: count + caption so clusters read as “grouped rentals”, not opaque dots.
 */
export function createRentaraDensityClusterIcon(cluster: RentaraClusterLike): L.DivIcon {
  const n = cluster.getChildCount()
  const micro = n < RENTARA_CLUSTER_MICRO_STYLE_BELOW_N
  const d = micro ? microClusterDims(n) : macroClusterDims(n)
  const { fill, stroke, w, h, numFs, capFs } = d

  const captionMicro = 'Nearby'
  const captionMacro = 'Rentals'
  const caption = micro ? captionMicro : captionMacro

  const pluralN = `${n}`
  const aria = `${
    n === 1
      ? 'One rental grouped in this circle'
      : `${pluralN} rentals grouped together in this circle`
  }. Tap the cluster or zoom in to browse individual ₱ pins.`
  const hoverTitle =
    n === 1
      ? `1 rental clustered here · Tap circle to zoom in on this area`
      : `${pluralN} rentals clustered in this circle · Tap to zoom in closer`

  const microClass = micro ? 'rentara-cluster-icon--micro' : 'rentara-cluster-icon--macro'
  const borderW = micro ? 1.5 : 2
  const shadow = micro
    ? '0 2px 8px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,0.35)'
    : '0 2px 12px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.35)'

  const html = `
<div class="rentara-cluster-icon ${microClass}"
  aria-label="${aria.replace(/"/g, '&quot;')}"
  title="${hoverTitle.replace(/"/g, '&quot;')}"
  style="
  box-sizing:border-box;
  width:${w}px;
  min-height:${h}px;
  border-radius:${Math.round(Math.min(w, h) / 2)}px;
  background:${fill};
  border:${borderW}px solid ${stroke};
  box-shadow:${shadow};
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:1px;
  padding:6px ${micro ? '7px' : '9px'};
  cursor:pointer;
  font-family:system-ui,-apple-system,sans-serif;
  font-weight:800;
  line-height:1;
  color:#fff;
">
  <span class="rentara-cluster-count" style="
    font-size:${numFs}px;
    letter-spacing:-0.02em;
    text-shadow:0 1px 2px rgba(0,0,0,${micro ? '0.2' : '0.22'});
  ">${n}</span>
  <span class="rentara-cluster-caption" style="
    font-size:${capFs}px;
    font-weight:700;
    letter-spacing:${micro ? '0.1em' : '0.12em'};
    text-transform:uppercase;
    opacity:0.95;
    white-space:nowrap;
    margin-top:${micro ? '-1px' : '0'};
    text-shadow:0 1px 1px rgba(0,0,0,0.15);
  ">${caption}</span>
</div>`.trim()

  return L.divIcon({
    className: 'rentara-cluster-marker rentara-cluster-marker--pill',
    html,
    iconSize: [w, h],
    iconAnchor: [Math.round(w / 2), Math.round(h / 2)],
  })
}
