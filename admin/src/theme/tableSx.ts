import type { SxProps, Theme } from '@mui/material/styles'

/** Section card wrapping admin tables — consistent elevation and radius */
export const adminTablePaperSx: SxProps<Theme> = {
  borderRadius: 2.5,
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 32px rgba(15,23,42,0.06)',
  overflow: 'hidden',
  bgcolor: '#fff',
}

/** Uppercase muted header row styling (apply to TableHead > TableRow `sx`) */
export const adminTableHeadRowSx: SxProps<Theme> = {
  '& .MuiTableCell-head': {
    fontWeight: 700,
    fontSize: '0.6875rem',
    letterSpacing: '0.055em',
    textTransform: 'uppercase',
    color: 'text.secondary',
    bgcolor: '#F1F5F9',
    borderBottom: '1px solid',
    borderColor: 'divider',
    py: 1.35,
    whiteSpace: 'nowrap',
  },
}

/** Subtle zebra striping */
export const adminTableStripeSx: SxProps<Theme> = {
  '& tbody .MuiTableRow-root:nth-of-type(even)': {
    bgcolor: 'rgba(241,245,249,0.55)',
  },
}
