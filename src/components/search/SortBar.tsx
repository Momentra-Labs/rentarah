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
  /** First segment of location for “N cars in …” */
  areaLabel: string
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
  areaLabel,
  sortBy,
  viewMode,
  onSort,
  onViewMode,
  onOpenFilters,
  filtersActive,
}: SortBarProps) {
  return (
    <Stack spacing={2} sx={{ mb: 2 }}>
      {onOpenFilters && (
        <Badge color="primary" variant="dot" invisible={!filtersActive} sx={{ width: '100%', display: { xs: 'block', sm: 'none' } }}>
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
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        columnGap={2}
        rowGap={{ xs: 1, sm: 0 }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          component="p"
          sx={{
            m: 0,
            minWidth: 0,
            flex: { sm: '1 1 auto' },
            alignSelf: { xs: 'flex-start', sm: 'center' },
            lineHeight: 1.5,
            order: { xs: 2, sm: 1 },
          }}
        >
          <strong>{total}</strong> cars in {areaLabel}
        </Typography>

        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{
            flexShrink: 0,
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'flex-end', sm: 'flex-end' },
            minWidth: 0,
            order: { xs: 1, sm: 2 },
          }}
        >
          <FormControl size="small" sx={{ minWidth: { xs: 0, sm: 200 }, flex: { xs: 1, sm: '0 0 auto' }, maxWidth: { xs: 'none', sm: 280 } }}>
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
            sx={{ flexShrink: 0 }}
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
    </Stack>
  )
}
