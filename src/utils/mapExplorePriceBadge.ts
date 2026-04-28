import L from 'leaflet'

import { exploreMapGlyphChipHtml } from './mapExploreMarkerGlyph'

export type ExploreMapVehicleBucket = 'car' | 'two_wheeler'

/** Short peso label for map badges (matches MapPage helper). */
export function formatExplorePriceDayShort(n: number): string {
  if (n >= 1000) return `₱${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return `₱${n}`
}

const cache = new Map<string, L.DivIcon>()

/**
 * Horizontal price tag (`L.divIcon`): glyph + short price — styled via `.rentara-price-tag-inner*` in index.css.
 * @param highlighted Listing-row hover (desktop): lift tint; ignored when `selected`.
 */
export function getExploreMapPriceBadgeIcon(
  pricePerDay: number,
  selected: boolean,
  vehicleBucket: ExploreMapVehicleBucket = 'car',
  highlighted = false,
): L.DivIcon {
  const main = formatExplorePriceDayShort(pricePerDay)
  const hi = highlighted && !selected ? '1' : '0'
  const bucketClass =
    vehicleBucket === 'two_wheeler' ? 'rentara-price-tag-inner--motor' : 'rentara-price-tag-inner--car'
  const key = `v5-${main}-${selected ? '1' : '0'}-h${hi}-${vehicleBucket}`
  const hit = cache.get(key)
  if (hit) return hit

  const glyph = exploreMapGlyphChipHtml(vehicleBucket)
  let stateClass = 'rentara-price-tag-inner'
  if (selected) stateClass += ' rentara-price-tag-inner--selected'
  else if (highlighted) stateClass += ' rentara-price-tag-inner--strip-hover'

  const w = Math.min(148, Math.round(58 + main.length * 7.5))
  const h = 30
  const html = `<div class="${stateClass} ${bucketClass}" style="width:${w}px;height:${h}px">${glyph}<span class="rentara-price-tag-price"><span class="rentara-price-tag-amount">${main}</span><span class="rentara-price-tag-unit">/day</span></span></div>`

  const icon = L.divIcon({
    className: 'rentara-explore-pin rentara-price-badge-pin rentara-price-tag-pin',
    html,
    iconSize: [w, h],
    iconAnchor: [Math.round(w / 2), h],
    popupAnchor: [0, -h - 2],
  })
  cache.set(key, icon)
  return icon
}
