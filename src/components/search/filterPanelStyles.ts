import { alpha } from '@mui/material/styles'
import type { SxProps, Theme } from '@mui/material/styles'

/** Pill chips — disconnected from ToggleButtonGroup’s joined borders. */
export function compactSearchToggleSx(theme: Theme): SxProps<Theme> {
  const outline = theme.palette.mode === 'light' ? theme.palette.divider : alpha(theme.palette.common.white, 0.16)
  return {
    flexWrap: 'wrap',
    gap: 0.75,
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    '& .MuiToggleButtonGroup-grouped': {
      margin: '0 !important',
      border: `1px solid ${outline} !important`,
      borderRadius: '999px !important',
    },
    '& .MuiToggleButton-root': {
      py: 0.5,
      px: 1.5,
      minHeight: 36,
      fontSize: '0.8125rem',
      lineHeight: 1.2,
      textTransform: 'none',
      fontWeight: 600,
      color: 'text.secondary',
      bgcolor: 'background.paper',
      '&.Mui-selected': {
        fontWeight: 700,
        color: 'primary.contrastText',
        bgcolor: 'primary.main',
        borderColor: `${theme.palette.primary.main} !important`,
        '&:hover': {
          bgcolor: 'primary.dark',
        },
      },
      '&:hover': {
        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.06 : 0.14),
      },
    },
  }
}

export const FILTER_SECTION_GAP = 1.75
