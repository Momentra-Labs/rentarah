/**
 * Default basemap: **Esri World Street Map** — detail through ~z19 (no API key).
 * Light Gray Canvas is quieter but only has real tiles to ~z16; past that Esri returns
 * “Map data not yet available”. Brand tint lives in `index.css` on `.rentara-leaflet-surface`.
 *
 * Leaflet XYZ for ArcGIS: `/tile/{z}/{y}/{x}` (y before x).
 */
export const RENTARA_MAP_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'

/**
 * Quieter canvas (max useful detail ~z16). Prefer {@link RENTARA_MAP_TILE_URL} for deep zoom.
 */
export const RENTARA_MAP_TILE_URL_LIGHT_GRAY =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'

/** @deprecated Prefer {@link RENTARA_MAP_TILE_URL_LIGHT_GRAY}. */
export const RENTARA_MAP_TILE_URL_POSITRON = RENTARA_MAP_TILE_URL_LIGHT_GRAY

/** @deprecated Alias — same as {@link RENTARA_MAP_TILE_URL}. */
export const RENTARA_MAP_TILE_URL_VOYAGER = RENTARA_MAP_TILE_URL

/** Highest zoom with reliable Street Map tiles for PH. */
export const RENTARA_MAP_MAX_NATIVE_ZOOM = 19

/**
 * Map / TileLayer max zoom. Keep ≤ native so Leaflet never requests empty Esri placeholders.
 * Slight room above pin fly targets (18) without blank tiles.
 */
export const RENTARA_MAP_MAX_ZOOM = 19

/** Use only if you re-enable default Leaflet `attributionControl`. */
export const RENTARA_MAP_ATTRIBUTION =
  'Tiles &copy; <a href="https://www.esri.com/" rel="noreferrer" target="_blank">Esri</a>'

/** Matches pins / primary UI for route lines and user dot (`#1A56DB`) */
export const RENTARA_MAP_PRIMARY = '#1A56DB'
