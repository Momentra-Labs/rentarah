import { Box } from '@mui/material'
import { AnimatePresence } from 'framer-motion'

import type { AppNotification } from '../../types'
import NotificationItem from './NotificationItem'
import NotificationEmptyState from './EmptyState'

export type NotificationListProps = {
  items: AppNotification[]
  onItemOpen: (id: string) => void
  compact?: boolean
  emptyFilterLabel?: string
}

export default function NotificationList({ items, onItemOpen, compact, emptyFilterLabel }: NotificationListProps) {
  if (items.length === 0) {
    return <NotificationEmptyState filterHint={emptyFilterLabel} />
  }

  return (
    <Box
      component="ul"
      role="list"
      sx={{
        m: 0,
        p: 0,
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? 1 : 1.5,
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <AnimatePresence initial={false}>
        {items.map((n) => (
          <NotificationItem key={n.id} notification={n} onOpen={onItemOpen} compact={compact} />
        ))}
      </AnimatePresence>
    </Box>
  )
}
