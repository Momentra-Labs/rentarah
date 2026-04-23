import FilterAlt from '@mui/icons-material/FilterAlt'
import { Box, Container, Fab, Grid, Pagination, Paper, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import CarCard from '../components/common/CarCard'
import BrowseCarSearch from '../components/browse/BrowseCarSearch'
import EmptyState from '../components/common/EmptyState'
import CarGridSkeleton from '../components/skeletons/CarGridSkeleton'
import FilterDrawer from '../components/search/FilterDrawer'
import FilterPanel from '../components/search/FilterPanel'
import SortBar from '../components/search/SortBar'
import VehicleTypeFilterChips from '../components/search/VehicleTypeFilterChips'
import { useFilteredCars } from '../hooks/useFilteredCars'
import { useVehicles } from '../hooks/useVehicles'
import { useSearchStore } from '../store/useSearchStore'
import type { SearchFilters } from '../types'
import { containerGutters, softInteractiveSurface, stickyToolbarPaper } from '../theme/pageStyles'
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
  const navigate = useNavigate()
  const routeLocation = useLocation()
  const { isLoading: vehiclesLoading, isError: vehiclesFatalError, error: vehiclesError, refetch: refetchVehicles } =
    useVehicles()
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

  useEffect(() => {
    const q = new URLSearchParams(routeLocation.search)
    const loc = q.get('location')
    const pu = q.get('pickup')
    const dr = q.get('dropoff')
    const types = q.get('types')
    const vt = q.get('vt')
    if (loc) setLocation(loc)
    if (pu && dr) setDates(dayjs(pu), dayjs(dr))
    else if (pu) setDates(dayjs(pu), dayjs(pu).add(3, 'day'))
    if (types) setFilter({ types: types.split(',').filter(Boolean) })
    if (vt && isValidVehicleType(vt)) setFilter({ vehicleType: vt })
    else setFilter({ vehicleType: 'all' })
  }, [routeLocation.search, setLocation, setDates, setFilter])

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('location', location)
    if (pickup?.isValid()) params.set('pickup', pickup.format('YYYY-MM-DD'))
    if (dropoff?.isValid()) params.set('dropoff', dropoff.format('YYYY-MM-DD'))
    if (filters.types.length) params.set('types', filters.types.join(','))
    if (filters.vehicleType !== 'all') params.set('vt', filters.vehicleType)
    setSearchParams(params, { replace: true })
  }, [location, pickup, dropoff, filters.types, filters.vehicleType, setSearchParams])

  const { cars, totalCount } = useFilteredCars()

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return cars.slice(start, start + PAGE_SIZE)
  }, [cars, page])

  useEffect(() => {
    setPage(1)
  }, [filters, sortBy, location])

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
    setLocation('Metro Manila')
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: { xs: 8, md: 6 } }}>
      <Paper elevation={0} sx={stickyToolbarPaper(theme)}>
        <Container
          maxWidth="lg"
          sx={{
            py: { xs: 1.5, md: 2 },
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
                  p: 2.5,
                  position: 'sticky',
                  top: 112,
                  maxHeight: 'calc(100vh - 100px)',
                  overflowY: 'auto',
                  ...softInteractiveSurface(theme, false),
                }}
              >
                <Stack spacing={0.5} sx={{ mb: 2 }}>
                  <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: '0.08em' }}>
                    Refine
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700} component="h2">
                    Filters
                  </Typography>
                </Stack>
                <FilterPanel
                  filters={filters}
                  onChange={setFilter}
                  onClear={handleClear}
                  hasActiveFilters={hasActiveFilters}
                />
              </Paper>
            </Grid>
          )}
          <Grid item xs={12} md={isMd ? 12 : 9}>
            <SortBar
              total={totalCount}
              areaLabel={(location || 'Metro Manila').split(',')[0]?.trim() || 'Metro Manila'}
              sortBy={sortBy}
              viewMode={viewMode}
              onSort={setSortBy}
              onViewMode={setViewMode}
              onOpenFilters={isMd ? () => setDrawerOpen(true) : undefined}
              filtersActive={hasActiveFilters}
            />

            <VehicleTypeFilterChips value={filters.vehicleType} onChange={(vehicleType) => setFilter({ vehicleType })} />

            {vehiclesLoading ? (
              <CarGridSkeleton count={PAGE_SIZE} layout={viewMode} />
            ) : vehiclesFatalError && vehiclesError ? (
              <EmptyState
                title="Couldn’t load vehicles"
                description={vehiclesError}
                actionLabel="Try again"
                onAction={() => refetchVehicles()}
              />
            ) : pageItems.length === 0 ? (
              <EmptyState
                title="No vehicles match your filters"
                description="Try changing vehicle type, widening your price range, or clearing filters."
                actionLabel="Clear filters"
                onAction={handleClear}
              />
            ) : (
              <>
                <Grid container spacing={{ xs: 2.5, md: 3 }}>
                  {pageItems.map((car) => (
                    <Grid item xs={12} sm={viewMode === 'grid' ? 6 : 12} md={viewMode === 'grid' ? 4 : 12} key={car.id}>
                      <Box sx={{ height: '100%', '& .MuiCard-root': { borderRadius: 3, height: '100%' } }}>
                        <CarCard
                          car={car}
                          layout={viewMode}
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
              right: 16,
              bottom: `max(24px, calc(16px + env(safe-area-inset-bottom)))`,
            }}
            onClick={() => setDrawerOpen(true)}
          >
            <FilterAlt />
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
