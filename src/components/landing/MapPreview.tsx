import { Box, Button, Container, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { lazy, Suspense, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

import ExploreMapErrorBoundary from '../map/ExploreMapErrorBoundary'
import ExploreMapFallbackList from '../map/ExploreMapFallbackList'
import { useGeolocationStore } from '../../store/useGeolocationStore'
import type { Car } from '../../types'
import { carsToExploreListings, filterExploreListings } from '../../utils/exploreMapListings'

const ExploreRentalsMapLazy = lazy(() => import('./ExploreRentalsMapInner'))

export type MapPreviewProps = {
  cars: Car[]
}

const PREVIEW_HEIGHT = { xs: 300, sm: 340, md: 380 }

/**
 * Above-the-fold map teaser on the landing page: partial height, markers, overlay CTA to full `/map`.
 */
export default function MapPreview({ cars }: MapPreviewProps) {
  const navigate = useNavigate()
  const userLocation = useGeolocationStore((s) => s.userLocation)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const listings = useMemo(() => {
    const all = carsToExploreListings(cars)
    return filterExploreListings(all, 'all', userLocation)
  }, [cars, userLocation])

  const fallback = (
    <ExploreMapFallbackList
      listings={listings}
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

  return (
    <Box
      id="explore-map-preview"
      component="section"
      aria-label="Map preview of rental locations"
      sx={{
        pt: { xs: 1, md: 2 },
        pb: { xs: 5, md: 6 },
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Paper
          elevation={0}
          sx={{
            position: 'relative',
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: `0 10px 40px ${alpha('#000', 0.07)}, 0 2px 10px ${alpha('#000', 0.04)}`,
          }}
        >
          {cars.length === 0 ? (
            <Skeleton variant="rounded" sx={{ height: PREVIEW_HEIGHT, borderRadius: 0 }} />
          ) : (
            <ExploreMapErrorBoundary fallback={fallback}>
              <Suspense fallback={suspenseFallback}>
                <Box sx={{ height: PREVIEW_HEIGHT, position: 'relative' }}>
                  <ExploreRentalsMapLazy
                    listings={listings}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    userLocation={userLocation}
                    onViewDetails={(l) => navigate(`/cars/${l.id}`)}
                    scrollWheelZoom={false}
                    enableFlyTo={false}
                  />
                  {/* Readability overlay + CTAs */}
                  <Box
                    sx={{
                      pointerEvents: 'none',
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(180deg, ${alpha('#fff', 0)} 0%, ${alpha('#fff', 0.08)} 45%, ${alpha('#fff', 0.92)} 100%)`,
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
                      <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: '#111827' }}>
                        See rentals near you
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25, maxWidth: 480 }}>
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
                        bgcolor: '#1A56DB',
                        '&:hover': { bgcolor: '#1647b8' },
                        borderRadius: 2,
                        py: 1.1,
                        px: 2.5,
                        textTransform: 'none',
                        fontWeight: 700,
                        boxShadow: `0 4px 16px ${alpha('#1A56DB', 0.35)}`,
                      }}
                    >
                      Open full map
                    </Button>
                  </Stack>
                </Box>
              </Suspense>
            </ExploreMapErrorBoundary>
          )}
        </Paper>
      </Container>
    </Box>
  )
}
