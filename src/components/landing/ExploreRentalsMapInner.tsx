import { Box, Button, Stack, Typography } from '@mui/material'
import L from 'leaflet'
import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from 'react'
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
import { RENTARA_MAP_PRIMARY, RENTARA_MAP_TILE_URL } from '../../constants/rentaraMapStyle'
import type { ExploreMapListing } from '../../utils/exploreMapListings'
import type { LatLng } from '../../utils/distance'
import { formatPeso } from '../../utils/formatCurrency'
import { ensureLeafletDefaultIcons } from '../../utils/leafletDefaultIcon'
import { getRentaraVehiclePinIcon } from '../../utils/mapVehiclePinIcon'

const MANILA_CENTER: L.LatLngTuple = [14.5995, 120.9842]
const PRIMARY = RENTARA_MAP_PRIMARY

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
  /** Embedded previews: disable wheel zoom so the page scrolls; touch/pinch still pans/zooms on mobile. */
  scrollWheelZoom?: boolean
  /** When false, skip fly-to animation (e.g. compact preview). */
  enableFlyTo?: boolean
}

/** Fits all listing pins (and optional user point) inside the viewport. */
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
      map.setView(MANILA_CENTER, 11)
      return
    }
    const pts: L.LatLngTuple[] = listings.map((l) => [l.latitude, l.longitude])
    if (userLocation) pts.push([userLocation.lat, userLocation.lng])
    map.fitBounds(L.latLngBounds(pts), { padding: [52, 52], maxZoom: userLocation ? 12 : 11 })
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
      sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
      onClick={() => {
        map.closePopup()
        onShowInListing(listing)
      }}
    >
      Show in listing below
    </Button>
  )
}

/** Pans to the selected listing when the user picks a card or marker. */
function FlyToSelected({
  selectedId,
  listings,
}: {
  selectedId: string | null
  listings: ExploreMapListing[]
}) {
  const map = useMap()
  useEffect(() => {
    if (!selectedId) return
    const hit = listings.find((l) => l.id === selectedId)
    if (!hit) return
    map.flyTo([hit.latitude, hit.longitude], Math.max(map.getZoom(), 14), { duration: 0.45 })
  }, [map, selectedId, listings])
  return null
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
    map.once('moveend', open)
    const t1 = window.setTimeout(open, 80)
    const t2 = window.setTimeout(open, 560)
    return () => {
      map.off('moveend', open)
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
          scrollWheelZoom={scrollWheelZoom}
          zoomControl={false}
          attributionControl={false}
          className="rentara-leaflet-surface"
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <TileLayer attribution="" url={RENTARA_MAP_TILE_URL} />
          <ZoomControl position="topright" />
          <MapBoundsController listings={listings} userLocation={userLocation} />
          {enableFlyTo ? <FlyToSelected selectedId={selectedId} listings={listings} /> : null}
          {userLocation && (
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
          )}
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
                autoPan
                keepInView
                autoPanPaddingTopLeft={[24, 120]}
                autoPanPaddingBottomRight={[28, 88]}
                minWidth={264}
                maxWidth={320}
              >
                <Box sx={{ width: '100%', maxWidth: 300, p: 0.5, boxSizing: 'border-box' }}>
                  <Box
                    component="img"
                    src={listing.vehicle.thumbnailUrl}
                    alt=""
                    sx={{
                      width: '100%',
                      height: 100,
                      objectFit: 'cover',
                      borderRadius: 1,
                      display: 'block',
                      mb: 1,
                      bgcolor: 'grey.100',
                    }}
                  />
                  <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.3, pr: 2.5 }}>
                    {listing.vehicle.displayName}
                  </Typography>
                  <Typography variant="body2" color="primary" fontWeight={700} sx={{ mt: 0.5 }}>
                    {formatPeso(listing.vehicle.pricePerDay)}
                    <Typography component="span" variant="caption" color="text.secondary" fontWeight={500}>
                      {' '}
                      / day
                    </Typography>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.35 }}>
                    {listing.vehicle.locationName}
                  </Typography>
                  <Stack spacing={1} sx={{ mt: 1.25, width: '100%' }}>
                    <Button
                      fullWidth
                      size="small"
                      variant="contained"
                      sx={{
                        bgcolor: PRIMARY,
                        '&:hover': { bgcolor: '#1647b8' },
                        borderRadius: 1.5,
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                      onClick={() => onViewDetails(listing)}
                    >
                      View details
                    </Button>
                    {onShowInListing ? (
                      <ShowInListingButton listing={listing} onShowInListing={onShowInListing} />
                    ) : null}
                  </Stack>
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
