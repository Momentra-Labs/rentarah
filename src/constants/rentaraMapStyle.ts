/**
 * Basemap: Carto **Voyager** — more color and contrast than Positron (parks, water, land read clearly).
 * Leaflet’s default attribution control stays off; tiles are OSM-derived per CARTO terms.
 * Single host (no `{s}`) avoids rare subdomain / template issues in bundled Leaflet.
 * @see https://carto.com/basemaps/
 */
export const RENTARA_MAP_TILE_URL =
  'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'

/** Use only if you re-enable default Leaflet `attributionControl`. */
export const RENTARA_MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noreferrer" target="_blank">OpenStreetMap</a> · <a href="https://carto.com/attributions/" rel="noreferrer" target="_blank">CARTO</a>'

/** Matches pins / primary UI for route lines and user dot */
export const RENTARA_MAP_PRIMARY = '#1A56DB'
