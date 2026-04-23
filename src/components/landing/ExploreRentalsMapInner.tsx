import { Box, Button, Typography } from '@mui/material'
import L from 'leaflet'
import { useEffect, useMemo } from 'react'
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'

import type { ExploreMapListing } from '../../utils/exploreMapListings'
import type { LatLng } from '../../utils/distance'
import { formatPeso } from '../../utils/formatCurrency'
import { ensureLeafletDefaultIcons } from '../../utils/leafletDefaultIcon'

const MANILA_CENTER: L.LatLngTuple = [14.5995, 120.9842]
const PRIMARY = '#1A56DB'

export type ExploreRentalsMapInnerProps = {
  listings: ExploreMapListing[]
  selectedId: string | null
  onSelect: (id: string) => void
  userLocation: LatLng | null
  onViewDetails: (listing: ExploreMapListing) => void
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

function rentaraPinIcon(selected: boolean): L.DivIcon {
  const ring = selected ? `0 0 0 3px #fff, 0 0 0 5px ${PRIMARY}` : '0 2px 8px rgba(0,0,0,0.2)'
  return L.divIcon({
    className: 'rentara-explore-pin',
    html: `<div style="width:26px;height:26px;border-radius:50%;background:${PRIMARY};border:3px solid #fff;box-shadow:${ring};transform:translate(-1px,-1px)"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -12],
  })
}

/**
 * Leaflet map: OSM tiles, Rentara-styled pins, popups with vehicle summary.
 * Lazy-loaded by map surfaces (`MapPreview`, `/map`) to defer Leaflet until needed.
 */
export default function ExploreRentalsMapInner({
  listings,
  selectedId,
  onSelect,
  userLocation,
  onViewDetails,
  scrollWheelZoom = true,
  enableFlyTo = true,
}: ExploreRentalsMapInnerProps) {
  useEffect(() => {
    ensureLeafletDefaultIcons()
  }, [])

  const icons = useMemo(() => {
    const m = new Map<string, L.DivIcon>()
    for (const l of listings) {
      m.set(l.id, rentaraPinIcon(selectedId === l.id))
    }
    return m
  }, [listings, selectedId])

  return (
    <MapContainer
      center={MANILA_CENTER}
      zoom={11}
      scrollWheelZoom={scrollWheelZoom}
      style={{ height: '100%', width: '100%', zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
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
        <Marker
          key={listing.id}
          position={[listing.latitude, listing.longitude]}
          icon={icons.get(listing.id) ?? rentaraPinIcon(false)}
          eventHandlers={{
            click: () => onSelect(listing.id),
          }}
        >
          <Popup className="rentara-explore-popup">
            <Box sx={{ minWidth: { xs: 200, sm: 220 }, p: 0.5 }}>
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
              <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.3 }}>
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
              <Button
                fullWidth
                size="small"
                variant="contained"
                sx={{ mt: 1.25, bgcolor: PRIMARY, '&:hover': { bgcolor: '#1647b8' }, borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                onClick={() => onViewDetails(listing)}
              >
                View details
              </Button>
            </Box>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
