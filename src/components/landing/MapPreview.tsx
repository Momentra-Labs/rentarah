import { Box, Button, Container, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { lazy, Suspense, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

import ExploreMapErrorBoundary from '../map/ExploreMapErrorBoundary'
import ExploreMapFallbackList from '../map/ExploreMapFallbackList'
import { useNearViewport } from '../../hooks/useNearViewport'
import { useGeolocationStore } from '../../store/useGeolocationStore'
import type { Car } from '../../types'
import {
  carsToExploreListings,
  filterExploreListings,
  sampleListingsForPreview,
} from '../../utils/exploreMapListings'

const ExploreRentalsMapLazy = lazy(() => import('./ExploreRentalsMapInner'))

export type MapPreviewProps = {
  cars: Car[]
}

const PREVIEW_HEIGHT = { xs: 260, sm: 320, md: 380 }
/** Cap markers so Leaflet stays smooth on large mock catalogs. */
const PREVIEW_MARKER_CAP = 72
const PREVIEW_FALLBACK_CAP = 36

/**
 * Above-the-fold map teaser on the landing page: partial height, markers, overlay CTA to full `/map`.
 * Map chunk + Leaflet mount only when the section is near the viewport; markers are sampled for performance.
 */
export default function MapPreview({ cars }: MapPreviewProps) {
  const navigate = useNavigate()
  const userLocation = useGeolocationStore((s) => s.userLocation)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { ref: sectionRef, ready: mapMountReady } = useNearViewport('200px 0px')

  const listingsAll = useMemo(() => {
    const all = carsToExploreListings(cars)
    return filterExploreListings(all, 'all', userLocation)
  }, [cars, userLocation])

  const listingsForMap = useMemo(
    () => sampleListingsForPreview(listingsAll, PREVIEW_MARKER_CAP),
    [listingsAll],
  )

  const listingsForFallback = useMemo(
    () => sampleListingsForPreview(listingsAll, PREVIEW_FALLBACK_CAP),
    [listingsAll],
  )

  const fallback = (
    <ExploreMapFallbackList
      listings={listingsForFallback}
      onNavigate={(id) => navigate(`/cars/${id}`)}
      maxHeight={380}
    />
  )

  const suspenseFallback = (
    <Box
      sx={{
        height: PREVIEW_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.100',
        borderRadius: { xs: 0, sm: 1 },
      }}
    >
      <Stack alignItems="center" spacing={1}>
        <Skeleton variant="rounded" width={160} height={22} />
        <Typography variant="caption" color="text.secondary">
          Loading map…
        </Typography>
      </Stack>
    </Box>
  )

  const overlayAndCtas = (
    <>
      <Box
        sx={{
          pointerEvents: 'none',
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, transparent 0%, ${alpha('#dfe8d8', 0.28)} 40%, ${alpha('#fff', 0.97)} 100%)`,
          zIndex: 400,
        }}
      />
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{
          pointerEvents: 'auto',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          p: { xs: 2, sm: 2.5 },
          zIndex: 500,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{ letterSpacing: '-0.02em', color: '#111827', fontSize: { xs: '1rem', sm: '1.25rem' } }}
          >
            See rentals near you
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25, maxWidth: 480, fontSize: { xs: '0.8rem', sm: '0.875rem' }, lineHeight: 1.45 }}>
            Tap pins for prices and pickup areas — full map with filters opens in one tap.
          </Typography>
        </Box>
        <Button
          component={RouterLink}
          to="/map"
          variant="contained"
          size="large"
          sx={{
            flexShrink: 0,
            width: { xs: '100%', sm: 'auto' },
            minHeight: { xs: 48, sm: 42 },
            bgcolor: '#1A56DB',
            '&:hover': { bgcolor: '#1647b8' },
            borderRadius: { xs: 2.5, sm: 2 },
            py: { xs: 1.15, sm: 1.1 },
            px: 2.5,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: { xs: '0.9rem', sm: '0.9375rem' },
            boxShadow: `0 4px 16px ${alpha('#1A56DB', 0.35)}`,
          }}
        >
          Open full map
        </Button>
      </Stack>
    </>
  )

  return (
    <Box
      ref={sectionRef}
      id="explore-map-preview"
      data-onboarding="map"
      component="section"
      aria-label="Map preview of rental locations"
      sx={{
        pt: { xs: 0.5, md: 2 },
        pb: { xs: 4, md: 6 },
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 0, sm: 3 } }}>
        <Paper
          elevation={0}
          sx={{
            position: 'relative',
            borderRadius: { xs: 0, sm: 3 },
            overflow: 'hidden',
            border: { xs: 'none', sm: '1px solid' },
            borderColor: 'divider',
            mx: { xs: 0, sm: 0 },
            boxShadow: {
              xs: 'none',
              sm: `0 10px 40px ${alpha('#000', 0.07)}, 0 2px 10px ${alpha('#000', 0.04)}`,
            },
          }}
        >
          {cars.length === 0 ? (
            <Skeleton variant="rounded" sx={{ height: PREVIEW_HEIGHT, borderRadius: 0 }} />
          ) : !mapMountReady ? (
            <Box
              sx={{
                height: PREVIEW_HEIGHT,
                position: 'relative',
                bgcolor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Skeleton variant="rounded" width="70%" height={12} sx={{ maxWidth: 280, opacity: 0.5 }} />
              {overlayAndCtas}
            </Box>
          ) : (
            <ExploreMapErrorBoundary fallback={fallback}>
              <Suspense fallback={suspenseFallback}>
                <Box sx={{ height: PREVIEW_HEIGHT, position: 'relative' }}>
                  <ExploreRentalsMapLazy
                    listings={listingsForMap}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    userLocation={userLocation}
                    onViewDetails={(l) => navigate(`/cars/${l.id}`)}
                    scrollWheelZoom={false}
                    enableFlyTo={false}
                    markerStyle="vehicle"
                    enableClustering={false}
                  />
                  {overlayAndCtas}
                </Box>
              </Suspense>
            </ExploreMapErrorBoundary>
          )}
        </Paper>
      </Container>
    </Box>
  )
}
