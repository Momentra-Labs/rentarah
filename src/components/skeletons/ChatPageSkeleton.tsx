import { Box, Container, Paper, Skeleton, Stack, useMediaQuery, useTheme } from '@mui/material'
import { useLocation } from 'react-router-dom'

import { MOBILE_BOTTOM_NAV_SX_PB } from '@/components/layout/MobileBottomNav'
import { containerGutters } from '@/theme/pageStyles'

import { ChatThreadRowSkeleton, PageHeaderSkeleton } from './skeletonPieces'

function ThreadPaneSkeleton() {
  return (
    <Stack spacing={1.5} sx={{ p: 2, flex: 1 }}>
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Skeleton variant="circular" animation="wave" width={36} height={36} />
        <Skeleton variant="rounded" animation="wave" width="46%" height={36} sx={{ borderRadius: 2 }} />
      </Stack>
      <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="flex-end">
        <Skeleton variant="rounded" animation="wave" width="38%" height={36} sx={{ borderRadius: 2 }} />
      </Stack>
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Skeleton variant="circular" animation="wave" width={36} height={36} />
        <Skeleton variant="rounded" animation="wave" width="52%" height={36} sx={{ borderRadius: 2 }} />
      </Stack>
      <Box sx={{ flex: 1 }} />
      <Skeleton variant="rounded" animation="wave" height={48} sx={{ borderRadius: 2 }} />
    </Stack>
  )
}

/** Messages chrome while the route chunk is loading. */
export default function ChatPageSkeleton() {
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))
  const { pathname } = useLocation()
  const threadOpen = pathname.startsWith('/messages/') && pathname !== '/messages/'

  if (!isMdUp) {
    if (threadOpen) {
      return (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
            height: '100%',
            pt: 'env(safe-area-inset-top, 0px)',
          }}
          aria-busy="true"
          aria-label="Loading conversation"
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1, py: 1, borderBottom: 1, borderColor: 'divider' }}>
            <Skeleton variant="circular" animation="wave" width={36} height={36} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" animation="wave" width="40%" height={22} />
              <Skeleton variant="text" animation="wave" width="28%" height={16} />
            </Box>
          </Stack>
          <ThreadPaneSkeleton />
        </Box>
      )
    }

    return (
      <Box
        sx={{ flex: 1, minHeight: 0, bgcolor: 'background.default', height: '100%' }}
        aria-busy="true"
        aria-label="Loading messages"
      >
        <ChatThreadRowSkeleton />
        <ChatThreadRowSkeleton />
        <ChatThreadRowSkeleton />
        <ChatThreadRowSkeleton />
      </Box>
    )
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }} aria-busy="true" aria-label="Loading messages">
      <Container
        maxWidth="lg"
        sx={{ py: { xs: 2, md: 3 }, pb: { xs: MOBILE_BOTTOM_NAV_SX_PB, md: 4 }, ...containerGutters }}
      >
        <PageHeaderSkeleton withOverline={false} />
        <Stack direction="row" spacing={2} alignItems="stretch" sx={{ mt: 1, minHeight: { md: 560 } }}>
          <Paper
            elevation={0}
            sx={{
              width: { md: 360, lg: 380 },
              flexShrink: 0,
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
              <Skeleton variant="text" animation="wave" width={72} height={28} />
            </Box>
            <ChatThreadRowSkeleton />
            <ChatThreadRowSkeleton />
            <ChatThreadRowSkeleton />
            <ChatThreadRowSkeleton />
          </Paper>
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              minWidth: 0,
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {threadOpen ? (
              <ThreadPaneSkeleton />
            ) : (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                <Skeleton variant="text" animation="wave" width={220} height={22} />
              </Box>
            )}
          </Paper>
        </Stack>
      </Container>
    </Box>
  )
}
