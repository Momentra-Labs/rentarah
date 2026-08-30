import { Box, Paper, Skeleton, Stack, useMediaQuery, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { MAP_PAGE_FLOAT_CLEAR_BOTTOM } from '@/components/layout/MobileBottomNav'

const PEEK_RESERVE_PX = 102

function ListingRowSkeleton() {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ py: 0.75 }}>
      <Skeleton variant="rounded" animation="wave" width={72} height={56} sx={{ borderRadius: 2, flexShrink: 0 }} />
      <Stack flex={1} minWidth={0} spacing={0.5}>
        <Skeleton variant="text" animation="wave" width="72%" height={20} />
        <Skeleton variant="text" animation="wave" width="48%" height={16} />
      </Stack>
      <Skeleton variant="text" animation="wave" width={52} height={22} />
    </Stack>
  )
}

/** Tile-like map pane used by the full page skeleton and the Leaflet Suspense fallback. */
export function MapSurfaceSkeleton() {
  const theme = useTheme()
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: { xs: 280, md: 320 },
        overflow: 'hidden',
        background: `linear-gradient(165deg, ${alpha(theme.palette.primary.main, 0.07)} 0%, ${theme.palette.grey[100]} 42%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
      }}
      aria-busy="true"
      aria-label="Loading map"
    >
      <Skeleton
        variant="rectangular"
        animation="wave"
        sx={{ position: 'absolute', inset: 0, bgcolor: 'transparent' }}
      />
      {[
        { top: '28%', left: '38%' },
        { top: '46%', left: '58%' },
        { top: '52%', left: '24%' },
        { top: '36%', left: '72%' },
      ].map((pos, i) => (
        <Skeleton
          key={i}
          variant="circular"
          animation="wave"
          width={i === 1 ? 36 : 22}
          height={i === 1 ? 36 : 22}
          sx={{
            position: 'absolute',
            top: pos.top,
            left: pos.left,
            bgcolor: alpha(theme.palette.primary.main, 0.22),
          }}
        />
      ))}
    </Box>
  )
}

/** Full /map chrome while the route chunk or catalog is loading. */
export default function MapPageSkeleton() {
  const theme = useTheme()
  const isCompact = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true })

  if (isCompact) {
    return (
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          bgcolor: 'background.default',
        }}
        aria-busy="true"
        aria-label="Loading map"
      >
        <Box sx={{ flex: 1, minHeight: 'min(70dvh, 560px)', position: 'relative' }}>
          <MapSurfaceSkeleton />
          <Stack
            spacing={1.25}
            sx={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 2 }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Skeleton variant="rounded" animation="wave" height={48} sx={{ flex: 1, borderRadius: 2 }} />
              <Skeleton variant="circular" animation="wave" width={48} height={48} />
            </Stack>
            <Stack direction="row" spacing={1}>
              {[0, 1, 2].map((i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  animation="wave"
                  width={i === 0 ? 56 : 88}
                  height={36}
                  sx={{ borderRadius: 999 }}
                />
              ))}
            </Stack>
          </Stack>
          <Paper
            elevation={8}
            sx={{
              position: 'absolute',
              left: 12,
              right: 12,
              bottom: `calc(${MAP_PAGE_FLOAT_CLEAR_BOTTOM} + 8px)`,
              zIndex: 2,
              p: 1.25,
              borderRadius: 3,
              minHeight: PEEK_RESERVE_PX - 16,
            }}
          >
            <ListingRowSkeleton />
          </Paper>
        </Box>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        height: '100%',
        maxHeight: 'min(100%, calc(100dvh - 64px - env(safe-area-inset-bottom, 0px)))',
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        bgcolor: 'var(--rh-primary-light, #eff6ff)',
      }}
      aria-busy="true"
      aria-label="Loading map"
    >
      <Box
        sx={{
          flexShrink: 0,
          width: 'min(420px, max(360px, 30vw))',
          minWidth: 360,
          maxWidth: 440,
          height: '100%',
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          px: 3,
          pt: 2,
          pb: 2.5,
          overflow: 'hidden',
        }}
      >
        <Skeleton variant="rounded" animation="wave" height={48} sx={{ borderRadius: 2 }} />
        <Stack direction="row" spacing={1} sx={{ mt: 1.75 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" animation="wave" width={72} height={36} sx={{ borderRadius: 999 }} />
          ))}
        </Stack>
        <Skeleton variant="text" animation="wave" width={88} height={18} sx={{ mt: 3 }} />
        <Skeleton variant="text" animation="wave" width="70%" height={32} />
        <Skeleton variant="text" animation="wave" width="92%" height={18} />
        <Skeleton variant="rounded" animation="wave" height={28} sx={{ mt: 2, mx: 1.5, borderRadius: 999 }} />
        <Skeleton variant="text" animation="wave" width={140} height={22} sx={{ mt: 2.5, mb: 1 }} />
        <Stack spacing={0.5}>
          <ListingRowSkeleton />
          <ListingRowSkeleton />
          <ListingRowSkeleton />
          <ListingRowSkeleton />
        </Stack>
      </Box>
      <Box sx={{ flex: '1 1 0px', minWidth: 0, minHeight: 0, height: '100%' }}>
        <MapSurfaceSkeleton />
      </Box>
    </Box>
  )
}
