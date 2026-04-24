/** Default area in search UI when none is set (capital region aggregate). */
export const DEFAULT_SEARCH_LOCATION = 'Metro Manila'

/** True when the query should match every listing’s city (nationwide browse). */
export function isNationalLocationQuery(raw: string): boolean {
  const n = raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
  return n === 'philippines' || n === 'ph' || n === 'pilipinas'
}
