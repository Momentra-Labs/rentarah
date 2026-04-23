import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import L from 'leaflet'
import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'

import { useGeolocationStore } from '../../store/useGeolocationStore'
import { haversineKm, type LatLng } from '../../utils/distance'
import { ensureLeafletDefaultIcons } from '../../utils/leafletDefaultIcon'
import { fetchOsrmDrivingRoute } from '../../utils/osrmRoute'

const MANILA_CENTER: L.LatLngTuple = [14.5995, 120.9842]

export type HostLocation = LatLng

export type RentaraMapProps = {
  hostLocation: HostLocation
}

function FitBounds({ positions }: { positions: L.LatLngTuple[] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length < 2) return
    const b = L.latLngBounds(positions)
    map.fitBounds(b, { padding: [48, 48], maxZoom: 16 })
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

  const userIcon = useMemo(
    () =>
      L.divIcon({
        className: 'rentara-map-user-marker',
        html: '<div style="width:14px;height:14px;background:#1A56DB;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.25)"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      }),
    [],
  )

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
      return 'Use the pin icon in the header to share your location for distance and driving route.'
    }
    if (routeLoading) return 'Calculating driving route…'
    if (driveKm != null) return `${driveKm} km driving`
    if (crowKm != null) return `${crowKm} km away · Could not load road route`
    return ''
  })()

  if (!mounted) {
    return (
      <Box
        sx={{
          width: '100%',
          height: { xs: 400, sm: 460 },
          borderRadius: 2,
          bgcolor: 'grey.100',
          border: '1px solid',
          borderColor: 'divider',
        }}
      />
    )
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: { xs: 400, sm: 460 },
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        '& .leaflet-container': { fontFamily: 'inherit' },
      }}
    >
      <MapContainer
        center={MANILA_CENTER}
        zoom={12}
        scrollWheelZoom
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {boundsPositions && <FitBounds positions={boundsPositions} />}
        {!userPos && <FitPickupOnly host={hostTuple} />}
        <Marker position={hostTuple}>
          <Popup>Pickup Location</Popup>
        </Marker>
        {userPos && (
          <Marker position={[userPos.lat, userPos.lng]} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}
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
      </MapContainer>

      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 12,
          zIndex: 1000,
          p: 2,
          borderRadius: 2,
          bgcolor: '#FFFFFF',
          color: '#111827',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#111827' }}>
              Pickup Location
            </Typography>
            <Typography variant="body2" sx={{ color: '#111827', opacity: 0.85, mt: 0.25 }}>
              {distanceLabel}
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="medium"
            onClick={() => openDirections(hostLocation, userPos)}
            sx={{
              flexShrink: 0,
              bgcolor: '#1A56DB',
              '&:hover': { bgcolor: '#1647b8' },
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Get Directions
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
