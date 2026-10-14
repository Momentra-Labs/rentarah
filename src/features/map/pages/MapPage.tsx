import ChevronLeft from '@mui/icons-material/ChevronLeft'
import AllInclusiveOutlined from '@mui/icons-material/AllInclusiveOutlined'
import CloseRounded from '@mui/icons-material/CloseRounded'
import DirectionsCar from '@mui/icons-material/DirectionsCar'
import Explore from '@mui/icons-material/Explore'
import FitScreen from '@mui/icons-material/FitScreen'
import FormatListBulleted from '@mui/icons-material/FormatListBulleted'
import MyLocation from '@mui/icons-material/MyLocation'
import RestartAlt from '@mui/icons-material/RestartAlt'
import SearchOutlined from '@mui/icons-material/SearchOutlined'
import TravelExploreOutlined from '@mui/icons-material/TravelExploreOutlined'
import TuneRounded from '@mui/icons-material/TuneRounded'
import TwoWheeler from '@mui/icons-material/TwoWheeler'
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  Fade,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
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

import ExploreMapListingStrip from '@/components/landing/ExploreMapListingStrip'
import EmptyState from '@/components/ui/EmptyState'
import { MAP_PAGE_FLOAT_CLEAR_BOTTOM } from '@/components/layout/MobileBottomNav'
import ExploreMapErrorBoundary from '@/components/map/ExploreMapErrorBoundary'
import ExploreMapFallbackList from '@/components/map/ExploreMapFallbackList'
import { MapPageResponsiveSplit } from '@/components/map/MapPageLayouts'
import MapPageSkeleton, { MapSurfaceSkeleton } from '@/components/skeletons/MapPageSkeleton'
import type { MapViewportBounds } from '@/features/landing/components/ExploreRentalsMapInner'
import MapListingRow from '@/features/map/components/MapListingRow'
import { useVehicles } from '@/hooks/useVehicles'
import { useCarsStore } from '@/store/useCarsStore'
import { useGeolocationStore } from '@/store/useGeolocationStore'
import { useT } from '@/hooks/useT'
import { rhElev, rhRadius } from '@/theme/tokens'


import {
  applyExploreMapFilters,
  carsToExploreListings,
  listingsInSamePickupCitySorted,
  type ExploreMapFilterMode,
  type ExploreMapListing,
} from '@/utils/exploreMapListings'

/** Same Leaflet surface as landing `MapPreview` — one chunk. */
const ExploreRentalsMapLazy = lazy(() => import('@/features/landing/components/ExploreRentalsMapInner'))

