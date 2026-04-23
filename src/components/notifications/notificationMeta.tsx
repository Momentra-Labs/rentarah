import CampaignOutlined from '@mui/icons-material/CampaignOutlined'
import CancelOutlined from '@mui/icons-material/CancelOutlined'
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline'
import ErrorOutline from '@mui/icons-material/ErrorOutline'
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined'
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined'
import { alpha, type Theme } from '@mui/material/styles'
import type { ElementType } from 'react'

import type { AppNotificationType } from '../../types'

export function getNotificationMeta(
  type: AppNotificationType,
): { Icon: ElementType; color: 'primary' | 'success' | 'error' | 'warning' | 'info' } {
  switch (type) {
    case 'booking_confirmed':
      return { Icon: CheckCircleOutline, color: 'success' }
    case 'booking_cancelled':
      return { Icon: CancelOutlined, color: 'error' }
    case 'payment_success':
      return { Icon: PaymentsOutlined, color: 'success' }
    case 'payment_failed':
      return { Icon: ErrorOutline, color: 'error' }
    case 'upcoming_rental_reminder':
      return { Icon: EventAvailableOutlined, color: 'warning' }
    case 'system_promo':
      return { Icon: CampaignOutlined, color: 'info' }
  }
}

export function colorSx(theme: Theme, c: 'primary' | 'success' | 'error' | 'warning' | 'info') {
  const m = {
    primary: theme.palette.primary.main,
    success: theme.palette.success.main,
    error: theme.palette.error.main,
    warning: theme.palette.warning.main,
    info: theme.palette.info?.main ?? theme.palette.primary.main,
  }
  return { bg: alpha(m[c], 0.12), fg: m[c] }
}
