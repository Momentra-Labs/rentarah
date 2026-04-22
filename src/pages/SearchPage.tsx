import FilterAlt from '@mui/icons-material/FilterAlt'
import {
  Box,
  Button,
  Container,
  Fab,
  Grid,
  Pagination,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import CarCard from '../components/common/CarCard'
import DateRangePicker from '../components/common/DateRangePicker'
import EmptyState from '../components/common/EmptyState'
import CarGridSkeleton from '../components/skeletons/CarGridSkeleton'
import FilterDrawer from '../components/search/FilterDrawer'
import FilterPanel from '../components/search/FilterPanel'
import SortBar from '../components/search/SortBar'
import { useFilteredCars } from '../hooks/useFilteredCars'
import { useCarsStore } from '../store/useCarsStore'
import { useSearchStore } from '../store/useSearchStore'
import type { SearchFilters } from '../types'

const PAGE_SIZE = 6

const defaultFilters: SearchFilters = {
  priceRange: [0, 15000],
  types: [],
  transmission: 'all',
  fuel: 'all',
  seats: 0,
  availableOnly: true,
}

export default function SearchPage() {
  const theme = useTheme()
  const isMd = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const listingsReady = useCarsStore((s) => s.cars.length > 0)
  const [searchParams, setSearchParams] = useSearchParams()

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
    const loc = searchParams.get('location')
    const pu = searchParams.get('pickup')
    const dr = searchParams.get('dropoff')
    const types = searchParams.get('types')
    if (loc) setLocation(loc)
    if (pu && dr) setDates(dayjs(pu), dayjs(dr))
    else if (pu) setDates(dayjs(pu), dayjs(pu).add(3, 'day'))
    if (types) setFilter({ types: types.split(',').filter(Boolean) })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate store from URL once on entry
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('location', location)
    if (pickup?.isValid()) params.set('pickup', pickup.format('YYYY-MM-DD'))
    if (dropoff?.isValid()) params.set('dropoff', dropoff.format('YYYY-MM-DD'))
    if (filters.types.length) params.set('types', filters.types.join(','))
    setSearchParams(params, { replace: true })
  }, [location, pickup, dropoff, filters.types, setSearchParams])

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

  const areaLabel = location || 'Metro Manila'

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 6 }}>
      <Paper elevation={1} sx={{ position: 'sticky', top: 0, zIndex: 10, borderRadius: 0 }}>
        <Container
          maxWidth="lg"
          sx={{
            py: { xs: 1.25, md: 2 },
            px: { xs: 1.5, sm: 3 },
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 1.25, md: 2 }} alignItems={{ md: 'flex-end' }}>
            <TextField
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              size={isMd ? 'small' : 'medium'}
              sx={{ flex: 1, bgcolor: 'grey.50' }}
              InputLabelProps={{ shrink: true }}
            />
            <Box sx={{ flex: { xs: 1, md: 2 }, width: '100%' }}>
              <DateRangePicker
                pickup={pickup}
                dropoff={dropoff}
                onChange={({ pickup: p, dropoff: d }) => setDates(p, d)}
                minDate={dayjs()}
                spacing={isMd ? 1 : 2}
                size={isMd ? 'small' : 'medium'}
                pickupLabel="Pick-up"
                dropoffLabel="Return"
              />
            </Box>
            <Button
              variant="contained"
              size={isMd ? 'medium' : 'large'}
              sx={{
                minHeight: { xs: 40, md: 48 },
                px: { xs: 2, md: 3 },
                alignSelf: { xs: 'stretch', md: 'auto' },
                flexShrink: 0,
              }}
              onClick={() => navigate(`/search?${searchParams.toString()}`)}
            >
              Update
            </Button>
          </Stack>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: { xs: 0.75, md: 1 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              lineHeight: 1.35,
            }}
          >
            {totalCount} cars in {areaLabel.split(',')[0]}
          </Typography>
        </Container>
      </Paper>

      <Container maxWidth="lg" sx={{ mt: 3, px: { xs: 2, sm: 3 }, pb: { xs: 10, md: 6 } }}>
        <Grid container spacing={3}>
          {!isMd && (
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, position: 'sticky', top: 140, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Filters
                </Typography>
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
              sortBy={sortBy}
              viewMode={viewMode}
              onSort={setSortBy}
              onViewMode={setViewMode}
              onOpenFilters={isMd ? () => setDrawerOpen(true) : undefined}
              filtersActive={hasActiveFilters}
            />

            {!listingsReady ? (
              <CarGridSkeleton count={PAGE_SIZE} layout={viewMode} />
            ) : pageItems.length === 0 ? (
              <EmptyState
                title="No cars match your filters"
                description="Try widening your price range or clearing filters."
                actionLabel="Clear filters"
                onAction={handleClear}
              />
            ) : (
              <>
                <Grid container spacing={2}>
                  {pageItems.map((car) => (
                    <Grid item xs={12} sm={viewMode === 'grid' ? 6 : 12} md={viewMode === 'grid' ? 4 : 12} key={car.id}>
                      <CarCard
                        car={car}
                        layout={viewMode}
                        onNavigate={(c) => navigate(`/cars/${c.id}`)}
                        onReserve={(c) => navigate(`/cars/${c.id}`)}
                      />
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
