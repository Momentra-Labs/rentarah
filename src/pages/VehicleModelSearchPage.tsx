import ArrowBack from '@mui/icons-material/ArrowBack'
import FilterAlt from '@mui/icons-material/FilterAlt'
import {
  Badge,
  Box,
  Button,
  Container,
  Fab,
  Grid,
  Pagination,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link as RouterLink, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { DEFAULT_SEARCH_LOCATION } from '../constants/geo'
import BrowseCarSearch from '../components/browse/BrowseCarSearch'
import CarCard from '../components/common/CarCard'
import EmptyState from '../components/common/EmptyState'
import CarGridSkeleton from '../components/skeletons/CarGridSkeleton'
import FilterDrawer from '../components/search/FilterDrawer'
import FilterPanelScrollColumn from '../components/search/FilterPanelScrollColumn'
import SortBar from '../components/search/SortBar'
import { useListingSearch } from '../hooks/useListingSearch'
import { useVehicles } from '../hooks/useVehicles'
import { useSearchStore } from '../store/useSearchStore'
import type { SearchFilters, VehicleType } from '../types'
import { MOBILE_TAB_BAR_FAB_BOTTOM } from '../components/layout/MobileBottomNav'
import { containerGutters, softInteractiveSurface, stickyToolbarPaper } from '../theme/pageStyles'
import {
  parseSearchDateTimeParam,
  withDefaultDropoffTime,
} from '../utils/dateUtils'
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

export default function VehicleModelSearchPage() {
  const theme = useTheme()
  const isMd = useMediaQuery(theme.breakpoints.down('md'))
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'))
  const navigate = useNavigate()
  const routeLocation = useLocation()
  const [searchParams] = useSearchParams()

  const make = (searchParams.get('make') ?? '').trim()
  const model = (searchParams.get('model') ?? '').trim()
  const vtRaw = searchParams.get('vt') ?? ''

  /** Stable reference — inline objects were new every render and retriggered search in an infinite loop. */
  const modelKey = useMemo(() => {
    if (!make || !model || !isValidVehicleType(vtRaw)) return null
    return { make, model, vehicleType: vtRaw as VehicleType }
  }, [make, model, vtRaw])

  const { isLoading: vehiclesLoading, isError: vehiclesFatalError, error: vehiclesError, refetch: refetchVehicles } =
    useVehicles()
  const {
    hits,
    isLoading: searchLoading,
    error: searchError,
    refetch: refetchSearch,
    availabilityApplied,
  } = useListingSearch({ modelKey, enabled: modelKey != null })

  const location = useSearchStore((s) => s.location)
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
  const [searchToolbarH, setSearchToolbarH] = useState(108)

  const appBarOffsetPx = isMd ? 56 : 64
  const belowSearchStickyTop = appBarOffsetPx + searchToolbarH

  useLayoutEffect(() => {
    const el = searchToolbarRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => {
      setSearchToolbarH(Math.round(el.getBoundingClientRect().height))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const q = new URLSearchParams(routeLocation.search)
    const loc = q.get('location')
    const pu = q.get('pickup')
    const dr = q.get('dropoff')
    if (loc) setLocation(loc)
    const puParsed = parseSearchDateTimeParam(pu, 'pickup')
    const drParsed = parseSearchDateTimeParam(dr, 'dropoff')
    if (puParsed && drParsed) setDates(puParsed, drParsed)
    else if (puParsed) setDates(puParsed, withDefaultDropoffTime(puParsed.startOf('day').add(3, 'day')))
  }, [routeLocation.search, setLocation, setDates])

  const totalCount = hits.length
  const effectiveViewMode = isSmDown ? 'list' : viewMode

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return hits.slice(start, start + PAGE_SIZE)
  }, [hits, page])

  useEffect(() => {
    setPage(1)
  }, [filters, sortBy, location, make, model, vtRaw])

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

  const handleClear = () => {
    clearFilters()
    setLocation(DEFAULT_SEARCH_LOCATION)
  }

  if (!modelKey) {
    return <Navigate to="/search" replace />
  }

  const displayModel = `${make} ${model}`

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: { xs: 8, md: 6 } }}>
      <Paper ref={searchToolbarRef} elevation={0} sx={stickyToolbarPaper(theme)}>
        <Container maxWidth="lg" sx={{ py: { xs: 1.5, md: 2 }, ...containerGutters }}>
          <Stack spacing={1.5}>
            <Button
              component={RouterLink}
              to="/search"
              startIcon={<ArrowBack />}
              size="small"
              sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
            >
              All vehicles
            </Button>
            <BrowseCarSearch />
          </Stack>
        </Container>
      </Paper>

      <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 3 }, pb: { xs: 10, md: 6 }, ...containerGutters }}>
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={800} component="h1">
            {displayModel}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Compare listings from different hosts. Pick dates and an area to check live availability.
          </Typography>
        </Stack>

        <Grid container spacing={{ xs: 2.5, md: 3 }}>
          {!isMd && (
            <Grid item xs={12} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, md: 2.25 },
                  position: 'sticky',
                  top: belowSearchStickyTop,
                  maxHeight: `calc(100vh - ${belowSearchStickyTop + 16}px)`,
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
                title={availabilityApplied ? 'Nothing available for those dates' : 'No matching host listings'}
                description={
                  availabilityApplied
                    ? 'Adjust your trip dates or try a nearby area to see more options for this model.'
                    : 'Widen your filters or clear them to see every host offering this vehicle.'
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
                          onNavigate={(c) => navigate(`/cars/${c.id}`)}
                          onReserve={(c) => navigate(`/cars/${c.id}`)}
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
