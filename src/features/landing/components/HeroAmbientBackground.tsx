import { Box, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'

/**
 * Static hero wash — animated blurs + Framer loops were desktop-janky (large viewport + persistent compositing).
 * Same look family as the old reduced-motion / mobile path.
 */
export default function HeroAmbientBackground() {
  const theme = useTheme()
  const p = theme.palette.primary.main

  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        background: `radial-gradient(ellipse 120% 80% at 20% 10%, ${alpha(p, 0.1)} 0%, transparent 50%),
          radial-gradient(ellipse 90% 70% at 90% 75%, ${alpha(p, 0.06)} 0%, transparent 45%)`,
      }}
    />
  )
}
