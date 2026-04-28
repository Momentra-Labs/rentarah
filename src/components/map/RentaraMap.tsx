import MyLocation from '@mui/icons-material/MyLocation'
import Place from '@mui/icons-material/Place'
import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import L from 'leaflet'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, ZoomControl } from 'react-leaflet'

import { PHILIPPINES_MAP_MIN_ZOOM, PHILIPPINES_MAX_BOUNDS_CORNERS } from '../../constants/geo'
import { RENTARA_MAP_TILE_URL } from '../../constants/rentaraMapStyle'
import { getHostPickupMapIcon, getRenterUserLocationMapIcon } from '../../utils/pickupRouteMapIcons'
import { useGeolocationStore } from '../../store/useGeolocationStore'
import { haversineKm, type LatLng } from '../../utils/distance'
import { ensureLeafletDefaultIcons } from '../../utils/leafletDefaultIcon'
import { fetchOsrmDrivingRoute } from '../../utils/osrmRoute'

const MANILA_CENTER: L.LatLngTuple = [14.5995, 120.9842]
const PH_BOUNDS = L.latLngBounds(PHILIPPINES_MAX_BOUNDS_CORNERS)

export type HostLocation = LatLng

export type RentaraMapProps = {
  hostLocation: HostLocation
}

function FitBounds({ positions }: { positions: L.LatLngTuple[] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length < 2) return
    const b = L.latLngBounds(positions)
    map.fitBounds(b, { padding: [56, 56], maxZoom: 16 })
  }, [map, positions])
  return null
}

function FitPickupOnly({ host }: { host: L.LatLngTuple }) {
  const map = useMap()
  const lat = host[0]
  const lng = host[1]
  useEffect(() => {
    map.setView([lat, lng], 14, { animate: false })
  }, [map, lat, lng])
  return null
}

function MapMarkerPopup({ title, body, icon }: { title: string; body: string; icon: ReactNode }) {
  return (
    <Box sx={{ minWidth: { xs: 220, sm: 270 }, py: 0.25, pr: 0.25 }}>
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <Box sx={{ flexShrink: 0, pt: 0.2, display: 'flex' }}>{icon}</Box>
        <Box>
          <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight: 1.3, color: 'text.primary' }}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75, lineHeight: 1.5 }}>
            {body}
          </Typography>
        </Box>
      </Stack>
    </Box>
  )
}

