import { Box, Container, Grid } from '@mui/material'

import { MOBILE_BOTTOM_NAV_SX_PB } from '@/components/layout/MobileBottomNav'
import { containerGutters } from '@/theme/pageStyles'

import {
  DashboardTabsSkeleton,
  MediaRowSkeleton,
  NextStepStripSkeleton,
  PageHeaderSkeleton,
} from './skeletonPieces'

/** Host dashboard chrome while the route chunk or catalog is loading. */
export default function HostDashboardPageSkeleton() {
  return (
    <Box
      sx={{ bgcolor: 'background.default', minHeight: '100vh' }}
      aria-busy="true"
      aria-label="Loading host dashboard"
    >
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, pb: { xs: MOBILE_BOTTOM_NAV_SX_PB, md: 10 }, ...containerGutters }}>
        <PageHeaderSkeleton />
        <NextStepStripSkeleton />
        <DashboardTabsSkeleton count={4} />
        <Grid container spacing={{ xs: 2.5, md: 3 }}>
          <Grid item xs={12} md={6}>
            <MediaRowSkeleton imageWidth={168} imageHeight={120} actions={2} />
          </Grid>
          <Grid item xs={12} md={6}>
            <MediaRowSkeleton imageWidth={168} imageHeight={120} actions={2} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
