import ChevronLeft from '@mui/icons-material/ChevronLeft'
import ChevronRight from '@mui/icons-material/ChevronRight'
import { Box, Button, Stack, Typography } from '@mui/material'
import L from 'leaflet'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  ZoomControl,
} from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'

import { PHILIPPINES_MAP_MIN_ZOOM, PHILIPPINES_MAX_BOUNDS_CORNERS } from '../../constants/geo'
import { RENTARA_MAP_PRIMARY, RENTARA_MAP_TILE_URL } from '../../constants/rentaraMapStyle'
import type { ExploreMapListing } from '../../utils/exploreMapListings'
import { listingsSortedByDistanceFrom } from '../../utils/exploreMapListings'
import type { LatLng } from '../../utils/distance'
import { formatPeso } from '../../utils/formatCurrency'
import { ensureLeafletDefaultIcons } from '../../utils/leafletDefaultIcon'
import { createRentaraExploreClusterIcon } from '../../utils/mapExploreClusterIcon'
import { getExploreMapPriceBadgeIcon } from '../../utils/mapExplorePriceBadge'
import { getRentaraVehiclePinIcon } from '../../utils/mapVehiclePinIcon'
import { isTwoWheeler } from '../../utils/vehicleUtils'

const MANILA_CENTER: L.LatLngTuple = [14.5995, 120.9842]
const PRIMARY = RENTARA_MAP_PRIMARY
const PH_BOUNDS = L.latLngBounds(PHILIPPINES_MAX_BOUNDS_CORNERS)

function clampLatLngToPhilippines(latlng: L.LatLng): L.LatLng {
  const sw = PH_BOUNDS.getSouthWest()
  const ne = PH_BOUNDS.getNorthEast()
  return L.latLng(
    Math.min(ne.lat, Math.max(sw.lat, latlng.lat)),
    Math.min(ne.lng, Math.max(sw.lng, latlng.lng)),
  )
}

function isUserInsidePhilippines(userLocation: LatLng | null): boolean {
  if (!userLocation) return false
  return PH_BOUNDS.contains(L.latLng(userLocation.lat, userLocation.lng))
}

export type ExploreRentalsMapInnerProps = {
  listings: ExploreMapListing[]
  selectedId: string | null
  onSelect: (id: string) => void
  userLocation: LatLng | null
  onViewDetails: (listing: ExploreMapListing) => void
  /**
   * Full map page: scroll the horizontal listing strip to this vehicle (optional).
   * Omit on landing preview — button is hidden.
   */
  onShowInListing?: (listing: ExploreMapListing) => void
  /**
   * Increment when the listing strip requests “view on map” so the marker popup opens after fly-to.
   * Omit on previews where that control does not exist.
   */
  mapFocusNonce?: number
  /** Full map: cycle previous/next among listings on the map (sorted by distance from current pin). */
  onNearbyNavigate?: (direction: 'next' | 'prev') => void
  /** Embedded previews: disable wheel zoom so the page scrolls; touch/pinch still pans/zooms on mobile. */
  scrollWheelZoom?: boolean
  /** When false, skip fly-to animation (e.g. compact preview). */
  enableFlyTo?: boolean
  /** `price` — marketplace-style ₱/day pills; `vehicle` — compact type icons (e.g. landing preview). */
  markerStyle?: 'vehicle' | 'price'
  /** Group nearby markers into clusters (full map); off for small previews. */
  enableClustering?: boolean
  /** Bump to fit all markers in view again (desktop “Fit to results”). */
  fitBoundsRequestId?: number
  /** Passed to markercluster `chunkDelay` — slightly higher reduces main-thread spikes on large screens. */
  clusterChunkDelay?: number
  /** When false, turns off cluster / spiderfy animations (snappier on desktop). */
  clusterAnimations?: boolean
  /** `maxClusterRadius` for Leaflet.markercluster (px). */
  clusterRadius?: number
  /**
   * Desktop split view: re-apply `maxBounds` after resize and snap the view if it drifts outside
   * the Philippines (wide aspect ratios can escape briefly after `invalidateSize`).
   */
  strictPhilippinesBounds?: boolean
  /**
   * `wide` = desktop split-pane: first auto view Metro Manila; OOB pins use Manila for fit.
   * `compact` = mobile: first auto view whole PH (`fitBounds`); OOB pins clamp to PH box for fit (legacy).
   */
  mapSurface?: 'compact' | 'wide'
}

