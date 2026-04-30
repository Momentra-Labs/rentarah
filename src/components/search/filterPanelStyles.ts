import { alpha } from '@mui/material/styles'
import type { SxProps, Theme } from '@mui/material/styles'

/** Shared compact chip-style toggles — sidebar, drawer, and inline vehicle chips. */
export function compactSearchToggleSx(theme: Theme): SxProps<Theme> {
  return {
    flexWrap: 'wrap',
    gap: 0.5,
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    '& .MuiToggleButton-root': {
      py: 0.35,
      px: { xs: 1, sm: 1.15 },
      minHeight: 30,
      fontSize: '0.8125rem',
      textTransform: 'none',
      fontWeight: 600,
      borderRadius: `${Number(theme.shape.borderRadius)}px`,
      '&.Mui-selected': {
        fontWeight: 700,
        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.12 : 0.22),
      },
    },
  }
}

export const FILTER_SECTION_GAP = 2
