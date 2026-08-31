import { Box, Button, Container, Stack } from '@mui/material'
import { useCallback, useMemo, useState } from 'react'

import PageHeader from '@/components/layout/PageHeader'
import NotificationList from '@/components/notifications/NotificationList'
import NotificationTabs from '@/components/notifications/NotificationTabs'
import { MOBILE_BOTTOM_NAV_SX_PB } from '@/components/layout/MobileBottomNav'
import { filterNotifications, useNotificationStore, useUnreadNotificationCount } from '@/store/useNotificationStore'
import { useT } from '@/hooks/useT'
import { containerGutters } from '@/theme/pageStyles'
import type { MessageKey } from '@/i18n/translate'
import type { NotificationFilter } from '@/types'

const EMPTY_HINT: Record<NotificationFilter, MessageKey | undefined> = {
  all: undefined,
  unread: 'notify.emptyUnread',
  bookings: 'notify.emptyBookings',
  payments: 'notify.emptyPayments',
}

export default function NotificationsPage() {
  const t = useT()
  const [filter, setFilter] = useState<NotificationFilter>('all')
  const notifications = useNotificationStore((s) => s.notifications)
  const markAsRead = useNotificationStore((s) => s.markAsRead)
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead)
  const unreadCount = useUnreadNotificationCount()

  const filtered = useMemo(() => filterNotifications(notifications, filter), [notifications, filter])

  const onItemOpen = useCallback(
    (id: string) => {
      markAsRead(id)
    },
    [markAsRead],
  )

  const hintKey = filtered.length === 0 && notifications.length > 0 ? EMPTY_HINT[filter] : undefined

  return (
    <Box
      component="section"
      aria-label={t('notify.title')}
      sx={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        pb: { xs: 'max(20px, env(safe-area-inset-bottom))', md: 4 },
      }}
    >
      <Container
        maxWidth="md"
        sx={{ flex: 1, ...containerGutters, pt: { xs: 2, md: 0 }, pb: { xs: MOBILE_BOTTOM_NAV_SX_PB, md: 0 } }}
      >
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={2}
          sx={{ mb: 0 }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <PageHeader title={t('notify.title')} subtitle={t('notify.subtitle')} dense />
          </Box>
          {unreadCount > 0 ? (
            <Button onClick={markAllAsRead} sx={{ fontWeight: 700, mt: { xs: 0, md: 0.5 }, minHeight: 44 }}>
              {t('notify.markAllRead')}
            </Button>
          ) : null}
        </Stack>

        <NotificationTabs value={filter} onChange={setFilter} unreadCount={unreadCount} />

        <Box key={filter}>
          <NotificationList
            items={filtered}
            onItemOpen={onItemOpen}
            emptyFilterLabel={hintKey ? t(hintKey) : undefined}
          />
        </Box>
      </Container>
    </Box>
  )
}
