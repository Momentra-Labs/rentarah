import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined'
import { Box } from '@mui/material'
import { motion } from 'framer-motion'

import EmptyState from '@/components/ui/EmptyState'

const MotionBox = motion.create(Box)

export type NotificationEmptyStateProps = {
  /** e.g. when a filter has no results */
  filterHint?: string
}

export default function NotificationEmptyState({ filterHint }: NotificationEmptyStateProps) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <EmptyState
        title="No notifications yet"
        description={
          filterHint
            ? filterHint
            : 'When you book, pay, or get updates from hosts, you will see them here.'
        }
        icon={
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: (t) => t.palette.grey[100],
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <NotificationsNoneOutlined sx={{ fontSize: 40, color: 'grey.400' }} aria-hidden />
          </Box>
        }
      />
    </MotionBox>
  )
}
