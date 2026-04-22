import {
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'

import type { PricingBreakdown } from '../../types'
import { formatPeso } from '../../utils/formatCurrency'

export interface PriceBreakdownProps {
  pricing: PricingBreakdown | null
  /** Daily rate in PHP (for label only) */
  pricePerDay?: number | null
  emptyMessage?: string
}

export default function PriceBreakdown({
  pricing,
  pricePerDay,
  emptyMessage = 'Select dates to see price.',
}: PriceBreakdownProps) {
  if (!pricing) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyMessage}
      </Typography>
    )
  }

  const { days, subtotal, serviceFee, insurance, total } = pricing
  const basePrimary =
    pricePerDay != null
      ? `Car rental (${days} day${days === 1 ? '' : 's'} × ${formatPeso(pricePerDay)} / day)`
      : `Car rental (${days} day${days === 1 ? '' : 's'})`

  const row = (
    label: string,
    amount: number,
    primaryProps: Record<string, unknown> = {},
  ) => (
    <ListItem
      disableGutters
      sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, py: 0.75 }}
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
      {row('Service fee', serviceFee)}
      {row('Insurance', insurance)}
      <Divider sx={{ my: 1 }} />
      <ListItem
        disableGutters
        sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2, pt: 0.5 }}
      >
        <Typography variant="subtitle1" fontWeight={600} color="text.primary">
          Total
        </Typography>
        <Typography variant="h5" color="primary">
          {formatPeso(total)}
        </Typography>
      </ListItem>
    </List>
  )
}
