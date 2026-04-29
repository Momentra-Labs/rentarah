import type { SxProps, Theme } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'

/** Strong focus outline for form fields (aligns with WCAG focus visibility) */
export const pickerFocusOutlineSx: SxProps<Theme> = {
  '& .MuiOutlinedInput-root.Mui-focused': {
    boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.35)}`,
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'primary.main',
    borderWidth: 2,
  },
}
