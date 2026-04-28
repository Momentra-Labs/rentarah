import L from 'leaflet'

import { RENTARA_MAP_PRIMARY } from '../constants/rentaraMapStyle'
import { formatExplorePriceDayShort } from './mapExplorePriceBadge'
import { exploreMapVehicleGlyphSvg } from './mapExploreMarkerGlyph'

const PRIMARY = RENTARA_MAP_PRIMARY

type ClusterLike = {
  getChildCount: () => number
  getAllChildMarkers: () => L.Marker[]
}

/**
 * Cluster marker: count + car / motorcycle cue (Airbnb-style “you know what’s grouped”).
 * Reads `exploreVehicleBucket` from child markers (set on explore map markers).
 */
export function createRentaraExploreClusterIcon(cluster: ClusterLike): L.DivIcon {
  const count = cluster.getChildCount()
  const markers = cluster.getAllChildMarkers()
  let cars = 0
  let twoWheelers = 0
  const prices: number[] = []
  for (const m of markers) {
    const b = m.options.exploreVehicleBucket
    if (b === 'two_wheeler') twoWheelers += 1
    else cars += 1
    const p = m.options.explorePricePerDay
    if (typeof p === 'number' && !Number.isNaN(p)) prices.push(p)
  }
  const minPrice = prices.length > 0 ? Math.min(...prices) : null

  const mixed = cars > 0 && twoWheelers > 0
  const onlyCars = cars > 0 && twoWheelers === 0
  const only2w = twoWheelers > 0 && cars === 0

  let label: string
  if (onlyCars) label = count === 1 ? 'car' : 'cars'
  else if (only2w) label = count === 1 ? 'motorcycle' : 'motorcycles'
  else label = 'vehicles'

  const title = minPrice != null ? `${count} ${label} · from ${formatExplorePriceDayShort(minPrice)}/day` : `${count} ${label}`

  let iconsHtml: string
  if (onlyCars) {
    iconsHtml = `<div style="display:flex;align-items:center">${exploreMapVehicleGlyphSvg('car', 16)}</div>`
  } else if (only2w) {
    iconsHtml = `<div style="display:flex;align-items:center">${exploreMapVehicleGlyphSvg('two_wheeler', 16)}</div>`
  } else {
    iconsHtml = `<div style="display:flex;align-items:center">
      <span style="display:flex;margin-right:-7px;z-index:1">${exploreMapVehicleGlyphSvg('car', 14)}</span>
      <span style="display:flex;z-index:2">${exploreMapVehicleGlyphSvg('two_wheeler', 14)}</span>
    </div>`
  }

  const w = mixed ? 92 : minPrice != null ? 90 : 80
  const h = minPrice != null ? 52 : 48
  const subline = minPrice != null
    ? `<span style="font-size:10px;font-weight:700;line-height:1.25;text-align:center;color:#64748b;max-width:200px;padding:0 4px"><span style="color:${PRIMARY}">From ${formatExplorePriceDayShort(minPrice)}</span><span style="font-weight:650">/day</span><span style="color:#cbd5e1"> · </span><span style="text-transform:uppercase;letter-spacing:0.04em;font-size:9px">${label}</span></span>`
    : `<span style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;line-height:1">${label}</span>`

  const html = `<div title="${title.replace(/"/g, '&quot;')}" style="box-sizing:border-box;min-width:${w}px;padding:8px 10px 7px;border-radius:16px;background:#fff;border:2px solid ${PRIMARY};box-shadow:0 2px 14px rgba(15,23,42,0.2);display:flex;flex-direction:column;align-items:center;gap:4px;font-family:system-ui,-apple-system,sans-serif">
  <div style="display:flex;align-items:center;gap:7px;line-height:1">
    ${iconsHtml}
    <span style="font-weight:800;font-size:15px;color:#0f172a">${count}</span>
  </div>
  ${subline}
</div>`

  return L.divIcon({
    className: 'rentara-map-cluster rentara-map-cluster-rich',
    html,
    iconSize: [w, h],
    iconAnchor: [w / 2, h / 2],
  })
}
