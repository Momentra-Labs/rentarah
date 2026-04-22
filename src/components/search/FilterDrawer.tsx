import { Box, Button, Drawer, Stack, Typography } from '@mui/material'

import type { SearchFilters } from '../../types'
import FilterPanel from './FilterPanel'

interface FilterDrawerProps {
  open: boolean
  onClose: () => void
  filters: SearchFilters
  onChange: (partial: Partial<SearchFilters>) => void
  onClear: () => void
  hasActive: boolean
}

export default function FilterDrawer({ open, onClose, filters, onChange, onClear, hasActive }: FilterDrawerProps) {
  return (
    <Drawer anchor="left" open={open} onClose={onClose} PaperProps={{ sx: { width: 300, p: 2 } }}>
      <Stack spacing={2}>
        <Typography variant="h6">Filters</Typography>
        <FilterPanel filters={filters} onChange={onChange} onClear={onClear} hasActiveFilters={hasActive} />
        <Box>
          <Button variant="contained" fullWidth onClick={onClose}>
            Apply
          </Button>
        </Box>
      </Stack>
    </Drawer>
  )
}
