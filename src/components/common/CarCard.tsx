import BrokenImageOutlined from '@mui/icons-material/BrokenImageOutlined'
import FavoriteBorder from '@mui/icons-material/FavoriteBorder'
import Favorite from '@mui/icons-material/Favorite'
import PlaceOutlined from '@mui/icons-material/PlaceOutlined'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { memo, useEffect, useState } from 'react'

import type { Car } from '../../types'
import { formatPeso } from '../../utils/formatCurrency'
import { getVehicleType, isTwoWheeler, VEHICLE_TYPE_LABELS } from '../../utils/vehicleUtils'
import { useCarsStore } from '../../store/useCarsStore'
import StarRating from './StarRating'

export interface CarCardProps {
  car: Car | null | undefined
  layout?: 'grid' | 'list'
  onReserve?: (car: Car) => void
  onNavigate?: (car: Car) => void
  /** When true, show a chip that this listing is free for the user’s selected trip dates. */
  showDateAvailabilityHint?: boolean
  /** Distance from the user’s search area (km); omitted when unknown. */
  distanceKm?: number | null
}

function CarCard({
  car,
  layout = 'grid',
  onReserve,
  onNavigate,
  showDateAvailabilityHint = false,
  distanceKm,
}: CarCardProps) {
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm'))
  const toggleSaved = useCarsStore((s) => s.toggleSaved)
  const carIdForSaved = car?.id
  const saved = useCarsStore((s) => !!(carIdForSaved && s.savedCarIds.includes(carIdForSaved)))

  const primaryImage = car?.images[0] ?? ''
  const [imageFailed, setImageFailed] = useState(!primaryImage)
  const showImagePlaceholder = !primaryImage || imageFailed

  useEffect(() => {
    setImageFailed(!primaryImage)
  }, [car?.id, primaryImage])

  if (!car) return null

  const image = primaryImage
  const title = `${car.year} ${car.make} ${car.model}`
  const unavailable = car.available === false

  const handleCardClick = () => onNavigate?.(car)

  const vehicleClass = getVehicleType(car)
  const twoWheeler = isTwoWheeler(car)

  const mediaHeights = twoWheeler
    ? layout === 'grid'
      ? { xs: 200, sm: 248 }
      : { xs: 160, sm: 200 }
    : layout === 'grid'
      ? { xs: 180, sm: 220 }
      : { xs: 140, sm: 180 }

  const mediaBox = (
    <Box
      sx={{
        position: 'relative',
        flexShrink: 0,
        width: layout === 'list' ? { xs: '100%', sm: 200 } : '100%',
        height: mediaHeights,
        minHeight: mediaHeights,
        borderRadius:
          layout === 'list' ? { xs: '12px 12px 0 0', sm: '12px 0 0 12px' } : '16px 16px 0 0',
        bgcolor: 'grey.200',
        overflow: 'hidden',
      }}
    >
      {showImagePlaceholder ? (
        <Box
          role="img"
          aria-label={`${title} — image unavailable`}
          sx={{
            width: '100%',
            height: '100%',
            minHeight: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'grey.500',
            borderRadius: 'inherit',
            opacity: unavailable ? 0.55 : 1,
          }}
        >
          <BrokenImageOutlined sx={{ fontSize: { xs: 40, sm: 44 } }} aria-hidden />
        </Box>
      ) : (
        <Box
          component="img"
          src={image}
          alt={title}
          onError={() => setImageFailed(true)}
          loading="lazy"
          decoding="async"
          sx={{
            display: 'block',
            width: '100%',
            height: '100%',
            minHeight: 'inherit',
            objectFit: twoWheeler ? 'contain' : 'cover',
            objectPosition: 'center',
            bgcolor: twoWheeler ? 'grey.100' : 'grey.200',
            borderRadius: 'inherit',
            opacity: unavailable ? 0.55 : 1,
          }}
        />
      )}
      <Stack
        direction="column"
        spacing={0.75}
        sx={{
          position: 'absolute',
          top: 12,
          left: 12,
          alignItems: 'flex-start',
          maxWidth: 'calc(100% - 56px)',
        }}
      >
        <Chip
          label={VEHICLE_TYPE_LABELS[vehicleClass]}
          size="small"
          sx={{
            bgcolor: 'rgba(255,255,255,0.98)',
            color: 'primary.dark',
            fontWeight: 700,
            backdropFilter: 'none',
          }}
        />
        <Chip
          label={car.tags[0] ?? car.type}
          size="small"
          sx={{ bgcolor: '#EFF6FF', color: 'primary.main', fontWeight: 600 }}
        />
      </Stack>
      <IconButton
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          bgcolor: 'rgba(255,255,255,0.9)',
          '&:hover': { bgcolor: 'white' },
        }}
        size="small"
        aria-label={saved ? 'Remove from saved' : 'Save listing'}
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

  const contentPadding = { pt: layout === 'grid' ? { xs: 1.25, sm: 2 } : { xs: 1.25, sm: 2 }, px: { xs: 1.5, sm: 2 } }

  const body = (
    <CardContent
      sx={{
        ...contentPadding,
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        pb: 0,
        '&:last-child': { pb: 0 },
      }}
    >
      <Stack spacing={{ xs: 0.75, sm: 1 }} sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1} sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            title={title}
            sx={{
              flex: 1,
              minWidth: 0,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="subtitle1"
            color="primary.main"
            fontWeight={800}
            sx={{
              fontSize: { xs: '0.875rem', sm: '1rem' },
              flexShrink: 0,
              textAlign: 'right',
              alignSelf: 'flex-start',
              maxWidth: '42%',
              lineHeight: 1.25,
            }}
          >
            {formatPeso(car.pricePerDay)}
            <Typography component="span" variant="caption" color="text.secondary" sx={{ fontSize: 'inherit' }}>
              {' '}
              / day
            </Typography>
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0, flexShrink: 0, flexWrap: 'wrap', gap: 0.5 }}>
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
          {typeof distanceKm === 'number' && (
            <Chip
              label={`${distanceKm} km away`}
              size="small"
              variant="outlined"
              sx={{ height: 22, fontSize: '0.65rem', fontWeight: 600 }}
            />
          )}
        </Stack>
        {showDateAvailabilityHint && (
          <Chip
            label="Available for your dates"
            size="small"
            sx={{
              alignSelf: 'flex-start',
              bgcolor: 'success.50',
              color: 'success.dark',
              fontWeight: 700,
              border: '1px solid',
              borderColor: 'success.light',
            }}
          />
        )}
        <Typography
          variant="body2"
          color="text.secondary"
          title={`${car.year} · ${car.type} · ${car.hostName}`}
          sx={{
            fontSize: { xs: '0.7rem', sm: '0.8125rem' },
            lineHeight: 1.35,
            flexShrink: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
          }}
        >
          {car.year} · {car.type} · {car.hostName}
        </Typography>
        <Box
          sx={{
            minHeight: { xs: 24, sm: 26 },
            maxHeight: { xs: 50, sm: 54 },
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <Stack
            direction="row"
            spacing={0.5}
            flexWrap="wrap"
            useFlexGap
            sx={{ gap: { xs: 0.5, sm: 0.75 } }}
          >
            {(twoWheeler && car.engineCapacity
              ? [`${car.engineCapacity} cc`, car.transmission, car.fuel]
              : [String(car.seats), car.transmission, car.fuel]
            ).map((label, idx) => (
              <Chip
                key={`${idx}-${label}`}
                label={label}
                size="small"
                variant="outlined"
                sx={{
                  bgcolor: '#F9FAFB',
                  height: { xs: 22, sm: 24 },
                  maxWidth: '100%',
                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                  '& .MuiChip-label': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 120,
                  },
                }}
              />
            ))}
          </Stack>
        </Box>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={0.5}
          gap={0.5}
          sx={{ minWidth: 0, flexShrink: 0, mt: 'auto', pt: { xs: 0.5, sm: 0.75 } }}
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
              maxWidth: { xs: '50%', sm: '52%' },
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
    <CardActions
      sx={{
        px: { xs: 1.5, sm: 2 },
        pb: { xs: 1.5, sm: 2 },
        pt: { xs: 1, sm: 1.25 },
        justifyContent: 'flex-end',
        flexShrink: 0,
      }}
    >
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
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
    '@media (hover: hover) and (pointer: fine)': {
      '&:hover': {
        transform: 'none',
        boxShadow: '0 4px 14px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)',
        borderColor: alpha(theme.palette.text.primary, 0.22),
      },
    },
  }

  if (layout === 'list') {
    return (
      <Card variant="outlined" onClick={handleCardClick} sx={{ ...cardSx, height: '100%' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ flex: 1, minHeight: 0, alignItems: 'stretch' }}
        >
          {mediaBox}
          <Stack flex={1} minWidth={0} sx={{ display: 'flex', flexDirection: 'column' }}>
            {body}
            {actions}
          </Stack>
        </Stack>
      </Card>
    )
  }

  const gridCard = (
    <Card variant="outlined" onClick={handleCardClick} sx={{ ...cardSx, width: '100%', minWidth: 0 }}>
      <Stack sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {mediaBox}
        {body}
        {actions}
      </Stack>
    </Card>
  )

  return (
    <Box sx={{ height: '100%', width: '100%', minWidth: 0 }}>{gridCard}</Box>
  )
}

export default memo(CarCard)
