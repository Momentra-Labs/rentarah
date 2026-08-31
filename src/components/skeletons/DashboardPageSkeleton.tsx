import { Box, Container, Skeleton, Stack } from '@mui/material'

import { MOBILE_BOTTOM_NAV_SX_PB } from '@/components/layout/MobileBottomNav'
import { containerGutters } from '@/theme/pageStyles'
import { rhRadius } from '@/theme/tokens'

import {
  DashboardTabsSkeleton,
  MediaRowSkeleton,
  NextStepStripSkeleton,
} from './skeletonPieces'

/** Renter dashboard chrome while the route chunk or catalog is loading. */
export default function DashboardPageSkeleton() {
  return (
    <Box
      sx={{ bgcolor: 'background.default', minHeight: '100vh' }}
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, pb: { xs: MOBILE_BOTTOM_NAV_SX_PB, md: 10 }, ...containerGutters }}>
        <Skeleton
          variant="rounded"
          animation="wave"
          height={168}
          sx={{ borderRadius: `${rhRadius.lg}px`, mb: 2.5 }}
        />
        <NextStepStripSkeleton />
        <DashboardTabsSkeleton count={5} />
        <Stack spacing={2.5}>
          <MediaRowSkeleton />
          <MediaRowSkeleton />
        </Stack>
      </Container>
    </Box>
  )
}
