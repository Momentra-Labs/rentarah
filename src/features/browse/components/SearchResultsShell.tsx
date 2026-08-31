import Tune from '@mui/icons-material/Tune'
import {
  Badge,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Pagination,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import CarCard from '@/components/common/CarCard'
import EmptyState from '@/components/common/EmptyState'
import { MOBILE_BOTTOM_NAV_SX_PB } from '@/components/layout/MobileBottomNav'
import FilterDrawer from '@/components/search/FilterDrawer'
import SortBar from '@/components/search/SortBar'
import CarGridSkeleton from '@/components/skeletons/CarGridSkeleton'
import { DEFAULT_SEARCH_FILTERS, SEARCH_PAGE_SIZE } from '@/config/searchFilters'
import { isScopedCitySearch, searchAreaLabel } from '@/utils/searchLocation'
import type { ListingSearchHit } from '@/services/listingSearchService'
import { useSearchStore } from '@/store/useSearchStore'
import { containerGutters, stickyToolbarPaper } from '@/theme/pageStyles'
import type { Car, SearchFilters } from '@/types'
import { useT } from '@/hooks/useT'
import { VEHICLE_TYPE_LABELS } from '@/utils/vehicleUtils'

export type SearchResultsShellProps = {
  toolbar: ReactNode
  /** Optional heading block under the sticky toolbar (e.g. model title). */
  header?: ReactNode
  hits: ListingSearchHit[]
  vehiclesLoading: boolean
  searchLoading: boolean
  vehiclesFatalError: boolean
  vehiclesError: string | null
  searchError: string | null
  availabilityApplied: boolean
  refetchVehicles: () => void
  refetchSearch: () => void
  onNavigate: (car: Car) => void
  /** @deprecated Listing cards no longer show a Reserve control; click opens the vehicle. */
  onReserve?: (car: Car) => void
  emptyTitle: string
  emptyDescription: string
  showVehicleTypeChips?: boolean
  /** Extra deps that should reset pagination (e.g. make/model). */
  pageResetKey?: string
}

function hasActiveSearchFilters(filters: SearchFilters): boolean {
  return (
    filters.types.length > 0 ||
    filters.vehicleType !== 'all' ||
    filters.transmission !== 'all' ||
    filters.fuel !== 'all' ||
    filters.seats !== 0 ||
    filters.priceRange[0] !== DEFAULT_SEARCH_FILTERS.priceRange[0] ||
    filters.priceRange[1] !== DEFAULT_SEARCH_FILTERS.priceRange[1] ||
    !filters.availableOnly
  )
}

export default function SearchResultsShell({
  toolbar,
  header,
  hits,
  vehiclesLoading,
  searchLoading,
  vehiclesFatalError,
  vehiclesError,
  searchError,
  availabilityApplied,
  refetchVehicles,
  refetchSearch,
  onNavigate,
  emptyTitle,
  emptyDescription,
  showVehicleTypeChips = false,
  pageResetKey = '',
}: SearchResultsShellProps) {
  const t = useT()
  const theme = useTheme()
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true })

  const location = useSearchStore((s) => s.location)
  const filters = useSearchStore((s) => s.filters)
  const sortBy = useSearchStore((s) => s.sortBy)
  const viewMode = useSearchStore((s) => s.viewMode)
  const setLocation = useSearchStore((s) => s.setLocation)
  const setFilter = useSearchStore((s) => s.setFilter)
  const setSortBy = useSearchStore((s) => s.setSortBy)
  const setViewMode = useSearchStore((s) => s.setViewMode)
  const clearFilters = useSearchStore((s) => s.clearFilters)

  const [page, setPage] = useState(1)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const searchChromeRef = useRef<HTMLDivElement | null>(null)
  const [searchChromeBottom, setSearchChromeBottom] = useState(128)

  useLayoutEffect(() => {
    const el = searchChromeRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    let raf = 0
    const update = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        setSearchChromeBottom(Math.round(el.getBoundingClientRect().bottom))
      })
    }
    const ro = new ResizeObserver(update)
    ro.observe(el)
    update()
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])
  const effectiveViewMode = isSmDown ? 'list' : viewMode
  const totalCount = hits.length
  const filtersTypesKey = useMemo(() => [...filters.types].sort().join('|'), [filters.types])

  const pageItems = useMemo(() => {
    const start = (page - 1) * SEARCH_PAGE_SIZE
    return hits.slice(start, start + SEARCH_PAGE_SIZE)
  }, [hits, page])

  const priceMin = filters.priceRange[0]
  const priceMax = filters.priceRange[1]

  useEffect(() => {
    setPage(1)
  }, [
    sortBy,
    location,
    filtersTypesKey,
    filters.vehicleType,
    filters.transmission,
    filters.fuel,
    filters.seats,
    priceMin,
    priceMax,
    filters.availableOnly,
    pageResetKey,
  ])

  const hasActiveFilters = useMemo(() => hasActiveSearchFilters(filters), [filters])

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onDelete: () => void }[] = []
    if (filters.vehicleType !== 'all') {
      chips.push({
        key: 'vt',
        label: VEHICLE_TYPE_LABELS[filters.vehicleType] ?? filters.vehicleType,
        onDelete: () => setFilter({ vehicleType: 'all' }),
      })
    }
    if (filters.transmission !== 'all') {
      chips.push({
        key: 'tr',
        label: filters.transmission,
        onDelete: () => setFilter({ transmission: 'all' }),
      })
    }
    if (filters.fuel !== 'all') {
      chips.push({
        key: 'fuel',
        label: filters.fuel,
        onDelete: () => setFilter({ fuel: 'all' }),
      })
    }
    if (filters.seats !== 0) {
      chips.push({
        key: 'seats',
        label: `${filters.seats}+ seats`,
        onDelete: () => setFilter({ seats: 0 }),
      })
    }
    if (
      filters.priceRange[0] !== DEFAULT_SEARCH_FILTERS.priceRange[0] ||
      filters.priceRange[1] !== DEFAULT_SEARCH_FILTERS.priceRange[1]
    ) {
      chips.push({
        key: 'price',
        label: `₱${filters.priceRange[0]}–₱${filters.priceRange[1]}`,
        onDelete: () => setFilter({ priceRange: [...DEFAULT_SEARCH_FILTERS.priceRange] as [number, number] }),
      })
    }
    filters.types.forEach((t) => {
      chips.push({
        key: `type-${t}`,
        label: t,
        onDelete: () => setFilter({ types: filters.types.filter((x) => x !== t) }),
      })
    })
    if (!filters.availableOnly) {
      chips.push({
        key: 'avail',
        label: 'Include unavailable',
        onDelete: () => setFilter({ availableOnly: true }),
      })
    }
    return chips
  }, [filters, setFilter])

  const areaLabel = searchAreaLabel(location)
  const showLocationChip = isScopedCitySearch(location)

  const handleClearFilters = useCallback(() => {
    clearFilters()
  }, [clearFilters])

  const handleSearchNationwide = useCallback(() => {
    setLocation('Philippines')
  }, [setLocation])

  const pageCount = Math.max(1, Math.ceil(totalCount / SEARCH_PAGE_SIZE))

  const handlePageChange = useCallback((_: unknown, p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [])

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: { xs: 8, md: 6 } }}>
      <Paper ref={searchChromeRef} elevation={0} sx={stickyToolbarPaper(theme)}>
        {toolbar}
      </Paper>

      <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 3 }, pb: { xs: MOBILE_BOTTOM_NAV_SX_PB, md: 6 }, ...containerGutters }}>
        {header}

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          alignItems="center"
          sx={{ mb: 1.5 }}
        >
          <Button
            variant="outlined"
            color={hasActiveFilters ? 'primary' : 'inherit'}
            startIcon={
              <Badge
                color="error"
                variant="dot"
                invisible={!hasActiveFilters}
                overlap="circular"
              >
                <Tune fontSize="small" />
              </Badge>
            }
            aria-label={t('search.filterVehiclesAria')}
            aria-expanded={advancedOpen}
            aria-controls="browse-advanced-search"
            onClick={() => setAdvancedOpen((open) => !open)}
            sx={{
              textTransform: 'none',
              alignItems: 'center',
              justifyContent: 'flex-start',
              borderRadius: 2,
              minHeight: 52,
              py: 0.75,
              px: 1.5,
              bgcolor: (th) =>
                alpha(th.palette.primary.main, hasActiveFilters ? 0.1 : 0.05),
              borderColor: (th) =>
                hasActiveFilters ? th.palette.primary.main : alpha(th.palette.primary.main, 0.28),
              '&:hover': {
                bgcolor: (th) => alpha(th.palette.primary.main, 0.12),
                borderColor: 'primary.main',
              },
            }}
          >
            <Stack alignItems="flex-start" spacing={0} sx={{ textAlign: 'left', lineHeight: 1.2 }}>
              <Typography variant="body2" fontWeight={800} color="text.primary">
                {t('search.filterVehicles')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('search.filterVehiclesHint')}
              </Typography>
            </Stack>
          </Button>
          {hasActiveFilters ? (
            <Button
              variant="text"
              color="primary"
              size="small"
              onClick={handleClearFilters}
              sx={{ textTransform: 'none', fontWeight: 700, minHeight: 40 }}
            >
              {t('search.clear')}
            </Button>
          ) : null}
        </Stack>

        {(showLocationChip || activeFilterChips.length > 0) && (
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            {showLocationChip && (
              <Chip
                label={location.trim()}
                size="small"
                variant="outlined"
                onDelete={handleSearchNationwide}
                aria-label={t('search.removeLocationAria', { location: location.trim() })}
              />
            )}
            {activeFilterChips.map((c) => (
              <Chip key={c.key} label={c.label} size="small" onDelete={c.onDelete} />
            ))}
            {activeFilterChips.length > 0 && (
              <Chip
                label={t('search.clearAll')}
                size="small"
                color="primary"
                variant="outlined"
                onClick={handleClearFilters}
                sx={{ fontWeight: 700 }}
              />
            )}
          </Stack>
        )}

        <SortBar
          total={totalCount}
          areaLabel={areaLabel}
          sortBy={sortBy}
          viewMode={effectiveViewMode}
          onSort={setSortBy}
          onViewMode={setViewMode}
          showViewModeToggle={!isSmDown}
          loading={vehiclesLoading || searchLoading}
        />

        {vehiclesLoading || searchLoading ? (
          <CarGridSkeleton count={SEARCH_PAGE_SIZE} layout={effectiveViewMode} />
        ) : vehiclesFatalError && vehiclesError ? (
          <EmptyState
            title={t('search.loadFail')}
            description={vehiclesError}
            actionLabel={t('common.tryAgain')}
            onAction={() => refetchVehicles()}
          />
        ) : searchError ? (
          <EmptyState
            title={t('search.refreshFail')}
            description={searchError}
            actionLabel={t('common.tryAgain')}
            onAction={() => refetchSearch()}
          />
        ) : pageItems.length === 0 ? (
          <EmptyState
            title={
              showLocationChip
                ? t('search.nothingIn', { area: areaLabel })
                : emptyTitle
            }
            description={
              showLocationChip
                ? availabilityApplied
                  ? t('search.noDatesIn', { area: areaLabel })
                  : t('search.noListingsIn', { area: areaLabel })
                : emptyDescription
            }
            actionLabel={showLocationChip ? t('search.searchNationwide') : t('common.clearFilters')}
            onAction={showLocationChip ? handleSearchNationwide : handleClearFilters}
            secondaryActionLabel={showLocationChip ? t('common.clearFilters') : undefined}
            onSecondaryAction={showLocationChip ? handleClearFilters : undefined}
          />
        ) : (
          <>
            <Grid
              container
              spacing={{ xs: 2.5, md: 3 }}
              sx={
                totalCount > 24
                  ? {
                      contentVisibility: 'auto',
                      containIntrinsicSize: '0 800px',
                    }
                  : undefined
              }
            >
              {pageItems.map((hit) => (
                <Grid
                  item
                  xs={12}
                  sm={effectiveViewMode === 'grid' ? 6 : 12}
                  md={effectiveViewMode === 'grid' ? 4 : 12}
                  key={hit.vehicle.id}
                >
                  <Box sx={{ height: '100%' }}>
                    <CarCard
                      car={hit.vehicle}
                      layout={effectiveViewMode}
                      showDateAvailabilityHint={
                        availabilityApplied && hit.availability.availableForRange
                      }
                      distanceKm={hit.distanceKm}
                      onNavigate={onNavigate}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
            {pageCount > 1 && (
              <Stack alignItems="center" sx={{ mt: 4 }}>
                <Pagination
                  count={pageCount}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size="small"
                  siblingCount={0}
                  boundaryCount={1}
                  sx={{
                    '& .MuiPagination-ul': { flexWrap: 'wrap', justifyContent: 'center', gap: 0.5 },
                  }}
                />
              </Stack>
            )}
          </>
        )}
      </Container>

      <FilterDrawer
        open={advancedOpen}
        onClose={() => setAdvancedOpen(false)}
        filters={filters}
        onChange={setFilter}
        onClear={handleClearFilters}
        hasActive={hasActiveFilters}
        showVehicleType={showVehicleTypeChips}
        insetTop={searchChromeBottom}
      />
    </Box>
  )
}
