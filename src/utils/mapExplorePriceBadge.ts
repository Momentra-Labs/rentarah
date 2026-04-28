import L from 'leaflet'

import { RENTARA_MAP_PRIMARY } from '../constants/rentaraMapStyle'
import { exploreMapGlyphChipHtml } from './mapExploreMarkerGlyph'

const PRIMARY = RENTARA_MAP_PRIMARY

export type ExploreMapVehicleBucket = 'car' | 'two_wheeler'

/** Short peso label for map badges (matches MapPage helper). */
export function formatExplorePriceDayShort(n: number): string {
  if (n >= 1000) return `₱${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return `₱${n}`
}

const cache = new Map<string, L.DivIcon>()

/**
 * Pill marker: vehicle glyph + “₱3.5k/day” (car vs motorcycle readable at a glance).
 * @param highlighted Listing-row hover (desktop): lift + primary-tint ring; ignored when `selected`.
 */
export function getExploreMapPriceBadgeIcon(
  pricePerDay: number,
  selected: boolean,
  vehicleBucket: ExploreMapVehicleBucket = 'car',
  highlighted = false,
): L.DivIcon {
  const main = formatExplorePriceDayShort(pricePerDay)
  const hi = highlighted && !selected ? '1' : '0'
  const key = `v3-${main}-${selected ? '1' : '0'}-h${hi}-${vehicleBucket}`
  const hit = cache.get(key)
  if (hit) return hit

  const glyph = exploreMapGlyphChipHtml(vehicleBucket)
  const w = Math.min(148, Math.round(58 + main.length * 7.5))
  const h = 30
  const ring = selected
    ? `0 4px 8px rgba(0,0,0,0.12), 0 0 0 2px ${PRIMARY}`
    : highlighted
      ? `0 6px 14px rgba(0,0,0,0.14), 0 0 0 2px rgba(26,86,219,0.35)`
      : '0 4px 6px rgba(0,0,0,0.1)'
  const border = selected
    ? `2px solid ${PRIMARY}`
    : highlighted
      ? `1.5px solid rgba(26,86,219,0.42)`
      : '1px solid rgba(15,23,42,0.14)'
  const html = `<div class="rentara-price-badge-inner" style="box-sizing:border-box;min-width:${w}px;height:${h}px;padding:0 8px 0 4px;border-radius:999px;background:#fff;border:${border};box-shadow:${ring};display:flex;align-items:center;justify-content:center;gap:6px;font-family:system-ui,-apple-system,sans-serif;font-size:12px;line-height:1;color:#0f172a;white-space:nowrap;animation:rentara-pin-enter 0.35s cubic-bezier(0.34,1.56,0.64,1) both">
${glyph}<span style="display:flex;align-items:baseline;gap:2px"><span style="font-weight:800">${main}</span><span style="font-weight:600;font-size:10px;color:#475569">/day</span></span>
</div>`

  const icon = L.divIcon({
    className: 'rentara-explore-pin rentara-price-badge-pin',
    html,
    iconSize: [w, h],
    iconAnchor: [Math.round(w / 2), h],
    popupAnchor: [0, -h - 2],
  })
  cache.set(key, icon)
  return icon
}
