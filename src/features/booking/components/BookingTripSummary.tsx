import { Box, Divider, Paper, Stack, Typography } from '@mui/material'
import type { Theme } from '@mui/material/styles'
import type { Dayjs } from 'dayjs'

import PriceBreakdown from '@/components/common/PriceBreakdown'
import { useT } from '@/hooks/useT'
import { listRowSurface } from '@/theme/pageStyles'
import type { Car, PricingBreakdown } from '@/types'
import { formatTripDateTime } from '@/utils/dateUtils'

export type BookingTripSummaryProps = {
  car: Car
  pickup: Dayjs
  dropoff: Dayjs
  pricing: PricingBreakdown | null
  theme: Theme
  caption?: string
}

export default function BookingTripSummary({
  car,
  pickup,
  dropoff,
  pricing,
  theme,
  caption,
}: BookingTripSummaryProps) {
  const t = useT()

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        ...listRowSurface(theme),
        position: { md: 'sticky' },
        top: { md: 96 },
      }}
    >
      <Box
        component="img"
        src={car.images[0]}
        alt=""
        sx={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 2, mb: 2 }}
      />
      <Typography fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
        {car.year} {car.make} {car.model}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {formatTripDateTime(pickup)} → {formatTripDateTime(dropoff)}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {car.location}
      </Typography>
      <Divider sx={{ my: 2 }} />
      {pricing ? (
        <PriceBreakdown pricing={pricing} pricePerDay={car.pricePerDay} dense />
      ) : (
        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
          <Typography fontWeight={700}>{t('booking.total')}</Typography>
          <Typography variant="h6" color="primary.main" component="span">
            —
          </Typography>
        </Stack>
      )}
      {caption ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {caption}
        </Typography>
      ) : null}
    </Paper>
  )
}
