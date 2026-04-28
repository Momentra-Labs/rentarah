/**
 * Default basemap: **Carto Voyager** — labeled streets, tinted water/parks/landuse (livelier than flat gray).
 * Price badges and clusters stay the hero contrast on top.
 */
export const RENTARA_MAP_TILE_URL =
  'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'

/**
 * Alternative: Carto **Positron** — muted grayscale when you want maximum neutrality (e.g. dense data viz).
 */
export const RENTARA_MAP_TILE_URL_POSITRON =
  'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'

/** @deprecated Use {@link RENTARA_MAP_TILE_URL} — Voyager is now the default product basemap. */
export const RENTARA_MAP_TILE_URL_VOYAGER = RENTARA_MAP_TILE_URL

/** Use only if you re-enable default Leaflet `attributionControl`. */
export const RENTARA_MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noreferrer" target="_blank">OpenStreetMap</a> · <a href="https://carto.com/attributions/" rel="noreferrer" target="_blank">CARTO</a>'

/** Matches pins / primary UI for route lines and user dot */
export const RENTARA_MAP_PRIMARY = '#1A56DB'
