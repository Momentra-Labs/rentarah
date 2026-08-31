import BrokenImageOutlined from '@mui/icons-material/BrokenImageOutlined'
import FavoriteBorder from '@mui/icons-material/FavoriteBorder'
import Favorite from '@mui/icons-material/Favorite'
import PlaceOutlined from '@mui/icons-material/PlaceOutlined'
import Star from '@mui/icons-material/Star'
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined'
import { Box, IconButton, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { KeyboardEvent } from 'react'
import { memo, useEffect, useState } from 'react'

import { useT } from '@/hooks/useT'
import { prefetchPath } from '@/lib/routePrefetch'
import { useCarsStore } from '@/store/useCarsStore'
import { rhElev, rhRadius } from '@/theme/tokens'
import type { Car } from '@/types'
import { formatPeso } from '@/utils/formatCurrency'
import { getVehicleType, isTwoWheeler, VEHICLE_TYPE_LABELS } from '@/utils/vehicleUtils'

export interface CarCardProps {
  car: Car | null | undefined
  layout?: 'grid' | 'list'
  /** @deprecated Card click opens the listing; kept so browse callers do not break. */
  onReserve?: (car: Car) => void
  onNavigate?: (car: Car) => void
  /** When true, show that this listing is free for the user’s selected trip dates. */
  showDateAvailabilityHint?: boolean
  /** Distance from the user’s search area (km); omitted when unknown. */
  distanceKm?: number | null
}

const GRID_PHOTO_H = { xs: 220, sm: 240 }
const LIST_PHOTO_H_XS = 200
const LIST_PHOTO_W_SM = 268

function CarCard({
  car,
  layout = 'grid',
  onNavigate,
  showDateAvailabilityHint = false,
  distanceKm,
}: CarCardProps) {
  const t = useT()
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
  const isList = layout === 'list'
  const ratingLabel = Number.isFinite(car.rating) ? car.rating.toFixed(1) : null

  const go = () => onNavigate?.(car)
  const prefetchDetail = () => prefetchPath(`/cars/${car.id}`)

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      go()
    }
  }

  const specLine =
    twoWheeler && car.engineCapacity
      ? `${VEHICLE_TYPE_LABELS[vehicleClass]} · ${car.engineCapacity} cc · ${car.transmission} · ${car.fuel}`
      : `${VEHICLE_TYPE_LABELS[vehicleClass]} · ${car.seats} seats · ${car.transmission} · ${car.fuel}`

  const mediaBox = (
    <Box
      sx={{
        position: 'relative',
        flexShrink: 0,
        width: isList ? { xs: '100%', sm: LIST_PHOTO_W_SM } : '100%',
        height: isList ? { xs: LIST_PHOTO_H_XS, sm: 'auto' } : GRID_PHOTO_H,
        minHeight: isList ? { xs: LIST_PHOTO_H_XS, sm: 200 } : GRID_PHOTO_H,
        alignSelf: 'stretch',
        boxSizing: 'border-box',
        borderRadius: `${rhRadius.lg}px`,
        bgcolor: twoWheeler ? 'grey.100' : 'grey.200',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s ease',
        '@media (hover: hover) and (pointer: fine)': {
          '.listing-card:hover &': { boxShadow: rhElev.elev2 },
        },
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
            isList
              ? `(max-width: 600px) 100vw, ${LIST_PHOTO_W_SM}px`
              : '(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw'
          }
          alt={title}
          onError={() => setImageFailed(true)}
          loading="lazy"
          decoding="async"
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: twoWheeler ? 'contain' : 'cover',
            objectPosition: 'center',
            bgcolor: twoWheeler ? 'grey.50' : 'grey.200',
            opacity: unavailable ? 0.55 : 1,
            transition: 'transform 0.35s ease',
            '@media (hover: hover) and (pointer: fine)': {
              '.listing-card:hover &': { transform: twoWheeler ? 'none' : 'scale(1.04)' },
            },
          }}
        />
      )}

      <Stack
        direction="row"
        spacing={0.75}
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          alignItems: 'flex-start',
          maxWidth: 'calc(100% - 52px)',
          flexWrap: 'wrap',
        }}
      >
        {unavailable ? (
          <Box
            component="span"
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: `${rhRadius.pill}px`,
              bgcolor: 'error.main',
              color: 'common.white',
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.01em',
              lineHeight: 1.4,
            }}
          >
            Unavailable
          </Box>
        ) : null}
      </Stack>

      <IconButton
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 36,
          height: 36,
          bgcolor: (th) => alpha(th.palette.common.white, 0.92),
          boxShadow: '0 1px 6px rgba(15,23,42,0.16)',
          '&:hover': { bgcolor: 'common.white' },
        }}
        size="small"
        aria-label={saved ? 'Remove from saved' : 'Save listing'}
        onClick={(e) => {
          e.stopPropagation()
          toggleSaved(car.id)
        }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {saved ? <Favorite color="error" fontSize="small" /> : <FavoriteBorder fontSize="small" />}
      </IconButton>
    </Box>
  )

  const ratingBlock = ratingLabel ? (
    <Stack direction="row" alignItems="center" spacing={0.4} sx={{ flexShrink: 0 }}>
      <Star sx={{ fontSize: 15, color: 'text.primary' }} aria-hidden />
      <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ lineHeight: 1 }}>
        {ratingLabel}
      </Typography>
      {car.reviewCount > 0 ? (
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
          ({car.reviewCount})
        </Typography>
      ) : null}
    </Stack>
  ) : null

  const hostBlock = (
    <Stack direction="row" alignItems="center" spacing={0.35} sx={{ minWidth: 0 }}>
      {verifiedHost && (
        <VerifiedOutlined sx={{ fontSize: 15, color: 'success.main' }} aria-label="Verified host" />
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
  )

  const priceBlock = (
    <Typography
      component="p"
      fontWeight={800}
      color="text.primary"
      sx={{ fontSize: { xs: '0.9375rem', sm: '1rem' }, lineHeight: 1.25, letterSpacing: '-0.02em' }}
    >
      {formatPeso(car.pricePerDay)}
      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5, fontWeight: 600 }}>
        {t('common.perDay')}
      </Typography>
    </Typography>
  )

  const locationLine = (
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
      <PlaceOutlined sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} aria-hidden />
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontSize: '0.8125rem', fontWeight: 500 }}
        noWrap
        title={car.location}
      >
        {car.location.split(',')[0]}
        {typeof distanceKm === 'number' ? ` · ${distanceKm} km` : ''}
      </Typography>
    </Stack>
  )

  const body = (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        pt: isList ? { xs: 0, sm: 0.25 } : 1.25,
        pb: 0.5,
        gap: 0.5,
      }}
    >
      {isList ? (
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          spacing={1}
          sx={{ minWidth: 0 }}
        >
          <Typography
            variant="subtitle1"
            fontWeight={700}
            title={title}
            sx={{
              fontSize: { xs: '0.9375rem', sm: '1.0625rem' },
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
              minWidth: 0,
            }}
          >
            {title}
          </Typography>
          {ratingBlock}
        </Stack>
      ) : (
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
      )}

      {locationLine}

      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
        {specLine}
      </Typography>

      {showDateAvailabilityHint && !unavailable ? (
        <Typography variant="caption" color="success.dark" fontWeight={700}>
          Free for your dates
        </Typography>
      ) : null}

      {isList ? (
        <Stack
          direction="row"
          alignItems="flex-end"
          justifyContent="space-between"
          spacing={1}
          sx={{ mt: 'auto', pt: 1.25, minWidth: 0 }}
        >
          {hostBlock}
          {priceBlock}
        </Stack>
      ) : (
        <>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={0.75}
            sx={{ minWidth: 0, pt: 0.25 }}
          >
            {ratingBlock}
            {hostBlock}
          </Stack>
          <Box sx={{ mt: 'auto', pt: 0.75 }}>{priceBlock}</Box>
        </>
      )}
    </Box>
  )

  return (
    <Box
      className="listing-card"
      role={onNavigate ? 'link' : undefined}
      tabIndex={onNavigate ? 0 : undefined}
      aria-label={onNavigate ? `${title}, ${formatPeso(car.pricePerDay)} per day` : undefined}
      onClick={onNavigate ? go : undefined}
      onKeyDown={onNavigate ? onKeyDown : undefined}
      onPointerEnter={onNavigate ? prefetchDetail : undefined}
      onFocus={onNavigate ? prefetchDetail : undefined}
      sx={{
        cursor: onNavigate ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        minWidth: 0,
        outline: 'none',
        borderRadius: `${rhRadius.lg}px`,
        '&:focus-visible': {
          boxShadow: 'var(--rh-focus-ring)',
        },
      }}
    >
      {isList ? (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1.25, sm: 2.5 }}
          sx={{ flex: 1, minHeight: 0, alignItems: 'stretch' }}
        >
          {mediaBox}
          {body}
        </Stack>
      ) : (
        <>
          {mediaBox}
          {body}
        </>
      )}
    </Box>
  )
}

export default memo(CarCard)
