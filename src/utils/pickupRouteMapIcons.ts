import L from 'leaflet'

/** Renter — “you are here” */
const YOU_BG = 'linear-gradient(160deg, #1e88e5 0%, #0d47a0 100%)'
/** Host — strong orange (no stroke: stroke + fill can fail to render) */
const PICKUP = '#e65100'

/** Material `MyLocation` (24) */
const MY_LOC_PATH =
  'M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4m8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7'

/** Material `Place` 24x24 (fill only — inner path cuts the hole) */
const PLACE_PATH =
  'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'

let cachedYou: L.DivIcon | null = null
let cachedPickup: L.DivIcon | null = null

export function getRenterUserLocationMapIcon(): L.DivIcon {
  if (cachedYou) return cachedYou
  const html = `<div class="rentara-pickup-route-icon rentara-pickup-route-you" style="width:40px;height:40px;border-radius:50%;background:${YOU_BG};border:3px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center" aria-hidden="true">
<svg viewBox="0 0 24 24" width="22" height="22" fill="#fff" xmlns="http://www.w3.org/2000/svg"><path d="${MY_LOC_PATH}"/></svg>
</div>`
  cachedYou = L.divIcon({
    className: 'rentara-pickup-route-icon',
    html,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  })
  return cachedYou
}

/**
 * Large, solid place pin + white rim so it reads on Voyager / route lines.
 */
export function getHostPickupMapIcon(): L.DivIcon {
  if (cachedPickup) return cachedPickup
  const html = `<div class="rentara-pickup-route-icon rentara-pickup-route-pickup" style="width:48px;height:48px;display:flex;align-items:flex-end;justify-content:center" aria-hidden="true">
<svg viewBox="0 0 24 24" width="48" height="48" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.32));display:block" xmlns="http://www.w3.org/2000/svg" overflow="visible">
<path d="${PLACE_PATH}" fill="${PICKUP}"/>
</svg>
</div>`
  cachedPickup = L.divIcon({
    className: 'rentara-pickup-route-icon',
    html,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -44],
  })
  return cachedPickup
}
