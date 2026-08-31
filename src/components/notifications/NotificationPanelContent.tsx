import ChevronRight from '@mui/icons-material/ChevronRight'
import { Box, Button, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

import { useT } from '@/hooks/useT'
import { useNotificationStore, useUnreadNotificationCount } from '@/store/useNotificationStore'
import type { AppNotification } from '@/types'

import NotificationList from './NotificationList'

const PREVIEW_MAX = 6

type Props = {
  onViewOne: (id: string) => void
  onMarkAll: () => void
  onClose: () => void
}

/**
 * Popover body: recent notifications + actions (desktop navbar bell).
 */
export default function NotificationPanelContent({ onViewOne, onMarkAll, onClose }: Props) {
  const t = useT()
  const notifications = useNotificationStore((s) => s.notifications)
  const unreadCount = useUnreadNotificationCount()
  const unreadFirst = sortUnreadFirst(notifications)
  const preview = unreadFirst.slice(0, PREVIEW_MAX)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', maxHeight: 'min(70vh, 480px)' }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
        sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}
      >
        <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={800} letterSpacing="-0.02em" noWrap>
            {t('notify.title')}
          </Typography>
          {unreadCount > 0 ? (
            <Box
              component="span"
              sx={{
                px: 1,
                py: 0.125,
                borderRadius: 999,
                bgcolor: 'primary.light',
                color: 'primary.main',
                fontWeight: 800,
                fontSize: 12,
                lineHeight: 1.5,
                flexShrink: 0,
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Box>
          ) : null}
        </Stack>
        {unreadCount > 0 ? (
          <Button size="small" onClick={onMarkAll} sx={{ fontWeight: 700, flexShrink: 0 }}>
            {t('notify.markAll')}
          </Button>
        ) : null}
      </Stack>
      <Box sx={{ overflow: 'auto', flex: 1 }}>
        <NotificationList
          items={preview}
          onItemOpen={onViewOne}
          compact
          variant="flush"
          emptyTitle={t('notify.caughtUp')}
          emptyFilterLabel=""
        />
      </Box>
      <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
        <Button
          component={RouterLink}
          to="/notifications"
          onClick={onClose}
          fullWidth
          endIcon={<ChevronRight />}
          sx={{ fontWeight: 700, justifyContent: 'space-between', px: 1.5 }}
        >
          {t('notify.viewAll')}
        </Button>
      </Box>
    </Box>
  )
}

function sortUnreadFirst(list: AppNotification[]) {
  return [...list].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}
