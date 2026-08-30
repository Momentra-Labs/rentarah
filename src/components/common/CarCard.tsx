import BrokenImageOutlined from '@mui/icons-material/BrokenImageOutlined'
import FavoriteBorder from '@mui/icons-material/FavoriteBorder'
import Favorite from '@mui/icons-material/Favorite'
import PlaceOutlined from '@mui/icons-material/PlaceOutlined'
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined'
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
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { KeyboardEvent } from 'react'
import { memo, useEffect, useState } from 'react'

import { prefetchPath } from '@/lib/routePrefetch'
import { useCarsStore } from '@/store/useCarsStore'
import type { Car } from '@/types'
import { formatPeso } from '@/utils/formatCurrency'
import { getVehicleType, isTwoWheeler, VEHICLE_TYPE_LABELS } from '@/utils/vehicleUtils'

import StarRating from './StarRating'

export interface CarCardProps {
  car: Car | null | undefined
  layout?: 'grid' | 'list'
  onReserve?: (car: Car) => void
  onNavigate?: (car: Car) => void
  /** When true, show that this listing is free for the user’s selected trip dates. */
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
  const vehicleClass = getVehicleType(car)
  const twoWheeler = isTwoWheeler(car)
  const verifiedHost = car.hostTrips >= 10 && car.rating >= 4.5

