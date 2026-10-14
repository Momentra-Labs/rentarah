import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined'
import { Box, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { Dayjs } from 'dayjs'

import { useT } from '@/hooks/useT'
import { rhRadius } from '@/theme/tokens'
import { formatClockHoursLabel, getPickupReturnRentSpan } from '@/utils/dateUtils'

export type TripClockSummaryProps = {
  pickup: Dayjs | null
  dropoff: Dayjs | null
  /** Single quiet line (homepage search card) instead of the highlighted summary panel. */
  compact?: boolean
}

export default function TripClockSummary({ pickup, dropoff, compact = false }: TripClockSummaryProps) {
  const t = useT()
  if (!pickup || !dropoff) return null
  const span = getPickupReturnRentSpan(pickup, dropoff)
  if (!span) return null

  const parts: string[] = []
  if (span.days > 0) {
    parts.push(t(span.days === 1 ? 'picker.daysOne' : 'picker.daysOther', { count: span.days }))
  }
  if (span.hours > 0) {
    parts.push(t(span.hours === 1 ? 'picker.hrsOne' : 'picker.hrsOther', { count: span.hours }))
  }
  if (span.minutes > 0 && span.days === 0) {
    parts.push(t('picker.minsLabel', { count: span.minutes }))
  }
  const headline = parts.length > 0 ? parts.join(' · ') : t('picker.minsLabel', { count: span.minutes })
  const clockHours = t('picker.clockHours', { hours: formatClockHoursLabel(span.totalHoursRounded) })

  if (compact) {
    return (
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        role="status"
        aria-live="polite"
        aria-label={`${t('picker.tripLength')}. ${headline}. ${clockHours}`}
        sx={{ px: 0.25, color: 'text.secondary', minWidth: 0 }}
      >
        <ScheduleOutlined sx={{ fontSize: 17, color: 'primary.main' }} aria-hidden />
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, color: 'text.primary', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
        >
          {t('picker.tripLength')}: {headline}
        </Typography>
        <Typography
          variant="body2"
          noWrap
          sx={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums', minWidth: 0 }}
        >
          · {clockHours}
        </Typography>
      </Stack>
    )
  }

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.25}
      role="status"
      aria-live="polite"
      aria-label={`${t('picker.tripLength')}. ${headline}. ${clockHours}`}
      sx={{
        px: { xs: 1.25, sm: 1.5 },
        py: { xs: 1, sm: 1.1 },
        borderRadius: `${rhRadius.md}px`,
        bgcolor: (th) => alpha(th.palette.primary.main, 0.06),
        border: '1px solid',
        borderColor: (th) => alpha(th.palette.primary.main, 0.14),
      }}
    >
      <Box
        sx={{
          width: { xs: 32, sm: 36 },
          height: { xs: 32, sm: 36 },
          borderRadius: `${rhRadius.sm}px`,
          bgcolor: (th) => alpha(th.palette.primary.main, 0.12),
          color: 'primary.main',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
        aria-hidden
      >
        <ScheduleOutlined sx={{ fontSize: { xs: 18, sm: 20 } }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            lineHeight: 1.2,
          }}
        >
          {t('picker.tripLength')}
        </Typography>
        <Typography
          component="p"
          sx={{
            m: 0,
            mt: 0.15,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            fontSize: { xs: '1.05rem', sm: '1.125rem' },
            lineHeight: 1.2,
            color: 'primary.main',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {headline}
        </Typography>
      </Box>
      <Box
        aria-hidden
        sx={{
          width: '1px',
          alignSelf: 'stretch',
          my: 0.25,
          bgcolor: (th) => alpha(th.palette.primary.main, 0.18),
          flexShrink: 0,
        }}
      />
      <Typography
        variant="body2"
        sx={{
          fontWeight: 700,
          lineHeight: 1.35,
          textAlign: 'right',
          maxWidth: { xs: '42%', sm: '44%' },
          flexShrink: 0,
          color: 'text.primary',
          fontVariantNumeric: 'tabular-nums',
          fontSize: { xs: '0.75rem', sm: '0.8125rem' },
        }}
      >
        {clockHours}
      </Typography>
    </Stack>
  )
}
