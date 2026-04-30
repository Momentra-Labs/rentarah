import { Box, Typography, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion } from 'framer-motion'

import { formatNotificationTime } from '../../utils/notificationTime'
import type { AppNotification } from '../../types'
import { colorSx, getNotificationMeta } from './notificationMeta'

const MotionBox = motion.create(Box)

export type NotificationItemProps = {
  notification: AppNotification
  onOpen: (id: string) => void
  /** Tighter padding for the navbar popover */
  compact?: boolean
}

export default function NotificationItem({ notification, onOpen, compact }: NotificationItemProps) {
  const theme = useTheme()
  const { Icon, color } = getNotificationMeta(notification.type)
  const { bg, fg } = colorSx(theme, color)
  const unread = !notification.read

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
        p: compact ? 1.5 : 2,
        minHeight: compact ? 64 : 72,
        borderRadius: 2,
        cursor: 'pointer',
        textAlign: 'left',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: unread ? alpha(theme.palette.primary.main, 0.04) : 'background.default',
        boxShadow: unread ? `inset 3px 0 0 ${theme.palette.primary.main}` : 'none',
        transition: 'background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          bgcolor: unread ? alpha(theme.palette.primary.main, 0.07) : alpha(theme.palette.action.hover, 0.5),
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        },
        '&:focus-visible': {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
      }}
    >
      <Box
        sx={{
          width: compact ? 40 : 44,
          height: compact ? 40 : 44,
          borderRadius: 1.5,
          bgcolor: bg,
          color: fg,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          mt: 0.25,
          '& .MuiSvgIcon-root': { fontSize: compact ? 20 : 22 },
        }}
      >
        <Icon fontSize="inherit" />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, pt: 0.1 }}>
        <Box sx={{ mb: 0.25 }}>
          <Typography
            variant="subtitle2"
            fontWeight={unread ? 700 : 600}
            color="text.primary"
            component="h3"
            sx={{
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: compact ? 1 : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {notification.title}
          </Typography>
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
            mb: 0.5,
          }}
        >
          {notification.message}
        </Typography>
        <Typography variant="caption" color="text.secondary" component="p" sx={{ m: 0, fontWeight: 500 }}>
          {formatNotificationTime(notification.createdAt)}
        </Typography>
      </Box>
    </MotionBox>
  )
}
