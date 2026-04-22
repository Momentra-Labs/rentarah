import type { SxProps, Theme } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'

/** Matches landing / marketing cards — soft elevation, no palette change */
export const softShadow = '0 1px 2px rgba(0,0,0,0.06), 0 12px 40px rgba(0,0,0,0.06)'
export const softShadowHover = '0 4px 16px rgba(0,0,0,0.08), 0 20px 48px rgba(0,0,0,0.08)'

export const containerGutters: SxProps<Theme> = {
  px: { xs: 2, sm: 3 },
}

/** Sticky toolbar under navbar (search, etc.) */
export function stickyToolbarPaper(theme: Theme): SxProps<Theme> {
  return {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    borderRadius: 0,
    border: 'none',
    borderBottom: '1px solid',
    borderColor: 'divider',
    bgcolor: alpha(theme.palette.background.default, 0.92),
    backdropFilter: 'saturate(180%) blur(12px)',
    boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
  }
}

/** Hero-style trip planner / booking panel */
export function softInteractiveSurface(theme: Theme, hover = true): SxProps<Theme> {
  return {
    borderRadius: 3,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.default',
    boxShadow: softShadow,
    transition: 'box-shadow 0.22s ease, border-color 0.2s ease',
    ...(hover
      ? {
          '&:hover': {
            boxShadow: softShadowHover,
            borderColor: alpha(theme.palette.primary.main, 0.15),
          },
        }
      : {}),
  }
}

/** List rows: outlined cards with subtle hover */
export function listRowSurface(theme: Theme): SxProps<Theme> {
  return {
    borderRadius: 3,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.default',
    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
    '&:hover': {
      boxShadow: softShadow,
      borderColor: alpha(theme.palette.primary.main, 0.1),
    },
  }
}

export const primaryCtaShadow = (theme: Theme) => ({
  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.32)}`,
  '&:hover': {
    boxShadow: `0 6px 18px ${alpha(theme.palette.primary.main, 0.38)}`,
  },
})
