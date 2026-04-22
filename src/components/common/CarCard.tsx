import FavoriteBorder from '@mui/icons-material/FavoriteBorder'
import Favorite from '@mui/icons-material/Favorite'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { motion } from 'framer-motion'

import type { Car } from '../../types'
import { formatPeso } from '../../utils/formatCurrency'
import { useCarsStore } from '../../store/useCarsStore'
import StarRating from './StarRating'

export interface CarCardProps {
  car: Car | null | undefined
  layout?: 'grid' | 'list'
  onReserve?: (car: Car) => void
  onNavigate?: (car: Car) => void
}

export default function CarCard({
  car,
  layout = 'grid',
  onReserve,
  onNavigate,
}: CarCardProps) {
  const toggleSaved = useCarsStore((s) => s.toggleSaved)
  const savedIds = useCarsStore((s) => s.savedCarIds)

  if (!car) return null

  const image = car.images[0]
  const title = `${car.year} ${car.make} ${car.model}`
  const unavailable = car.available === false
  const saved = savedIds.includes(car.id)

  const handleCardClick = () => onNavigate?.(car)

  const mediaBox = (
    <Box sx={{ position: 'relative', flexShrink: layout === 'list' ? 0 : undefined }}>
      <CardMedia
        component="img"
        src={image}
        alt={title}
        sx={{
          height: layout === 'grid' ? 220 : { xs: 160, sm: 180 },
          width: layout === 'list' ? { xs: '100%', sm: 200 } : '100%',
          objectFit: 'cover',
          borderRadius: layout === 'list' ? '12px 0 0 12px' : '16px 16px 0 0',
          opacity: unavailable ? 0.55 : 1,
        }}
      />
      <Chip
        label={car.tags[0] ?? car.type}
        size="small"
        sx={{
          position: 'absolute',
          top: 12,
          left: 12,
          bgcolor: '#EFF6FF',
          color: 'primary.main',
          fontWeight: 600,
        }}
      />
      <IconButton
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          bgcolor: 'rgba(255,255,255,0.9)',
          '&:hover': { bgcolor: 'white' },
        }}
        size="small"
        aria-label={saved ? 'Remove from saved' : 'Save car'}
        onClick={(e) => {
          e.stopPropagation()
          toggleSaved(car.id)
        }}
      >
        {saved ? <Favorite color="error" /> : <FavoriteBorder />}
      </IconButton>
      {unavailable && (
        <Chip label="Unavailable" color="error" sx={{ position: 'absolute', bottom: 12, left: 12 }} />
      )}
    </Box>
  )

  const body = (
    <CardContent sx={{ pt: layout === 'grid' ? 2 : 2, pb: 1 }}>
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>
            {title}
          </Typography>
          <Typography variant="subtitle1" color="primary.main" fontWeight={800}>
            {formatPeso(car.pricePerDay)}
            <Typography component="span" variant="caption" color="text.secondary">
              {' '}
              / day
            </Typography>
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {car.year} · {car.type} · {car.hostName}
        </Typography>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {[String(car.seats), car.transmission, car.fuel].map((label) => (
            <Chip key={label} label={label} size="small" variant="outlined" sx={{ bgcolor: '#F9FAFB' }} />
          ))}
        </Stack>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" spacing={1}>
          <StarRating value={car.rating} reviews={car.reviewCount} />
          <Typography variant="caption" color="text.secondary">
            {car.hostTrips}+ trips · {car.location.split(',')[0]}
          </Typography>
        </Stack>
      </Stack>
    </CardContent>
  )

  const actions = (
    <CardActions sx={{ px: 2, pb: 2, justifyContent: 'flex-end' }}>
      <Button
        variant="contained"
        disabled={unavailable}
        onClick={(e) => {
          e.stopPropagation()
          onReserve?.(car)
        }}
      >
        Reserve
      </Button>
    </CardActions>
  )

  const cardSx = {
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.08)',
    },
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  }

  if (layout === 'list') {
    return (
      <Card variant="outlined" onClick={handleCardClick} sx={{ ...cardSx }}>
        <Stack direction={{ xs: 'column', sm: 'row' }}>
          {mediaBox}
          <Stack flex={1}>
            {body}
            {actions}
          </Stack>
        </Stack>
      </Card>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card variant="outlined" onClick={handleCardClick} sx={{ height: '100%', ...cardSx }}>
        <Stack sx={{ flex: 1 }}>
          {mediaBox}
          {body}
          {actions}
        </Stack>
      </Card>
    </motion.div>
  )
}
