import { Box, Container } from '@mui/material'

import { containerGutters } from '@/theme/pageStyles'

import { DashboardTabsSkeleton, NotificationInboxSkeleton, PageHeaderSkeleton } from './skeletonPieces'

/** Notifications chrome while the route chunk is loading. */
export default function NotificationsPageSkeleton() {
  return (
    <Box
      sx={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        pb: { xs: 'max(20px, env(safe-area-inset-bottom))', md: 4 },
      }}
      aria-busy="true"
      aria-label="Loading notifications"
    >
      <Container maxWidth="md" sx={{ flex: 1, ...containerGutters, pt: { xs: 2, md: 3 } }}>
        <PageHeaderSkeleton withOverline={false} />
        <DashboardTabsSkeleton count={4} />
        <NotificationInboxSkeleton />
      </Container>
    </Box>
  )
}
