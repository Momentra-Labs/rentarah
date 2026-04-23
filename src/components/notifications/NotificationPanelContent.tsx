import { Box, Button, Divider, Link as MuiLink, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

import { useNotificationStore } from '../../store/useNotificationStore'
import type { AppNotification } from '../../types'
import NotificationList from './NotificationList'

const PREVIEW_MAX = 6

type Props = {
  onViewOne: (id: string) => void
  onMarkAll: () => void
  onClose: () => void
}

/**
 * Popover / drawer body: recent notifications + actions (desktopnavbar bell).
 */
export default function NotificationPanelContent({ onViewOne, onMarkAll, onClose }: Props) {
  const notifications = useNotificationStore((s) => s.notifications)
  const unreadFirst = sortUnreadFirst(notifications)
  const preview = unreadFirst.slice(0, PREVIEW_MAX)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', maxHeight: 'min(70vh, 480px)' }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          Notifications
        </Typography>
        <Button size="small" onClick={onMarkAll} sx={{ fontWeight: 600, textTransform: 'none' }}>
          Mark all as read
        </Button>
      </Stack>
      <Box sx={{ overflow: 'auto', flex: 1, px: 1.5, py: 1.5 }}>
        {preview.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3, px: 1 }}>
            You are all caught up.
          </Typography>
        ) : (
          <NotificationList items={preview} onItemOpen={onViewOne} compact />
        )}
      </Box>
      <Divider />
      <Box sx={{ p: 1.5, textAlign: 'center' }}>
        <MuiLink
          component={RouterLink}
          to="/notifications"
          onClick={onClose}
          fontWeight={600}
          underline="hover"
        >
          View all notifications
        </MuiLink>
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