  const go = () => onNavigate?.(car)
  const prefetchDetail = () => prefetchPath(`/cars/${car.id}`)

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      go()
    }
  }

  const mediaHeights = layout === 'grid' ? { xs: 196, sm: 228 } : { xs: 156, sm: 192 }

  const mediaBox = (
    <Box
      sx={{
        position: 'relative',
        flexShrink: 0,
        width: layout === 'list' ? { xs: '100%', sm: 200 } : '100%',
        height: mediaHeights,
        minHeight: mediaHeights,
        maxHeight: mediaHeights,
        boxSizing: 'border-box',
        borderRadius:
          layout === 'list' ? { xs: '16px 16px 0 0', sm: '16px 0 0 16px' } : '16px 16px 0 0',
        bgcolor: 'grey.200',
        overflow: 'hidden',
      }}
    >
      {showImagePlaceholder ? (
        <Box
          role="img"
          aria-label={`${title} — image unavailable`}
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'grey.500',
            bgcolor: 'grey.200',
            opacity: unavailable ? 0.55 : 1,
          }}
        >
          <BrokenImageOutlined sx={{ fontSize: { xs: 40, sm: 44 } }} aria-hidden />
        </Box>
      ) : (
        <Box
          component="img"
          src={image}
          srcSet={`${image} 1x`}
          sizes={
            layout === 'list'
              ? '(max-width: 600px) 100vw, 200px'
              : '(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw'
          }
          alt={title}
          onError={() => setImageFailed(true)}
          loading="lazy"
          decoding="async"
          sx={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: twoWheeler ? 'contain' : 'cover',
            objectPosition: 'center',
            bgcolor: twoWheeler ? 'grey.100' : 'grey.200',
            opacity: unavailable ? 0.55 : 1,
          }}
        />
      )}
      <Stack
        direction="row"
        spacing={0.75}
        sx={{
          position: 'absolute',
          top: 12,
          left: 12,
          alignItems: 'flex-start',
          maxWidth: 'calc(100% - 56px)',
          flexWrap: 'wrap',
        }}
      >
        <Chip
          label={VEHICLE_TYPE_LABELS[vehicleClass]}
          size="small"
          sx={{
            bgcolor: 'rgba(255,255,255,0.98)',
            color: 'primary.dark',
            fontWeight: 700,
          }}
        />
        {unavailable && <Chip label="Unavailable" color="error" size="small" />}
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
        onKeyDown={(e) => e.stopPropagation()}
      >
        {saved ? <Favorite color="error" /> : <FavoriteBorder />}
      </IconButton>
    </Box>
  )

  const body = (
    <CardContent
      sx={{
        pt: { xs: 1.5, sm: 2 },
        px: { xs: 1.5, sm: 2 },
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        pb: 0,
        '&:last-child': { pb: 0 },
      }}
    >
      <Stack spacing={1} sx={{ flex: 1, minHeight: 0 }}>
        <Typography
          variant="h6"
          component="p"
          color="primary.main"
          fontWeight={800}
          sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' }, lineHeight: 1.2, letterSpacing: '-0.02em' }}
        >
          {formatPeso(car.pricePerDay)}
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5, fontWeight: 600 }}>
            / day
          </Typography>
        </Typography>

        <Typography
          variant="subtitle1"
          fontWeight={700}
          title={title}
          sx={{
            fontSize: { xs: '0.9375rem', sm: '1rem' },
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
          }}
        >
          {title}
        </Typography>

        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0, flexWrap: 'wrap', gap: 0.5 }}>
          <PlaceOutlined sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} aria-hidden />
          <Typography
            variant="body2"
            color="text.secondary"
            fontWeight={600}
            sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
            noWrap
            title={car.location}
          >
            {car.location.split(',')[0]}
            {typeof distanceKm === 'number' ? ` · ${distanceKm} km` : ''}
          </Typography>
        </Stack>

        {showDateAvailabilityHint && !unavailable && (
          <Typography variant="body2" color="success.dark" fontWeight={700} sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
            Free for your dates
          </Typography>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
          {twoWheeler && car.engineCapacity
            ? `${car.engineCapacity} cc · ${car.transmission} · ${car.fuel}`
            : `${car.seats} seats · ${car.transmission} · ${car.fuel}`}
        </Typography>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={0.5}
          sx={{ mt: 'auto', pt: 0.75, minWidth: 0 }}
        >
          <StarRating value={car.rating} reviews={car.reviewCount} />
          <Stack direction="row" alignItems="center" spacing={0.35} sx={{ minWidth: 0 }}>
            {verifiedHost && (
              <VerifiedOutlined sx={{ fontSize: 16, color: 'success.main' }} aria-label="Verified host" />
            )}
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              title={`${car.hostTrips}+ trips with ${car.hostName}`}
            >
              {car.hostName}
            </Typography>
          </Stack>
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
        justifyContent: 'stretch',
        flexShrink: 0,
      }}
    >
      <Button
        variant="outlined"
        fullWidth
        size="medium"
        disabled={unavailable}
        sx={{ minHeight: 44, fontWeight: 700 }}
        onClick={(e) => {
          e.stopPropagation()
          ;(onReserve ?? onNavigate)?.(car)
        }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        Reserve
      </Button>
    </CardActions>
  )

  const cardSx = {
    cursor: onNavigate ? 'pointer' : 'default',
    borderColor: 'divider',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    outline: 'none',
    transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
    '@media (hover: hover) and (pointer: fine)': {
      '&:hover': {
        boxShadow: 'var(--rh-elev-2)',
        borderColor: alpha(theme.palette.text.primary, 0.22),
      },
    },
    '&:focus-visible': {
      boxShadow: 'var(--rh-focus-ring)',
      borderColor: 'primary.main',
    },
  }

  const cardProps = {
    variant: 'outlined' as const,
    role: onNavigate ? ('link' as const) : undefined,
    tabIndex: onNavigate ? 0 : undefined,
    'aria-label': onNavigate ? `${title}, ${formatPeso(car.pricePerDay)} per day` : undefined,
    onClick: onNavigate ? go : undefined,
    onKeyDown: onNavigate ? onKeyDown : undefined,
    onPointerEnter: onNavigate ? prefetchDetail : undefined,
    onFocus: onNavigate ? prefetchDetail : undefined,
  }

  if (layout === 'list') {
    return (
      <Card {...cardProps} sx={{ ...cardSx, height: '100%' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ flex: 1, minHeight: 0, alignItems: 'stretch' }}>
          {mediaBox}
          <Stack flex={1} minWidth={0} sx={{ display: 'flex', flexDirection: 'column' }}>
            {body}
            {actions}
          </Stack>
        </Stack>
      </Card>
    )
  }

  return (
    <Box sx={{ height: '100%', width: '100%', minWidth: 0 }}>
      <Card {...cardProps} sx={{ ...cardSx, width: '100%', minWidth: 0 }}>
        <Stack sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {mediaBox}
          {body}
          {actions}
        </Stack>
      </Card>
    </Box>
  )
}

export default memo(CarCard)
