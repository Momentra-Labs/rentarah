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
import {
  listingsInSamePickupCitySorted,
  pickupHubKeyForExploreListing,
  shortPickupCityLineForCluster,
  type ExploreMapListing,
} from '../../utils/exploreMapListings'
import type { LatLng } from '../../utils/distance'
import { formatPeso } from '../../utils/formatCurrency'
import { ensureLeafletDefaultIcons } from '../../utils/leafletDefaultIcon'
import {
  createRentaraDensityClusterIcon,
  RENTARA_CLUSTER_DISABLE_AT_MAP_ZOOM,
  RENTARA_CLUSTER_MAX_RADIUS_PX,
} from '../../utils/mapExploreClusterIcon'
import { getExploreMapPriceBadgeIcon } from '../../utils/mapExplorePriceBadge'
import { getRentaraVehiclePinIcon } from '../../utils/mapVehiclePinIcon'
import { isTwoWheeler } from '../../utils/vehicleUtils'

import { popupCtaGestureBlockers } from '../../utils/exploreMapPopupGestures'

import { ExploreMapPopupCityPrevNextRow, ExploreMapPopupSwipeRail, ExploreMapVehiclePopupCompactHorizontal } from './exploreMapVehiclePopup'

const MANILA_CENTER: L.LatLngTuple = [14.5995, 120.9842]
const PRIMARY = RENTARA_MAP_PRIMARY
const PH_BOUNDS = L.latLngBounds(PHILIPPINES_MAX_BOUNDS_CORNERS)

/** Fraction of viewport height from top — pin appears in lower band so the popup/card stays unobstructed. */
const LOWER_SCREEN_MARKER_FRAC = 0.72

function schedulePanLatLngTowardLowerThird(map: L.Map, latlng: L.LatLng): void {
  const run = () => {
    if (!map.getContainer()?.isConnected) return
    const size = map.getSize()
    if (size.x < 32 || size.y < 32) return
    const pt = map.latLngToContainerPoint(latlng)
    const target = L.point(size.x / 2, size.y * LOWER_SCREEN_MARKER_FRAC)
    map.panBy(L.point(pt.x - target.x, pt.y - target.y))
  }
  requestAnimationFrame(run)
  requestAnimationFrame(() => requestAnimationFrame(run))
  window.setTimeout(run, 72)
  window.setTimeout(run, 220)
}

/**
 * Leaflet’s `invalidateSize` touches `_mapPane` / `_leaflet_pos`; calling it before the map panes
 * exist (or after the container disconnected) throws. ResizeObserver + shell resize events can fire
 * in that window on desktop flex layouts.
 */
function safeInvalidateSize(map: L.Map, options?: boolean | { animate?: boolean; pan?: boolean }): boolean {
  const el = map.getContainer()
  if (!el?.isConnected) return false
  try {
    if (typeof options === 'boolean') {
      map.invalidateSize(options)
    } else {
      map.invalidateSize(options ?? { animate: false })
    }
    return true
  } catch {
    return false
  }
}

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
  /** Bump to fit all markers in view again (desktop “Fit to results”). */
  fitBoundsRequestId?: number
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
  /** Desktop listing strip hover: emphasize marker z-order/icons and preview its Leaflet popup. */
  hoveredListingId?: string | null
  /**
   * Mobile `/map`: compact popup + pan pin into lower viewport band. Previews omit (default false).
   */
  compactVehiclePopup?: boolean
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
      if (safeInvalidateSize(map, { animate: false })) afterInvalidate?.(map)
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
        if (safeInvalidateSize(map, { animate: false })) afterInvalidate?.(map)
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
      safeInvalidateSize(map, { animate: false })
      const { x, y } = map.getSize()
      if (x >= 32 && y >= 32) return
      if (frames++ < 48) {
        requestAnimationFrame(tick)
      }
    }
    tick()
    const t1 = window.setTimeout(() => {
      if (!cancelled) safeInvalidateSize(map, { animate: false })
    }, 120)
    const t2 = window.setTimeout(() => {
      if (!cancelled) safeInvalidateSize(map, { animate: false })
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
        safeInvalidateSize(map, { animate: false })
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

      safeInvalidateSize(map, { animate: false })
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
  }, [map, listings, boundsKey, fitBoundsRequestId, mapSurface, userLocation])

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
      type="button"
      sx={{ borderRadius: 1.25, textTransform: 'none', fontWeight: 600, py: 0.55, fontSize: 12 }}
      {...popupCtaGestureBlockers()}
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
 * Leaflet popup / fly skips: `/map` can be at `maxZoom` 19 while we cap fly at 18 —
 * comparing `zoom === targetZoom` would always fail at 19 and force `closePopup` + `setView`, which collapses spiderfy.
 */
