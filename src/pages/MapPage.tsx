import DirectionsCar from '@mui/icons-material/DirectionsCar'
import ExpandMore from '@mui/icons-material/ExpandMore'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import MyLocation from '@mui/icons-material/MyLocation'
import SearchOutlined from '@mui/icons-material/SearchOutlined'
import TwoWheeler from '@mui/icons-material/TwoWheeler'
import {
  Box,
  Button,
  Collapse,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  Slider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import ExploreMapListingStrip from '../components/landing/ExploreMapListingStrip'
import PageHeader from '../components/layout/PageHeader'
import ExploreMapErrorBoundary from '../components/map/ExploreMapErrorBoundary'
import ExploreMapFallbackList from '../components/map/ExploreMapFallbackList'
import { useCarsStore } from '../store/useCarsStore'
import { useGeolocationStore } from '../store/useGeolocationStore'
import {
  applyExploreMapFilters,
  carsToExploreListings,
  listingsWithinRadiusKm,
  NEARBY_LISTINGS_RADIUS_KM,
  type ExploreMapFilterMode,
  type ExploreMapListing,
} from '../utils/exploreMapListings'

const ExploreRentalsMapLazy = lazy(() => import('../components/landing/ExploreRentalsMapInner'))

function formatPesoShort(n: number): string {
  if (n >= 1000) return `₱${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return `₱${n}`
}

/**
 * Full-screen map experience: type/price/location filters, lazy map, listing strip.
 * Swap `useCarsStore` for an API hook when backend is ready.
 */
export default function MapPage() {
  const theme = useTheme()
  const isCompactLayout = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true })
  const navigate = useNavigate()
  const location = useLocation()
  const cars = useCarsStore((s) => s.cars)
  const userLocation = useGeolocationStore((s) => s.userLocation)
  const [filterMode, setFilterMode] = useState<ExploreMapFilterMode>('all')
  const [locationQuery, setLocationQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  /** When true, listing strip scrolls selected card into view; map marker picks keep the strip position. */
  const [selectionFromListingStrip, setSelectionFromListingStrip] = useState(false)
  /** Bumped when the user chooses “Show in listing below” so the strip scrolls even if that listing was already selected on the map. */
  const [listingScrollRequest, setListingScrollRequest] = useState(0)
  /** Bumped when the user chooses “View on map” on a strip card so the marker popup opens after fly-to. */
  const [mapFocusNonce, setMapFocusNonce] = useState(0)
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false)

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname, location.key])

  const handleMapSelect = useCallback((id: string) => {
    setSelectionFromListingStrip(false)
    setSelectedId(id)
  }, [])

  const handleListingStripSelect = useCallback((id: string) => {
    setSelectionFromListingStrip(true)
    setSelectedId(id)
  }, [])

  const handleShowInListing = useCallback((l: ExploreMapListing) => {
    setSelectionFromListingStrip(true)
    setSelectedId(l.id)
    setListingScrollRequest((n) => n + 1)
    requestAnimationFrame(() => {
      document.getElementById('explore-map-listing-strip')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const handleViewOnMap = useCallback((l: ExploreMapListing) => {
    setSelectionFromListingStrip(false)
    setSelectedId(l.id)
    setMapFocusNonce((n) => n + 1)
    requestAnimationFrame(() => {
      document.getElementById('explore-map-canvas')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }, [])

  const priceExtent = useMemo((): [number, number] => {
    if (!cars.length) return [0, 12_000]
    const max = Math.max(...cars.map((c) => c.pricePerDay))
    const hi = Math.ceil(max / 500) * 500 + 500
    return [0, Math.max(hi, 5000)]
  }, [cars])

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 12_000])

  useEffect(() => {
    setPriceRange([priceExtent[0], priceExtent[1]])
  }, [priceExtent])

  useEffect(() => {
    if (!isCompactLayout) setMoreFiltersOpen(false)
  }, [isCompactLayout])

  const filtersDirty = useMemo(
    () =>
      Boolean(locationQuery.trim()) ||
      priceRange[0] > priceExtent[0] ||
      priceRange[1] < priceExtent[1],
    [locationQuery, priceRange, priceExtent],
  )

  const allListings = useMemo(() => carsToExploreListings(cars), [cars])

  const filtered = useMemo(
    () =>
      applyExploreMapFilters(allListings, filterMode, userLocation, {
        priceMin: priceRange[0] > priceExtent[0] ? priceRange[0] : null,
        priceMax: priceRange[1] < priceExtent[1] ? priceRange[1] : null,
        locationQuery,
      }),
    [allListings, filterMode, userLocation, priceRange, locationQuery, priceExtent],
  )

  useEffect(() => {
    if (selectedId && !filtered.some((l) => l.id === selectedId)) {
      setSelectedId(null)
    }
  }, [filtered, selectedId])

  const handleNearbyNavigate = useCallback(
    (dir: 'next' | 'prev') => {
      const cur = filtered.find((l) => l.id === selectedId)
      if (!cur) return
      const ring = listingsWithinRadiusKm(cur, filtered, NEARBY_LISTINGS_RADIUS_KM)
      if (ring.length < 2) return
      const i = ring.findIndex((l) => l.id === selectedId)
      if (i < 0) return
      const n = ring.length
      const j = dir === 'next' ? (i + 1) % n : (i - 1 + n) % n
      handleMapSelect(ring[j].id)
      setMapFocusNonce((x) => x + 1)
    },
    [filtered, selectedId, handleMapSelect],
  )

  const onViewDetails = (l: ExploreMapListing) => navigate(`/cars/${l.id}`)

  const handleFilter = (_: React.MouseEvent<HTMLElement>, v: ExploreMapFilterMode | null) => {
    if (v != null) setFilterMode(v)
  }

  const nearbyDisabled = !userLocation

  const mapFallback = (
    <ExploreMapFallbackList listings={filtered} onNavigate={(id) => navigate(`/cars/${id}`)} />
  )

  const mapSuspense = (
    <Box
      sx={{
        height: '100%',
        minHeight: 320,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.100',
      }}
    >
      <Stack alignItems="center" spacing={1}>
        <Skeleton variant="rounded" width={200} height={24} />
        <Typography variant="caption" color="text.secondary">
          Loading map…
        </Typography>
      </Stack>
    </Box>
  )

  const typeToggle = (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={filterMode}
      onChange={handleFilter}
      aria-label="Filter map by vehicle type"
      sx={{
        flexWrap: 'nowrap',
        width: '100%',
        '& .MuiToggleButtonGroup-grouped': {
          flex: isCompactLayout ? '0 0 auto' : '0 1 auto',
          minWidth: 0,
          px: { xs: 0.75, sm: 1.25 },
          typography: 'caption',
        },
        ...(isCompactLayout
          ? {
              display: 'flex',
              overflowX: 'auto',
              pb: 0.25,
              scrollbarWidth: 'thin',
              '&::-webkit-scrollbar': { height: 4 },
            }
          : { flexWrap: 'wrap' }),
      }}
    >
      <ToggleButton value="all">All</ToggleButton>
      <ToggleButton value="cars">
        <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="center">
          <DirectionsCar sx={{ fontSize: 18 }} />
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            Cars
          </Box>
        </Stack>
      </ToggleButton>
      <ToggleButton value="motorcycles">
        <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="center">
          <TwoWheeler sx={{ fontSize: 18 }} />
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            Moto
          </Box>
        </Stack>
      </ToggleButton>
      <Tooltip
        title={
          nearbyDisabled
            ? 'Share your location from the header pin to filter by distance'
            : 'Within about 12 km of your position'
        }
      >
        <span>
          <ToggleButton value="nearby" disabled={nearbyDisabled}>
            <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="center">
              <MyLocation sx={{ fontSize: 18 }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Nearby
              </Box>
            </Stack>
          </ToggleButton>
        </span>
      </Tooltip>
    </ToggleButtonGroup>
  )

  const locationPriceBlock = (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
      <TextField
        size="small"
        placeholder="Area (Cebu, Davao, Makati…)"
        value={locationQuery}
        onChange={(e) => setLocationQuery(e.target.value)}
        sx={{ flex: { md: 1 }, minWidth: { md: 240 } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchOutlined fontSize="small" color="action" />
            </InputAdornment>
          ),
        }}
        inputProps={{ 'aria-label': 'Filter listings by location name' }}
      />
      <Box sx={{ flex: { md: 2 }, minWidth: 0, px: { xs: 0, md: 1 } }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Price per day: {formatPesoShort(priceRange[0])} – {formatPesoShort(priceRange[1])}
        </Typography>
        <Slider
          size="small"
          value={priceRange}
          min={priceExtent[0]}
          max={priceExtent[1]}
          step={100}
          onChange={(_, v) => setPriceRange(v as [number, number])}
          valueLabelDisplay="auto"
          valueLabelFormat={(v) => formatPesoShort(v)}
          disableSwap
        />
      </Box>
      <Button variant="outlined" size="small" onClick={() => setPriceRange([priceExtent[0], priceExtent[1]])}>
        Reset price
      </Button>
    </Stack>
  )

  const mapBody =
    cars.length === 0 ? (
      <Skeleton variant="rounded" height="100%" sx={{ borderRadius: 0 }} />
    ) : filtered.length === 0 ? (
      <Box sx={{ py: 6, textAlign: 'center', px: 2 }}>
        <Typography color="text.secondary">No listings match these filters.</Typography>
        <Button
          sx={{ mt: 1 }}
          onClick={() => {
            setFilterMode('all')
            setLocationQuery('')
            setPriceRange([priceExtent[0], priceExtent[1]])
          }}
        >
          Clear filters
        </Button>
      </Box>
    ) : (
      <ExploreMapErrorBoundary fallback={mapFallback}>
        <Suspense fallback={mapSuspense}>
          <Box sx={{ height: '100%' }}>
            <ExploreRentalsMapLazy
              listings={filtered}
              selectedId={selectedId}
              onSelect={handleMapSelect}
              userLocation={userLocation}
              onViewDetails={onViewDetails}
              onShowInListing={handleShowInListing}
              mapFocusNonce={mapFocusNonce}
              onNearbyNavigate={handleNearbyNavigate}
            />
          </Box>
        </Suspense>
      </ExploreMapErrorBoundary>
    )

  const mapChromeSx = {
    position: 'relative' as const,
    overflow: 'hidden',
    border: '1px solid',
    borderColor: 'divider',
    boxShadow: `0 8px 32px ${alpha('#000', 0.08)}`,
    bgcolor: 'grey.50',
    scrollMarginTop: { xs: 72, md: 88 },
    borderRadius: { xs: 2, md: 3 },
    ...(isCompactLayout
      ? {
          flex: 1,
          minHeight: { xs: 'min(520px, calc(100dvh - 200px))', sm: 420 },
          maxHeight: { xs: 'none', sm: 'none' },
        }
      : {
          height: { sm: '56dvh', md: 'calc(100dvh - 280px)' },
          minHeight: 340,
          maxHeight: 720,
        }),
  }

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        pb: { xs: 2, md: 4 },
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          px: { xs: 1.5, sm: 2, md: 3 },
          pt: { xs: 1, md: 3 },
        }}
      >
        {isCompactLayout ? null : (
          <PageHeader
            overline="Explore"
            title="Rental map"
            subtitle="Filter by vehicle type, price, and area. Your location (when shared) powers Nearby and helps center the map."
            dense
          />
        )}

        {isCompactLayout ? null : (
          <Stack spacing={2} sx={{ mb: 2 }}>
            {typeToggle}
            {locationPriceBlock}
          </Stack>
        )}

        <Box id="explore-map-canvas" sx={mapChromeSx}>
          {isCompactLayout ? (
            <Paper
              elevation={4}
              sx={{
                position: 'absolute',
                top: 10,
                left: 10,
                right: 52,
                zIndex: 1100,
                borderRadius: 2,
                px: 1.25,
                py: 1,
                pointerEvents: 'auto',
                bgcolor: (t) => alpha(t.palette.background.paper, 0.94),
                backdropFilter: 'blur(10px)',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1, minWidth: 0 }} noWrap>
                    Rental map
                  </Typography>
                  <Tooltip title="Filter by type, price, and area. Share your location for Nearby and map centering.">
                    <IconButton size="small" aria-label="About this map" sx={{ flexShrink: 0 }}>
                      <InfoOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                {typeToggle}
                <Button
                  size="small"
                  color={filtersDirty ? 'primary' : 'inherit'}
                  onClick={() => setMoreFiltersOpen((o) => !o)}
                  endIcon={
                    <ExpandMore
                      sx={{
                        transition: theme.transitions.create('transform'),
                        transform: moreFiltersOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  }
                  sx={{
                    alignSelf: 'flex-start',
                    textTransform: 'none',
                    fontWeight: 600,
                    typography: 'caption',
                    py: 0.25,
                    minHeight: 32,
                  }}
                >
                  {'Area & price'}
                  {filtersDirty ? ' · active' : ''}
                </Button>
                <Collapse in={moreFiltersOpen}>{locationPriceBlock}</Collapse>
              </Stack>
            </Paper>
          ) : null}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 400,
              '& .leaflet-container': { borderRadius: 0 },
            }}
          >
            {mapBody}
          </Box>
        </Box>

        <Box
          id="explore-map-listing-strip"
          sx={{ mt: { xs: 2, md: 3 }, px: { xs: 0.5, sm: 0 }, scrollMarginTop: { xs: 72, md: 88 } }}
        >
          <ExploreMapListingStrip
            listings={filtered}
            selectedId={selectedId}
            onSelect={handleListingStripSelect}
            onViewDetails={onViewDetails}
            onViewOnMap={handleViewOnMap}
            autoScrollToSelected={selectionFromListingStrip}
            listingScrollRequest={listingScrollRequest}
            title="Listings on this map"
          />
        </Box>
      </Container>
    </Box>
  )
}
