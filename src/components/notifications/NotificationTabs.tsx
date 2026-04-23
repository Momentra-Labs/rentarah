import { Box, Tab, Tabs } from '@mui/material'

import type { NotificationFilter } from '../../types'

const TAB_KEYS: { value: NotificationFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'bookings', label: 'Bookings' },
  { value: 'payments', label: 'Payments' },
]

export type NotificationTabsProps = {
  value: NotificationFilter
  onChange: (next: NotificationFilter) => void
  /** If set, the scrollable “Unread” label can show a count badge */
  unreadCount?: number
}

export default function NotificationTabs({ value, onChange, unreadCount }: NotificationTabsProps) {
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs
        value={value}
        onChange={(_, v) => onChange(v as NotificationFilter)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        aria-label="Notification filters"
        sx={{
          minHeight: 48,
          '& .MuiTab-root': {
            minHeight: 48,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            transition: 'color 0.2s ease',
          },
        }}
      >
        {TAB_KEYS.map((t) => (
          <Tab
            key={t.value}
            value={t.value}
            label={
              t.value === 'unread' && unreadCount != null && unreadCount > 0
                ? `${t.label} (${unreadCount > 9 ? '9+' : unreadCount})`
                : t.label
            }
            disableRipple
          />
        ))}
      </Tabs>
    </Box>
  )
}
