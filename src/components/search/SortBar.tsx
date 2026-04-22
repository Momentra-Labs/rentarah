import FilterAlt from '@mui/icons-material/FilterAlt'
import ReorderIcon from '@mui/icons-material/Reorder'
import ViewModule from '@mui/icons-material/ViewModule'
import {
  Badge,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'

import type { SearchStoreState } from '../../store/useSearchStore'

interface SortBarProps {
  total: number
  sortBy: SearchStoreState['sortBy']
  viewMode: 'grid' | 'list'
  onSort: (v: SearchStoreState['sortBy']) => void
  onViewMode: (v: 'grid' | 'list') => void
  /** Opens filter bottom sheet on narrow screens when set */
  onOpenFilters?: () => void
  filtersActive?: boolean
}

export default function SortBar({
  total,
  sortBy,
  viewMode,
  onSort,
  onViewMode,
  onOpenFilters,
  filtersActive,
}: SortBarProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      justifyContent="space-between"
      spacing={2}
      sx={{ mb: 2 }}
    >
      <Typography variant="body2" color="text.secondary">
        <strong>{total}</strong> cars found
      </Typography>

      {onOpenFilters && (
        <Badge color="primary" variant="dot" invisible={!filtersActive} sx={{ width: '100%' }}>
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            startIcon={<FilterAlt />}
            onClick={onOpenFilters}
            sx={{ justifyContent: 'center', py: 1.25 }}
          >
            Filters
          </Button>
        </Badge>
      )}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: 0, flex: { sm: 1 }, justifyContent: { sm: 'flex-end' } }}
      >
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 }, flex: { sm: 1 } }}>
          <InputLabel id="sort-label">Sort</InputLabel>
          <Select
            labelId="sort-label"
            label="Sort"
            value={sortBy}
            onChange={(e) => onSort(e.target.value as SearchStoreState['sortBy'])}
          >
            <MenuItem value="recommended">Recommended</MenuItem>
            <MenuItem value="price_asc">Price: low to high</MenuItem>
            <MenuItem value="price_desc">Price: high to low</MenuItem>
            <MenuItem value="rating">Rating</MenuItem>
            <MenuItem value="newest">Newest year</MenuItem>
          </Select>
        </FormControl>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={viewMode}
          onChange={(_, v) => v && onViewMode(v)}
          sx={{ alignSelf: { xs: 'flex-end', sm: 'auto' } }}
        >
          <ToggleButton value="grid" aria-label="grid">
            <ViewModule fontSize="small" />
          </ToggleButton>
          <ToggleButton value="list" aria-label="list">
            <ReorderIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    </Stack>
  )
}