function formatPesoShort(n: number): string {
  if (n >= 1000) return `₱${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return `₱${n}`
}

/** Space above bottom peek so OSM/CARTO attribution stays readable (matches peek card height). */
const MOBILE_LISTING_PEEK_RESERVE_PX = 102

const mapSheetHandleSx = {
  width: 40,
  height: 4,
  borderRadius: `${rhRadius.pill}px`,
  bgcolor: 'grey.300',
  mx: 'auto',
  flexShrink: 0,
} as const

const mapIconBtnSx = {
  flexShrink: 0,
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: `${rhRadius.md}px`,
  bgcolor: 'background.paper',
  boxShadow: rhElev.elev1,
} as const

/** Floating map controls (desktop + mobile): stacked square buttons in one rounded card. */
const mapControlBtnSx = {
  width: 44,
  height: 44,
  borderRadius: 0,
  color: 'text.primary',
  '&:hover': { bgcolor: 'action.hover' },
  '&.Mui-disabled': { bgcolor: 'transparent', opacity: 0.45 },
} as const

type MapListSort = 'recommended' | 'priceLow' | 'priceHigh' | 'rating'

function sortListings(listings: ExploreMapListing[], sort: MapListSort): ExploreMapListing[] {
  if (sort === 'recommended') return listings
  const out = [...listings]
  if (sort === 'priceLow') out.sort((a, b) => a.vehicle.pricePerDay - b.vehicle.pricePerDay)
  else if (sort === 'priceHigh') out.sort((a, b) => b.vehicle.pricePerDay - a.vehicle.pricePerDay)
  else out.sort((a, b) => b.vehicle.rating - a.vehicle.rating || b.vehicle.reviewCount - a.vehicle.reviewCount)
  return out
}

function listingInBounds(l: ExploreMapListing, b: MapViewportBounds): boolean {
  return l.latitude >= b.south && l.latitude <= b.north && l.longitude >= b.west && l.longitude <= b.east
}

/**
 * Full-screen map experience: type/price/location filters, lazy map, listing strip.
 * Swap `useCarsStore` for an API hook when backend is ready.
 */
export default function MapPage() {
  const t = useT()
  const theme = useTheme()
  const isCompactLayout = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true })
  /** Thumb-scale map toolbar: chip text hidden; icons keep 44px hit targets inside toggles */
  const mapFiltersIconOnly = useMediaQuery('(max-width:359.95px)', { noSsr: true })
  const filtersIconOnly = isCompactLayout && mapFiltersIconOnly
  const navigate = useNavigate()
  const location = useLocation()
  const cars = useCarsStore((s) => s.cars)
  const { isLoading: vehiclesLoading } = useVehicles()
  const userLocation = useGeolocationStore((s) => s.userLocation)
  const requestLocation = useGeolocationStore((s) => s.requestLocation)
  const geoStatus = useGeolocationStore((s) => s.status)
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
  /** Desktop: price panel under the search row. */
  const [priceFiltersOpen, setPriceFiltersOpen] = useState(false)
  const [listSort, setListSort] = useState<MapListSort>('recommended')
  /** Desktop: sidebar list mirrors the map area the user has panned/zoomed to. */
  const [followMap, setFollowMap] = useState(true)
  /** Last user-chosen map area; `null` = list every filtered result (initial view, after Fit, after filter edits). */
  const [areaBounds, setAreaBounds] = useState<MapViewportBounds | null>(null)
  const sidebarListRef = useRef<HTMLDivElement>(null)

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
      if (isCompactLayout) setListingsDrawerOpen(true)
      // Desktop: the sidebar list scrolls the row into view (see effect below).
    },
    [isCompactLayout],
  )

  /** Desktop sidebar row "show on map": select + fly the map to that pin and open its popup. */
  const handleListRowFocus = useCallback((l: ExploreMapListing) => {
    setSelectionFromListingStrip(true)
    setSelectedId(l.id)
    setMapFocusNonce((n) => n + 1)
  }, [])

  const handleUserViewportChange = useCallback((b: MapViewportBounds) => setAreaBounds(b), [])

  /** Desktop: a pin picked on the map (or "Show in list") brings its sidebar row into view. */
  useEffect(() => {
    if (isCompactLayout || !selectedId) return
    if (selectionFromListingStrip && listingScrollRequest === 0) return
    const list = sidebarListRef.current
    const row = list?.querySelector<HTMLElement>(`[data-listing-id="${selectedId}"]`)
    if (!list || !row) return
    // Scroll only the list (scrollIntoView can also nudge the overflow-hidden page shells).
    const pad = 8
    const top = row.offsetTop
    const bottom = top + row.offsetHeight
    if (top - pad < list.scrollTop) list.scrollTo({ top: top - pad, behavior: 'smooth' })
    else if (bottom + pad > list.scrollTop + list.clientHeight)
      list.scrollTo({ top: bottom + pad - list.clientHeight, behavior: 'smooth' })
  }, [isCompactLayout, selectedId, selectionFromListingStrip, listingScrollRequest])

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

  const [priceExtentMin, priceExtentMax] = priceExtent
  /** Keyed on the numbers: a vehicles refetch rebuilds `priceExtent` and must not wipe the user's price filter. */
  useEffect(() => {
    setPriceRange([priceExtentMin, priceExtentMax])
  }, [priceExtentMin, priceExtentMax])

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

  /** Filter edits re-fit the map to every match, so the list goes back to every match too. */
  const [priceMin, priceMax] = priceRange
  useEffect(() => {
    setAreaBounds(null)
  }, [filterMode, locationQuery, priceMin, priceMax])

  const areaActive = !isCompactLayout && followMap && areaBounds !== null

  const sidebarListings = useMemo(() => {
    const inArea = areaActive && areaBounds ? filtered.filter((l) => listingInBounds(l, areaBounds)) : filtered
    return sortListings(inArea, listSort)
  }, [filtered, areaActive, areaBounds, listSort])

  const showAllResults = useCallback(() => {
    setAreaBounds(null)
    setFitBoundsNonce((n) => n + 1)
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilterMode('all')
    setLocationQuery('')
    setPriceRange([priceExtent[0], priceExtent[1]])
  }, [priceExtent])

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

  const onViewDetails = useCallback((l: ExploreMapListing) => navigate(`/cars/${l.id}`), [navigate])

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

  if (vehiclesLoading && cars.length === 0) {
    return <MapPageSkeleton />
  }

  const mapFallback = (
    <ExploreMapFallbackList listings={filtered} onNavigate={(id) => navigate(`/cars/${id}`)} />
  )

  const mapSuspense = <MapSurfaceSkeleton />

  /** Desktop: removable summary of what is narrowing the results. */
  const activeFilterChips: { key: string; label: string; onClear: () => void }[] = [
    ...(filterMode !== 'all'
      ? [
          {
            key: 'type',
            label: t(filterMode === 'cars' ? 'map.car' : filterMode === 'motorcycles' ? 'map.moto' : 'map.nearby'),
            onClear: () => setFilterMode('all'),
          },
        ]
      : []),
    ...(locationQuery.trim()
      ? [{ key: 'area', label: `“${locationQuery.trim()}”`, onClear: () => setLocationQuery('') }]
      : []),
    ...(priceFilterActive
      ? [
          {
            key: 'price',
            label: `${formatPesoShort(priceRange[0])} – ${formatPesoShort(priceRange[1])}`,
            onClear: () => setPriceRange([priceExtent[0], priceExtent[1]]),
          },
        ]
      : []),
  ]

  const typeToggle = (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={filterMode}
      onChange={handleFilter}
      aria-label={t('map.filterByType')}
      sx={{
        flexWrap: 'nowrap',
        width: '100%',
        ...(isCompactLayout
          ? {
              display: 'flex',
              overflowX: 'auto',
              pb: 0.15,
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
              bgcolor: 'transparent',
              borderRadius: 0,
              p: 0,
              border: 'none',
              gap: 1,
              '& .MuiToggleButtonGroup-grouped': {
                flex: '0 0 auto',
                minWidth: 0,
                typography: 'caption',
                border: '1px solid !important',
                borderColor: 'divider !important',
                borderRadius: `${rhRadius.pill}px !important`,
                mx: 0,
                bgcolor: 'background.paper',
                boxShadow: 'none',
                ...(filtersIconOnly
                  ? { minWidth: 44, minHeight: 40, px: 1, py: 0.75 }
                  : { px: 1.75, py: 0.85 }),
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.8125rem',
                color: 'text.primary',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'common.white',
                  borderColor: 'primary.main !important',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                },
                '&.Mui-disabled': {
                  opacity: 0.45,
                },
              },
            }
          : {
              flexWrap: 'wrap',
              bgcolor: (th) => alpha(th.palette.primary.main, 0.04),
              borderRadius: `${rhRadius.md}px`,
              p: 0.5,
              border: '1px solid',
              borderColor: 'divider',
              gap: 0.5,
              '& .MuiToggleButtonGroup-grouped': {
                flex: '0 1 auto',
                minWidth: 0,
                px: { xs: 0.75, sm: 1.25 },
                typography: 'caption',
                border: 'none',
                borderRadius: `${rhRadius.sm}px`,
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
                  boxShadow: 'none',
                },
              },
            }),
      }}
    >
      <ToggleButton value="all" aria-label={t('map.allAria')}>
        {filtersIconOnly ? (
          <AllInclusiveOutlined sx={{ fontSize: 22 }} aria-hidden />
        ) : (
          t('map.all')
        )}
      </ToggleButton>
      <ToggleButton value="cars" aria-label={t('map.carsAria')}>
        {filtersIconOnly ? (
          <DirectionsCar sx={{ fontSize: 22 }} aria-hidden />
        ) : (
          <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="center">
            <DirectionsCar sx={{ fontSize: 18 }} />
            <Box component="span" sx={{ display: 'inline' }}>
              {t('map.car')}
            </Box>
          </Stack>
        )}
      </ToggleButton>
      <ToggleButton value="motorcycles" aria-label={t('map.motorcyclesAria')}>
        {filtersIconOnly ? (
          <TwoWheeler sx={{ fontSize: 22 }} aria-hidden />
        ) : (
          <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="center">
            <TwoWheeler sx={{ fontSize: 18 }} />
            <Box component="span" sx={{ display: 'inline' }}>
              {t('map.moto')}
            </Box>
          </Stack>
        )}
      </ToggleButton>
      <Tooltip title={nearbyDisabled ? t('map.nearbyNeedLocation') : t('map.nearbyHint')}>
        <span>
          <ToggleButton value="nearby" disabled={nearbyDisabled} aria-label={t('map.nearbyAria')}>
            {filtersIconOnly ? (
              <Explore sx={{ fontSize: 22 }} aria-hidden />
            ) : (
              <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="center">
                <Explore sx={{ fontSize: 18 }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  {t('map.nearby')}
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
      placeholder={isCompactLayout ? t('map.searchPlaceholderMobile') : t('map.searchPlaceholderDesktop')}
      value={locationQuery}
      onChange={(e) => setLocationQuery(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchOutlined
              fontSize="small"
              sx={(th) => ({
                color: isCompactLayout ? th.palette.primary.main : th.palette.action.active,
              })}
            />
          </InputAdornment>
        ),
      }}
      inputProps={{ 'aria-label': t('map.searchAria') }}
      sx={
        isCompactLayout
          ? {
              '& .MuiOutlinedInput-root': {
                borderRadius: 0,
                bgcolor: 'transparent',
                minHeight: 48,
                boxShadow: 'none',
                '& fieldset': {
                  borderColor: 'transparent',
                  borderWidth: 0,
                },
                '&:hover fieldset': {
                  borderColor: 'transparent',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'transparent',
                  borderWidth: 0,
                },
                '&.Mui-focused': {
                  boxShadow: 'none',
                },
              },
              '& .MuiOutlinedInput-input': {
                py: 1.35,
                pl: 0.25,
                fontSize: '0.95rem',
                fontWeight: 600,
                letterSpacing: '-0.015em',
                color: 'text.primary',
                '&::placeholder': {
                  color: 'text.secondary',
                  opacity: 0.85,
                  fontWeight: 500,
                },
              },
              '& .MuiInputAdornment-root': {
                ml: 1.25,
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
    <Stack spacing={isCompactLayout ? 2 : 1.5}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            fontWeight={700}
            sx={{ letterSpacing: '0.08em', lineHeight: 1.2 }}
          >
            {t('map.pricePerDay')}
          </Typography>
          <Typography variant="h6" fontWeight={800} sx={{ mt: 0.75, letterSpacing: '-0.02em' }}>
            {formatPesoShort(priceRange[0])} – {formatPesoShort(priceRange[1])}
          </Typography>
        </Box>
        <Tooltip title={t('map.resetPrice')}>
          <span>
            <IconButton
              size="small"
              aria-label={t('map.resetPrice')}
              onClick={() => setPriceRange([priceExtent[0], priceExtent[1]])}
              disabled={!priceFilterActive}
              sx={mapIconBtnSx}
            >
              <RestartAlt fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start', width: '100%' }}>
        <TextField
          size="small"
          label={t('map.min')}
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
          label={t('map.max')}
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
      <MapSurfaceSkeleton />
    ) : filtered.length === 0 ? (
      <EmptyState
        title={t('map.emptyTitle')}
        description={t('map.emptyDescription')}
        actionLabel={t('map.clearFilters')}
        onAction={() => {
          setFilterMode('all')
          setLocationQuery('')
          setPriceRange([priceExtent[0], priceExtent[1]])
        }}
      />
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
              zoomControlPosition={isCompactLayout ? 'bottomleft' : 'topright'}
              listingsDrawerOpen={isCompactLayout ? listingsDrawerOpen : false}
              mapSurface={isCompactLayout ? 'compact' : 'wide'}
              onUserViewportChange={!isCompactLayout && followMap ? handleUserViewportChange : undefined}
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
    borderColor: { xs: 'transparent', md: 'divider' },
    boxShadow: { xs: 'none', md: rhElev.elev1 },
    bgcolor: { xs: 'transparent', md: 'background.default' },
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
            aria-label={t('map.filtersAndListings')}
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
              boxShadow: rhElev.elev1,
              zIndex: 1,
            }}
          >
            {/* Fixed header: title, search, filters, type. Only the listing column below scrolls. */}
            <Box sx={{ flexShrink: 0, px: 2.5, pt: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                <Typography
                  component="h1"
                  sx={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}
                >
                  {t('map.title')}
                </Typography>
                <Tooltip title={t('map.collapseSidebar')}>
                  <IconButton
                    size="small"
                    aria-label={t('map.collapseSidebarAria')}
                    onClick={() => setDesktopMapSidebarCollapsed(true)}
                    sx={{ ...mapIconBtnSx, boxShadow: 'none' }}
                  >
                    <ChevronLeft fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>{locationSearchField}</Box>
                <Button
                  variant="outlined"
                  onClick={() => setPriceFiltersOpen((o) => !o)}
                  aria-expanded={priceFiltersOpen}
                  aria-controls="map-price-filters"
                  startIcon={
                    <Badge color="primary" variant="dot" invisible={!priceFilterActive}>
                      <TuneRounded fontSize="small" />
                    </Badge>
                  }
                  sx={(th) => ({
                    flexShrink: 0,
                    px: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                    color: 'text.primary',
                    borderColor: priceFiltersOpen ? 'primary.main' : 'divider',
                    bgcolor: priceFiltersOpen ? alpha(th.palette.primary.main, 0.06) : 'background.paper',
                    '&:hover': { borderColor: 'primary.main', bgcolor: alpha(th.palette.primary.main, 0.06) },
                  })}
                >
                  {t('map.filters')}
                </Button>
              </Stack>

              <Box sx={{ mt: 1.25 }}>{typeToggle}</Box>

              <Collapse in={priceFiltersOpen} unmountOnExit>
                <Box
                  id="map-price-filters"
                  sx={{
                    mt: 1.5,
                    p: 2,
                    pb: 1,
                    borderRadius: `${rhRadius.md}px`,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.default',
                  }}
                >
                  {priceFilterCore}
                </Box>
              </Collapse>

              {filtersDirty ? (
                <Stack direction="row" flexWrap="wrap" useFlexGap gap={0.75} alignItems="center" sx={{ mt: 1.25 }}>
                  {activeFilterChips.map((c) => (
                    <Chip
                      key={c.key}
                      size="small"
                      label={c.label}
                      onDelete={c.onClear}
                      aria-label={t('map.removeFilter', { label: c.label })}
                      sx={(th) => ({
                        fontWeight: 700,
                        bgcolor: alpha(th.palette.primary.main, 0.08),
                        color: 'primary.main',
                        '& .MuiChip-deleteIcon': { color: alpha(th.palette.primary.main, 0.6) },
                        '& .MuiChip-deleteIcon:hover': { color: 'primary.main' },
                      })}
                    />
                  ))}
                  <Button
                    size="small"
                    onClick={clearAllFilters}
                    sx={{ minHeight: 24, py: 0, px: 0.75, textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
                  >
                    {t('map.clearAll')}
                  </Button>
                </Stack>
              ) : null}
            </Box>

            {/* Result count (live) + sort. */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              gap={1}
              sx={{ flexShrink: 0, px: 2.5, pt: 1.25, pb: 0.75 }}
            >
              <Stack direction="row" alignItems="center" gap={0.5} sx={{ minWidth: 0 }}>
                <Typography
                  aria-live="polite"
                  sx={{ fontWeight: 700, fontSize: '0.8125rem', color: 'text.secondary', whiteSpace: 'nowrap' }}
                >
                  {areaActive
                    ? t('map.inArea', { shown: sidebarListings.length, total: filtered.length })
                    : t(filtered.length === 1 ? 'map.ridesOne' : 'map.ridesOther', { count: filtered.length })}
                </Typography>
                {areaActive && sidebarListings.length < filtered.length ? (
                  <Button
                    size="small"
                    onClick={showAllResults}
                    sx={{ minWidth: 0, minHeight: 24, py: 0, px: 0.75, textTransform: 'none', fontWeight: 700, fontSize: '0.8125rem' }}
                  >
                    {t('map.showAll')}
                  </Button>
                ) : null}
              </Stack>
              <Select
                variant="standard"
                disableUnderline
                value={listSort}
                onChange={(e) => setListSort(e.target.value as MapListSort)}
                inputProps={{ 'aria-label': t('map.sort') }}
                sx={{ flexShrink: 0, fontSize: '0.8125rem', fontWeight: 700, '& .MuiSelect-select': { py: 0.25 } }}
              >
                <MenuItem value="recommended">{t('map.sortRecommended')}</MenuItem>
                <MenuItem value="priceLow">{t('map.sortPriceLow')}</MenuItem>
                <MenuItem value="priceHigh">{t('map.sortPriceHigh')}</MenuItem>
                <MenuItem value="rating">{t('map.sortRating')}</MenuItem>
              </Select>
            </Stack>

            <Box
              ref={sidebarListRef}
              id="explore-map-listing-strip"
              sx={{
                /** Positioned so row `offsetTop` is relative to the list (see scroll-to-selected effect). */
                position: 'relative',
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollbarWidth: 'thin',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                px: 1.5,
                pt: 0.25,
                pb: 2,
              }}
            >
              {sidebarListings.map((l) => (
                <MapListingRow
                  key={l.id}
                  listing={l}
                  selected={selectedId === l.id}
                  hovered={hoveredListingId === l.id}
                  onViewDetails={onViewDetails}
                  onShowOnMap={handleListRowFocus}
                  onHover={setHoveredListingId}
                />
              ))}
              {sidebarListings.length === 0 ? (
                <Stack alignItems="center" textAlign="center" spacing={1} sx={{ py: 6, px: 3 }}>
                  <TravelExploreOutlined sx={{ fontSize: 40, color: 'text.disabled' }} />
                  <Typography sx={{ fontWeight: 800 }}>
                    {filtered.length === 0 ? t('map.emptyTitle') : t('map.noneInAreaTitle')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {filtered.length === 0 ? t('map.emptyDescription') : t('map.noneInAreaBody')}
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={filtered.length === 0 ? clearAllFilters : showAllResults}
                    sx={{ mt: 1, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                  >
                    {filtered.length === 0 ? t('map.clearFilters') : t('map.showAllResults')}
                  </Button>
                </Stack>
              ) : null}
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
                className="pointer-events-none [&>*]:pointer-events-auto"
                sx={{
                  position: 'absolute',
                  top: { xs: 10, sm: 12 },
                  left: 12,
                  right: 12,
                  zIndex: zMap.toolbar,
                }}
              >
                <Stack spacing={1.25}>
                  <Paper
                    elevation={0}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: `${rhRadius.lg}px`,
                      boxShadow: rhElev.elev1,
                      bgcolor: 'background.paper',
                      overflow: 'hidden',
                      pr: 0.5,
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>{locationSearchField}</Box>
                    <IconButton
                      aria-label={t('map.openFilters')}
                      onClick={() => setFilterDrawerOpen(true)}
                      sx={{
                        position: 'relative',
                        flexShrink: 0,
                        width: 44,
                        height: 44,
                        color: 'text.primary',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <TuneRounded />
                      {filtersDirty ? (
                        <Box
                          component="span"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            width: 9,
                            height: 9,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            border: '2px solid',
                            borderColor: 'background.paper',
                          }}
                        />
                      ) : null}
                    </IconButton>
                  </Paper>
                  <Box sx={{ mx: -0.25, overflow: 'hidden' }}>{typeToggle}</Box>
                </Stack>
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

            {!isCompactLayout && (desktopMapSidebarCollapsed || filtered.length > 0) ? (
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ position: 'absolute', top: 12, left: 12, zIndex: zMap.toolbar, pointerEvents: 'none', '& > *': { pointerEvents: 'auto' } }}
              >
                {desktopMapSidebarCollapsed ? (
                  <Button
                    variant="contained"
                    disableElevation
                    startIcon={<FormatListBulleted fontSize="small" />}
                    onClick={() => setDesktopMapSidebarCollapsed(false)}
                    aria-label={t('map.expandSidebar')}
                    sx={{
                      borderRadius: `${rhRadius.pill}px`,
                      textTransform: 'none',
                      fontWeight: 700,
                      px: 2,
                      minHeight: 40,
                      boxShadow: rhElev.elev1,
                    }}
                  >
                    {t('map.showList')} · {sidebarListings.length}
                  </Button>
                ) : null}
                {filtered.length > 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: `${rhRadius.pill}px`,
                    boxShadow: rhElev.elev1,
                    bgcolor: 'background.paper',
                    pl: 0.75,
                    pr: 1.75,
                    minHeight: 40,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <FormControlLabel
                    sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: '0.8125rem', fontWeight: 700 } }}
                    control={
                      <Checkbox
                        size="small"
                        checked={followMap}
                        onChange={(e) => {
                          setFollowMap(e.target.checked)
                          setAreaBounds(null)
                        }}
                        sx={{ p: 0.5, mr: 0.5 }}
                      />
                    }
                    label={t('map.followMap')}
                  />
                </Paper>
                ) : null}
              </Stack>
            ) : null}

            {!isCompactLayout && filtered.length > 0 ? (
              <Paper
                elevation={0}
                sx={{
                  position: 'absolute',
                  right: 12,
                  bottom: 24,
                  zIndex: zMap.toolbar,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  borderRadius: `${rhRadius.md}px`,
                  boxShadow: rhElev.elev1,
                  bgcolor: 'background.paper',
                }}
              >
                <Tooltip title={t('map.fitToResults')} placement="left">
                  <IconButton aria-label={t('map.fitResults')} onClick={showAllResults} sx={mapControlBtnSx}>
                    <FitScreen fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Box sx={{ height: '1px', bgcolor: 'divider' }} />
                <Tooltip title={geoStatus === 'ready' ? t('map.recenter') : t('map.shareLocation')} placement="left">
                  <IconButton
                    aria-label={t('map.useMyLocation')}
                    onClick={() => requestLocation()}
                    sx={{ ...mapControlBtnSx, color: userLocation ? 'primary.main' : 'text.primary' }}
                  >
                    <MyLocation fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Paper>
            ) : null}

            {isCompactLayout && !filterDrawerOpen && !listingsDrawerOpen ? (
              <Fade in>
                <Paper
                  elevation={0}
                  sx={{
                    position: 'absolute',
                    right: 12,
                    bottom: `calc(${MAP_PAGE_FLOAT_CLEAR_BOTTOM} + ${MOBILE_LISTING_PEEK_RESERVE_PX}px + 16px)`,
                    zIndex: zMap.toolbar,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    borderRadius: `${rhRadius.lg}px`,
                    boxShadow: rhElev.elev2,
                    bgcolor: 'background.paper',
                  }}
                >
                  <Tooltip title={t('map.fitToResults')}>
                    <span>
                      <IconButton
                        aria-label={t('map.fitResults')}
                        disabled={filtered.length === 0}
                        onClick={() => setFitBoundsNonce((n) => n + 1)}
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 0,
                          color: 'text.primary',
                          '&:hover': { bgcolor: 'action.hover' },
                          '&.Mui-disabled': { bgcolor: 'transparent', opacity: 0.45 },
                        }}
                      >
                        <FitScreen />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Box sx={{ height: '1px', bgcolor: 'divider', mx: 1 }} />
                  <Tooltip title={geoStatus === 'ready' ? t('map.recenter') : t('map.shareLocation')}>
                    <IconButton
                      aria-label={t('map.useMyLocation')}
                      onClick={() => requestLocation()}
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 0,
                        bgcolor: userLocation ? 'primary.main' : 'transparent',
                        color: userLocation ? 'common.white' : 'text.primary',
                        '&:hover': {
                          bgcolor: userLocation ? 'primary.dark' : 'action.hover',
                        },
                      }}
                    >
                      <MyLocation />
                    </IconButton>
                  </Tooltip>
                </Paper>
              </Fade>
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
                elevation={0}
                role="button"
                tabIndex={0}
                aria-label={t('map.openListings')}
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
                  left: 0,
                  right: 0,
                  zIndex: zMap.peek,
                  borderRadius: `${rhRadius.lg}px ${rhRadius.lg}px 0 0`,
                  pt: 1,
                  px: 2.25,
                  pb: 'max(16px, calc(12px + env(safe-area-inset-bottom, 0px)))',
                  cursor: 'pointer',
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  border: 'none',
                  boxShadow: rhElev.elev2,
                  transition: (th) => th.transitions.create(['transform'], { duration: 160 }),
                  '&:active': { transform: 'translateY(2px)' },
                }}
              >
                <Box sx={{ ...mapSheetHandleSx, mb: 1.5 }} />
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={800}
                      sx={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}
                    >
                      {t(
                        filterMode === 'nearby'
                          ? filtered.length === 1
                            ? 'map.vehicleNearbyOne'
                            : 'map.vehicleNearbyOther'
                          : filtered.length === 1
                            ? 'map.vehicleOne'
                            : 'map.vehicleOther',
                        { count: filtered.length },
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {t('map.peekHint')}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    size="medium"
                    disableElevation
                    tabIndex={-1}
                    sx={{
                      flexShrink: 0,
                      borderRadius: `${rhRadius.pill}px`,
                      px: 2.25,
                      py: 1,
                      textTransform: 'none',
                      fontWeight: 800,
                      minWidth: 96,
                    }}
                  >
                    {t('map.view')}
                  </Button>
                </Stack>
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
                  borderTopLeftRadius: `${rhRadius.lg}px`,
                  borderTopRightRadius: `${rhRadius.lg}px`,
                  maxHeight: 'min(78dvh, 560px)',
                  pb: 'max(16px, env(safe-area-inset-bottom, 0px))',
                  px: 2,
                  pt: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderBottom: 'none',
                  boxShadow: rhElev.elev2,
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
              <Box sx={{ ...mapSheetHandleSx, mb: 1 }} />
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em">
                  {t('map.filters')}
                </Typography>
                <IconButton aria-label={t('map.closeFilters')} onClick={() => setFilterDrawerOpen(false)} size="small">
                  <CloseRounded />
                </IconButton>
              </Stack>
              {priceFilterCore}
              <Button
                fullWidth
                variant="contained"
                onClick={() => setFilterDrawerOpen(false)}
                sx={{
                  mt: 3,
                  py: 1.25,
                  borderRadius: `${rhRadius.md}px`,
                  textTransform: 'none',
                  fontWeight: 800,
                }}
              >
                {t('map.done')}
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
                  borderTopLeftRadius: `${rhRadius.lg}px`,
                  borderTopRightRadius: `${rhRadius.lg}px`,
                  pointerEvents: 'auto',
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
                  boxShadow: rhElev.elev2,
                },
              }}
            >
              <Box
                role="presentation"
                aria-label={t('map.dragListings')}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexShrink: 0,
                  pt: 0.5,
                  pb: 0.25,
                }}
              >
                <Box sx={mapSheetHandleSx} />
              </Box>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 1.5, pb: 0.35, pt: 0, flexShrink: 0 }}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight={800}
                  sx={{ fontSize: '0.8125rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}
                >
                  {t('map.listings')}
                </Typography>
                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  label={t(filtered.length === 1 ? 'map.vehicleOne' : 'map.vehicleOther', { count: filtered.length })}
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
