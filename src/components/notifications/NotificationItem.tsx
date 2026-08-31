import { Box, Typography, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion } from 'framer-motion'

import { useT } from '@/hooks/useT'
import { rhFocusRing } from '@/theme/tokens'
import { formatNotificationTime } from '@/utils/notificationTime'
import type { AppNotification } from '@/types'

import { colorSx, getNotificationMeta, notificationKindKey } from './notificationMeta'

const MotionBox = motion.create(Box)

export type NotificationItemProps = {
  notification: AppNotification
  onOpen: (id: string) => void
  /** Tighter padding for the navbar popover */
  compact?: boolean
}

export default function NotificationItem({ notification, onOpen, compact }: NotificationItemProps) {
  const t = useT()
  const theme = useTheme()
  const { Icon, color } = getNotificationMeta(notification.type)
  const { bg, fg } = colorSx(theme, color)
  const unread = !notification.read
  const kind = t(notificationKindKey(notification.type))
  const when = formatNotificationTime(notification.createdAt)

  return (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      component="li"
      onClick={() => onOpen(notification.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(notification.id)
        }
      }}
      role="button"
      tabIndex={0}
      sx={{
        listStyle: 'none',
        display: 'flex',
        alignItems: 'flex-start',
        gap: compact ? 1.25 : 1.5,
        px: compact ? 1.75 : 2,
        py: compact ? 1.25 : 1.75,
        minHeight: compact ? 64 : 72,
        cursor: 'pointer',
        textAlign: 'left',
        bgcolor: unread ? 'primary.light' : 'transparent',
        border: 'none',
        borderBottom: '1px solid',
        borderColor: 'divider',
        transition: 'background-color 0.15s ease',
        '&:last-of-type': { borderBottom: 'none' },
        '@media (pointer: fine)': {
          '&:hover': {
            bgcolor: unread ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.primary.main, 0.04),
          },
        },
        '&:focus-visible': {
          outline: 'none',
          boxShadow: rhFocusRing,
          position: 'relative',
          zIndex: 1,
        },
      }}
    >
      <Box
        sx={{
          width: compact ? 40 : 44,
          height: compact ? 40 : 44,
          borderRadius: '50%',
          bgcolor: bg,
          color: fg,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          mt: 0.125,
          '& .MuiSvgIcon-root': { fontSize: compact ? 20 : 22 },
        }}
      >
        <Icon fontSize="inherit" />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, pt: 0.1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Typography
            variant="subtitle2"
            fontWeight={unread ? 700 : 600}
            color="text.primary"
            component="h3"
            sx={{
              flex: 1,
              minWidth: 0,
              lineHeight: 1.35,
              letterSpacing: '-0.01em',
              display: '-webkit-box',
              WebkitLineClamp: compact ? 1 : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {notification.title}
          </Typography>
          {unread ? (
            <Box
              aria-hidden
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                flexShrink: 0,
                mt: 0.75,
              }}
            />
          ) : null}
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: compact ? 2 : 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mt: 0.25,
          }}
        >
          {notification.message}
        </Typography>
        <Typography variant="caption" color="text.secondary" component="p" sx={{ m: 0, mt: 0.5, fontWeight: 600 }}>
          {kind}
          {when ? ` · ${when}` : ''}
        </Typography>
      </Box>
    </MotionBox>
  )
}
