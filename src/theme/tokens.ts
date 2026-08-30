/** RentaraH design tokens — single source for theme, CSS vars, and pageStyles. */

export const RH_PRIMARY = '#1A56DB'
export const RH_PRIMARY_DARK = '#1549c2'
export const RH_PRIMARY_LIGHT = '#EFF6FF'

/** Radius ladder (px) */
export const rhRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const

/** Elevation ladder */
export const rhElev = {
  elev1: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
  elev2: '0 4px 16px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.08)',
  elev3: '0 20px 60px rgba(0,0,0,0.18)',
} as const

export const rhFocusRing = `0 0 0 3px rgba(26, 86, 219, 0.28)`