/**
 * Fits all listing pins (and optional user point) in view.
 * Uses center + zoom from getBoundsZoom instead of fitBounds/flyToBounds so padding cannot
 * request a view outside maxBounds (avoids panInsideMaxBounds recursion with viscosity 1).
 *
 * Omits {@link userLocation} from the bounds when it falls outside the Philippines — otherwise
 * a shared location from abroad (VPN / dev / travel) zooms the map out to “all of SE Asia”.
 */
/** Flex / split layouts: Leaflet often needs a nudge when the map container resizes. */
function MapInvalidateOnResize({ afterInvalidate }: { afterInvalidate?: (m: L.Map) => void }) {
  const map = useMap()
  useEffect(() => {
    const c = map.getContainer()
    if (!c) return
    const ro = new ResizeObserver(() => {
      map.invalidateSize({ animate: false })
      afterInvalidate?.(map)
    })
    ro.observe(c)
    return () => ro.disconnect()
  }, [map, afterInvalidate])
  return null
}

/** Listens for `rentara-map-shell-resize` (map page layout) so Leaflet refits after flex shell reflow. */
function MapShellResizeSync({ afterInvalidate }: { afterInvalidate?: (m: L.Map) => void }) {
  const map = useMap()
  useEffect(() => {
    const onShellResize = () => {
      requestAnimationFrame(() => {
        map.invalidateSize({ animate: false })
        afterInvalidate?.(map)
      })
    }
    window.addEventListener('rentara-map-shell-resize', onShellResize)
    return () => window.removeEventListener('rentara-map-shell-resize', onShellResize)
  }, [map, afterInvalidate])
  return null
}

/**
 * Flex / split layouts often report 0×0 on first paint. Retry `invalidateSize` until the map has
 * a real size so `getBoundsZoom` / tiles are valid (fixes blank basemap on desktop).
 */
