/**
 * Basemap: Carto **Voyager** — more color and contrast than Positron (parks, water, land read clearly).
 * On-map Leaflet attribution is off; see {@link MapAttributionNote} (legal credit below the map).
 * @see https://carto.com/basemaps/
 */
export const RENTARA_MAP_TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'

/** Use only if you re-enable default Leaflet attribution. Prefer `MapAttributionNote` below the map. */
export const RENTARA_MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noreferrer" target="_blank">OpenStreetMap</a> · <a href="https://carto.com/attributions/" rel="noreferrer" target="_blank">CARTO</a>'

/** Matches pins / primary UI for route lines and user dot */
export const RENTARA_MAP_PRIMARY = '#1A56DB'
