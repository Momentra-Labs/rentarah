import { RENTARA_MAP_PRIMARY } from '../constants/rentaraMapStyle'

const PRIMARY = RENTARA_MAP_PRIMARY
/** Distinct from map / car blue so two-wheelers read at a glance on pins and clusters. */
const TWO_WHEELER_GLYPH = '#6d28d9'

/** Material-style car (24×24 viewBox). */
const D_CAR =
  'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16m11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5M5 11l1.5-4.5h11L19 11z'

/** Material-style motorcycle (24×24 viewBox). */
const D_MOTO =
  'M20 11c-.18 0-.36.03-.53.05L17.41 9H20V6l-3.72 1.86L13.41 5H9v2h3.59l2 2H11l-4 2-2-2H0v2h4c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4l2 2h3l3.49-6.1 1.01 1.01c-.91.73-1.5 1.84-1.5 3.09 0 2.21 1.79 4 4 4s4-1.79 4-4-1.79-4-4-4M4 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2m16 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2'

export function exploreMapVehicleGlyphSvg(bucket: 'car' | 'two_wheeler', px: number): string {
  const fill = bucket === 'car' ? PRIMARY : TWO_WHEELER_GLYPH
  const d = bucket === 'car' ? D_CAR : D_MOTO
  return `<svg viewBox="0 0 24 24" width="${px}" height="${px}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="${d}" fill="${fill}"/></svg>`
}

/** Rounded chip used inside price pills so car vs motorcycle is obvious before tap. */
export function exploreMapGlyphChipHtml(bucket: 'car' | 'two_wheeler'): string {
  const bg = bucket === 'car' ? 'rgba(26,86,219,0.1)' : 'rgba(109,40,217,0.12)'
  return `<span style="flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:9px;background:${bg}">${exploreMapVehicleGlyphSvg(bucket, 14)}</span>`
}