function MapLayoutStabilizer() {
  const map = useMap()
  useEffect(() => {
    let cancelled = false
    let frames = 0
    const tick = () => {
      if (cancelled) return
      map.invalidateSize({ animate: false })
      const { x, y } = map.getSize()
      if (x >= 32 && y >= 32) return
      if (frames++ < 48) {
        requestAnimationFrame(tick)
      }
    }
    tick()
    const t1 = window.setTimeout(() => {
      if (!cancelled) map.invalidateSize({ animate: false })
    }, 120)
    const t2 = window.setTimeout(() => {
      if (!cancelled) map.invalidateSize({ animate: false })
    }, 400)
    return () => {
      cancelled = true
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [map])
  return null
}

function listingLatLngClampedForFit(l: ExploreMapListing, surface: 'compact' | 'wide'): L.LatLngTuple {
  const lat = Number(l.latitude)
  const lng = Number(l.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return [MANILA_CENTER[0], MANILA_CENTER[1]]
  }
  if (!PH_BOUNDS.contains(L.latLng(lat, lng))) {
    if (surface === 'wide') {
      return [MANILA_CENTER[0], MANILA_CENTER[1]]
    }
    const c = clampLatLngToPhilippines(L.latLng(lat, lng))
    return [c.lat, c.lng]
  }
  return [lat, lng]
}

function MapBoundsController({
  listings,
  userLocation,
  fitBoundsRequestId = 0,
  mapSurface,
}: {
  listings: ExploreMapListing[]
  userLocation: LatLng | null
  fitBoundsRequestId?: number
  mapSurface: 'compact' | 'wide'
}) {
  const map = useMap()

  /** Listings only — never tie auto-fit to GPS jitter (that re-ran the effect and fought wheel zoom on desktop). */
  const boundsKey = useMemo(() => {
    if (!listings.length) return ''
    return listings
      .map((l) => {
        const la = Number(l.latitude)
        const lo = Number(l.longitude)
        const a = Number.isFinite(la) ? la.toFixed(5) : 'na'
        const o = Number.isFinite(lo) ? lo.toFixed(5) : 'na'
        return `${l.id}:${a}:${o}`
      })
      .sort()
      .join('|')
  }, [listings])

  const prevBoundsKey = useRef<string | null>(null)
  const prevRequestId = useRef(0)
  /** First auto layout: wide → Metro Manila; compact → whole PH. Then listing fit on filter change / Fit. */
  const didInitialSurfaceLayoutRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    let frames = 0

    const apply = () => {
      if (cancelled) return

      if (!listings.length) {
        map.invalidateSize({ animate: false })
        const { x: xe, y: ye } = map.getSize()
        if (xe < 24 || ye < 24) {
          if (frames++ < 48) requestAnimationFrame(apply)
          return
        }
        map.setView(MANILA_CENTER, 11, { animate: false })
        prevBoundsKey.current = ''
        return
      }

      const manualFit = fitBoundsRequestId > prevRequestId.current
      const keyChanged = boundsKey !== prevBoundsKey.current
      /** Skip all work (especially `invalidateSize`) when nothing would change the view — avoids fighting user zoom/pan. */
      if (!manualFit && !keyChanged) return

      map.invalidateSize({ animate: false })
      const { x, y } = map.getSize()
      if (x < 24 || y < 24) {
        if (frames++ < 48) requestAnimationFrame(apply)
        return
      }

      if (!manualFit && !didInitialSurfaceLayoutRef.current) {
        didInitialSurfaceLayoutRef.current = true
        prevBoundsKey.current = boundsKey
        prevRequestId.current = fitBoundsRequestId
        if (mapSurface === 'wide') {
          map.setView(MANILA_CENTER, 11, { animate: false })
        } else {
          map.fitBounds(PH_BOUNDS, { animate: false, padding: [10, 10] })
        }
        return
      }

      prevBoundsKey.current = boundsKey
      prevRequestId.current = fitBoundsRequestId

      const pts: L.LatLngTuple[] = listings.map((l) => listingLatLngClampedForFit(l, mapSurface))
      const userInPh = isUserInsidePhilippines(userLocation)
      if (userInPh && userLocation && manualFit) {
        pts.push([userLocation.lat, userLocation.lng])
      }

      if (pts.length === 0) {
        map.setView(MANILA_CENTER, 11, { animate: false })
        return
      }

      const b = L.latLngBounds(pts)
      const center = clampLatLngToPhilippines(b.getCenter())
      /** Allow closer auto-fit on desktop; user can still wheel past this after fit. */
      const maxZ = manualFit ? (userInPh ? 14 : 13) : Math.min(16, userInPh ? 15 : 14)
      const pad = L.point(52, 52)
      let z = map.getBoundsZoom(b, false, pad)
      if (!Number.isFinite(z)) z = 10
      z = Math.round(z)
      z = Math.min(maxZ, Math.max(PHILIPPINES_MAP_MIN_ZOOM, z))
      if (!Number.isFinite(z)) z = 10
      map.setView(center, z, { animate: false })
    }

    apply()
    return () => {
      cancelled = true
    }
  }, [map, listings, boundsKey, fitBoundsRequestId, mapSurface])

  return null
}

/** Recover from any view outside the Philippines (bad coords / fitBounds edge cases). */
function MapEnsurePhilippinesCenter() {
  const map = useMap()
  useEffect(() => {
    const fix = () => {
      if (!map.getContainer().isConnected) return
      if (PH_BOUNDS.contains(map.getCenter())) return
      map.setView(MANILA_CENTER, 11, { animate: false })
    }
    map.on('moveend', fix)
    fix()
    return () => {
      map.off('moveend', fix)
    }
  }, [map])
  return null
}

