import CloseRounded from '@mui/icons-material/CloseRounded'
import DirectionsCar from '@mui/icons-material/DirectionsCar'
import Explore from '@mui/icons-material/Explore'
import FitScreen from '@mui/icons-material/FitScreen'
import RestartAlt from '@mui/icons-material/RestartAlt'
import SearchOutlined from '@mui/icons-material/SearchOutlined'
import TuneRounded from '@mui/icons-material/TuneRounded'
import TwoWheeler from '@mui/icons-material/TwoWheeler'
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  Slider,
  Stack,
  SwipeableDrawer,
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
import { MAP_PAGE_FLOAT_CLEAR_BOTTOM } from '../components/layout/MobileBottomNav'
import ExploreMapErrorBoundary from '../components/map/ExploreMapErrorBoundary'
import ExploreMapFallbackList from '../components/map/ExploreMapFallbackList'
import { MapPageResponsiveSplit } from '../components/map/MapPageLayouts'
import { useCarsStore } from '../store/useCarsStore'
import { useGeolocationStore } from '../store/useGeolocationStore'
import {
  applyExploreMapFilters,
  carsToExploreListings,
  listingsSortedByDistanceFrom,
  type ExploreMapFilterMode,
  type ExploreMapListing,
} from '../utils/exploreMapListings'

/** Same Leaflet surface as landing `MapPreview` — one chunk; clustering toggles by breakpoint only. */
const ExploreRentalsMapLazy = lazy(() => import('../components/landing/ExploreRentalsMapInner'))

