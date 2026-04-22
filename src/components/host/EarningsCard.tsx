import AttachMoney from '@mui/icons-material/AttachMoney'
import CalendarMonth from '@mui/icons-material/CalendarMonth'
import DirectionsCar from '@mui/icons-material/DirectionsCar'
import Star from '@mui/icons-material/Star'
import { Box, Card, CardContent, Stack, Typography } from '@mui/material'

import { formatPeso } from '../../utils/formatCurrency'

export interface EarningsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: 'money' | 'calendar' | 'car' | 'star'
}

const icons = {
  money: AttachMoney,
  calendar: CalendarMonth,
  car: DirectionsCar,
  star: Star,
}

export default function EarningsCard({ title, value, subtitle, icon }: EarningsCardProps) {
  const Icon = icons[icon]
  const display = typeof value === 'number' ? formatPeso(value) : value

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <BoxCopy title={title} subtitle={subtitle} value={display} />
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: 'primary.light',
              color: 'primary.main',
            }}
          >
            <Icon />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

function BoxCopy({
  title,
  subtitle,
  value,
}: {
  title: string
  subtitle?: string
  value: string
}) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h5" fontWeight={800}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Stack>
  )
}

export function EarningsPlaceholderChart() {
  const bars = [48, 72, 56, 88, 64, 92, 76]
  return (
    <Stack direction="row" alignItems="flex-end" spacing={1} sx={{ height: 160, mt: 2 }}>
      {bars.map((h, i) => (
        <Box
          key={i}
          sx={{
            flex: 1,
            height: h,
            bgcolor: i % 2 === 0 ? 'primary.main' : 'primary.light',
            borderRadius: 1,
            opacity: 0.9,
          }}
        />
      ))}
    </Stack>
  )
}