/** Closes the Leaflet popup then runs the parent handler (e.g. scroll listing into view). */
function ShowInListingButton({
  listing,
  onShowInListing,
}: {
  listing: ExploreMapListing
  onShowInListing: (listing: ExploreMapListing) => void
}) {
  const map = useMap()
  return (
    <Button
      fullWidth
      size="small"
      variant="outlined"
      color="primary"
      sx={{ borderRadius: 1.25, textTransform: 'none', fontWeight: 600, py: 0.4, fontSize: 12 }}
      onClick={() => {
        map.closePopup()
        onShowInListing(listing)
      }}
    >
      Show in list
    </Button>
  )
}

/** Zoom after selecting a pin — road-level detail (Carto native tiles to 18). */
const SELECTED_PIN_STREET_ZOOM = 18

/**
 * Pan the map so the open vehicle popup card is centered in the map container (not stuck to the pin edge).
 * Runs a few times to catch Leaflet layout + React paint after `popupopen` / fly animations.
 */
function scheduleCenterExplorePopupInMap(map: L.Map) {
  const run = () => {
    const container = map.getContainer()
    const size = map.getSize()
    if (!container || size.x <= 0 || size.y <= 0) return

    const anchor = container.querySelector(
      '.leaflet-popup-pane .rentara-explore-popup',
    )?.closest('.leaflet-popup') as HTMLElement | null
    if (!anchor || anchor.offsetWidth < 8) return

    const mapCenterPt = L.point(size.x / 2, size.y / 2)
    const cr = container.getBoundingClientRect()
    const pr = anchor.getBoundingClientRect()
    const popupCenterPt = L.point(
      pr.left - cr.left + pr.width / 2,
      pr.top - cr.top + pr.height / 2,
    )
    const d = L.point(mapCenterPt.x - popupCenterPt.x, mapCenterPt.y - popupCenterPt.y)
    if (Math.abs(d.x) < 2 && Math.abs(d.y) < 2) return
    map.panBy(d, { animate: false })
  }

  requestAnimationFrame(run)
  requestAnimationFrame(() => requestAnimationFrame(run))
  const t1 = window.setTimeout(run, 90)
  const t2 = window.setTimeout(run, 240)
  return () => {
    window.clearTimeout(t1)
    window.clearTimeout(t2)
  }
}

/**
 * On embedded previews, pan so the card sits in the middle of the small map.
 * On the full /map page (`recenterCard` false), skip — extra pans were shifting the view away from the pin.
 */
function CenterExplorePopupOnOpen({ recenterCard }: { recenterCard: boolean }) {
  const map = useMap()
  const clearRef = useRef<(() => void) | null>(null)

  const onPopupOpen = useCallback(() => {
    if (!recenterCard) return
    clearRef.current?.()
    clearRef.current = scheduleCenterExplorePopupInMap(map)
  }, [map, recenterCard])

  useEffect(() => {
    map.on('popupopen', onPopupOpen)
    return () => {
      map.off('popupopen', onPopupOpen)
      clearRef.current?.()
      clearRef.current = null
    }
  }, [map, onPopupOpen])

  return null
}

/**
 * Snap map to the listing’s coordinates at street-level zoom. Uses `setView` with no animation so the pin
 * stays on the exact lat/lng.
 *
 * On the first direct marker tap, Leaflet opens the popup, then this effect runs and moves the map — that
 * leaves the popup half-laid-out until we reset it. We `closePopup()` before `setView`, then open again on
 * `moveend` (plus short timers when the view doesn’t change and `moveend` never fires).
 */
