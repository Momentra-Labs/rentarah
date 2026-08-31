import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined'
import { Box } from '@mui/material'
import { motion } from 'framer-motion'

import EmptyState from '@/components/ui/EmptyState'
import { useT } from '@/hooks/useT'

const MotionBox = motion.create(Box)

export type NotificationEmptyStateProps = {
  /** e.g. when a filter has no results */
  filterHint?: string
  title?: string
  compact?: boolean
}

export default function NotificationEmptyState({ filterHint, title, compact }: NotificationEmptyStateProps) {
  const t = useT()
  const size = compact ? 56 : 80
  const iconSize = compact ? 28 : 40

  return (
    <MotionBox
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      sx={compact ? { '& .MuiStack-root': { py: 4 } } : undefined}
    >
      <EmptyState
        title={title ?? t('notify.emptyTitle')}
        description={filterHint ?? t('notify.emptyDesc')}
        icon={
          <Box
            sx={{
              width: size,
              height: size,
              borderRadius: '50%',
              bgcolor: 'primary.light',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <NotificationsNoneOutlined sx={{ fontSize: iconSize, color: 'primary.main' }} aria-hidden />
          </Box>
        }
      />
    </MotionBox>
  )
}
