import { Box, Container, Skeleton, Stack, useMediaQuery, useTheme } from '@mui/material'

import { containerGutters } from '@/theme/pageStyles'

import { NotificationRowSkeleton, PageHeaderSkeleton } from './skeletonPieces'

/** Notifications chrome while the route chunk is loading. */
export default function NotificationsPageSkeleton() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

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
        {isMobile ? (
          <Skeleton variant="text" animation="wave" width="70%" height={20} sx={{ mb: 2 }} />
        ) : (
          <PageHeaderSkeleton />
        )}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Skeleton variant="rounded" animation="wave" width={64} height={32} sx={{ borderRadius: 999 }} />
          <Skeleton variant="rounded" animation="wave" width={72} height={32} sx={{ borderRadius: 999 }} />
          <Skeleton variant="rounded" animation="wave" width={88} height={32} sx={{ borderRadius: 999 }} />
        </Stack>
        <Stack spacing={1.5}>
          <NotificationRowSkeleton />
          <NotificationRowSkeleton />
          <NotificationRowSkeleton />
          <NotificationRowSkeleton />
        </Stack>
      </Container>
    </Box>
  )
}
