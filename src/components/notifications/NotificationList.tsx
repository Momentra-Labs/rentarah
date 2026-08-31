import { Box, Paper, Typography } from '@mui/material'
import { AnimatePresence } from 'framer-motion'

import { useT } from '@/hooks/useT'
import { rhRadius } from '@/theme/tokens'
import type { MessageKey } from '@/i18n/translate'
import type { AppNotification } from '@/types'
import { groupNotificationsByDay, type NotificationDayGroup } from '@/utils/notificationTime'

import NotificationItem from './NotificationItem'
import NotificationEmptyState from './EmptyState'

const GROUP_KEYS: Record<NotificationDayGroup, MessageKey> = {
  today: 'notify.groupToday',
  yesterday: 'notify.groupYesterday',
  earlier: 'notify.groupEarlier',
}

export type NotificationListProps = {
  items: AppNotification[]
  onItemOpen: (id: string) => void
  compact?: boolean
  emptyFilterLabel?: string
  emptyTitle?: string
  /** Popover: no outer paper (the popover already has chrome). */
  variant?: 'sheet' | 'flush'
}

export default function NotificationList({
  items,
  onItemOpen,
  compact,
  emptyFilterLabel,
  emptyTitle,
  variant = 'sheet',
}: NotificationListProps) {
  const t = useT()
  const flush = variant === 'flush' || compact

  if (items.length === 0) {
    const empty = (
      <NotificationEmptyState compact={flush} title={emptyTitle} filterHint={emptyFilterLabel} />
    )
    if (flush) return empty
    return (
      <Paper elevation={0} sx={sheetSx}>
        {empty}
      </Paper>
    )
  }

  const groups = groupNotificationsByDay(items)

  const list = (
    <Box
      component="ul"
      role="list"
      sx={{
        m: 0,
        p: 0,
        listStyle: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <AnimatePresence initial={false}>
        {groups.map((g) => (
          <Box component="li" key={g.group} sx={{ listStyle: 'none' }}>
            <Typography
              variant="caption"
              component="p"
              sx={{
                m: 0,
                px: compact ? 1.75 : 2,
                py: compact ? 0.75 : 1,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'text.secondary',
                bgcolor: 'grey.50',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              {t(GROUP_KEYS[g.group])}
            </Typography>
            <Box component="ul" role="list" sx={{ m: 0, p: 0, listStyle: 'none' }}>
              {g.items.map((n) => (
                <NotificationItem key={n.id} notification={n} onOpen={onItemOpen} compact={compact} />
              ))}
            </Box>
          </Box>
        ))}
      </AnimatePresence>
    </Box>
  )

  if (flush) return list

  return (
    <Paper elevation={0} sx={sheetSx}>
      {list}
    </Paper>
  )
}

const sheetSx = {
  borderRadius: `${rhRadius.lg}px`,
  border: '1px solid',
  borderColor: 'divider',
  overflow: 'hidden',
  bgcolor: 'background.default',
} as const