function formatPesoShort(n: number): string {
  if (n >= 1000) return `₱${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return `₱${n}`
}

/** Space above bottom peek so OSM/CARTO attribution stays readable (matches peek card height). */
const MOBILE_LISTING_PEEK_RESERVE_PX = 102

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
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [listingsDrawerOpen, setListingsDrawerOpen] = useState(false)
  /** Desktop: increment to force the map to fit all filtered pins in view. */
  const [fitBoundsNonce, setFitBoundsNonce] = useState(0)

  /**
   * Map-only overlays must stay **below** `theme.zIndex.drawer` (1200). Leaflet uses ~500–650;
   * App bar / tab bar use 1100. Previous values (1250–1500) painted hints and the peek above
   * bottom sheets, which broke the filter UI.
   */
  const zMap = useMemo(
    () => ({
      hint: theme.zIndex.mobileStepper,
      toolbar: theme.zIndex.mobileStepper + 5,
      peek: theme.zIndex.mobileStepper + 10,
      filterScrim: theme.zIndex.appBar - 1,
    }),
    [theme],
  )

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

  const handleShowInListing = useCallback(
    (l: ExploreMapListing) => {
      setSelectionFromListingStrip(true)
      setSelectedId(l.id)
      setListingScrollRequest((n) => n + 1)
      if (isCompactLayout) {
        setListingsDrawerOpen(true)
      } else {
        requestAnimationFrame(() => {
          document.getElementById('explore-map-listing-strip')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }
    },
    [isCompactLayout],
  )

  const handleViewOnMap = useCallback(
    (l: ExploreMapListing) => {
      setSelectionFromListingStrip(false)
      setSelectedId(l.id)
      setMapFocusNonce((n) => n + 1)
      if (isCompactLayout) setListingsDrawerOpen(false)
      requestAnimationFrame(() => {
        document.getElementById('explore-map-canvas')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    },
    [isCompactLayout],
  )

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
    if (!isCompactLayout) {
      setFilterDrawerOpen(false)
      setListingsDrawerOpen(false)
    }
  }, [isCompactLayout])

  const filtersDirty = useMemo(
    () =>
      filterMode !== 'all' ||
      Boolean(locationQuery.trim()) ||
      priceRange[0] > priceExtent[0] ||
      priceRange[1] < priceExtent[1],
    [filterMode, locationQuery, priceRange, priceExtent],
  )

  const priceFilterActive = useMemo(
    () => priceRange[0] > priceExtent[0] || priceRange[1] < priceExtent[1],
    [priceRange, priceExtent],
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
      const ring = listingsSortedByDistanceFrom(cur, filtered)
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
        ...(isCompactLayout
          ? {
              display: 'flex',
              overflowX: 'auto',
              pb: 0.25,
              scrollbarWidth: 'thin',
              '&::-webkit-scrollbar': { height: 4 },
              bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
              borderRadius: '12px',
              p: 0.5,
              border: '1px solid',
              borderColor: (t) => alpha(t.palette.primary.main, 0.12),
              gap: 0.5,
              '& .MuiToggleButtonGroup-grouped': {
                flex: '0 0 auto',
                minWidth: 0,
                typography: 'caption',
                border: 'none',
                borderRadius: '10px',
                mx: 0,
                px: 1.35,
                py: 0.75,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.8125rem',
                color: 'text.secondary',
                '&.Mui-selected': {
                  bgcolor: 'common.white',
                  color: 'primary.main',
                  boxShadow: (th) => `0 1px 4px ${alpha(th.palette.common.black, 0.07)}`,
                },
              },
            }
          : {
              flexWrap: 'wrap',
              bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
              borderRadius: '12px',
              p: 0.5,
              border: '1px solid',
              borderColor: (t) => alpha(t.palette.primary.main, 0.12),
              gap: 0.5,
              '& .MuiToggleButtonGroup-grouped': {
                flex: '0 1 auto',
                minWidth: 0,
                px: { xs: 0.75, sm: 1.25 },
                typography: 'caption',
                border: 'none',
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.8125rem',
                color: 'text.secondary',
                '&.Mui-selected': {
                  bgcolor: 'common.white',
                  color: 'primary.main',
                  boxShadow: (th) => `0 1px 4px ${alpha(th.palette.common.black, 0.06)}`,
                },
              },
            }),
      }}
    >
      <ToggleButton value="all">All</ToggleButton>
      <ToggleButton value="cars">
        <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="center">
          <DirectionsCar sx={{ fontSize: 18 }} />
          <Box component="span" sx={{ display: 'inline' }}>
            Car
          </Box>
        </Stack>
      </ToggleButton>
      <ToggleButton value="motorcycles">
        <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="center">
          <TwoWheeler sx={{ fontSize: 18 }} />
          <Box component="span" sx={{ display: 'inline' }}>
            Moto
          </Box>
        </Stack>
      </ToggleButton>
      <Tooltip
        title={
          nearbyDisabled
            ? 'Share your location from the app bar (location icon) to filter by distance'
            : 'Within about 12 km of your position'
        }
      >
        <span>
          <ToggleButton value="nearby" disabled={nearbyDisabled}>
            <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="center">
              <Explore sx={{ fontSize: 18 }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Nearby
              </Box>
            </Stack>
          </ToggleButton>
        </span>
      </Tooltip>
    </ToggleButtonGroup>
  )

  const locationSearchField = (
    <TextField
      size="small"
      fullWidth
      placeholder={
        isCompactLayout ? 'Search city, area, or landmark' : 'Area (Cebu, Davao, Makati…)'
      }
      value={locationQuery}
      onChange={(e) => setLocationQuery(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchOutlined
              fontSize="small"
              sx={(t) => ({
                color: isCompactLayout ? t.palette.primary.main : t.palette.action.active,
              })}
            />
          </InputAdornment>
        ),
      }}
      inputProps={{ 'aria-label': 'Filter listings by location name' }}
      sx={
        isCompactLayout
          ? {
              '& .MuiOutlinedInput-root': {
                borderRadius: '999px',
                bgcolor: 'common.white',
                transition: (t) =>
                  t.transitions.create(['border-color', 'box-shadow'], { duration: 200 }),
                boxShadow: 'none',
                '& fieldset': {
                  borderColor: 'divider',
                  borderWidth: 1,
                },
                '&:hover fieldset': {
                  borderColor: (t) => alpha(t.palette.primary.main, 0.35),
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                  borderWidth: 2,
                },
                '&.Mui-focused': {
                  boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.22)}`,
                },
              },
              '& .MuiOutlinedInput-input': {
                py: 1.1,
                pl: 0.25,
                fontSize: '0.9375rem',
                letterSpacing: '-0.01em',
                color: 'text.primary',
                '&::placeholder': {
                  color: 'text.secondary',
                  opacity: 1,
                },
              },
              '& .MuiInputAdornment-root': {
                ml: 1,
                mr: 0.25,
              },
            }
          : undefined
      }
    />
  )

  const priceFilterCore = (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            fontWeight={700}
            sx={{ letterSpacing: '0.08em', lineHeight: 1.2 }}
          >
            Price per day
          </Typography>
          <Typography variant="h6" fontWeight={800} sx={{ mt: 0.75, letterSpacing: '-0.02em' }}>
            {formatPesoShort(priceRange[0])} – {formatPesoShort(priceRange[1])}
          </Typography>
        </Box>
        <Tooltip title="Reset price range">
          <span>
            <IconButton
              size="small"
              aria-label="Reset price range"
              onClick={() => setPriceRange([priceExtent[0], priceExtent[1]])}
              disabled={!priceFilterActive}
              sx={{
                flexShrink: 0,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: 'background.paper',
              }}
            >
              <RestartAlt fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          Min · {formatPesoShort(priceExtent[0])}
        </Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          Max · {formatPesoShort(priceExtent[1])}
        </Typography>
      </Stack>
      <Slider
        size="medium"
        value={priceRange}
        min={priceExtent[0]}
        max={priceExtent[1]}
        step={100}
        onChange={(_, v) => setPriceRange(v as [number, number])}
        valueLabelDisplay="auto"
        valueLabelFormat={(v) => formatPesoShort(v)}
        disableSwap
        sx={{
          '& .MuiSlider-thumb': { width: 18, height: 18 },
          '& .MuiSlider-track': { height: 6, borderRadius: 3 },
          '& .MuiSlider-rail': { height: 6, borderRadius: 3, opacity: 0.35 },
        }}
      />
    </Stack>
  )

  const locationPriceBlock = (
    <Stack spacing={2}>
      {!isCompactLayout ? locationSearchField : null}
      {priceFilterCore}
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
      <ExploreMapErrorBoundary
        resetKey={`${location.key}-${isCompactLayout ? 'compact' : 'wide'}`}
        fallback={mapFallback}
      >
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
              markerStyle="price"
              enableClustering={isCompactLayout}
              fitBoundsRequestId={fitBoundsNonce}
              clusterChunkDelay={isCompactLayout ? 50 : 96}
              clusterAnimations={isCompactLayout}
              clusterRadius={isCompactLayout ? 52 : 68}
            />
          </Box>
        </Suspense>
      </ExploreMapErrorBoundary>
    )

  const mapChromeSx = {
    position: 'relative' as const,
    /** Above panel chrome; mobile/desktop overlays (toolbar, hints) use higher z via zMap. */
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    /** `1 1 0` + `minHeight: 0` fills the split-pane column; plain `flex: 1` + only abspos children often yields ~0 height on desktop. */
    flex: '1 1 0px',
    minWidth: 0,
    /** Taller map canvas on desktop (same inner component as landing; more room than preview). */
    minHeight: { xs: 0, md: 560 },
    /** `overflow: hidden` + `border-radius` on wide flex panes can blank Leaflet raster tiles in Chrome; clip only on mobile. */
    overflow: { xs: 'hidden', md: 'visible' },
    border: { xs: 'none', md: '1px solid' },
    borderColor: 'divider',
    boxShadow: { xs: 'none', md: `0 12px 40px ${alpha('#000', 0.07)}` },
    bgcolor: { xs: 'grey.50', md: 'common.white' },
    scrollMarginTop: { xs: 72, md: 88 },
    /** Sharp corners on desktop avoid Leaflet + rounded overflow clipping raster tiles in Chrome. */
    borderRadius: 0,
    width: '100%',
  }

  const iOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        width: '100%',
      }}
    >
      <MapPageResponsiveSplit
        isMobile={isCompactLayout}
        sidebar={
          <Stack
            sx={{
              display: { xs: 'none', md: 'flex' },
              width: { md: 'min(420px, 32vw)' },
              maxWidth: { md: 460 },
              flexShrink: 0,
              borderRight: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              minHeight: 0,
              borderRadius: { md: '20px 0 0 20px' },
              boxShadow: { md: (t) => `4px 0 24px ${alpha(t.palette.common.black, 0.05)}` },
              zIndex: 0,
            }}
          >
            <Box sx={{ flexShrink: 0, p: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <PageHeader
                    overline="Explore"
                    title="Rental map"
                    subtitle="Filter by vehicle type, price, and area. Your location (when shared) powers Nearby and centers the map."
                    dense
                  />
                </Box>
                <Tooltip title="Fit map to filtered results">
                  <span>
                    <IconButton
                      size="small"
                      aria-label="Fit map to filtered results"
                      onClick={() => setFitBoundsNonce((n) => n + 1)}
                      disabled={filtered.length === 0}
                      sx={{
                        mt: 0.25,
                        flexShrink: 0,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                      }}
                    >
                      <FitScreen fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label={`${filtered.length} ${filtered.length === 1 ? 'vehicle' : 'vehicles'} on map`}
                sx={{ mt: 1.5, fontWeight: 700 }}
              />
            </Box>
            <Stack spacing={2} sx={{ p: 2, flexShrink: 0 }}>
              {typeToggle}
              {locationPriceBlock}
            </Stack>
            <Box
              id="explore-map-listing-strip"
              sx={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                px: 2,
                pb: 2,
                pt: 0,
                overflow: 'hidden',
              }}
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
                orientation="vertical"
              />
            </Box>
          </Stack>
        }
      >
        <>
          <Box
            sx={{
              flex: '1 1 0px',
              minHeight: 0,
              minWidth: 0,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {isCompactLayout ? (
              <Box
                sx={{
                  position: 'absolute',
                  top: 10,
                  left: 0,
                  right: 0,
                  zIndex: zMap.toolbar,
                  px: 2,
                  pointerEvents: 'none',
                  '& > *': { pointerEvents: 'auto' },
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.25,
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'common.white',
                    boxShadow: (t) => `0 8px 32px ${alpha(t.palette.common.black, 0.08)}`,
                  }}
                >
                  {locationSearchField}
                  <Stack direction="row" spacing={1} alignItems="stretch" sx={{ mt: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>{typeToggle}</Box>
                    <IconButton
                      aria-label="Open filters"
                      onClick={() => setFilterDrawerOpen(true)}
                      sx={{
                        position: 'relative',
                        flexShrink: 0,
                        alignSelf: 'stretch',
                        width: 48,
                        minHeight: 44,
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: (t) => alpha(t.palette.primary.main, 0.22),
                        bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
                        color: 'primary.main',
                        '&:hover': {
                          bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                          borderColor: (t) => alpha(t.palette.primary.main, 0.35),
                        },
                      }}
                    >
                      <TuneRounded />
                      {filtersDirty ? (
                        <Box
                          component="span"
                          sx={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            border: '2px solid',
                            borderColor: 'common.white',
                          }}
                        />
                      ) : null}
                    </IconButton>
                  </Stack>
                </Paper>
              </Box>
            ) : null}

            {isCompactLayout ? (
              <Box
                aria-hidden
                onClick={() => setFilterDrawerOpen(false)}
                sx={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: zMap.filterScrim,
                  bgcolor: (t) => alpha(t.palette.common.black, filterDrawerOpen ? 0.34 : 0),
                  opacity: filterDrawerOpen ? 1 : 0,
                  transition: 'opacity 0.22s ease',
                  pointerEvents: filterDrawerOpen ? 'auto' : 'none',
                }}
              />
            ) : null}

            {!isCompactLayout && filtered.length > 0 ? (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 24,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: zMap.hint,
                  px: 2,
                  py: 0.75,
                  borderRadius: 999,
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                  color: (t) => t.palette.primary.dark,
                  border: '1px solid',
                  borderColor: (t) => alpha(t.palette.primary.main, 0.22),
                  backdropFilter: 'saturate(140%) blur(10px)',
                  WebkitBackdropFilter: 'saturate(140%) blur(10px)',
                  pointerEvents: 'none',
                  boxShadow: (t) => `0 4px 20px ${alpha(t.palette.common.black, 0.06)}`,
                }}
              >
                <Typography variant="caption" fontWeight={700} sx={{ color: 'inherit' }}>
                  Prices on pins · clusters show lowest rate · tap for details
                </Typography>
              </Box>
            ) : null}

            {isCompactLayout && filtered.length > 0 && !filterDrawerOpen && !listingsDrawerOpen ? (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: `calc(${MAP_PAGE_FLOAT_CLEAR_BOTTOM} + ${MOBILE_LISTING_PEEK_RESERVE_PX}px + 10px)`,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: zMap.hint,
                  px: 2,
                  py: 0.75,
                  borderRadius: 999,
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                  color: (t) => t.palette.primary.dark,
                  border: '1px solid',
                  borderColor: (t) => alpha(t.palette.primary.main, 0.22),
                  backdropFilter: 'saturate(140%) blur(10px)',
                  WebkitBackdropFilter: 'saturate(140%) blur(10px)',
                  pointerEvents: 'none',
                  maxWidth: 'calc(100% - 24px)',
                  textAlign: 'center',
                  boxShadow: (t) => `0 4px 20px ${alpha(t.palette.common.black, 0.06)}`,
                }}
              >
                <Typography variant="caption" fontWeight={700} sx={{ color: 'inherit' }}>
                  Prices on pins · clusters show lowest rate · tap for details
                </Typography>
              </Box>
            ) : null}

            <Box id="explore-map-canvas" sx={mapChromeSx}>
              <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, position: 'relative' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 2,
                    '& .leaflet-container': { borderRadius: 0 },
                  }}
                >
                  {mapBody}
                </Box>
              </Box>
            </Box>

            {isCompactLayout && !listingsDrawerOpen && !filterDrawerOpen && filtered.length > 0 ? (
              <Paper
                elevation={8}
                role="button"
                tabIndex={0}
                aria-label="Open listings"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setListingsDrawerOpen(true)
                  }
                }}
                onClick={() => setListingsDrawerOpen(true)}
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 10,
                  right: 10,
                  zIndex: zMap.peek,
                  borderRadius: '20px 20px 0 0',
                  pt: 2,
                  px: 2,
                  pb: 'max(16px, calc(12px + env(safe-area-inset-bottom, 0px)))',
                  cursor: 'pointer',
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderBottom: 'none',
                  boxShadow: (t) => `0 -12px 40px ${alpha(t.palette.common.black, 0.14)}`,
                  transition: (t) => t.transitions.create(['transform', 'box-shadow'], { duration: 180 }),
                  '&:active': { transform: 'scale(0.995)' },
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 5,
                    borderRadius: 3,
                    bgcolor: 'divider',
                    mx: 'auto',
                    mb: 1.25,
                  }}
                />
                <Typography variant="h6" fontWeight={800} sx={{ textAlign: 'center', letterSpacing: '-0.02em' }}>
                  {filtered.length} {filtered.length === 1 ? 'vehicle' : 'vehicles'} available
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', textAlign: 'center', mt: 0.5, fontWeight: 600 }}
                >
                  Swipe up to browse listings
                </Typography>
              </Paper>
            ) : null}
          </Box>

          {isCompactLayout ? (
            <SwipeableDrawer
              anchor="bottom"
              open={filterDrawerOpen}
              onClose={() => setFilterDrawerOpen(false)}
              onOpen={() => setFilterDrawerOpen(true)}
              disableBackdropTransition={!iOS}
              disableDiscovery={iOS}
              ModalProps={{ keepMounted: true }}
              PaperProps={{
                sx: {
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  maxHeight: 'min(72dvh, 560px)',
                  pb: 'max(16px, env(safe-area-inset-bottom, 0px))',
                  px: 2,
                  pt: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderBottom: 'none',
                  boxShadow: (t) => `0 -16px 48px ${alpha(t.palette.common.black, 0.16)}`,
                },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 5,
                  borderRadius: 3,
                  bgcolor: 'divider',
                  mx: 'auto',
                  mb: 1,
                }}
              />
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em">
                  Filters
                </Typography>
                <IconButton aria-label="Close filters" onClick={() => setFilterDrawerOpen(false)} size="small">
                  <CloseRounded />
                </IconButton>
              </Stack>
              {priceFilterCore}
              <Button
                fullWidth
                variant="outlined"
                color="inherit"
                onClick={() => setFilterDrawerOpen(false)}
                sx={{ mt: 3, py: 1.25, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
              >
                Done
              </Button>
            </SwipeableDrawer>
          ) : null}

          {isCompactLayout ? (
            <SwipeableDrawer
              anchor="bottom"
              open={listingsDrawerOpen}
              onClose={() => setListingsDrawerOpen(false)}
              onOpen={() => setListingsDrawerOpen(true)}
              disableBackdropTransition={!iOS}
              disableDiscovery={iOS}
              hideBackdrop
              ModalProps={{ keepMounted: true }}
              PaperProps={{
                sx: {
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  maxHeight: 'min(86dvh, 820px)',
                  mx: 0.5,
                  mt: 1,
                  pb: 'max(12px, env(safe-area-inset-bottom, 0px))',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderBottom: 'none',
                  boxShadow: (t) => `0 -12px 48px ${alpha(t.palette.common.black, 0.14)}`,
                },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 5,
                  borderRadius: 3,
                  bgcolor: 'divider',
                  mx: 'auto',
                  mt: 1,
                  mb: 0.5,
                  flexShrink: 0,
                }}
              />
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 2, pb: 1, pt: 0.5, flexShrink: 0 }}
              >
                <Typography variant="subtitle1" fontWeight={800}>
                  Listings
                </Typography>
                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  label={`${filtered.length} ${filtered.length === 1 ? 'vehicle' : 'vehicles'}`}
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
              <Box
                id="explore-map-listing-strip"
                sx={{
                  flex: 1,
                  minHeight: 240,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  px: 2,
                  pb: 2,
                }}
              >
                <ExploreMapListingStrip
                  listings={filtered}
                  selectedId={selectedId}
                  onSelect={handleListingStripSelect}
                  onViewDetails={onViewDetails}
                  onViewOnMap={handleViewOnMap}
                  autoScrollToSelected={selectionFromListingStrip}
                  listingScrollRequest={listingScrollRequest}
                  layout="minimal"
                  orientation="vertical"
                  title=""
                />
              </Box>
            </SwipeableDrawer>
          ) : null}
        </>
      </MapPageResponsiveSplit>
    </Box>
  )
}
