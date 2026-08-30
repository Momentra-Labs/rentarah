import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline'
import ChevronLeft from '@mui/icons-material/ChevronLeft'
import ChevronRight from '@mui/icons-material/ChevronRight'
import LocationOn from '@mui/icons-material/LocationOn'
import {
  Alert,
  alpha,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  Link,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom'

import { MOBILE_TAB_BAR_INSET_PX } from '@/components/layout/MobileBottomNav'

import DateRangePicker from '@/components/common/DateRangePicker'
import PriceBreakdown from '@/components/common/PriceBreakdown'
import StarRating from '@/components/common/StarRating'
import UserAvatar from '@/components/common/UserAvatar'
import AvailabilityCalendar from '@/components/detail/AvailabilityCalendar'
import ReviewsList from '@/components/detail/ReviewsList'
import CarDetailSkeleton from '@/components/skeletons/CarDetailSkeleton'
import { useDateValidation } from '@/hooks/useDateValidation'
import { useT } from '@/hooks/useT'
import { useOfferGeoPrompt } from '@/hooks/useOfferGeoPrompt'
import { usePricing } from '@/hooks/usePricing'
import { useVehicles } from '@/hooks/useVehicles'
import { useAuthStore } from '@/store/useAuthStore'
import { useBookingStore } from '@/store/useBookingStore'
import { useCarsStore } from '@/store/useCarsStore'
import { useSearchStore } from '@/store/useSearchStore'
import { formatPeso } from '@/utils/formatCurrency'
import { getVehicleType, isTwoWheeler, VEHICLE_TYPE_LABELS } from '@/utils/vehicleUtils'
import PageHeader from '@/components/layout/PageHeader'
import RentaraMap from '@/components/map/RentaraMap'
import { containerGutters, listRowSurface, primaryCtaShadow, softInteractiveSurface } from '@/theme/pageStyles'
import { getCarPickupLatLng } from '@/utils/mapPickupLocation'
import { vehicleModelSearchPath } from '@/utils/vehicleBrowsePaths'
import { formatTripDateTime, withDefaultDropoffTime, withDefaultPickupTime } from '@/utils/dateUtils'
import { prefetchPath } from '@/lib/routePrefetch'
import { sameAreaListings, searchResultsPath } from '@/utils/searchLocation'

/** Match Browse search dates when opening from listings; else fallback window. */
function initialTripFromSearchStore(): { pickup: Dayjs; dropoff: Dayjs } {
  const { pickup: p, dropoff: d } = useSearchStore.getState()
  if (p?.isValid()) {
    if (d?.isValid() && d.isAfter(p, 'day')) {
      return { pickup: p, dropoff: d }
    }
    return { pickup: p, dropoff: withDefaultDropoffTime(p.startOf('day').add(3, 'day')) }
  }
  const t = dayjs()
  return {
    pickup: withDefaultPickupTime(t.add(1, 'day')),
    dropoff: withDefaultDropoffTime(t.add(4, 'day')),
  }
}

function ListingPhotoStage({
  images,
  alt,
  contain,
  height,
  index,
  onStep,
  showArrows,
}: {
  images: string[]
  alt: string
  contain: boolean
  height: { xs?: number; sm?: number; md?: number }
  index: number
  onStep: (delta: number) => void
  showArrows: boolean
}) {
  const touchStartX = useRef<number | null>(null)
  const didSwipe = useRef(false)
  const multi = images.length > 1

  return (
    <Box
      sx={{ position: 'relative', bgcolor: contain ? 'grey.100' : 'grey.200', borderRadius: { md: 3 }, overflow: 'hidden' }}
      onTouchStart={(e) => {
        touchStartX.current = e.changedTouches[0]?.clientX ?? null
        didSwipe.current = false
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current == null) return
        const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current
        touchStartX.current = null
        if (dx > 40) {
          didSwipe.current = true
          onStep(-1)
        } else if (dx < -40) {
          didSwipe.current = true
          onStep(1)
        }
      }}
    >
      <Box
        component="img"
        src={images[index]}
        alt={alt}
        onClick={() => {
          if (!multi || didSwipe.current) return
          onStep(1)
        }}
        sx={{
          width: '100%',
          height,
          objectFit: contain ? 'contain' : 'cover',
          display: 'block',
          cursor: multi ? 'pointer' : 'default',
        }}
      />
      {multi && (
        <Chip
          size="small"
          label={`${index + 1} / ${images.length}`}
          sx={{
            position: 'absolute',
            right: 12,
            bottom: 12,
            bgcolor: alpha('#0f172a', 0.72),
            color: '#fff',
            fontWeight: 700,
            backdropFilter: 'blur(6px)',
          }}
        />
      )}
      {showArrows && multi && (
        <>
          <IconButton
            aria-label="Previous photo"
            onClick={(e) => {
              e.stopPropagation()
              onStep(-1)
            }}
            sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: alpha('#fff', 0.92),
              '&:hover': { bgcolor: '#fff' },
            }}
            size="small"
          >
            <ChevronLeft />
          </IconButton>
          <IconButton
            aria-label="Next photo"
            onClick={(e) => {
              e.stopPropagation()
              onStep(1)
            }}
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: alpha('#fff', 0.92),
              '&:hover': { bgcolor: '#fff' },
            }}
            size="small"
          >
            <ChevronRight />
          </IconButton>
        </>
      )}
    </Box>
  )
}

