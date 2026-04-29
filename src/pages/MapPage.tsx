import ChevronLeft from '@mui/icons-material/ChevronLeft'
import ChevronRight from '@mui/icons-material/ChevronRight'
import AllInclusiveOutlined from '@mui/icons-material/AllInclusiveOutlined'
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
  Fade,
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
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
  listingsInSamePickupCitySorted,
  type ExploreMapFilterMode,
  type ExploreMapListing,
} from '../utils/exploreMapListings'

/** Same Leaflet surface as landing `MapPreview` — one chunk. */
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
  /** Thumb-scale map toolbar: chip text hidden; icons keep 44px hit targets inside toggles */
  const mapFiltersIconOnly = useMediaQuery('(max-width:359.95px)', { noSsr: true })
  const filtersIconOnly = isCompactLayout && mapFiltersIconOnly
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
  /** One subtle vibrate when the listings sheet nears fully expanded while dragging */
  const listingsDrawerFullSnapHapticGatedRef = useRef(false)
  /** Desktop: increment to force the map to fit all filtered pins in view. */
  const [fitBoundsNonce, setFitBoundsNonce] = useState(0)
  /** Desktop: listing-card hover syncs map marker styling / z-order. */
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null)
  /** Desktop /map — hide the tools column to widen the map. */
  const [desktopMapSidebarCollapsed, setDesktopMapSidebarCollapsed] = useState(false)

  /**
   * Leaflet stays ~400–650. Map chrome sits at mobileStepper + n (~1005–1015).
   * The **filters** drawer uses the default MUI drawer layer (~1200) so it stays above chrome.
   * The **listings** sheet is intentionally lowered so sticky Navbar (appBar ~1100) and the search /
   * type toolbar stay above it (see listings `ModalProps`).
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

  /** Anchored split-panel: lock document scroll on desktop /map so only the tools column scrolls. */
  useEffect(() => {
    if (isCompactLayout || location.pathname !== '/map') return
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
    }
  }, [isCompactLayout, location.pathname])

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
    } else {
      setDesktopMapSidebarCollapsed(false)
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

  useEffect(() => {
    if (hoveredListingId && !filtered.some((l) => l.id === hoveredListingId)) {
      setHoveredListingId(null)
    }
  }, [filtered, hoveredListingId])

  const handleNearbyNavigate = useCallback(
    (dir: 'next' | 'prev') => {
      const cur = filtered.find((l) => l.id === selectedId)
      if (!cur) return
      const ring = listingsInSamePickupCitySorted(cur, filtered)
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

  /** When the listings swipeable sheet is dragged near fully open, give a light haptic cue (supported devices). */
  const onListingsDrawerPaperTouchMove = useCallback((e: React.TouchEvent<HTMLElement>) => {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
    const top = e.currentTarget.getBoundingClientRect().top
    const frac = top / Math.max(window.innerHeight, 320)
    if (frac <= 0.065 && !listingsDrawerFullSnapHapticGatedRef.current) {
      listingsDrawerFullSnapHapticGatedRef.current = true
      navigator.vibrate(14)
    }
    if (frac > 0.2) listingsDrawerFullSnapHapticGatedRef.current = false
  }, [])

  const onViewDetails = (l: ExploreMapListing) => navigate(`/cars/${l.id}`)

  const handleFilter = (_: React.MouseEvent<HTMLElement>, v: ExploreMapFilterMode | null) => {
    if (v != null) setFilterMode(v)
  }

  const nearbyDisabled = !userLocation

  const snapPriceInExtent = useCallback(
    (n: number): number => {
      const [lo, hi] = priceExtent
      if (Number.isNaN(n)) return lo
      const snapped = Math.round(n / 100) * 100
      return Math.min(hi, Math.max(lo, snapped))
    },
    [priceExtent],
  )

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
                ...(filtersIconOnly
                  ? { minWidth: 44, minHeight: 44, px: 0.75, py: 0.65 }
                  : { px: 1.35, py: 0.75 }),
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
                  bgcolor: (th) => alpha(th.palette.primary.main, 0.14),
                  color: 'primary.dark',
                  fontWeight: 800,
                  border: '1px solid',
                  borderColor: 'primary.main',
                  boxShadow: (th) => `0 1px 4px ${alpha(th.palette.primary.main, 0.22)}`,
                },
              },
            }),
      }}
    >
      <ToggleButton value="all" aria-label="All vehicles">
        {filtersIconOnly ? (
          <AllInclusiveOutlined sx={{ fontSize: 22 }} aria-hidden />
        ) : (
          'All'
        )}
      </ToggleButton>
      <ToggleButton value="cars" aria-label="Cars">
        {filtersIconOnly ? (
          <DirectionsCar sx={{ fontSize: 22 }} aria-hidden />
        ) : (
          <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="center">
            <DirectionsCar sx={{ fontSize: 18 }} />
            <Box component="span" sx={{ display: 'inline' }}>
              Car
            </Box>
          </Stack>
        )}
      </ToggleButton>
      <ToggleButton value="motorcycles" aria-label="Motorcycles">
        {filtersIconOnly ? (
          <TwoWheeler sx={{ fontSize: 22 }} aria-hidden />
        ) : (
          <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="center">
            <TwoWheeler sx={{ fontSize: 18 }} />
            <Box component="span" sx={{ display: 'inline' }}>
              Moto
            </Box>
          </Stack>
        )}
      </ToggleButton>
      <Tooltip
        title={
          nearbyDisabled
            ? 'Share your location from the app bar (location icon) to filter by distance'
            : 'Within about 12 km of your position'
        }
      >
        <span>
          <ToggleButton value="nearby" disabled={nearbyDisabled} aria-label="Nearby">
            {filtersIconOnly ? (
              <Explore sx={{ fontSize: 22 }} aria-hidden />
            ) : (
              <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="center">
                <Explore sx={{ fontSize: 18 }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Nearby
                </Box>
              </Stack>
            )}
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
          : {
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                alignItems: 'center',
                bgcolor: 'background.paper',
                transition: (t) =>
                  t.transitions.create(['border-color', 'box-shadow'], { duration: 200 }),
                '& fieldset': { borderColor: 'divider', borderWidth: 1 },
                '&:hover fieldset': {
                  borderColor: (t) => alpha(t.palette.primary.main, 0.35),
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                  borderWidth: 1,
                },
                '&.Mui-focused': {
                  boxShadow: (t) => `0 0 0 2px ${alpha(t.palette.primary.main, 0.35)}`,
                },
              },
              '& .MuiOutlinedInput-input': {
                py: 1.15,
                lineHeight: 1.5,
                display: 'block',
                fontSize: '0.875rem',
                letterSpacing: '-0.01em',
                color: 'text.primary',
                '&::placeholder': {
                  color: 'text.secondary',
                  opacity: 1,
                  lineHeight: 'inherit',
                },
              },
              '& .MuiInputAdornment-root': {
                ml: 0.5,
                mr: 0,
                alignSelf: 'center',
                height: 'auto',
                maxHeight: 'none',
                '& .MuiSvgIcon-root': { display: 'block' },
              },
            }
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
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start', width: '100%' }}>
        <TextField
          size="small"
          label="Minimum"
          type="number"
          key={`pf-min-${priceRange[0]}-${priceRange[1]}-${priceExtent[1]}`}
          defaultValue={String(priceRange[0])}
          onBlur={(e) => {
            const raw = snapPriceInExtent(Number(e.target.value))
            setPriceRange((p) => {
              let mn = raw
              if (mn > p[1]) mn = p[1]
              if (mn < priceExtent[0]) mn = priceExtent[0]
              return [mn, p[1]]
            })
          }}
          inputProps={{ min: priceExtent[0], max: priceExtent[1], step: 100 }}
          sx={{ flex: 1 }}
        />
        <TextField
          size="small"
          label="Maximum"
          type="number"
          key={`pf-max-${priceRange[0]}-${priceRange[1]}-${priceExtent[0]}`}
          defaultValue={String(priceRange[1])}
          onBlur={(e) => {
            const raw = snapPriceInExtent(Number(e.target.value))
            setPriceRange((p) => {
              let mx = raw
              if (mx < p[0]) mx = p[0]
              if (mx > priceExtent[1]) mx = priceExtent[1]
              return [p[0], mx]
            })
          }}
          inputProps={{ min: priceExtent[0], max: priceExtent[1], step: 100 }}
          sx={{ flex: 1 }}
        />
      </Stack>
      <Box
        sx={{
          width: '100%',
          overflow: 'hidden',
          /** Room for range thumbs without widening the drawer / clipping at edges */
          px: { xs: 0.75, md: 0 },
        }}
      >
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
          sx={(t) => ({
            width: '100%',
            '& .MuiSlider-thumb': {
              width: { xs: 18, md: 14 },
              height: { xs: 18, md: 14 },
              bgcolor: 'common.white',
              border: '1px solid',
              borderColor: alpha(t.palette.grey[500], 0.45),
              boxShadow: '0 2px 6px rgba(15,23,42,0.12)',
              transition: t.transitions.create(['box-shadow', 'border-color'], { duration: 160 }),
              '&:hover, &.Mui-focusVisible, &.Mui-active': {
                boxShadow: '0 2px 10px rgba(15,23,42,0.18)',
                borderColor: alpha(t.palette.primary.main, 0.55),
              },
            },
            '& .MuiSlider-track': {
              height: { xs: 6, md: 4 },
              borderRadius: 2,
              border: 'none',
            },
            '& .MuiSlider-rail': {
              height: { xs: 6, md: 4 },
              borderRadius: 2,
              opacity: { xs: 0.35, md: 0.28 },
            },
          })}
        />
      </Box>
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
              fitBoundsRequestId={fitBoundsNonce}
              hoveredListingId={hoveredListingId}
              compactVehiclePopup={isCompactLayout}
              listingsDrawerOpen={isCompactLayout ? listingsDrawerOpen : false}
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
    /**
     * Desktop split: map uses the full map column (remaining width after the tools sidebar).
     * Mobile: column height comes from the flex chain; no fixed max so the map can grow with the layout.
     */
    minHeight: { xs: 0, md: 0 },
    maxHeight: { xs: 'none', md: '100%' },
    height: { xs: 'auto', md: '100%' },
    maxWidth: { xs: 'none', md: '100%' },
    width: '100%',
    alignSelf: { md: 'stretch' },
    mx: { xs: 0, md: 0 },
    /** Clip tiles/markers to the chrome; desktop uses square corners so hidden overflow does not blank raster tiles. */
    overflow: 'hidden',
    border: { xs: 'none', md: '1px solid' },
    borderColor: 'divider',
    boxShadow: { xs: 'none', md: `0 12px 40px ${alpha('#000', 0.07)}` },
    bgcolor: { xs: '#f6f9f7', md: '#fafcfb' },
    scrollMarginTop: { xs: 72, md: 88 },
    borderRadius: 0,
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
        height: { xs: 'auto', md: '100%' },
        maxHeight: { xs: 'none', md: '100%' },
        overflow: { xs: 'visible', md: 'hidden' },
      }}
    >
      <MapPageResponsiveSplit
        isMobile={isCompactLayout}
        sidebar={
          <Stack
            component="aside"
            aria-label="Map filters and listings"
            sx={{
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              minHeight: { md: 0 },
              flexShrink: 0,
              width: {
                md: desktopMapSidebarCollapsed ? 0 : 'min(420px, max(360px, 30vw))',
              },
              maxWidth: { md: desktopMapSidebarCollapsed ? 0 : 440 },
              minWidth: { md: desktopMapSidebarCollapsed ? 0 : 360 },
              height: { md: '100%' },
              maxHeight: { md: '100%' },
              overflow: { md: 'hidden' },
              borderRightWidth: { md: desktopMapSidebarCollapsed ? 0 : 1 },
              borderRightStyle: { md: 'solid' },
              borderColor: 'divider',
              bgcolor: 'background.paper',
              opacity: { md: desktopMapSidebarCollapsed ? 0 : 1 },
              pointerEvents: { md: desktopMapSidebarCollapsed ? 'none' : 'auto' },
              transition:
                theme.transitions.create(['width', 'min-width', 'max-width', 'opacity'], {
                  duration: 280,
                  easing: theme.transitions.easing.easeOut,
                }),
              borderRadius: 0,
              boxShadow: 'none',
              zIndex: 1,
            }}
          >
            {/*
              Single scroll column: search, filters, header, price, listings — matches mobile “everything
              scrolls” ergonomics and avoids nested scroll regions fighting each other.
            */}
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch',
                scrollbarGutter: 'stable',
                display: 'flex',
                flexDirection: 'column',
                px: { md: 3 },
                pt: { md: 2 },
                pb: { md: 2.5 },
              }}
            >
              <Box
                sx={{
                  flexShrink: 0,
                  pb: { md: 2 },
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                {locationSearchField}
                <Box sx={{ mt: 1.75 }}>{typeToggle}</Box>
              </Box>
              <Stack
                direction="row"
                alignItems="flex-start"
                justifyContent="space-between"
                gap={1}
                sx={{ flexShrink: 0, mt: { md: 2.5 } }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <PageHeader
                    overline="Explore"
                    title="Rental map"
                    subtitle="Filter by vehicle type, price, and area. Your location (when shared) powers Nearby and centers the map."
                    dense
                    variant="mapSidebar"
                  />
                </Box>
                <Stack direction="row" spacing={0.5} alignItems="flex-start" sx={{ flexShrink: 0, mt: 0.25 }}>
                <Tooltip title="Fit map to filtered results">
                  <span>
                    <IconButton
                      size="small"
                      aria-label="Fit map to filtered results"
                      onClick={() => setFitBoundsNonce((n) => n + 1)}
                      disabled={filtered.length === 0}
                      sx={{
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
                <Tooltip title="Collapse sidebar">
                  <span>
                    <IconButton
                      size="small"
                      aria-label="Collapse sidebar — maximize map"
                      onClick={() => setDesktopMapSidebarCollapsed(true)}
                      sx={{
                        flexShrink: 0,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                      }}
                    >
                      <ChevronLeft fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                </Stack>
              </Stack>
              <Box sx={{ mt: 2, flexShrink: 0 }}>{priceFilterCore}</Box>
              <Box id="explore-map-listing-strip" sx={{ mt: 2, flexShrink: 0, minWidth: 0 }}>
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
                  listScrollMode="outer"
                  onListingHover={setHoveredListingId}
                  hoveredListingId={hoveredListingId}
                  headerExtra={
                    <Chip
                      size="small"
                      color="primary"
                      variant="outlined"
                      label={`${filtered.length} ${filtered.length === 1 ? 'vehicle' : 'vehicles'} on map`}
                      sx={{ fontWeight: 700 }}
                    />
                  }
                />
              </Box>
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
            {!isCompactLayout && desktopMapSidebarCollapsed && (
              <Tooltip title="Show filters and listings">
                <IconButton
                  aria-label="Show filters and listings"
                  size="small"
                  onClick={() => setDesktopMapSidebarCollapsed(false)}
                  sx={{
                    position: 'absolute',
                    left: 8,
                    top: 'calc(50% + 52px)',
                    transform: 'translateY(-50%)',
                    zIndex: (t) => t.zIndex.appBar + 2,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '0 999px 999px 0',
                    borderLeft: 'none',
                    boxShadow: (t) => `4px 0 24px ${alpha(t.palette.common.black, 0.1)}`,
                    '&:hover': { bgcolor: 'background.paper' },
                  }}
                >
                  <ChevronRight />
                </IconButton>
              </Tooltip>
            )}
            {isCompactLayout ? (
              <Box
                className="pointer-events-none px-2 max-[359px]:px-1.5 xs:px-3 [&>*]:pointer-events-auto"
                sx={{
                  position: 'absolute',
                  top: { xs: 8, sm: 10 },
                  left: 0,
                  right: 0,
                  zIndex: zMap.toolbar,
                }}
              >
                <Paper
                  elevation={0}
                  className="rounded-2xl border border-solid border-transparent p-2 shadow-search backdrop-blur-md max-[359px]:p-1.5 sm:p-3.5"
                  sx={{
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: alpha('#ffffff', 0.86),
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    boxShadow: (t) => `0 8px 32px ${alpha(t.palette.common.black, 0.09)}`,
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
                        alignSelf: 'center',
                        width: 44,
                        height: 44,
                        minWidth: 44,
                        minHeight: 44,
                        p: 0,
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
                  ₱/day price tags · larger circles group nearby rentals; tap to zoom
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
                  px: 1,
                  py: 0.5,
                  borderRadius: 999,
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                  color: (t) => t.palette.primary.dark,
                  border: '1px solid',
                  borderColor: (t) => alpha(t.palette.primary.main, 0.22),
                  backdropFilter: 'saturate(140%) blur(10px)',
                  WebkitBackdropFilter: 'saturate(140%) blur(10px)',
                  pointerEvents: 'none',
                  maxWidth: 'calc(100% - 56px)',
                  textAlign: 'center',
                  boxShadow: (t) => `0 4px 20px ${alpha(t.palette.common.black, 0.06)}`,
                }}
              >
                <Typography
                  component="p"
                  sx={{
                    m: 0,
                    fontSize: '0.65rem',
                    lineHeight: 1.35,
                    fontWeight: 700,
                    letterSpacing: '0.01em',
                    color: 'inherit',
                  }}
                >
                  ₱ tags & clusters · pinch or tap to zoom
                </Typography>
              </Box>
            ) : null}

            <Box id="explore-map-canvas" sx={mapChromeSx}>
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  minWidth: 0,
                  position: 'relative',
                  overflow: 'hidden',
                  alignSelf: 'stretch',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 2,
                    overflow: 'hidden',
                    '& .leaflet-container': { height: '100%', width: '100%', borderRadius: 0 },
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
                    width: 52,
                    height: 7,
                    borderRadius: 999,
                    bgcolor: (t) => alpha(t.palette.grey[800], 0.32),
                    mx: 'auto',
                    mb: 1.35,
                    flexShrink: 0,
                    boxShadow: (t) => `0 0 0 2px ${alpha(t.palette.common.white, 0.7)}`,
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
                  Swipe up · use arrows to step through vehicles
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
                  maxHeight: 'min(78dvh, 560px)',
                  /** Avoid tiny overflow from slider thumbs / fractional layout that forces a scrollbar. */
                  pb: 'max(16px, env(safe-area-inset-bottom, 0px))',
                  px: 2,
                  pt: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderBottom: 'none',
                  boxShadow: (t) => `0 -16px 48px ${alpha(t.palette.common.black, 0.16)}`,
                  overflowX: 'hidden',
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  '&::-webkit-scrollbar': {
                    width: 0,
                    height: 0,
                    display: 'none',
                  },
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
              onClose={() => {
                listingsDrawerFullSnapHapticGatedRef.current = false
                setListingsDrawerOpen(false)
              }}
              onOpen={() => {
                listingsDrawerFullSnapHapticGatedRef.current = false
                setListingsDrawerOpen(true)
              }}
              disableBackdropTransition={!iOS}
              disableDiscovery={iOS}
              hideBackdrop
              ModalProps={{
                keepMounted: true,
                disableScrollLock: true,
                /** Let taps reach the map + Leaflet popups outside the sheet (see Paper `pointerEvents: 'auto'`). */
                sx: {
                  pointerEvents: 'none',
                  /** Default drawer z (~1200) sits above Navbar + filter bar; tuck sheet under chrome. */
                  zIndex: theme.zIndex.mobileStepper - 50,
                },
              }}
              SlideProps={{
                easing: theme.transitions.easing.easeOut,
                timeout: { enter: 400, exit: 300 },
              }}
              PaperProps={{
                onTouchMove: onListingsDrawerPaperTouchMove as React.TouchEventHandler<HTMLDivElement>,
                onTouchStart: () => {
                  listingsDrawerFullSnapHapticGatedRef.current = false
                },
                sx: {
                  borderTopLeftRadius: 22,
                  borderTopRightRadius: 22,
                  /** Re-enable hits on sheet chrome + listing strip only */
                  pointerEvents: 'auto',
                  /** Caps sheet height; content is authored to shrink-wrap so excess map stays visible. */
                  height: 'auto',
                  maxHeight: 'min(38dvh, 320px)',
                  mx: 0.5,
                  mt: 1,
                  pb: 'max(10px, env(safe-area-inset-bottom, 0px))',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderBottom: 'none',
                  boxShadow: (t) => `0 -12px 48px ${alpha(t.palette.common.black, 0.14)}`,
                },
              }}
            >
              <Box
                role="presentation"
                aria-label="Drag handle for listings sheet"
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexShrink: 0,
                  pt: 0.5,
                  pb: 0.25,
                }}
              >
                <Box
                  sx={{
                  width: 52,
                  height: 6,
                    borderRadius: 999,
                    bgcolor: (t) => alpha(t.palette.grey[800], 0.42),
                    boxShadow: (t) => `inset 0 0 0 2px ${alpha(t.palette.common.white, 0.85)}`,
                  }}
                />
              </Box>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 1.5, pb: 0.35, pt: 0, flexShrink: 0 }}
              >
                <Typography variant="subtitle2" fontWeight={800} sx={{ fontSize: '0.8125rem', lineHeight: 1.2 }}>
                  Listings
                </Typography>
                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  label={`${filtered.length} ${filtered.length === 1 ? 'vehicle' : 'vehicles'}`}
                  sx={{ fontWeight: 700, height: 24, '& .MuiChip-label': { px: 0.85, py: 0, fontSize: '0.7rem' } }}
                />
              </Stack>
              <Box
                id="explore-map-listing-strip"
                sx={{
                  flex: '0 1 auto',
                  minHeight: 0,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  alignSelf: 'stretch',
                  px: { xs: 1, sm: 1.5 },
                  pb: 0.5,
                  touchAction: 'pan-y',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                <Fade appear in={listingsDrawerOpen} timeout={280}>
                  <Box sx={{ outline: 'none' }} key={selectedId ?? 'none'}>
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
                      verticalBrowseMode="pager"
                      cardDensity="compact"
                      title=""
                      showListingCardActions={!listingsDrawerOpen}
                      onListingHover={setHoveredListingId}
                      hoveredListingId={hoveredListingId}
                    />
                  </Box>
                </Fade>
              </Box>
            </SwipeableDrawer>
          ) : null}
        </>
      </MapPageResponsiveSplit>
    </Box>
  )
}
