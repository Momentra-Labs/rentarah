import { useMediaQuery, useTheme } from '@mui/material'
import { useReducedMotion } from 'framer-motion'

/**
 * Use cheaper motion (opacity-only, shorter durations, fewer scroll observers)
 * on viewports below `md` and when the user prefers reduced motion — improves mobile FPS.
 */
export function useMobileLightMotion(): boolean {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true })
  const reducedMotion = useReducedMotion()
  return Boolean(reducedMotion || isMobile)
}