const SELECT_ALREADY_FRAMED_MAX_CENTER_DISTANCE_M = 260

/** Extra margin when testing if the selected pin is already on screen (not just near `map.getCenter()` — auto-pan shifts the center away from the pin). */
const SELECT_ALREADY_FRAMED_BOUNDS_PAD = 0.2

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
 * Avoids repeating `closePopup` + `setView` when the map is already close enough to the pin at street zoom
 * (including current zoom above target, e.g. 19 vs 18, and when the pin is **in the current viewport** even if
 * the map center is far after popup auto-pan — otherwise switching spiderfied markers collapses the cluster) —
 * that repetition collapses leaflet.markercluster’s spiderfy and makes the UI jump back to the cluster badge.
 *
 * When the map really needs to move, we `closePopup()` before `setView`, then reopen on `moveend` (plus timers).
 */
function FlyToSelected({
  selectedId,
  listings,
  markerRegistry,
  preferPinBelowCard,
}: {
  selectedId: string | null
  listings: ExploreMapListing[]
  markerRegistry: MutableRefObject<Map<string, L.Marker>>
  preferPinBelowCard?: boolean
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

    const runAfterSelect = () => {
      if (!map.getContainer().isConnected) return
      safeInvalidateSize(map, false)
      refreshPopup()
      requestAnimationFrame(refreshPopup)
      if (preferPinBelowCard) {
        const ll = clampLatLngToPhilippines(L.latLng(hit.latitude, hit.longitude))
        window.setTimeout(() => schedulePanLatLngTowardLowerThird(map, ll), 0)
        window.setTimeout(() => schedulePanLatLngTowardLowerThird(map, ll), 120)
      }
    }

    const curZ = map.getZoom()
    const zoomAlreadyStreetOrCloser =
      curZ != null && curZ + 1e-4 >= targetZoom
    const nearMapCenter =
      map.getCenter().distanceTo(center) < SELECT_ALREADY_FRAMED_MAX_CENTER_DISTANCE_M
    const pinAlreadyInViewport = map
      .getBounds()
      .pad(SELECT_ALREADY_FRAMED_BOUNDS_PAD)
      .contains(center)
    const alreadyFramed =
      zoomAlreadyStreetOrCloser && (nearMapCenter || pinAlreadyInViewport)

    /**
     * Skip `closePopup` + `setView` when already at the pin — leaflet.markercluster would otherwise
     * un-spiderfy and the cluster “count” badge can replace the open vehicle popup.
     */
    if (alreadyFramed) {
      const idRaf = window.requestAnimationFrame(runAfterSelect)
      const tStable = window.setTimeout(runAfterSelect, 48)
      const tPopup = window.setTimeout(refreshPopup, 170)
      return () => {
        window.cancelAnimationFrame(idRaf)
        window.clearTimeout(tStable)
        window.clearTimeout(tPopup)
      }
    }

    const afterMove = () => {
      runAfterSelect()
    }

    const apply = () => {
      if (!map.getContainer().isConnected) return
      safeInvalidateSize(map, false)
      map.closePopup()
      map.setView(center, targetZoom, { animate: false })
    }

    map.once('moveend', afterMove)
    apply()

    const t1 = window.setTimeout(() => {
      safeInvalidateSize(map, false)
      refreshPopup()
    }, 110)
    const t2 = window.setTimeout(refreshPopup, 300)

    return () => {
      map.off('moveend', afterMove)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [map, selectedId, markerRegistry, preferPinBelowCard])
  return null
}

/** After any popup opens on mobile `/map`, nudge pin into the lower screen band (matches fly-to UX). */
function SnapExplorePinOnPopupOpen({
  enabled,
  selectedId,
  markerRegistry,
}: {
  enabled: boolean
  selectedId: string | null
  markerRegistry: MutableRefObject<Map<string, L.Marker>>
}) {
  const map = useMap()
  const selectedIdRef = useRef(selectedId)
  selectedIdRef.current = selectedId

  useEffect(() => {
    if (!enabled) return
    const handler = () => {
      const id = selectedIdRef.current
      if (!id) return
      const m = markerRegistry.current.get(id)
      if (!m) return
      schedulePanLatLngTowardLowerThird(map, clampLatLngToPhilippines(m.getLatLng()))
    }
    map.on('popupopen', handler)
    return () => {
      void map.off('popupopen', handler)
    }
  }, [enabled, map, markerRegistry])
  return null
}

/** Vehicle popup: compact + swipe rail on mobile; stacked desktop — prev/next stays within pickup city hub. */
function MapVehicleLeafletPopupContent({
  listing,
  listings,
  compactVehiclePopup,
  onViewDetails,
  onShowInListing,
  onNearbyNavigate,
}: {
  listing: ExploreMapListing
  listings: ExploreMapListing[]
  compactVehiclePopup: boolean
  onViewDetails: (l: ExploreMapListing) => void
  onShowInListing?: (l: ExploreMapListing) => void
  onNearbyNavigate?: (direction: 'next' | 'prev') => void
}) {
  const ring = useMemo(() => listingsInSamePickupCitySorted(listing, listings), [listing, listings])
  const idx = ring.findIndex((l) => l.id === listing.id)
  const canSwipe = Boolean(onNearbyNavigate) && ring.length >= 2 && idx >= 0
  const canPrev = canSwipe && ring.length >= 2
  const canNext = canSwipe && ring.length >= 2

  const showIn =
    onShowInListing ? (
      <ShowInListingButton listing={listing} onShowInListing={onShowInListing} />
    ) : null

  const legacyVertical = (
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
      <Typography fontWeight={700} sx={{ lineHeight: 1.25, pr: 2, fontSize: 13, letterSpacing: '-0.01em' }}>
        {listing.vehicle.displayName}
      </Typography>
      <Typography sx={{ mt: 0.35, fontSize: 13, fontWeight: 700, color: 'primary.main' }}>
        {formatPeso(listing.vehicle.pricePerDay)}
        <Typography component="span" sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500 }}>
          {' '}
          / day
        </Typography>
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, lineHeight: 1.3, fontSize: 11 }}>
        {listing.vehicle.locationName}
      </Typography>
      <Stack spacing={1.25} sx={{ mt: 0.75, width: '100%' }}>
        <Button
          fullWidth
          size="small"
          type="button"
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
          {...popupCtaGestureBlockers()}
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails(listing)
          }}
        >
          View details
        </Button>
        {showIn}
      </Stack>
    </Box>
  )

  const compactHorizontal = (
    <ExploreMapVehiclePopupCompactHorizontal
      listing={listing}
      listingPrimaryHex={PRIMARY}
      onViewDetails={() => onViewDetails(listing)}
      footerSlotAfterButtons={showIn}
    />
  )

  const body = compactVehiclePopup ? compactHorizontal : legacyVertical

  if (!canSwipe || !onNearbyNavigate) return body

  if (compactVehiclePopup) {
    return (
      <ExploreMapPopupSwipeRail
        canPrev={canPrev}
        canNext={canNext}
        onSwipePrev={() => onNearbyNavigate('prev')}
        onSwipeNext={() => onNearbyNavigate('next')}
        positionLabel={`${idx + 1} / ${ring.length} · Same city`}
      >
        {body}
      </ExploreMapPopupSwipeRail>
    )
  }

  const cityNavLabel = `${idx + 1} / ${ring.length} · Same city`

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'stretch', width: '100%', maxWidth: 280 }}>
      {body}
      <ExploreMapPopupCityPrevNextRow
        canPrev={canPrev}
        canNext={canNext}
        positionLabel={cityNavLabel}
        onPrev={() => onNearbyNavigate('prev')}
        onNext={() => onNearbyNavigate('next')}
      />
    </Box>
  )
}

