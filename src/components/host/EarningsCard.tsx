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
    <Card
      variant="outlined"
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <CardContent
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'space-between',
          py: 2,
          px: 2.25,
          minHeight: 148,
          '&:last-child': { pb: 2 },
        }}
      >
        {/* Fixed visual rhythm: label + icon share one row; main value sits on the bottom so a row of cards lines up. */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr) 48px',
            gridTemplateRows: 'minmax(48px, auto)',
            columnGap: 1.5,
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            fontWeight={600}
            sx={{
              lineHeight: 1.4,
              minWidth: 0,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
            }}
          >
            {title}
          </Typography>
          <Box
            component="span"
            aria-hidden
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: 'primary.light',
              color: 'primary.main',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              '& .MuiSvgIcon-root': {
                width: 22,
                height: 22,
                fontSize: 22,
                display: 'block',
              },
            }}
          >
            <Icon fontSize="inherit" />
          </Box>
        </Box>

        <Box sx={{ width: '100%', mt: 'auto', pt: 1.5 }}>
          <ValueBlock value={display} subtitle={subtitle} />
        </Box>
      </CardContent>
    </Card>
  )
}

function ValueBlock({ value, subtitle }: { value: string; subtitle?: string }) {
  return (
    <Box sx={{ minWidth: 0, textAlign: 'left' }}>
      <Typography
        variant="h5"
        fontWeight={800}
        component="p"
        sx={{
          m: 0,
          lineHeight: 1.2,
          minHeight: 40,
          display: 'block',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
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
