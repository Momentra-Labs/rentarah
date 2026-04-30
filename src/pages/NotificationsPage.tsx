import ArrowBack from '@mui/icons-material/ArrowBack'
import { Box, Button, Container, IconButton, Stack, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import PageHeader from '../components/layout/PageHeader'
import NotificationList from '../components/notifications/NotificationList'
import NotificationTabs from '../components/notifications/NotificationTabs'
import { MOBILE_APP_BAR_TOOLBAR_PX } from '../constants/mobileShell'
import { filterNotifications, useNotificationStore, useUnreadNotificationCount } from '../store/useNotificationStore'
import { containerGutters } from '../theme/pageStyles'
import type { NotificationFilter } from '../types'

const EMPTY_HINT: Record<NotificationFilter, string | undefined> = {
  all: undefined,
  unread: 'You have read everything. New alerts will show up here.',
  bookings: 'No booking confirmations, cancellations, or trip reminders in this view yet.',
  payments: 'No payment success or failed alerts in this view yet.',
}

export default function NotificationsPage() {
  const theme = useTheme()
  const navigate = useNavigate()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [filter, setFilter] = useState<NotificationFilter>('all')
  const notifications = useNotificationStore((s) => s.notifications)
  const markAsRead = useNotificationStore((s) => s.markAsRead)
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead)
  const unreadCount = useUnreadNotificationCount()

  const filtered = useMemo(() => {
    return filterNotifications(notifications, filter)
  }, [notifications, filter])

  const onItemOpen = useCallback(
    (id: string) => {
      markAsRead(id)
    },
    [markAsRead],
  )

  const emptyLabel = (filtered.length === 0 && notifications.length > 0 && EMPTY_HINT[filter]) || undefined

  return (
    <Box
      component="section"
      aria-label="Notifications"
      sx={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        pb: { xs: 'max(20px, env(safe-area-inset-bottom))', md: 4 },
      }}
    >
      {isMobile && (
        <Box
          component="header"
          sx={{
            position: 'sticky',
            zIndex: (t) => t.zIndex.appBar - 1,
            // Below global sticky AppBar (safe area + compact toolbar on mobile)
            top: { xs: `calc(env(safe-area-inset-top, 0px) + ${MOBILE_APP_BAR_TOOLBAR_PX}px)`, md: 64 },
            bgcolor: alpha(theme.palette.background.default, 0.98),
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Toolbar
            disableGutters
            variant="dense"
            sx={{ minHeight: MOBILE_APP_BAR_TOOLBAR_PX, px: 1, gap: 1 }}
          >
            <IconButton
              edge="start"
              aria-label="Back"
              onClick={() => navigate(-1)}
              size="small"
              sx={{ minWidth: 44, minHeight: 44 }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" sx={{ flex: 1, fontWeight: 700, fontSize: '1.05rem' }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={markAllAsRead}
                sx={{ fontWeight: 600, textTransform: 'none', minHeight: 44 }}
              >
                Mark all
              </Button>
            )}
          </Toolbar>
        </Box>
      )}

      <Container maxWidth="md" sx={{ flex: 1, ...containerGutters, pt: { xs: 2, md: 0 } }}>
        {!isMobile && (
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={2} sx={{ mb: 0 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <PageHeader
                overline="RentaraH"
                title="Notifications"
                subtitle="Bookings, payments, and important updates in one place."
                dense
              />
            </Box>
            {unreadCount > 0 && (
              <Button variant="outlined" onClick={markAllAsRead} sx={{ borderRadius: 2, fontWeight: 600, mt: 0.5 }}>
                Mark all as read
              </Button>
            )}
          </Stack>
        )}

        {isMobile && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
            Bookings, payments, and trip reminders for your cars and two-wheeler rentals.
          </Typography>
        )}

        <Box sx={{ mb: 2 }}>
          <NotificationTabs
            value={filter}
            onChange={setFilter}
            unreadCount={unreadCount}
          />
        </Box>
        <Box key={filter}>
          <NotificationList items={filtered} onItemOpen={onItemOpen} emptyFilterLabel={emptyLabel} />
        </Box>
      </Container>
    </Box>
  )
}