function VehicleMarker({
  listing,
  icon,
  onSelect,
  markerRegistry,
  restingZIndex,
  children,
}: {
  listing: ExploreMapListing
  icon: L.DivIcon
  onSelect: (id: string) => void
  markerRegistry: MutableRefObject<Map<string, L.Marker>>
  restingZIndex: number
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

  useEffect(() => {
    markerRef.current?.setZIndexOffset(restingZIndex)
  }, [listing.id, restingZIndex])

  return (
    <Marker
      ref={markerRef}
      position={[listing.latitude, listing.longitude]}
      icon={icon}
      zIndexOffset={restingZIndex}
      exploreVehicleBucket={exploreVehicleBucket}
      explorePricePerDay={listing.vehicle.pricePerDay}
      explorePickupHubKey={pickupHubKeyForExploreListing(listing)}
      explorePickupAreaLabel={shortPickupCityLineForCluster(listing.vehicle.locationName)}
      eventHandlers={{
        click: () => onSelect(listing.id),
        mouseover: () =>
          markerRef.current?.setZIndexOffset(Math.max(restingZIndex, 920)),
        mouseout: () => markerRef.current?.setZIndexOffset(restingZIndex),
      }}
    >
      {children}
    </Marker>
  )
}

/**
 * Listing strip hover: open that pin’s Leaflet popup so vehicle details preview while the pin may be clustered.
 * When hover clears, restore the selected pin’s popup (or close if none).
 */
function SyncExplorePopupFromStripHover({
  hoveredListingId,
  selectedId,
  markerRegistry,
}: {
  hoveredListingId: string | null
  selectedId: string | null
  markerRegistry: MutableRefObject<Map<string, L.Marker>>
}) {
  const map = useMap()
  const hadStripHoverRef = useRef(false)

  useEffect(() => {
    const reg = markerRegistry.current

    if (hoveredListingId) {
      hadStripHoverRef.current = true
      const id = hoveredListingId
      const open = () => {
        reg.get(id)?.openPopup()
      }
      open()
      const t1 = window.setTimeout(open, 120)
      const t2 = window.setTimeout(open, 420)
      return () => {
        window.clearTimeout(t1)
        window.clearTimeout(t2)
      }
    }

    const hadHover = hadStripHoverRef.current
    hadStripHoverRef.current = false
    if (!hadHover) return

    const restore = () => {
      if (selectedId) reg.get(selectedId)?.openPopup()
      else map.closePopup()
    }
    restore()
    const tr1 = window.setTimeout(restore, 0)
    const tr2 = window.setTimeout(restore, 160)
    return () => {
      window.clearTimeout(tr1)
      window.clearTimeout(tr2)
    }
  }, [hoveredListingId, selectedId, map, markerRegistry])
  return null
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
 * Leaflet map: Carto Voyager basemap, Rentara price tags + density clusters; styled popups.
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
  fitBoundsRequestId = 0,
  strictPhilippinesBounds = false,
  mapSurface = 'compact',
  hoveredListingId = null,
  compactVehiclePopup = false,
}: ExploreRentalsMapInnerProps) {
  const markerRegistry = useRef<Map<string, L.Marker>>(new Map())

  const afterMapResize = useCallback((m: L.Map) => {
    /** When enabled, nudge the view inside PH after resize; resize handlers already call `safeInvalidateSize`. */
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
      const selected = selectedId === l.id
      const highlighted = hoveredListingId === l.id
      const icon =
        markerStyle === 'price'
          ? getExploreMapPriceBadgeIcon(l.vehicle.pricePerDay, selected, bucket, highlighted)
          : getRentaraVehiclePinIcon(l.vehicle.vehicleType, selected)
      m.set(l.id, icon)
    }
    return m
  }, [listings, selectedId, hoveredListingId, markerStyle])

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
            <FlyToSelected
              selectedId={selectedId}
              listings={listings}
              markerRegistry={markerRegistry}
              preferPinBelowCard={compactVehiclePopup}
            />
          ) : null}
          <SnapExplorePinOnPopupOpen
            enabled={compactVehiclePopup}
            selectedId={selectedId}
            markerRegistry={markerRegistry}
          />
          <SyncExplorePopupFromStripHover
            hoveredListingId={hoveredListingId}
            selectedId={selectedId}
            markerRegistry={markerRegistry}
          />
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
          {/*
           * spiderfyOnMaxZoom + disableClusteringAtZoom: both tweak `this._maxZoom` (~15 vs map maxZoom).
           * With spiderfy ON, most cluster clicks spiderfy instead of zoomToBounds — feels like “lost auto-zoom”.
           * Prefer zoom-first; overlap at identical coords resolves once zoomed toward disableClusteringAtZoom pins.
           */}
          <MarkerClusterGroup
            chunkedLoading
            chunkDelay={48}
            spiderfyOnMaxZoom={false}
            zoomToBoundsOnClick
            showCoverageOnHover={false}
            maxClusterRadius={RENTARA_CLUSTER_MAX_RADIUS_PX}
            disableClusteringAtZoom={RENTARA_CLUSTER_DISABLE_AT_MAP_ZOOM}
            animate
            animateAddingMarkers
            iconCreateFunction={createRentaraDensityClusterIcon}
          >
            {listings.map((listing) => (
              <VehicleMarker
                key={listing.id}
                listing={listing}
                restingZIndex={
                  selectedId === listing.id ? 1100 : hoveredListingId === listing.id ? 650 : 0
                }
                icon={
                  icons.get(listing.id) ??
                  (markerStyle === 'price'
                    ? getExploreMapPriceBadgeIcon(
                        listing.vehicle.pricePerDay,
                        selectedId === listing.id,
                        isTwoWheeler(listing.vehicle) ? 'two_wheeler' : 'car',
                        hoveredListingId === listing.id,
                      )
                    : getRentaraVehiclePinIcon(listing.vehicle.vehicleType, selectedId === listing.id))
                }
                onSelect={onSelect}
                markerRegistry={markerRegistry}
              >
                <Popup
                  closeOnClick={false}
                  className={
                    hoveredListingId === listing.id
                      ? 'rentara-explore-popup rentara-explore-popup-hover-front'
                      : 'rentara-explore-popup'
                  }
                  offset={[0, compactVehiclePopup ? 4 : 8]}
                  autoPan
                  keepInView={false}
                  autoPanPaddingTopLeft={[20, 72]}
                  autoPanPaddingBottomRight={compactVehiclePopup ? [28, 120] : [28, 160]}
                  minWidth={compactVehiclePopup ? 272 : 216}
                  maxWidth={compactVehiclePopup ? 312 : 268}
                >
                  <MapVehicleLeafletPopupContent
                    listing={listing}
                    listings={listings}
                    compactVehiclePopup={compactVehiclePopup}
                    onViewDetails={onViewDetails}
                    onShowInListing={onShowInListing}
                    onNearbyNavigate={onNearbyNavigate}
                  />
                </Popup>
              </VehicleMarker>
            ))}
          </MarkerClusterGroup>
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
