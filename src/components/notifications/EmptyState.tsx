import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined'
import { Box, Stack, Typography } from '@mui/material'
import { motion } from 'framer-motion'

const MotionStack = motion(Stack)

export type NotificationEmptyStateProps = {
  /** e.g. when a filter has no results */
  filterHint?: string
}

export default function NotificationEmptyState({ filterHint }: NotificationEmptyStateProps) {
  return (
    <MotionStack
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      alignItems="center"
      justifyContent="center"
      spacing={1.5}
      sx={{ py: { xs: 6, sm: 8 }, px: 2, textAlign: 'center' }}
    >
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
      <Typography variant="h6" fontWeight={700} color="text.primary">
        No notifications yet
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, lineHeight: 1.6 }}>
        {filterHint
          ? filterHint
          : 'When you book, pay, or get updates from hosts, you will see them here.'}
      </Typography>
    </MotionStack>
  )
}
