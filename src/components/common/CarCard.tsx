import FavoriteBorder from '@mui/icons-material/FavoriteBorder'
import Favorite from '@mui/icons-material/Favorite'
import PlaceOutlined from '@mui/icons-material/PlaceOutlined'
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
  useMediaQuery,
  useTheme,
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
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm'))
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
          height: layout === 'grid' ? { xs: 180, sm: 220 } : { xs: 140, sm: 180 },
          width: layout === 'list' ? { xs: '100%', sm: 200 } : '100%',
          objectFit: 'cover',
          borderRadius:
            layout === 'list'
              ? { xs: '12px 12px 0 0', sm: '12px 0 0 12px' }
              : '16px 16px 0 0',
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
    <CardContent
      sx={{
        pt: layout === 'grid' ? { xs: 1.25, sm: 2 } : { xs: 1.25, sm: 2 },
        pb: { xs: 0.75, sm: 1 },
        px: { xs: 1.5, sm: 2 },
      }}
    >
      <Stack spacing={{ xs: 0.75, sm: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{
              flex: 1,
              minWidth: 0,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              lineHeight: 1.3,
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="subtitle1"
            color="primary.main"
            fontWeight={800}
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, flexShrink: 0, textAlign: 'right' }}
          >
            {formatPeso(car.pricePerDay)}
            <Typography component="span" variant="caption" color="text.secondary" sx={{ fontSize: 'inherit' }}>
              {' '}
              / day
            </Typography>
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
          <PlaceOutlined sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0, opacity: 0.9 }} aria-hidden />
          <Typography
            variant="body2"
            color="text.primary"
            fontWeight={600}
            sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, lineHeight: 1.35, minWidth: 0 }}
            noWrap
            title={car.location}
          >
            {car.location.split(',')[0]}
          </Typography>
        </Stack>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: { xs: '0.7rem', sm: '0.8125rem' }, lineHeight: 1.35 }}
        >
          {car.year} · {car.type} · {car.hostName}
        </Typography>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ gap: { xs: 0.5, sm: 0.75 } }}>
          {[String(car.seats), car.transmission, car.fuel].map((label) => (
            <Chip
              key={label}
              label={label}
              size="small"
              variant="outlined"
              sx={{
                bgcolor: '#F9FAFB',
                height: { xs: 22, sm: 24 },
                fontSize: { xs: '0.65rem', sm: '0.75rem' },
              }}
            />
          ))}
        </Stack>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={0.5}
          gap={0.5}
          sx={{ minWidth: 0 }}
        >
          <StarRating value={car.rating} reviews={car.reviewCount} />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              lineHeight: 1.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: { xs: '52%', sm: '55%' },
              textAlign: 'right',
            }}
            title={`${car.hostTrips}+ trips with ${car.hostName}`}
          >
            {car.hostTrips}+ trips
          </Typography>
        </Stack>
      </Stack>
    </CardContent>
  )

  const actions = (
    <CardActions sx={{ px: { xs: 1.5, sm: 2 }, pb: { xs: 1.5, sm: 2 }, pt: 0, justifyContent: 'flex-end' }}>
      <Button
        variant="contained"
        size={isXs ? 'small' : 'medium'}
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
    borderColor: 'divider',
    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06)',
      borderColor: 'action.hover',
    },
    transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.2s ease',
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
