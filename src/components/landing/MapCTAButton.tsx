import MapOutlined from '@mui/icons-material/MapOutlined'
import { Button } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { ReactNode } from 'react'
import type { SxProps, Theme } from '@mui/material/styles'
import { Link as RouterLink } from 'react-router-dom'

export type MapCTAButtonProps = {
  variant?: 'hero' | 'inline'
  /** Opens the dedicated map route (default). Ignored if `scrollToId` is set. */
  to?: string
  /** Smooth-scroll to a map section on the current page (e.g. landing preview id). */
  scrollToId?: string
  children?: ReactNode
  sx?: SxProps<Theme>
}

const heroSx: SxProps<Theme> = {
  py: { xs: 1.15, sm: 1.35 },
  px: { xs: 2, sm: 2.5 },
  minHeight: { xs: 48, sm: 42 },
  borderRadius: { xs: 2.5, sm: 2 },
  fontSize: { xs: '0.9375rem', sm: '1rem' },
  fontWeight: 700,
  boxShadow: (t) => `0 4px 14px ${alpha(t.palette.primary.main, 0.35)}`,
  '&:hover': {
    boxShadow: (t) => `0 6px 20px ${alpha(t.palette.primary.main, 0.4)}`,
  },
}

/**
 * Routes to `/map` or scrolls to an in-page map anchor — shared by hero, toolbars, etc.
 */
export default function MapCTAButton({
  variant = 'inline',
  to = '/map',
  scrollToId,
  children = 'View rentals on map',
  sx: sxProp,
}: MapCTAButtonProps) {
  const isHero = variant === 'hero'
  const heroMerged: SxProps<Theme> | undefined = isHero ? ([heroSx, sxProp] as SxProps<Theme>) : sxProp

  if (scrollToId) {
    return (
      <Button
        type="button"
        variant={isHero ? 'contained' : 'outlined'}
        color="primary"
        size={isHero ? 'large' : 'medium'}
        startIcon={<MapOutlined />}
        onClick={() =>
          document.getElementById(scrollToId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        sx={heroMerged}
      >
        {children}
      </Button>
    )
  }

  return (
    <Button
      component={RouterLink}
      to={to}
      variant={isHero ? 'contained' : 'outlined'}
      color="primary"
      size={isHero ? 'large' : 'medium'}
      startIcon={<MapOutlined />}
      sx={heroMerged}
    >
      {children}
    </Button>
  )
}
