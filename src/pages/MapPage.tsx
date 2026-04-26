import DirectionsCar from '@mui/icons-material/DirectionsCar'
import MyLocation from '@mui/icons-material/MyLocation'
import SearchOutlined from '@mui/icons-material/SearchOutlined'
import TwoWheeler from '@mui/icons-material/TwoWheeler'
import {
  Box,
  Button,
  Container,
  InputAdornment,
  Skeleton,
  Slider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
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

  return (
    <Box sx={{ bgcolor: 'background.default', pb: { xs: 3, md: 4 } }}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, md: 3 } }}>
        <PageHeader
          overline="Explore"
          title="Rental map"
          subtitle="Filter by vehicle type, price, and area. Your location (when shared) powers Nearby and helps center the map."
          dense
        />

        <Stack spacing={2} sx={{ mb: 2 }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={filterMode}
            onChange={handleFilter}
            aria-label="Filter map by vehicle type"
            sx={{ flexWrap: 'wrap' }}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="cars">
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <DirectionsCar fontSize="small" />
                <Box component="span">Cars</Box>
              </Stack>
            </ToggleButton>
            <ToggleButton value="motorcycles">
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <TwoWheeler fontSize="small" />
                <Box component="span">Motorcycles</Box>
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
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <MyLocation fontSize="small" />
                    <Box component="span">Nearby</Box>
                  </Stack>
                </ToggleButton>
              </span>
            </Tooltip>
          </ToggleButtonGroup>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <TextField
              size="small"
              placeholder="Search by area (e.g. Cebu City, Davao, Makati)"
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
        </Stack>

        <Box
          id="explore-map-canvas"
          sx={{
            height: { xs: '52dvh', sm: '56dvh', md: 'calc(100dvh - 280px)' },
            minHeight: 340,
            maxHeight: 720,
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: `0 8px 32px ${alpha('#000', 0.08)}`,
            bgcolor: 'grey.50',
            scrollMarginTop: { xs: 72, md: 88 },
          }}
        >
          {cars.length === 0 ? (
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
                  />
                </Box>
              </Suspense>
            </ExploreMapErrorBoundary>
          )}
        </Box>

        <Box
          id="explore-map-listing-strip"
          sx={{ mt: 3, scrollMarginTop: { xs: 72, md: 88 } }}
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
