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

import MapAttributionNote from '../map/MapAttributionNote'
import { PHILIPPINES_MAP_MIN_ZOOM, PHILIPPINES_MAX_BOUNDS_CORNERS } from '../../constants/geo'
import { RENTARA_MAP_PRIMARY, RENTARA_MAP_TILE_URL } from '../../constants/rentaraMapStyle'
import type { ExploreMapListing } from '../../utils/exploreMapListings'
import { listingsSortedByDistanceFrom } from '../../utils/exploreMapListings'
import type { LatLng } from '../../utils/distance'
import { formatPeso } from '../../utils/formatCurrency'
import { ensureLeafletDefaultIcons } from '../../utils/leafletDefaultIcon'
import { getRentaraVehiclePinIcon } from '../../utils/mapVehiclePinIcon'

const MANILA_CENTER: L.LatLngTuple = [14.5995, 120.9842]
const PRIMARY = RENTARA_MAP_PRIMARY
const PH_BOUNDS = L.latLngBounds(PHILIPPINES_MAX_BOUNDS_CORNERS)

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
}

/**
 * Fits all listing pins (and optional user point) in view.
 * Uses center + zoom from getBoundsZoom instead of fitBounds/flyToBounds so padding cannot
 * request a view outside maxBounds (avoids panInsideMaxBounds recursion with viscosity 1).
 *
 * Omits {@link userLocation} from the bounds when it falls outside the Philippines — otherwise
 * a shared location from abroad (VPN / dev / travel) zooms the map out to “all of SE Asia”.
 */
function MapBoundsController({
  listings,
  userLocation,
}: {
  listings: ExploreMapListing[]
  userLocation: LatLng | null
}) {
  const map = useMap()
  useEffect(() => {
    if (!listings.length) {
      map.setView(MANILA_CENTER, 11, { animate: false })
      return
    }
    const pts: L.LatLngTuple[] = listings.map((l) => [l.latitude, l.longitude])
    const userInPh = isUserInsidePhilippines(userLocation)
    if (userInPh && userLocation) {
      pts.push([userLocation.lat, userLocation.lng])
    }
    const b = L.latLngBounds(pts)
    const center = b.getCenter()
    const maxZ = userInPh ? 12 : 11
    const pad = L.point(52, 52)
    const z = Math.min(maxZ, map.getBoundsZoom(b, false, pad))
    map.setView(center, z, { animate: false })
  }, [map, listings, userLocation])
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
      Show in listing below
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
    const center = L.latLng(hit.latitude, hit.longitude)
    if (!PH_BOUNDS.contains(center)) return
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
  return (
    <Marker
      ref={markerRef}
      position={[listing.latitude, listing.longitude]}
      icon={icon}
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
}: ExploreRentalsMapInnerProps) {
  const markerRegistry = useRef<Map<string, L.Marker>>(new Map())

  useEffect(() => {
    ensureLeafletDefaultIcons()
  }, [])

  const icons = useMemo(() => {
    const m = new Map<string, L.DivIcon>()
    for (const l of listings) {
      m.set(l.id, getRentaraVehiclePinIcon(l.vehicle.vehicleType, selectedId === l.id))
    }
    return m
  }, [listings, selectedId])

  return (
    <Stack direction="column" sx={{ height: '100%', minHeight: 0 }} spacing={0}>
      <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <MapContainer
          center={MANILA_CENTER}
          zoom={11}
          minZoom={PHILIPPINES_MAP_MIN_ZOOM}
          maxZoom={19}
          maxBounds={PH_BOUNDS}
          maxBoundsViscosity={1}
          scrollWheelZoom={scrollWheelZoom}
          zoomControl={false}
          attributionControl={false}
          className="rentara-leaflet-surface"
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <TileLayer attribution="" url={RENTARA_MAP_TILE_URL} maxZoom={19} maxNativeZoom={18} />
          <ZoomControl position="topright" />
          <MapBoundsController listings={listings} userLocation={userLocation} />
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
          {listings.map((listing) => (
            <VehicleMarker
              key={listing.id}
              listing={listing}
              icon={icons.get(listing.id) ?? getRentaraVehiclePinIcon(listing.vehicle.vehicleType, false)}
              onSelect={onSelect}
              markerRegistry={markerRegistry}
            >
              <Popup
                className="rentara-explore-popup"
                offset={[0, 8]}
                autoPan
                keepInView={false}
                autoPanPaddingTopLeft={[20, 72]}
                autoPanPaddingBottomRight={[28, 140]}
                minWidth={216}
                maxWidth={268}
              >
                <Box sx={{ width: '100%', maxWidth: 252, py: 0.25, px: 0.35, boxSizing: 'border-box' }}>
                  <Box
                    component="img"
                    src={listing.vehicle.thumbnailUrl}
                    alt=""
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
          <OpenListingPopupOnMapFocus
            selectedId={selectedId}
            mapFocusNonce={mapFocusNonce}
            markerRegistry={markerRegistry}
          />
        </MapContainer>
      </Box>
      <MapAttributionNote />
    </Stack>
  )
}