function FlyToSelected({
  selectedId,
  listings,
  markerRegistry,
}: {
  selectedId: string | null
  listings: ExploreMapListing[]
  markerRegistry: MutableRefObject<Map<string, L.Marker>>
}) {
  const map = useMap()
  const listingsRef = useRef(listings)
  listingsRef.current = listings

  useEffect(() => {
    if (!selectedId) return
    const hit = listingsRef.current.find((l) => l.id === selectedId)
    if (!hit) return
    const center = clampLatLngToPhilippines(L.latLng(hit.latitude, hit.longitude))
    const rawMax = map.getMaxZoom()
    const cap = typeof rawMax === 'number' && !Number.isNaN(rawMax) && rawMax > 0 ? rawMax : 18
    const targetZoom = Math.min(cap, SELECTED_PIN_STREET_ZOOM)
    const id = selectedId

    const refreshPopup = () => {
      markerRegistry.current.get(id)?.openPopup()
    }

    const afterMove = () => {
      if (!map.getContainer().isConnected) return
      map.invalidateSize(false)
      refreshPopup()
      requestAnimationFrame(refreshPopup)
    }

    const apply = () => {
      if (!map.getContainer().isConnected) return
      map.invalidateSize(false)
      map.closePopup()
      map.setView(center, targetZoom, { animate: false })
    }

    map.once('moveend', afterMove)
    apply()

    const t1 = window.setTimeout(() => {
      map.invalidateSize(false)
      refreshPopup()
    }, 110)
    const t2 = window.setTimeout(refreshPopup, 300)

    return () => {
      map.off('moveend', afterMove)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [map, selectedId, markerRegistry])
  return null
}

function NearbyVehicleNav({
  current,
  listings,
  onNavigate,
}: {
  current: ExploreMapListing
  listings: ExploreMapListing[]
  onNavigate: (direction: 'next' | 'prev') => void
}) {
  const ring = useMemo(() => listingsSortedByDistanceFrom(current, listings), [current, listings])
  const idx = ring.findIndex((l) => l.id === current.id)
  if (ring.length < 2 || idx < 0) return null

  return (
    <Box sx={{ mt: 0.75, pt: 0.75, borderTop: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, lineHeight: 1.3, fontSize: 10 }}>
        {ring.length} on map — by distance
      </Typography>
      <Stack direction="row" spacing={0.5}>
        <Button
          fullWidth
          size="small"
          variant="outlined"
          color="primary"
          startIcon={<ChevronLeft sx={{ fontSize: 16 }} />}
          onClick={() => onNavigate('prev')}
          sx={{ borderRadius: 1.25, textTransform: 'none', fontWeight: 600, py: 0.35, fontSize: 12 }}
        >
          Prev
        </Button>
        <Button
          fullWidth
          size="small"
          variant="outlined"
          color="primary"
          endIcon={<ChevronRight sx={{ fontSize: 16 }} />}
          onClick={() => onNavigate('next')}
          sx={{ borderRadius: 1.25, textTransform: 'none', fontWeight: 600, py: 0.35, fontSize: 12 }}
        >
          Next
        </Button>
      </Stack>
    </Box>
  )
}

function VehicleMarker({
  listing,
  icon,
  onSelect,
  markerRegistry,
  children,
}: {
  listing: ExploreMapListing
  icon: L.DivIcon
  onSelect: (id: string) => void
  markerRegistry: MutableRefObject<Map<string, L.Marker>>
  children: ReactNode
}) {
  const markerRef = useRef<L.Marker | null>(null)
  useLayoutEffect(() => {
    const reg = markerRegistry.current
    const m = markerRef.current
    if (!m) return
    reg.set(listing.id, m)
    return () => {
      reg.delete(listing.id)
    }
    // markerRegistry ref is stable for the map instance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing.id])
  const exploreVehicleBucket = isTwoWheeler(listing.vehicle) ? 'two_wheeler' : 'car'
  return (
    <Marker
      ref={markerRef}
      position={[listing.latitude, listing.longitude]}
      icon={icon}
      exploreVehicleBucket={exploreVehicleBucket}
      explorePricePerDay={listing.vehicle.pricePerDay}
      eventHandlers={{
        click: () => onSelect(listing.id),
      }}
    >
      {children}
    </Marker>
  )
}

/** After “View on map” from the listing strip: open the marker popup once fly-to settles (or fallback timer). */
function OpenListingPopupOnMapFocus({
  selectedId,
  mapFocusNonce,
  markerRegistry,
}: {
  selectedId: string | null
  mapFocusNonce: number
  markerRegistry: MutableRefObject<Map<string, L.Marker>>
}) {
  const map = useMap()
  const selectedIdRef = useRef(selectedId)
  selectedIdRef.current = selectedId

  useEffect(() => {
    if (mapFocusNonce === 0) return
    const id = selectedIdRef.current
    if (!id) return
    const reg = markerRegistry.current
    const open = () => {
      reg.get(id)?.openPopup()
    }
    const openAfterFrame = () => window.setTimeout(open, 0)
    map.once('moveend', openAfterFrame)
    const t1 = window.setTimeout(open, 120)
    const t2 = window.setTimeout(open, 720)
    return () => {
      map.off('moveend', openAfterFrame)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- markerRegistry ref is stable; run only on mapFocusNonce
  }, [map, mapFocusNonce])
  return null
}

/**
 * Leaflet map: Carto Voyager basemap, Rentara pins, credit below the canvas, styled popups.
 * Lazy-loaded by map surfaces (`MapPreview`, `/map`) to defer Leaflet until needed.
 */
export default function ExploreRentalsMapInner({
  listings,
  selectedId,
  onSelect,
  userLocation,
  onViewDetails,
  onShowInListing,
  mapFocusNonce = 0,
  onNearbyNavigate,
  scrollWheelZoom = true,
  enableFlyTo = true,
  markerStyle = 'price',
  enableClustering = true,
  fitBoundsRequestId = 0,
  clusterChunkDelay = 50,
  clusterAnimations = true,
  clusterRadius = 52,
  strictPhilippinesBounds = false,
  mapSurface = 'compact',
}: ExploreRentalsMapInnerProps) {
  const markerRegistry = useRef<Map<string, L.Marker>>(new Map())

  const afterMapResize = useCallback((m: L.Map) => {
    /** `MapInvalidateOnResize` already called `invalidateSize` in the same tick; do not call again here (avoids `_leaflet_pos` errors). */
    if (!strictPhilippinesBounds) return
    requestAnimationFrame(() => {
      if (!m.getContainer()?.isConnected) return
      if (!PH_BOUNDS.contains(m.getCenter())) {
        m.panInsideBounds(PH_BOUNDS, { animate: false })
      }
    })
  }, [strictPhilippinesBounds])

  /**
   * React Strict Mode (and error-boundary remounts) can leave a Leaflet `_leaflet_id` on the DOM.
   * Defer mounting until layout, bump `key` on teardown so `MapContainer` always gets a fresh node.
   */
  const [mapDomReady, setMapDomReady] = useState(false)
  const [mapInstanceKey, setMapInstanceKey] = useState(0)
  useLayoutEffect(() => {
    setMapDomReady(true)
    return () => {
      setMapDomReady(false)
      setMapInstanceKey((k) => k + 1)
    }
  }, [])

  useEffect(() => {
    ensureLeafletDefaultIcons()
  }, [])

  const icons = useMemo(() => {
    const m = new Map<string, L.DivIcon>()
    for (const l of listings) {
      const bucket = isTwoWheeler(l.vehicle) ? 'two_wheeler' : 'car'
      const icon =
        markerStyle === 'price'
          ? getExploreMapPriceBadgeIcon(l.vehicle.pricePerDay, selectedId === l.id, bucket)
          : getRentaraVehiclePinIcon(l.vehicle.vehicleType, selectedId === l.id)
      m.set(l.id, icon)
    }
    return m
  }, [listings, selectedId, markerStyle])

  return (
    <Stack direction="column" sx={{ height: '100%', minHeight: 0 }} spacing={0}>
      <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {mapDomReady ? (
        <MapContainer
          key={mapInstanceKey}
          center={MANILA_CENTER}
          zoom={11}
          minZoom={PHILIPPINES_MAP_MIN_ZOOM}
          maxZoom={19}
          maxBounds={PH_BOUNDS}
          maxBoundsViscosity={1}
          worldCopyJump={false}
          scrollWheelZoom={scrollWheelZoom}
          zoomControl={false}
          attributionControl={false}
          className="rentara-leaflet-surface"
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <TileLayer attribution="" url={RENTARA_MAP_TILE_URL} maxZoom={19} maxNativeZoom={18} />
          <MapLayoutStabilizer />
          <MapInvalidateOnResize afterInvalidate={afterMapResize} />
          <MapShellResizeSync afterInvalidate={afterMapResize} />
          <ZoomControl position="topright" />
          <MapBoundsController
            listings={listings}
            userLocation={userLocation}
            fitBoundsRequestId={fitBoundsRequestId}
            mapSurface={mapSurface}
          />
          <MapEnsurePhilippinesCenter />
          <CenterExplorePopupOnOpen recenterCard={!enableFlyTo} />
          {enableFlyTo ? (
            <FlyToSelected selectedId={selectedId} listings={listings} markerRegistry={markerRegistry} />
          ) : null}
          {isUserInsidePhilippines(userLocation) && userLocation ? (
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={9}
              pathOptions={{
                color: PRIMARY,
                weight: 2,
                fillColor: PRIMARY,
                fillOpacity: 0.28,
              }}
            />
          ) : null}
          {enableClustering ? (
            <MarkerClusterGroup
              chunkedLoading
              chunkDelay={clusterChunkDelay}
              spiderfyOnMaxZoom
              showCoverageOnHover={false}
              maxClusterRadius={clusterRadius}
              animate={clusterAnimations}
              animateAddingMarkers={clusterAnimations}
              iconCreateFunction={createRentaraExploreClusterIcon}
            >
              {listings.map((listing) => (
                <VehicleMarker
                  key={listing.id}
                  listing={listing}
                  icon={
                    icons.get(listing.id) ??
                    (markerStyle === 'price'
                      ? getExploreMapPriceBadgeIcon(
                          listing.vehicle.pricePerDay,
                          false,
                          isTwoWheeler(listing.vehicle) ? 'two_wheeler' : 'car',
                        )
                      : getRentaraVehiclePinIcon(listing.vehicle.vehicleType, false))
                  }
                  onSelect={onSelect}
                  markerRegistry={markerRegistry}
                >
                  <Popup
                    className="rentara-explore-popup"
                    offset={[0, 8]}
                    autoPan
                    keepInView={false}
                    autoPanPaddingTopLeft={[20, 72]}
                    autoPanPaddingBottomRight={[28, 160]}
                    minWidth={216}
                    maxWidth={268}
                  >
                    <Box sx={{ width: '100%', maxWidth: 252, py: 0.25, px: 0.35, boxSizing: 'border-box' }}>
                      <Box
                        component="img"
                        src={listing.vehicle.thumbnailUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        sx={{
                          width: '100%',
                          height: { xs: 56, sm: 64 },
                          objectFit: 'cover',
                          borderRadius: 0.75,
                          display: 'block',
                          mb: 0.5,
                          bgcolor: 'grey.100',
                        }}
                      />
                      <Typography
                        fontWeight={700}
                        sx={{ lineHeight: 1.25, pr: 2, fontSize: 13, letterSpacing: '-0.01em' }}
                      >
                        {listing.vehicle.displayName}
                      </Typography>
                      <Typography sx={{ mt: 0.35, fontSize: 13, fontWeight: 700, color: 'primary.main' }}>
                        {formatPeso(listing.vehicle.pricePerDay)}
                        <Typography component="span" sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500 }}>
                          {' '}
                          / day
                        </Typography>
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.25, lineHeight: 1.3, fontSize: 11 }}
                      >
                        {listing.vehicle.locationName}
                      </Typography>
                      <Stack spacing={0.5} sx={{ mt: 0.75, width: '100%' }}>
                        <Button
                          fullWidth
                          size="small"
                          variant="contained"
                          sx={{
                            bgcolor: PRIMARY,
                            '&:hover': { bgcolor: '#1647b8' },
                            borderRadius: 1.25,
                            textTransform: 'none',
                            fontWeight: 600,
                            py: 0.4,
                            fontSize: 12,
                          }}
                          onClick={() => onViewDetails(listing)}
                        >
                          View details
                        </Button>
                        {onShowInListing ? (
                          <ShowInListingButton listing={listing} onShowInListing={onShowInListing} />
                        ) : null}
                      </Stack>
                      {onNearbyNavigate ? (
                        <NearbyVehicleNav
                          current={listing}
                          listings={listings}
                          onNavigate={onNearbyNavigate}
                        />
                      ) : null}
                    </Box>
                  </Popup>
                </VehicleMarker>
              ))}
            </MarkerClusterGroup>
          ) : (
            listings.map((listing) => (
              <VehicleMarker
                key={listing.id}
                listing={listing}
                icon={
                  icons.get(listing.id) ??
                  (markerStyle === 'price'
                    ? getExploreMapPriceBadgeIcon(
                        listing.vehicle.pricePerDay,
                        false,
                        isTwoWheeler(listing.vehicle) ? 'two_wheeler' : 'car',
                      )
                    : getRentaraVehiclePinIcon(listing.vehicle.vehicleType, false))
                }
                onSelect={onSelect}
                markerRegistry={markerRegistry}
              >
                <Popup
                  className="rentara-explore-popup"
                  offset={[0, 8]}
                  autoPan
                  keepInView={false}
                  autoPanPaddingTopLeft={[20, 72]}
                  autoPanPaddingBottomRight={[28, 160]}
                  minWidth={216}
                  maxWidth={268}
                >
                  <Box sx={{ width: '100%', maxWidth: 252, py: 0.25, px: 0.35, boxSizing: 'border-box' }}>
                    <Box
                      component="img"
                      src={listing.vehicle.thumbnailUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      sx={{
                        width: '100%',
                        height: { xs: 56, sm: 64 },
                        objectFit: 'cover',
                        borderRadius: 0.75,
                        display: 'block',
                        mb: 0.5,
                        bgcolor: 'grey.100',
                      }}
                    />
                    <Typography
                      fontWeight={700}
                      sx={{ lineHeight: 1.25, pr: 2, fontSize: 13, letterSpacing: '-0.01em' }}
                    >
                      {listing.vehicle.displayName}
                    </Typography>
                    <Typography sx={{ mt: 0.35, fontSize: 13, fontWeight: 700, color: 'primary.main' }}>
                      {formatPeso(listing.vehicle.pricePerDay)}
                      <Typography component="span" sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500 }}>
                        {' '}
                        / day
                      </Typography>
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.25, lineHeight: 1.3, fontSize: 11 }}
                    >
                      {listing.vehicle.locationName}
                    </Typography>
                    <Stack spacing={0.5} sx={{ mt: 0.75, width: '100%' }}>
                      <Button
                        fullWidth
                        size="small"
                        variant="contained"
                        sx={{
                          bgcolor: PRIMARY,
                          '&:hover': { bgcolor: '#1647b8' },
                          borderRadius: 1.25,
                          textTransform: 'none',
                          fontWeight: 600,
                          py: 0.4,
                          fontSize: 12,
                        }}
                        onClick={() => onViewDetails(listing)}
                      >
                        View details
                      </Button>
                      {onShowInListing ? (
                        <ShowInListingButton listing={listing} onShowInListing={onShowInListing} />
                      ) : null}
                    </Stack>
                    {onNearbyNavigate ? (
                      <NearbyVehicleNav
                        current={listing}
                        listings={listings}
                        onNavigate={onNearbyNavigate}
                      />
                    ) : null}
                  </Box>
                </Popup>
              </VehicleMarker>
            ))
          )}
          <OpenListingPopupOnMapFocus
            selectedId={selectedId}
            mapFocusNonce={mapFocusNonce}
            markerRegistry={markerRegistry}
          />
        </MapContainer>
        ) : (
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'grey.100',
            }}
          />
        )}
      </Box>
    </Stack>
  )
}
