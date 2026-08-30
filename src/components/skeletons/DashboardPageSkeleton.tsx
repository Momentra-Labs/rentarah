import { Box, Container, Stack } from '@mui/material'

import { containerGutters } from '@/theme/pageStyles'

import {
  DashboardTabsSkeleton,
  MediaRowSkeleton,
  NextStepStripSkeleton,
  PageHeaderSkeleton,
} from './skeletonPieces'

/** Renter dashboard chrome while the route chunk or catalog is loading. */
export default function DashboardPageSkeleton() {
  return (
    <Box
      sx={{ bgcolor: 'background.default', minHeight: '100vh' }}
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, pb: { xs: 12, md: 10 }, ...containerGutters }}>
        <PageHeaderSkeleton />
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
