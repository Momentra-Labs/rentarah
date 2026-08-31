import { Badge, Box, Tab, Tabs } from '@mui/material'

import { useT } from '@/hooks/useT'
import { dashboardSectionTabsSx, dashboardTabsBarWrapSx } from '@/theme/pageStyles'
import type { NotificationFilter } from '@/types'
import type { MessageKey } from '@/i18n/translate'

const TAB_KEYS: { value: NotificationFilter; labelKey: MessageKey }[] = [
  { value: 'all', labelKey: 'notify.tabAll' },
  { value: 'unread', labelKey: 'notify.tabUnread' },
  { value: 'bookings', labelKey: 'notify.tabBookings' },
  { value: 'payments', labelKey: 'notify.tabPayments' },
]

const TAB_BADGE_SX = {
  '& .MuiBadge-badge': {
    position: 'relative',
    transform: 'none',
    ml: 0.75,
    fontSize: 10,
    fontWeight: 800,
    minWidth: 18,
    height: 18,
  },
} as const

export type NotificationTabsProps = {
  value: NotificationFilter
  onChange: (next: NotificationFilter) => void
  /** If set, the Unread tab can show a count badge */
  unreadCount?: number
}

export default function NotificationTabs({ value, onChange, unreadCount }: NotificationTabsProps) {
  const t = useT()

  return (
    <Box sx={dashboardTabsBarWrapSx}>
      <Tabs
        value={value}
        onChange={(_, v) => onChange(v as NotificationFilter)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        aria-label={t('notify.filtersAria')}
        sx={dashboardSectionTabsSx}
      >
        {TAB_KEYS.map((tab) => {
          const label = t(tab.labelKey)
          const showBadge = tab.value === 'unread' && unreadCount != null && unreadCount > 0
          return (
            <Tab
              key={tab.value}
              value={tab.value}
              disableRipple
              label={
                showBadge ? (
                  <Badge badgeContent={unreadCount} color="primary" max={9} sx={TAB_BADGE_SX}>
                    {label}
                  </Badge>
                ) : (
                  label
                )
              }
            />
          )
        })}
      </Tabs>
    </Box>
  )
}
