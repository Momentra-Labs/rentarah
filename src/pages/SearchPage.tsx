import FilterAlt from '@mui/icons-material/FilterAlt'
import { Badge, Box, Container, Fab, Grid, Pagination, Paper, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { DEFAULT_SEARCH_LOCATION } from '../constants/geo'
import {
  formatSearchDateTimeParam,
  parseSearchDateTimeParam,
  withDefaultDropoffTime,
} from '../utils/dateUtils'
import { areUrlSearchQueriesEqual } from '../utils/urlQueryCompare'
import CarCard from '../components/common/CarCard'
import BrowseCarSearch from '../components/browse/BrowseCarSearch'
import EmptyState from '../components/common/EmptyState'
import CarGridSkeleton from '../components/skeletons/CarGridSkeleton'
import FilterDrawer from '../components/search/FilterDrawer'
import FilterPanelScrollColumn from '../components/search/FilterPanelScrollColumn'
import SortBar from '../components/search/SortBar'
import VehicleTypeFilterChips from '../components/search/VehicleTypeFilterChips'
import { useListingSearch } from '../hooks/useListingSearch'
import { useVehicles } from '../hooks/useVehicles'
import { prefetchPath } from '../lib/routePrefetch'
import { useSearchStore } from '../store/useSearchStore'
import type { Car, SearchFilters } from '../types'
import { MOBILE_TAB_BAR_FAB_BOTTOM } from '../components/layout/MobileBottomNav'
import { containerGutters, softInteractiveSurface, stickyToolbarPaper } from '../theme/pageStyles'
import { vehicleModelSearchPath } from '../utils/vehicleBrowsePaths'
import { isValidVehicleType } from '../utils/vehicleUtils'

const PAGE_SIZE = 6

const defaultFilters: SearchFilters = {
  priceRange: [0, 15000],
  types: [],
  vehicleType: 'all',
  transmission: 'all',
  fuel: 'all',
  seats: 0,
  availableOnly: true,
}

export default function SearchPage() {
  const theme = useTheme()
  const isMd = useMediaQuery(theme.breakpoints.down('md'))
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'))
  const navigate = useNavigate()
  const routeLocation = useLocation()
  const { isLoading: vehiclesLoading, isError: vehiclesFatalError, error: vehiclesError, refetch: refetchVehicles } =
    useVehicles()
  const {
    hits,
    isLoading: searchLoading,
    error: searchError,
    refetch: refetchSearch,
    availabilityApplied,
  } = useListingSearch()
  const [, setSearchParams] = useSearchParams()

  const location = useSearchStore((s) => s.location)
  const pickup = useSearchStore((s) => s.pickup)
  const dropoff = useSearchStore((s) => s.dropoff)
  const filters = useSearchStore((s) => s.filters)
  const sortBy = useSearchStore((s) => s.sortBy)
  const viewMode = useSearchStore((s) => s.viewMode)
  const setLocation = useSearchStore((s) => s.setLocation)
  const setDates = useSearchStore((s) => s.setDates)
  const setFilter = useSearchStore((s) => s.setFilter)
  const setSortBy = useSearchStore((s) => s.setSortBy)
  const setViewMode = useSearchStore((s) => s.setViewMode)
  const clearFilters = useSearchStore((s) => s.clearFilters)

  const [page, setPage] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const searchToolbarRef = useRef<HTMLDivElement | null>(null)
  /** Measured height of the sticky search strip — drives filter sidebar & mobile secondary sticky offset. */
  const [searchToolbarH, setSearchToolbarH] = useState(108)

  useLayoutEffect(() => {
    const el = searchToolbarRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    let raf = 0
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        setSearchToolbarH(Math.round(el.getBoundingClientRect().height))
      })
    })
    ro.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  /** Reset scroll once on first mount — avoid repeating when stale layout wrappers remount briefly. */
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

  /** Sidebar filters only render on `md+` (`isMd` = down(md) mobile). Offset is global app chrome + sticky search strip. */
  const desktopFiltersStickyTop = 64 + searchToolbarH

  const filtersTypesKey = useMemo(() => [...filters.types].sort().join('|'), [filters.types])
  const pickupKey = pickup?.isValid() ? formatSearchDateTimeParam(pickup) : ''
  const dropoffKey = dropoff?.isValid() ? formatSearchDateTimeParam(dropoff) : ''

  useEffect(() => {
    const q = new URLSearchParams(routeLocation.search)
    const st = useSearchStore.getState()

    const rawLoc = q.get('location')
    const locTrim = rawLoc?.trim()
    if (locTrim && locTrim !== st.location) setLocation(locTrim)

    const vtRaw = q.get('vt')
    if (vtRaw && isValidVehicleType(vtRaw)) {
      if (st.filters.vehicleType !== vtRaw) setFilter({ vehicleType: vtRaw })
    } else if (st.filters.vehicleType !== 'all') {
      setFilter({ vehicleType: 'all' })
    }

    const typesCsv = q.get('types')
    const typesParsed = typesCsv?.split(',').filter(Boolean)
    if (typesParsed?.length) {
      const incoming = [...typesParsed].sort().join('|')
      const existing = [...st.filters.types].sort().join('|')
      if (incoming !== existing) setFilter({ types: typesParsed })
    } else if (st.filters.types.length > 0) {
      setFilter({ types: [] })
    }

    const puParsed = parseSearchDateTimeParam(q.get('pickup'), 'pickup')
    const drParsed = parseSearchDateTimeParam(q.get('dropoff'), 'dropoff')

    if (puParsed?.isValid() && drParsed?.isValid()) {
      const samePu =
        st.pickup?.isValid() && formatSearchDateTimeParam(st.pickup) === formatSearchDateTimeParam(puParsed)
      const sameDr =
        st.dropoff?.isValid() && formatSearchDateTimeParam(st.dropoff) === formatSearchDateTimeParam(drParsed)
      if (!samePu || !sameDr) setDates(puParsed, drParsed)
    } else if (puParsed?.isValid()) {
      const defDrop = withDefaultDropoffTime(puParsed.startOf('day').add(3, 'day'))
      const samePu =
        st.pickup?.isValid() && formatSearchDateTimeParam(st.pickup) === formatSearchDateTimeParam(puParsed)
      const sameDr =
        st.dropoff?.isValid() &&
        formatSearchDateTimeParam(st.dropoff) === formatSearchDateTimeParam(defDrop)
      if (!samePu || !sameDr) setDates(puParsed, defDrop)
    }
  }, [routeLocation.search, setLocation, setDates, setFilter])

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('location', location)
    if (pickup?.isValid()) params.set('pickup', formatSearchDateTimeParam(pickup))
    if (dropoff?.isValid()) params.set('dropoff', formatSearchDateTimeParam(dropoff))
    if (filters.types.length) params.set('types', filters.types.join(','))
    if (filters.vehicleType !== 'all') params.set('vt', filters.vehicleType)

    const next = params.toString()
    const dest = next ? `?${next}` : ''
    if (areUrlSearchQueriesEqual(routeLocation.search ?? '', dest)) return
    setSearchParams(params, { replace: true })
  }, [
    location,
    pickupKey,
    dropoffKey,
    filtersTypesKey,
    filters.vehicleType,
    setSearchParams,
    routeLocation.search,
    pickup,
    dropoff,
  ])

  const totalCount = hits.length
  const effectiveViewMode = isSmDown ? 'list' : viewMode

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return hits.slice(start, start + PAGE_SIZE)
  }, [hits, page])

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
    filters.priceRange[0],
    filters.priceRange[1],
    filters.availableOnly,
  ])

  const hasActiveFilters = useMemo(() => {
    return (
      filters.types.length > 0 ||
      filters.vehicleType !== 'all' ||
      filters.transmission !== 'all' ||
      filters.fuel !== 'all' ||
      filters.seats !== 0 ||
      filters.priceRange[0] !== defaultFilters.priceRange[0] ||
      filters.priceRange[1] !== defaultFilters.priceRange[1] ||
      !filters.availableOnly
    )
  }, [filters])

  const handleClear = useCallback(() => {
    clearFilters()
    setLocation(DEFAULT_SEARCH_LOCATION)
  }, [clearFilters, setLocation])

  const handleNavigateToVehicle = useCallback(
    (c: Car) => {
      const path = vehicleModelSearchPath(c)
      prefetchPath(path)
      navigate(path)
    },
    [navigate],
  )
  const handleReserveVehicle = useCallback(
    (c: Car) => {
      const path = `/cars/${c.id}`
      prefetchPath(path)
      navigate(path)
    },
    [navigate],
  )

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: { xs: 8, md: 6 } }}>
      <Paper ref={searchToolbarRef} elevation={0} sx={stickyToolbarPaper(theme)}>
        <Container
          maxWidth="lg"
          sx={{
            py: { xs: 1, md: 2 },
            ...containerGutters,
          }}
        >
          <BrowseCarSearch />
        </Container>
      </Paper>

      <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 3 }, pb: { xs: 10, md: 6 }, ...containerGutters }}>
        <Grid container spacing={{ xs: 2.5, md: 3 }}>
          {!isMd && (
            <Grid item xs={12} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, md: 2.25 },
                  position: 'sticky',
                  top: desktopFiltersStickyTop,
                  maxHeight: `calc(100vh - ${desktopFiltersStickyTop + 16}px)`,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  ...softInteractiveSurface(theme, false),
                }}
              >
                <Stack spacing={0.375} sx={{ mb: 1.5, flexShrink: 0 }}>
                  <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.65rem' }}>
                    Refine
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={800} component="h2" sx={{ fontSize: '1.05rem', lineHeight: 1.25 }}>
                    Filters
                  </Typography>
                </Stack>
                <FilterPanelScrollColumn
                  active
                  filters={filters}
                  onChange={setFilter}
                  onClear={handleClear}
                  hasActiveFilters={hasActiveFilters}
                  scrollBoxSx={{ pb: 0.5 }}
                />
              </Paper>
            </Grid>
          )}
          <Grid item xs={12} md={isMd ? 12 : 9}>
            <SortBar
              total={totalCount}
              areaLabel={(location || DEFAULT_SEARCH_LOCATION).split(',')[0]?.trim() || DEFAULT_SEARCH_LOCATION}
              sortBy={sortBy}
              viewMode={effectiveViewMode}
              onSort={setSortBy}
              onViewMode={setViewMode}
              showViewModeToggle={!isSmDown}
            />

            <VehicleTypeFilterChips value={filters.vehicleType} onChange={(vehicleType) => setFilter({ vehicleType })} />

            {vehiclesLoading || searchLoading ? (
              <CarGridSkeleton count={PAGE_SIZE} layout={effectiveViewMode} />
            ) : vehiclesFatalError && vehiclesError ? (
              <EmptyState
                title="Couldn’t load vehicles"
                description={vehiclesError}
                actionLabel="Try again"
                onAction={() => refetchVehicles()}
              />
            ) : searchError ? (
              <EmptyState
                title="Couldn’t refresh results"
                description={searchError}
                actionLabel="Try again"
                onAction={() => refetchSearch()}
              />
            ) : pageItems.length === 0 ? (
              <EmptyState
                title={
                  availabilityApplied ? 'Nothing available for those dates' : 'No vehicles match your filters'
                }
                description={
                  availabilityApplied
                    ? 'Try different pickup and return dates, another area, or clear filters to see more options.'
                    : 'Try changing vehicle type, widening your price range, or clearing filters.'
                }
                actionLabel="Clear filters"
                onAction={handleClear}
              />
            ) : (
              <>
                <Grid container spacing={{ xs: 2.5, md: 3 }}>
                  {pageItems.map((hit) => (
                    <Grid
                      item
                      xs={12}
                      sm={effectiveViewMode === 'grid' ? 6 : 12}
                      md={effectiveViewMode === 'grid' ? 4 : 12}
                      key={hit.vehicle.id}
                    >
                      <Box sx={{ height: '100%', '& .MuiCard-root': { borderRadius: 3, height: '100%' } }}>
                        <CarCard
                          car={hit.vehicle}
                          layout={effectiveViewMode}
                          showDateAvailabilityHint={availabilityApplied && hit.availability.availableForRange}
                          distanceKm={hit.distanceKm}
                          onNavigate={handleNavigateToVehicle}
                          onReserve={handleReserveVehicle}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                <Stack alignItems="center" sx={{ mt: 4 }}>
                  <Pagination
                    count={Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
                    page={page}
                    onChange={(_, p) => setPage(p)}
                    color="primary"
                    size="small"
                    siblingCount={0}
                    boundaryCount={1}
                    sx={{
                      '& .MuiPagination-ul': { flexWrap: 'wrap', justifyContent: 'center', gap: 0.5 },
                    }}
                  />
                </Stack>
              </>
            )}
          </Grid>
        </Grid>
      </Container>

      {isMd && (
        <>
          <Fab
            color="primary"
            size="medium"
            aria-label="Open filters"
            sx={{
              position: 'fixed',
              zIndex: theme.zIndex.speedDial,
              right: 16,
              bottom: MOBILE_TAB_BAR_FAB_BOTTOM,
            }}
            onClick={() => setDrawerOpen(true)}
          >
            <Badge color="error" variant="dot" invisible={!hasActiveFilters} sx={{ '& .MuiBadge-badge': { right: 6, top: 6 } }}>
              <FilterAlt />
            </Badge>
          </Fab>
          <FilterDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            filters={filters}
            onChange={setFilter}
            onClear={handleClear}
            hasActive={hasActiveFilters}
          />
        </>
      )}
    </Box>
  )
}
