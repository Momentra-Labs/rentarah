import type { SxProps, Theme } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'

import { MOBILE_APP_BAR_TOOLBAR_PX, MOBILE_APP_MAX_WIDTH_PX } from '../constants/mobileShell'

/** Matches landing / marketing cards — soft elevation, no palette change */
export const softShadow = '0 1px 2px rgba(0,0,0,0.06), 0 12px 40px rgba(0,0,0,0.06)'
export const softShadowHover = '0 4px 16px rgba(0,0,0,0.08), 0 20px 48px rgba(0,0,0,0.08)'

export const containerGutters: SxProps<Theme> = {
  px: { xs: 2, sm: 3 },
}

/** Narrow centered column under `md`; pair with outlet wrapper in {@link MainLayout}. */
export const mobileShellColumnSx: SxProps<Theme> = {
  width: '100%',
  maxWidth: { xs: MOBILE_APP_MAX_WIDTH_PX, md: 'none' },
  mx: { xs: 'auto', md: 0 },
  minHeight: 0,
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignSelf: { xs: 'stretch', md: 'auto' },
  boxSizing: 'border-box',
}

/**
 * Sticky toolbar directly below the app bar (search, etc.).
 * Mobile `top` = safe-area + toolbar (see {@link MOBILE_APP_BAR_TOOLBAR_PX}).
 */
export function stickyToolbarPaper(theme: Theme): SxProps<Theme> {
  const mobileTop = `calc(env(safe-area-inset-top, 0px) + ${MOBILE_APP_BAR_TOOLBAR_PX}px)`
  return {
    position: 'sticky',
    top: { xs: mobileTop, md: 64 },
    zIndex: theme.zIndex.appBar - 1,
    borderRadius: 0,
    border: 'none',
    borderBottom: '1px solid',
    borderColor: 'divider',
    bgcolor: alpha(theme.palette.background.default, 0.98),
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
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
          '@media (pointer: fine)': {
            '&:hover': {
              borderColor: alpha(theme.palette.primary.main, 0.15),
              boxShadow: softShadow,
            },
          },
          '@media (pointer: coarse)': {
            '&:active': {
              boxShadow: softShadow,
            },
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
    '@media (pointer: fine)': {
      '&:hover': {
        borderColor: alpha(theme.palette.primary.main, 0.1),
        boxShadow: 'none',
      },
    },
    '@media (pointer: coarse)': {
      '&:active': {
        borderColor: alpha(theme.palette.primary.main, 0.12),
      },
    },
  }
}

export const primaryCtaShadow = (theme: Theme) => ({
  transition: 'box-shadow 0.2s ease',
  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.32)}`,
  '@media (pointer: fine)': {
    '&:hover': {
      boxShadow: `0 6px 18px ${alpha(theme.palette.primary.main, 0.38)}`,
    },
  },
})

/**
 * MUI `Tabs` for renter + host dashboards: underline, scrollable.
 * Stays within the same horizontal padding as {@link containerGutters} so tabs line up with PageHeader and cards.
 * Collapses disabled scroll arrows; slightly tighter tab padding on small screens.
 */
export const dashboardSectionTabsSx: SxProps<Theme> = {
  borderBottom: 1,
  borderColor: 'divider',
  mb: 3,
  minHeight: 48,
  '& .MuiTabs-flexContainer': {
    alignItems: 'center',
  },
  '& .MuiTabs-scrollButtons': {
    flexShrink: 0,
  },
  '& .MuiTabs-scrollButtons.Mui-disabled': {
    width: 0,
    minWidth: 0,
    maxWidth: 0,
    flexBasis: 0,
    padding: 0,
    margin: 0,
    opacity: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  '& .MuiTab-root': {
    minWidth: 0,
    minHeight: 48,
    flexShrink: 0,
    px: { xs: 0.75, sm: 1.5 },
    textTransform: 'none',
    fontWeight: 600,
    fontSize: { xs: '0.75rem', sm: '0.8rem' },
  },
}
