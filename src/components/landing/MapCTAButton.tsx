import MapOutlined from '@mui/icons-material/MapOutlined'
import { Button } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'

export type MapCTAButtonProps = {
  variant?: 'hero' | 'inline'
  /** Opens the dedicated map route (default). Ignored if `scrollToId` is set. */
  to?: string
  /** Smooth-scroll to a map section on the current page (e.g. landing preview id). */
  scrollToId?: string
  children?: ReactNode
}

const heroSx = {
  py: 1.35,
  px: 2.5,
  borderRadius: 2,
  fontSize: '1rem',
  boxShadow: (t: { palette: { primary: { main: string } } }) =>
    `0 4px 14px ${alpha(t.palette.primary.main, 0.35)}`,
  '&:hover': {
    boxShadow: (t: { palette: { primary: { main: string } } }) =>
      `0 6px 20px ${alpha(t.palette.primary.main, 0.4)}`,
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
}: MapCTAButtonProps) {
  const isHero = variant === 'hero'

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
        sx={isHero ? heroSx : undefined}
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
      sx={isHero ? heroSx : undefined}
    >
      {children}
    </Button>
  )
}
