import ReorderIcon from '@mui/icons-material/Reorder'
import ViewModule from '@mui/icons-material/ViewModule'
import { FormControl, InputLabel, MenuItem, Select, Skeleton, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'

import { useT } from '@/hooks/useT'

import type { SearchStoreState } from '../../store/useSearchStore'

/** Result count, sort control, and optional grid/list toggle. Full filter UI: sidebar (md+) or SearchPage FAB (< md). */
interface SortBarProps {
  total: number
  /** Current search area for “N vehicles in …” (full city name, not a comma-split token). */
  areaLabel: string
  sortBy: SearchStoreState['sortBy']
  viewMode: 'grid' | 'list'
  onSort: (v: SearchStoreState['sortBy']) => void
  onViewMode: (v: 'grid' | 'list') => void
  /** When false, hide grid/list toggle (e.g. narrow screens default to list). */
  showViewModeToggle?: boolean
  /** Hide the live count while listings are still loading. */
  loading?: boolean
}

export default function SortBar({
  total,
  areaLabel,
  sortBy,
  viewMode,
  onSort,
  onViewMode,
  showViewModeToggle = true,
  loading = false,
}: SortBarProps) {
  const t = useT()
  return (
    <Stack spacing={2} sx={{ mb: 2 }}>
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
          {loading ? (
            <Skeleton variant="text" animation="wave" width={180} sx={{ display: 'inline-block' }} />
          ) : (
            <>
              <strong>{total}</strong> {t('search.vehiclesInRest', { area: areaLabel })}
            </>
          )}
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
            <InputLabel id="sort-label">{t('search.sort')}</InputLabel>
            <Select
              labelId="sort-label"
              label={t('search.sort')}
              value={sortBy}
              onChange={(e) => onSort(e.target.value as SearchStoreState['sortBy'])}
            >
              <MenuItem value="recommended">{t('search.sortRecommended')}</MenuItem>
              <MenuItem value="price_asc">{t('search.sortPriceAsc')}</MenuItem>
              <MenuItem value="price_desc">{t('search.sortPriceDesc')}</MenuItem>
              <MenuItem value="rating">{t('search.sortRating')}</MenuItem>
              <MenuItem value="newest">{t('search.sortNewest')}</MenuItem>
              <MenuItem value="distance_asc">{t('search.sortNearest')}</MenuItem>
            </Select>
          </FormControl>
          {showViewModeToggle && (
            <ToggleButtonGroup
              exclusive
              size="small"
              value={viewMode}
              onChange={(_, v) => v && onViewMode(v)}
              sx={{ flexShrink: 0 }}
            >
              <ToggleButton value="grid" aria-label={t('search.grid')}>
                <ViewModule fontSize="small" />
              </ToggleButton>
              <ToggleButton value="list" aria-label={t('search.list')}>
                <ReorderIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          )}
        </Stack>
      </Stack>
    </Stack>
  )
}