function openDirections(host: HostLocation, user: LatLng | null) {
  const dest = `${host.lat},${host.lng}`
  const url = user
    ? `https://www.google.com/maps/dir/${user.lat},${user.lng}/${dest}`
    : `https://www.google.com/maps/dir/?api=1&destination=${dest}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

export default function RentaraMap({ hostLocation }: RentaraMapProps) {
  const [mounted, setMounted] = useState(false)
  const userPos = useGeolocationStore((s) => s.userLocation)
  const geoStatus = useGeolocationStore((s) => s.status)
  /** Road-following polyline (OSRM); if routing fails, two-point straight fallback. */
  const [drivingLine, setDrivingLine] = useState<L.LatLngTuple[] | null>(null)
  const [driveKm, setDriveKm] = useState<number | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    ensureLeafletDefaultIcons()
  }, [])

  useEffect(() => {
    if (!userPos) {
      setDrivingLine(null)
      setDriveKm(null)
      setRouteLoading(false)
      return
    }
    const straight: L.LatLngTuple[] = [
      [userPos.lat, userPos.lng],
      [hostLocation.lat, hostLocation.lng],
    ]
    const ac = new AbortController()
    setRouteLoading(true)
    setDrivingLine(null)
    setDriveKm(null)
    ;(async () => {
      try {
        const route = await fetchOsrmDrivingRoute(userPos, hostLocation, ac.signal)
        if (ac.signal.aborted) return
        if (route) {
          setDrivingLine(route.positions)
          setDriveKm(route.distanceKm)
        } else {
          setDrivingLine(straight)
          setDriveKm(null)
        }
      } catch {
        if (ac.signal.aborted) return
        setDrivingLine(straight)
        setDriveKm(null)
      } finally {
        if (!ac.signal.aborted) setRouteLoading(false)
      }
    })()
    return () => ac.abort()
  }, [userPos, hostLocation])

  const hostTuple: L.LatLngTuple = [hostLocation.lat, hostLocation.lng]

  const fitPositions = useMemo((): L.LatLngTuple[] | null => {
    if (!userPos) return null
    return [
      [hostLocation.lat, hostLocation.lng],
      [userPos.lat, userPos.lng],
    ]
  }, [hostLocation.lat, hostLocation.lng, userPos])

  const boundsPositions = useMemo((): L.LatLngTuple[] | null => {
    if (!userPos || !fitPositions) return null
    if (drivingLine && drivingLine.length >= 2) return drivingLine
    return fitPositions
  }, [userPos, fitPositions, drivingLine])

  const crowKm = userPos ? haversineKm(userPos, hostLocation) : null

  const distanceLabel = (() => {
    if (!userPos) {
      if (geoStatus === 'denied') {
        return 'Location blocked — allow access in the browser, or use the pin icon in the header to try again.'
      }
      if (geoStatus === 'unsupported') {
        return 'This browser cannot share location.'
      }
      if (geoStatus === 'pending') {
        return 'Getting your position…'
      }
      return 'Use the location pin in the header so we can show you on the map and draw a route to pickup.'
    }
    if (routeLoading) return 'Calculating driving route from your position to the pickup point…'
    if (driveKm != null) return `About ${driveKm} km by road from you to the pickup point`
    if (crowKm != null) return `~${crowKm} km straight-line · Road route could not be loaded`
    return ''
  })()

  if (!mounted) {
    return (
      <Box
        sx={{
          width: '100%',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ height: { xs: 300, sm: 360 }, bgcolor: '#eef4f0' }} />
        <Box sx={{ height: 64, borderTop: 1, borderColor: 'divider', bgcolor: '#f5f8f6' }} />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        width: '100%',
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        '& .leaflet-container': { fontFamily: 'inherit' },
      }}
    >
      <Box
        sx={{
          height: { xs: 300, sm: 360 },
          position: 'relative',
          minHeight: 0,
        }}
      >
        <MapContainer
          center={MANILA_CENTER}
          zoom={12}
          minZoom={PHILIPPINES_MAP_MIN_ZOOM}
          maxBounds={PH_BOUNDS}
          maxBoundsViscosity={1}
          scrollWheelZoom
          zoomControl={false}
          attributionControl={false}
          className="rentara-leaflet-surface"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer attribution="" url={RENTARA_MAP_TILE_URL} />
          <ZoomControl position="topright" />
          {boundsPositions && <FitBounds positions={boundsPositions} />}
          {!userPos && <FitPickupOnly host={hostTuple} />}
          {userPos && drivingLine && drivingLine.length >= 2 && (
            <Polyline
              positions={drivingLine}
              pathOptions={{
                color: '#1A56DB',
                weight: 5,
                opacity: driveKm != null ? 0.88 : 0.55,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          )}
          <Marker position={hostTuple} icon={getHostPickupMapIcon()} zIndexOffset={1000}>
            <Popup className="rentara-map-popup">
              <MapMarkerPopup
                title="Vehicle pickup (host)"
                body="This is where you meet the host and pick up the vehicle. Use Get directions to open your maps app."
                icon={<Place sx={{ color: 'warning.main', fontSize: 22 }} />}
              />
            </Popup>
          </Marker>
          {userPos && (
            <Marker position={[userPos.lat, userPos.lng]} icon={getRenterUserLocationMapIcon()} zIndexOffset={100}>
              <Popup className="rentara-map-popup">
                <MapMarkerPopup
                  title="Your location (renter)"
                  body="This dot is you — we use it to show distance and a driving line to the pickup point."
                  icon={<MyLocation sx={{ color: 'primary.main', fontSize: 22 }} />}
                />
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </Box>
      <Paper
        elevation={0}
        square
        sx={{
          p: 1.5,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.25}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          useFlexGap
        >
          <Stack direction="row" flexWrap="wrap" alignItems="center" useFlexGap gap={1.25} sx={{ flexShrink: 0 }}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: 'linear-gradient(160deg, #1e88e5 0%, #0d47a0 100%)',
                  border: '1px solid',
                  borderColor: 'common.white',
                  boxShadow: 1,
                }}
              />
              <Typography variant="caption" fontWeight={800}>
                You
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.disabled" component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              |
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: 1,
                  flexShrink: 0,
                  bgcolor: '#e65100',
                  boxShadow: 1,
                }}
              />
              <Typography variant="caption" fontWeight={800}>
                Pickup
              </Typography>
            </Stack>
          </Stack>
          {distanceLabel ? (
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1, minWidth: 0, lineHeight: 1.5 }}>
              {distanceLabel}
            </Typography>
          ) : null}
          <Button
            variant="contained"
            size="small"
            onClick={() => openDirections(hostLocation, userPos)}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 1.5,
              px: 2,
              flexShrink: 0,
              alignSelf: { xs: 'stretch', sm: 'center' },
            }}
          >
            Get directions
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
