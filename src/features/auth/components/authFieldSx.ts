import type { Theme } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'

/** Outlined inputs — match {@link AuthDialog} field chrome. */
export function authOutlinedFieldSx(theme: Theme, compact?: boolean) {
  return {
    overflow: 'visible',
    '&& .MuiInputLabel-root': {
      overflow: 'visible',
      textOverflow: 'clip',
      lineHeight: 1.5,
      pointerEvents: 'auto',
    },
    '& .MuiOutlinedInput-root': {
      borderRadius: compact ? 2 : 2.5,
      minHeight: compact ? 44 : undefined,
      alignItems: 'center',
      transition: 'box-shadow 0.2s ease',
      '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.45) },
      '&.Mui-focused': {
        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}`,
      },
    },
    '& .MuiFormHelperText-root': compact
      ? { mt: 0.5, fontSize: '0.7rem', lineHeight: 1.35 }
      : {},
  } as const
}
