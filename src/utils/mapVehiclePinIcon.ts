import L from 'leaflet'

import { RENTARA_MAP_PRIMARY } from '../constants/rentaraMapStyle'
import type { VehicleType } from '../types'
import { isValidVehicleType } from './vehicleUtils'

const PRIMARY = RENTARA_MAP_PRIMARY

/** MUI 24x24 `path` `d` values (Material Icons) */
const SVGS: Record<VehicleType, string> = {
  car: `<path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16m11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5M5 11l1.5-4.5h11L19 11z" fill="white"/>`,
  motorcycle: `<path d="M20 11c-.18 0-.36.03-.53.05L17.41 9H20V6l-3.72 1.86L13.41 5H9v2h3.59l2 2H11l-4 2-2-2H0v2h4c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4l2 2h3l3.49-6.1 1.01 1.01c-.91.73-1.5 1.84-1.5 3.09 0 2.21 1.79 4 4 4s4-1.79 4-4-1.79-4-4-4M4 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2m16 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2" fill="white"/>`,
  scooter: `<path d="M19 5c0-1.1-.9-2-2-2h-3v2h3v2.65L13.52 12H10V7H6c-2.21 0-4 1.79-4 4v3h2c0 1.66 1.34 3 3 3s3-1.34 3-3h4.48L19 8.35zM7 15c-.55 0-1-.45-1-1h2c0 .55-.45 1-1 1" fill="white"/><path d="M5 4h5v2H5zm14 7c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3m0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1M7 20h4v-2l6 3h-4v2z" fill="white"/>`,
  bigbike: `<path d="M12 11.39c0-.65-.39-1.23-.98-1.48L5.44 7.55c-1.48 1.68-2.32 3.7-2.8 5.45h7.75c.89 0 1.61-.72 1.61-1.61" fill="white"/><path d="M21.96 11.22c-.41-4.41-4.56-7.49-8.98-7.2-2.51.16-4.44.94-5.93 2.04l4.74 2.01c1.33.57 2.2 1.87 2.2 3.32 0 1.99-1.62 3.61-3.61 3.61H2.21C2 16.31 2 17.2 2 17.2v.8c0 1.1.9 2 2 2h10c4.67 0 8.41-4.01 7.96-8.78" fill="white"/>`,
}

const cache = new Map<string, L.DivIcon>()

function normalizeType(v: string | undefined | null): VehicleType {
  if (v && isValidVehicleType(v)) return v
  return 'car'
}

/**
 * Map marker: car vs motorcycle / scooter / big bike glyphs on the Rentara pin.
 */
export function getRentaraVehiclePinIcon(vehicleType: string | undefined | null, selected: boolean): L.DivIcon {
  const vt = normalizeType(vehicleType)
  const key = `${vt}-${selected ? 's' : 'n'}`
  const hit = cache.get(key)
  if (hit) return hit

  const ring = selected ? `0 0 0 3px #fff, 0 0 0 5px ${PRIMARY}` : '0 2px 8px rgba(0,0,0,0.22)'
  const inner = SVGS[vt]
  const html = `<div style="width:30px;height:30px;border-radius:50%;background:${PRIMARY};border:3px solid #fff;box-shadow:${ring};display:flex;align-items:center;justify-content:center;transform:translate(0,0)">
<svg viewBox="0 0 24 24" width="17" height="17" style="display:block" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">${inner}</svg>
</div>`

  const icon = L.divIcon({
    className: 'rentara-explore-pin rentara-vehicle-pin',
    html,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -14],
  })
  cache.set(key, icon)
  return icon
}