export default function CarDetailPage() {
  const t = useT()
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const setSearchDates = useSearchStore((s) => s.setDates)
  const searchLocation = useSearchStore((s) => s.location)
  const searchPickup = useSearchStore((s) => s.pickup)
  const searchDropoff = useSearchStore((s) => s.dropoff)
  const cars = useCarsStore((s) => s.cars)
  const car = cars.find((c) => c.id === id)
  const { isLoading: vehiclesLoading } = useVehicles()
  const bookPanelRef = useRef<HTMLDivElement | null>(null)

  const hostNameParts = useMemo(() => {
    if (!car) return { first: '', last: '' }
    const parts = car.hostName.trim().split(/\s+/)
    return { first: parts[0] ?? '', last: parts.slice(1).join(' ') }
  }, [car])
  useOfferGeoPrompt('car-detail', Boolean(car))
  const user = useAuthStore((s) => s.user)
  const initBooking = useBookingStore((s) => s.initBooking)

  const [trip, setTrip] = useState<{ pickup: Dayjs | null; dropoff: Dayjs | null }>(() => {
    const i = initialTripFromSearchStore()
    return { pickup: i.pickup, dropoff: i.dropoff }
  })
  const { pickup, dropoff } = trip
  const [activeImg, setActiveImg] = useState(0)

  const { isRangeAvailable } = useDateValidation(car ?? null)
  const pricingHooks = usePricing(car ?? null, pickup, dropoff)

  const conflict = useMemo(() => {
    if (!pickup?.isValid() || !dropoff?.isValid() || !car) return false
    return !isRangeAvailable(pickup, dropoff)
  }, [pickup, dropoff, car, isRangeAvailable])

  const backToResults = searchResultsPath({
    location: searchLocation,
    pickup: searchPickup,
    dropoff: searchDropoff,
  })

  const sameArea = useMemo(() => (car ? sameAreaListings(car, cars, 3) : []), [car, cars])

  const imageCount = car?.images.length ?? 0
  const goPhoto = useCallback(
    (delta: number) => {
      if (imageCount < 2) return
      setActiveImg((i) => (i + delta + imageCount) % imageCount)
    },
    [imageCount],
  )

  useEffect(() => {
    setActiveImg(0)
  }, [id])

  useEffect(() => {
    if (imageCount < 2) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t?.closest('input, textarea, [contenteditable="true"]')) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPhoto(-1)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goPhoto(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goPhoto, imageCount])

  const canReserve = Boolean(pickup && dropoff && !conflict && car?.available)
  const nights = pricingHooks.pricing?.days ?? null
  const totalLabel =
    pricingHooks.pricing != null ? formatPeso(pricingHooks.pricing.total) : null

  if (vehiclesLoading && !car) {
    return <CarDetailSkeleton />
  }

  if (!car) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '50vh', py: 6 }}>
        <Container maxWidth="sm" sx={containerGutters}>
          <Paper elevation={0} sx={{ p: 4, ...softInteractiveSurface(theme, false) }}>
            <PageHeader title="We couldn’t find that vehicle" subtitle="It may have been removed. Head back to listings and keep browsing." dense />
            <Button component={RouterLink} to={backToResults} variant="contained" size="large" sx={{ mt: 2, borderRadius: 2, ...primaryCtaShadow(theme) }}>
              Back to results
            </Button>
          </Paper>
        </Container>
      </Box>
    )
  }

  const vehicleClass = getVehicleType(car)
  const twoWheeler = isTwoWheeler(car)
  const verifiedHost = car.hostTrips >= 10 && car.rating >= 4.5

  const reserve = () => {
    if (!pickup?.isValid() || !dropoff?.isValid() || conflict) return
    if (!user) {
      setSearchDates(pickup, dropoff)
      navigate(
        { pathname: location.pathname, search: location.search, hash: location.hash },
        { state: { auth: true, pendingBookCarId: car.id }, replace: false },
      )
      return
    }
    initBooking(car, pickup, dropoff)
    navigate(`/booking/${car.id}`)
  }

  const scrollToBook = () => {
    bookPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const stickyCtaLabel = !canReserve ? 'Choose dates' : user ? 'Reserve' : 'Continue'
  const stickyCtaAction = !canReserve ? scrollToBook : reserve

  const primaryTags = car.tags.slice(0, 3)

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        minHeight: '100vh',
        pb: { xs: `calc(${MOBILE_TAB_BAR_INSET_PX + 88}px + env(safe-area-inset-bottom, 0px))`, md: 10 },
      }}
    >
      {/* Mobile: edge-to-edge gallery first */}
      {!isMdUp && (
        <Box sx={{ position: 'relative' }}>
          <ListingPhotoStage
            images={car.images}
            alt={`${car.make} ${car.model}`}
            contain={twoWheeler}
            height={{ xs: 280, sm: 340 }}
            index={activeImg}
            onStep={goPhoto}
            showArrows={false}
          />
          {!car.available && (
            <Chip
              size="small"
              label="Unavailable"
              color="default"
              sx={{ position: 'absolute', left: 12, top: 12, fontWeight: 700, zIndex: 1 }}
            />
          )}
        </Box>
      )}

      {!isMdUp && car.images.length > 1 && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ px: 2, pt: 1.5, pb: 0.5, overflowX: 'auto', bgcolor: 'background.default' }}
          role="list"
          aria-label="Photo gallery"
        >
          {car.images.map((src, i) => (
            <Box
              key={src + i}
              component="button"
              type="button"
              role="listitem"
              aria-label={`Photo ${i + 1} of ${car.images.length}`}
              aria-current={activeImg === i ? 'true' : undefined}
              onClick={() => setActiveImg(i)}
              sx={{
                p: 0,
                width: 64,
                height: 48,
                flexShrink: 0,
                borderRadius: 1.5,
                cursor: 'pointer',
                overflow: 'hidden',
                opacity: activeImg === i ? 1 : 0.55,
                border: activeImg === i ? '2px solid' : '1px solid',
                borderColor: activeImg === i ? 'primary.main' : 'divider',
                bgcolor: twoWheeler ? 'grey.100' : 'transparent',
                '&:focus-visible': { boxShadow: 'var(--rh-focus-ring)', outline: 'none' },
              }}
            >
              <Box
                component="img"
                src={src}
                alt=""
                sx={{ display: 'block', width: '100%', height: '100%', objectFit: twoWheeler ? 'contain' : 'cover' }}
              />
            </Box>
          ))}
        </Stack>
      )}

      <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 3 }, ...containerGutters }}>
        <Link
          component={RouterLink}
          to={backToResults}
          underline="hover"
          color="primary"
          fontWeight={700}
          variant="body2"
          sx={{ display: { xs: 'inline-flex', sm: 'none' }, mb: 1.5, alignItems: 'center' }}
        >
          ← Back to results
        </Link>
        <Breadcrumbs
          separator={<ChevronRight fontSize="small" />}
          sx={{
            mb: { xs: 1.5, md: 2 },
            display: { xs: 'none', sm: 'flex' },
            flexWrap: 'wrap',
            '& .MuiBreadcrumbs-separator': { mx: 0.5 },
          }}
        >
          <Link component={RouterLink} to="/" underline="hover" color="inherit">
            Home
          </Link>
          <Link component={RouterLink} to={backToResults} underline="hover" color="inherit">
            Back to results
          </Link>
          <Typography color="text.primary" noWrap sx={{ maxWidth: 200 }}>
            {car.make} {car.model}
          </Typography>
        </Breadcrumbs>

        <Grid container spacing={{ xs: 2.5, md: 4 }}>
          {/* Title & summary — first on mobile after gallery */}
          <Grid item xs={12} md={8} order={{ xs: 1, md: 1 }}>
            {isMdUp && (
              <>
                <Box
                  sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                  }}
                >
                  <ListingPhotoStage
                    images={car.images}
                    alt={`${car.make} ${car.model}`}
                    contain={twoWheeler}
                    height={{ md: 480 }}
                    index={activeImg}
                    onStep={goPhoto}
                    showArrows
                  />
                </Box>
                <Stack direction="row" spacing={1} sx={{ mt: 2, overflowX: 'auto' }} role="list" aria-label="Photo gallery">
                  {car.images.map((src, i) => (
                    <Box
                      key={src + i}
                      component="button"
                      type="button"
                      role="listitem"
                      aria-label={`Photo ${i + 1} of ${car.images.length}`}
                      aria-current={activeImg === i ? 'true' : undefined}
                      onClick={() => setActiveImg(i)}
                      sx={{
                        p: 0,
                        width: 96,
                        height: 64,
                        flexShrink: 0,
                        borderRadius: 2,
                        cursor: 'pointer',
                        overflow: 'hidden',
                        opacity: activeImg === i ? 1 : 0.65,
                        border: activeImg === i ? '2px solid' : '1px solid',
                        borderColor: activeImg === i ? 'primary.main' : 'divider',
                        bgcolor: twoWheeler ? 'grey.100' : 'transparent',
                        '&:hover': { opacity: 1 },
                        '&:focus-visible': { boxShadow: 'var(--rh-focus-ring)', outline: 'none' },
                      }}
                    >
                      <Box
                        component="img"
                        src={src}
                        alt=""
                        sx={{
                          display: 'block',
                          width: '100%',
                          height: '100%',
                          objectFit: twoWheeler ? 'contain' : 'cover',
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </>
            )}

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center" sx={{ mt: { xs: 0.5, md: 2 }, mb: 1 }}>
              <Chip size="small" label={VEHICLE_TYPE_LABELS[vehicleClass]} color="primary" sx={{ fontWeight: 700 }} />
              {primaryTags.map((t) => (
                <Chip key={t} size="small" label={t} variant="outlined" />
              ))}
              {verifiedHost && (
                <Chip
                  size="small"
                  icon={<CheckCircleOutline sx={{ fontSize: '16px !important' }} />}
                  label="Verified host"
                  color="success"
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
              )}
            </Stack>

            <Typography
              variant="h2"
              component="h1"
              sx={{ mb: 1, fontWeight: 800, letterSpacing: '-0.03em', fontSize: { xs: '1.45rem', sm: '1.75rem', md: '2rem' } }}
            >
              {car.year} {car.make} {car.model}
            </Typography>

            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
              <StarRating value={car.rating} reviews={car.reviewCount} />
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                {car.hostTrips}+ trips
              </Typography>
            </Stack>

            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
              <LocationOn sx={{ fontSize: 18, color: 'primary.main' }} />
              <Typography variant="body2" fontWeight={650} color="text.primary">
                {car.location}
              </Typography>
            </Stack>

            <Link
              component={RouterLink}
              to={vehicleModelSearchPath(car)}
              underline="hover"
              fontWeight={650}
              color="primary"
              variant="body2"
              sx={{ display: 'inline-block', mb: { xs: 0, md: 1 } }}
            >
              Compare other hosts →
            </Link>
          </Grid>

          {/* Book panel — second on mobile so photos/title come first */}
          <Grid item xs={12} md={4} order={{ xs: 2, md: 2 }}>
            <Paper
              ref={bookPanelRef}
              id="book-panel"
              elevation={0}
              sx={{
                p: { xs: 2, md: 3 },
                position: { xs: 'static', md: 'sticky' },
                top: { md: 88 },
                scrollMarginTop: { xs: 88, md: 96 },
                borderRadius: 3,
                border: '1px solid',
                borderColor: (t) => alpha(t.palette.primary.main, 0.12),
                boxShadow: { xs: '0 8px 28px rgba(15,23,42,0.08)', md: '0 12px 40px rgba(15,23,42,0.08)' },
                bgcolor: 'background.paper',
              }}
            >
              <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1}>
                <Typography variant="h4" color="primary.main" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {formatPeso(car.pricePerDay)}
                  <Typography component="span" variant="body2" color="text.secondary" fontWeight={600}>
                    {' '}
                    / day
                  </Typography>
                </Typography>
                {nights != null && nights > 0 && (
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    {nights} {nights === 1 ? 'day' : 'days'}
                  </Typography>
                )}
              </Stack>

              {pickup?.isValid() && dropoff?.isValid() && (
                <Typography variant="body2" color="text.secondary" display="block" sx={{ mt: 0.75, fontWeight: 650, lineHeight: 1.4 }}>
                  {formatTripDateTime(pickup)} → {formatTripDateTime(dropoff)}
                </Typography>
              )}

              <Box sx={{ mt: 2 }}>
                <DateRangePicker
                  pickup={pickup}
                  dropoff={dropoff}
                  onChange={({ pickup: p, dropoff: d }) => {
                    setTrip({ pickup: p, dropoff: d })
                    if (p?.isValid() && d?.isValid()) setSearchDates(p, d)
                  }}
                  minDate={dayjs()}
                  pickupLabel={t('picker.pickup')}
                  dropoffLabel={t('picker.return')}
                  splitDateTime
                  timeGranularity="halfHourSelect"
                  mobileGroupedBoxes
                  showHumanReadableSummary
                  showPolicyCaption={false}
                  preferDesktopPickers
                  size="small"
                  spacing={1.25}
                />
              </Box>

              {conflict && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Those dates overlap a booked trip. Pick another range.
                </Alert>
              )}
              {!car.available && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  This listing is not available right now.
                </Alert>
              )}

              {pricingHooks.pricing && (
                <Box sx={{ mt: 2 }}>
                  <PriceBreakdown pricing={pricingHooks.pricing} pricePerDay={car.pricePerDay} />
                </Box>
              )}

              {isMdUp && (
                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  sx={{ mt: 2.5, py: 1.35, borderRadius: 999, fontSize: '1rem', fontWeight: 800, ...primaryCtaShadow(theme) }}
                  disabled={!canReserve}
                  onClick={reserve}
                >
                  {user ? 'Reserve' : 'Sign in to reserve'}
                </Button>
              )}

              <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mt: 1.25, lineHeight: 1.45 }}>
                No charge yet · Free cancel within 24h (demo)
              </Typography>

              <Divider sx={{ my: 2 }} />
              <Stack direction="row" spacing={1.5} alignItems="center">
                <UserAvatar
                  avatar={car.hostAvatar}
                  firstName={hostNameParts.first}
                  lastName={hostNameParts.last}
                  alt={car.hostName}
                  size={44}
                  sx={{ flexShrink: 0 }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontWeight={800} noWrap>
                    {car.hostName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Responds {car.hostResponseTime}
                    {verifiedHost ? ' · Verified' : ''}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {sameArea.length > 0 && (
              <Paper elevation={0} sx={{ mt: 2, p: { xs: 2, md: 2.25 }, ...listRowSurface(theme) }}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.25 }}>
                  More in this area
                </Typography>
                <Stack spacing={1}>
                  {sameArea.map((other) => (
                    <Box
                      key={other.id}
                      component={RouterLink}
                      to={`/cars/${other.id}`}
                      onPointerEnter={() => prefetchPath(`/cars/${other.id}`)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                        textDecoration: 'none',
                        color: 'inherit',
                        borderRadius: 2,
                        p: 0.5,
                        '&:hover': { bgcolor: 'action.hover' },
                        '&:focus-visible': { boxShadow: 'var(--rh-focus-ring)', outline: 'none' },
                      }}
                    >
                      <Box
                        component="img"
                        src={other.images[0]}
                        alt=""
                        sx={{
                          width: 64,
                          height: 48,
                          borderRadius: 1.5,
                          objectFit: isTwoWheeler(other) ? 'contain' : 'cover',
                          bgcolor: 'grey.100',
                          flexShrink: 0,
                        }}
                      />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>
                          {other.year} {other.make} {other.model}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {other.location}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={800} color="primary.main" sx={{ flexShrink: 0 }}>
                        {formatPeso(other.pricePerDay)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            )}
          </Grid>

          {/* Long-form details */}
          <Grid item xs={12} md={8} order={{ xs: 3, md: 3 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 1, fontWeight: 800, letterSpacing: '-0.02em' }}>
              {twoWheeler ? 'About this vehicle' : 'About this car'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.65 }}>
              {car.description}
            </Typography>

            {twoWheeler && (car.engineCapacity != null || car.transmissionType != null || car.helmetIncluded != null) && (
              <Stack direction="row" flexWrap="wrap" useFlexGap gap={1} sx={{ mt: 2 }}>
                {car.engineCapacity != null && (
                  <Chip size="small" variant="outlined" label={`${car.engineCapacity} cc`} />
                )}
                {car.transmissionType != null && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={car.transmissionType === 'automatic' ? 'Automatic' : 'Manual'}
                  />
                )}
                {car.helmetIncluded != null && (
                  <Chip
                    size="small"
                    variant="outlined"
                    color={car.helmetIncluded ? 'success' : 'default'}
                    label={car.helmetIncluded ? 'Helmet included' : 'No helmet'}
                  />
                )}
              </Stack>
            )}

            <Typography variant="h6" component="h2" sx={{ mt: 3.5, mb: 1.25, fontWeight: 800, letterSpacing: '-0.02em' }}>
              What&apos;s included
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {car.features.map((f) => (
                <Chip key={f} size="small" label={f} variant="outlined" sx={{ fontWeight: 600 }} />
              ))}
            </Stack>

            <AvailabilityCalendar car={car} pickup={pickup} dropoff={dropoff} />

            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, mt: 3.5, ...listRowSurface(theme) }}>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <LocationOn color="primary" />
                <Box>
                  <Typography variant="subtitle1" fontWeight={800}>
                    Pickup location
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {car.location}
                  </Typography>
                </Box>
              </Stack>
              <Box sx={{ mt: 2 }}>
                <RentaraMap hostLocation={getCarPickupLatLng(car)} />
              </Box>
            </Paper>

            <ReviewsList car={car} />
          </Grid>
        </Grid>
      </Container>

      {!isMdUp && (
        <Paper
          elevation={12}
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: theme.zIndex.appBar,
            borderRadius: '16px 16px 0 0',
            borderTop: '1px solid',
            borderColor: (t) => alpha(t.palette.primary.main, 0.1),
            px: 2,
            pt: 1.5,
            pb: `calc(12px + ${MOBILE_TAB_BAR_INSET_PX}px + env(safe-area-inset-bottom, 0px))`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: 'background.paper',
            boxShadow: '0 -8px 32px rgba(15,23,42,0.12)',
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            {totalLabel && canReserve ? (
              <>
                <Typography variant="caption" color="text.secondary" fontWeight={650} display="block">
                  Total{nights ? ` · ${nights}d` : ''}
                </Typography>
                <Typography variant="subtitle1" fontWeight={800} color="primary.main" noWrap>
                  {totalLabel}
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="caption" color="text.secondary" fontWeight={650} display="block">
                  From
                </Typography>
                <Typography variant="subtitle1" fontWeight={800} color="primary.main" noWrap>
                  {formatPeso(car.pricePerDay)}
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5, fontWeight: 600 }}>
                    / day
                  </Typography>
                </Typography>
              </>
            )}
          </Box>
          <Button
            variant="contained"
            size="large"
            disabled={canReserve ? !car.available : false}
            onClick={stickyCtaAction}
            startIcon={canReserve ? undefined : <CalendarMonthOutlined />}
            sx={{
              flexShrink: 0,
              minWidth: 132,
              borderRadius: 999,
              px: 2.5,
              fontWeight: 800,
              textTransform: 'none',
              ...primaryCtaShadow(theme),
            }}
          >
            {stickyCtaLabel}
          </Button>
        </Paper>
      )}
    </Box>
  )
}
