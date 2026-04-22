import Star from '@mui/icons-material/Star'
import {
  Avatar,
  Box,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material'

import type { Car } from '../../types'

type MockReview = {
  id: string
  initials: string
  name: string
  date: string
  rating: number
  text: string
}

/** Deterministic mock reviews + star histogram derived from listing stats. */
function buildMockData(car: Car): { reviews: MockReview[]; breakdownFiveToOne: number[] } {
  const idNum = parseInt(car.id.replace(/\D/g, ''), 10) || 1

  const templates: MockReview[][] = [
    [
      {
        id: 'r1',
        initials: 'AK',
        name: 'Alex K.',
        date: 'Mar 2026',
        rating: 5,
        text: 'Smooth handoff and the car was spotless. Would book again for weekend trips.',
      },
      {
        id: 'r2',
        initials: 'LM',
        name: 'Liza M.',
        date: 'Feb 2026',
        rating: 5,
        text: 'Great fuel economy and responsive host. Pickup in Makati was easy.',
      },
      {
        id: 'r3',
        initials: 'JR',
        name: 'Jigo R.',
        date: 'Jan 2026',
        rating: 4,
        text: 'Solid ride; only minor GPS lag on phone mount. Overall very happy.',
      },
    ],
    [
      {
        id: 'r1',
        initials: 'TC',
        name: 'Tricia C.',
        date: 'Apr 2026',
        rating: 5,
        text: 'Perfect for family errands — roomy and quiet on EDSA.',
      },
      {
        id: 'r2',
        initials: 'BV',
        name: 'Ben V.',
        date: 'Mar 2026',
        rating: 5,
        text: 'Host replied fast. Vehicle matched photos exactly.',
      },
      {
        id: 'r3',
        initials: 'SM',
        name: 'Sam M.',
        date: 'Feb 2026',
        rating: 5,
        text: 'Insurance add-on gave peace of mind. Five stars.',
      },
    ],
  ]

  const reviews = templates[idNum % templates.length]

  const weightsFiveToOne = [0.62, 0.18, 0.07, 0.05, 0.08]
  const breakdownFiveToOne = weightsFiveToOne.map((w) => Math.round(w * car.reviewCount))
  const sum = breakdownFiveToOne.reduce((a, b) => a + b, 0)
  const diff = car.reviewCount - sum
  if (diff !== 0 && breakdownFiveToOne.length > 0) {
    breakdownFiveToOne[0] += diff
  }

  return { reviews, breakdownFiveToOne }
}

export interface ReviewsListProps {
  car: Car
}

export default function ReviewsList({ car }: ReviewsListProps) {
  const { reviews, breakdownFiveToOne } = buildMockData(car)
  const maxBar = Math.max(...breakdownFiveToOne, 1)
  const starLabels = [5, 4, 3, 2, 1]
  const filledStars = Math.min(5, Math.round(car.rating))

  return (
    <Box sx={{ mt: 5 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Reviews
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="flex-start">
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, minWidth: { md: 200 } }}>
          <Typography variant="h2" fontWeight={800} color="primary.main">
            {car.rating.toFixed(1)}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.25}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                sx={{
                  fontSize: 22,
                  color: i < filledStars ? 'warning.main' : 'action.disabled',
                }}
              />
            ))}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Based on {car.reviewCount} reviews
          </Typography>
        </Paper>

        <Stack spacing={1} flex={1} sx={{ width: '100%' }}>
          {starLabels.map((starLabel, idx) => (
            <Stack key={starLabel} direction="row" alignItems="center" spacing={1}>
              <Typography variant="caption" sx={{ width: 28 }}>
                {starLabel}★
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(breakdownFiveToOne[idx] / maxBar) * 100}
                sx={{
                  flex: 1,
                  height: 8,
                  borderRadius: 1,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': { borderRadius: 1, bgcolor: 'primary.main' },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ width: 32, textAlign: 'right' }}>
                {breakdownFiveToOne[idx]}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>

      <Stack spacing={2} sx={{ mt: 3 }}>
        {reviews.map((r) => (
          <Paper key={r.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>{r.initials}</Avatar>
              <Box flex={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                  <Typography fontWeight={700}>{r.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {r.date}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.25} sx={{ my: 0.5 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      sx={{
                        fontSize: 18,
                        color: i < r.rating ? 'warning.main' : 'action.disabled',
                      }}
                    />
                  ))}
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {r.text}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  )
}
