import {
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'

import { useT } from '@/hooks/useT'
import type { PricingBreakdown } from '../../types'
import { formatPeso } from '../../utils/formatCurrency'

export interface PriceBreakdownProps {
  pricing: PricingBreakdown | null
  /** Daily rate in PHP (for label only) */
  pricePerDay?: number | null
  emptyMessage?: string
  /** Tighter rows so the full total stays in view on the listing book card. */
  dense?: boolean
}

export default function PriceBreakdown({
  pricing,
  pricePerDay,
  emptyMessage,
  dense = false,
}: PriceBreakdownProps) {
  const t = useT()
  if (!pricing) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyMessage ?? t('detail.selectDates')}
      </Typography>
    )
  }

  const { days, subtotal, serviceFee, insurance, total } = pricing
  const rateKey = days === 1 ? 'booking.vehicleRentalRateOne' : 'booking.vehicleRentalRateOther'
  const plainKey = days === 1 ? 'booking.vehicleRentalOne' : 'booking.vehicleRentalOther'
  const basePrimary =
    pricePerDay != null
      ? t(rateKey, { count: days, rate: formatPeso(pricePerDay) })
      : t(plainKey, { count: days })

  const row = (
    label: string,
    amount: number,
    primaryProps: Record<string, unknown> = {},
  ) => (
    <ListItem
      disableGutters
      sx={{
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 2,
        py: dense ? 0.35 : 0.75,
      }}
    >
      <ListItemText
        primary={label}
        primaryTypographyProps={{
          variant: 'body2',
          color: 'text.secondary',
          ...primaryProps,
        }}
      />
      <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'nowrap' }}>
        {formatPeso(amount)}
      </Typography>
    </ListItem>
  )

  return (
    <List dense disablePadding sx={{ py: 0 }}>
      {row(basePrimary, subtotal)}
      {row(t('booking.serviceFee'), serviceFee)}
      {row(t('booking.insurance'), insurance)}
      <Divider sx={{ my: dense ? 0.75 : 1 }} />
      <ListItem
        disableGutters
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          pt: dense ? 0.25 : 0.5,
          pb: 0,
        }}
      >
        <Typography variant="subtitle1" fontWeight={700} color="text.primary">
          {t('booking.total')}
        </Typography>
        <Typography
          fontWeight={800}
          color="text.primary"
          sx={{ fontSize: dense ? '1.25rem' : '1.5rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}
        >
          {formatPeso(total)}
        </Typography>
      </ListItem>
    </List>
  )
}
