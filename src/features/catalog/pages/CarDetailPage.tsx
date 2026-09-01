import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline'
import ChevronRight from '@mui/icons-material/ChevronRight'
import PlaceOutlined from '@mui/icons-material/PlaceOutlined'
import Star from '@mui/icons-material/Star'
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined'
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Container,
  Divider,
  Grid,
  Link,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import type { Theme } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { useMemo, useRef, useState } from 'react'
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom'

import {
  MOBILE_FOOTER_ADDITIONAL_CLEAR_PX,
  MOBILE_TAB_BAR_INSET_PX,
  MOBILE_TAB_BAR_STACK_BOTTOM,
} from '@/components/layout/MobileBottomNav'
import DateRangePicker from '@/components/common/DateRangePicker'
import PriceBreakdown from '@/components/common/PriceBreakdown'
import UserAvatar from '@/components/common/UserAvatar'
import AvailabilityCalendar from '@/components/detail/AvailabilityCalendar'
import ReviewsList from '@/components/detail/ReviewsList'
import CarDetailSkeleton from '@/components/skeletons/CarDetailSkeleton'
import ListingPhotoGallery from '@/features/catalog/components/ListingPhotoGallery'
import ListingShareControl from '@/features/catalog/components/ListingShareControl'
import VehicleFacts from '@/features/catalog/components/VehicleFacts'
import TripClockSummary from '@/features/landing/components/TripClockSummary'
import { useDateValidation } from '@/hooks/useDateValidation'
import { useT } from '@/hooks/useT'
import { useOfferGeoPrompt } from '@/hooks/useOfferGeoPrompt'
import { usePricing } from '@/hooks/usePricing'
import { useVehicles } from '@/hooks/useVehicles'
import { prefetchPath } from '@/lib/routePrefetch'
import { useAuthStore } from '@/store/useAuthStore'
import { useBookingStore } from '@/store/useBookingStore'
import { useCarsStore } from '@/store/useCarsStore'
import { useSearchStore } from '@/store/useSearchStore'
import PageHeader from '@/components/layout/PageHeader'
import RentaraMap from '@/components/map/RentaraMap'
import { containerGutters, detailSectionHeadingSx, listRowSurface, primaryCtaShadow, softInteractiveSurface } from '@/theme/pageStyles'
import { rhElev, rhRadius } from '@/theme/tokens'
import type { Car } from '@/types'
import { formatPeso } from '@/utils/formatCurrency'
import { getCarPickupLatLng } from '@/utils/mapPickupLocation'
import { sameAreaListings, searchResultsPath } from '@/utils/searchLocation'
import { withDefaultDropoffTime, withDefaultPickupTime } from '@/utils/dateUtils'
import { vehicleModelSearchPath } from '@/utils/vehicleBrowsePaths'
import { isTwoWheeler } from '@/utils/vehicleUtils'

const DETAIL_STICKY_RESERVE_PX = 64

/** Match Browse search dates when opening from listings; else fallback window. */
function initialTripFromSearchStore(): { pickup: Dayjs; dropoff: Dayjs } {
  const { pickup: p, dropoff: d } = useSearchStore.getState()
  if (p?.isValid()) {
    if (d?.isValid() && d.isAfter(p, 'day')) {
      return { pickup: p, dropoff: d }
    }
    return { pickup: p, dropoff: withDefaultDropoffTime(p.startOf('day').add(3, 'day')) }
  }
  const now = dayjs()
  return {
    pickup: withDefaultPickupTime(now.add(1, 'day')),
    dropoff: withDefaultDropoffTime(now.add(4, 'day')),
  }
}

function HostRow({ car, verified }: { car: Car; verified: boolean }) {
  const t = useT()
  const parts = car.hostName.trim().split(/\s+/)
  const first = parts[0] ?? ''
  const last = parts.slice(1).join(' ')

  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <UserAvatar
        avatar={car.hostAvatar}
        firstName={first}
        lastName={last}
        alt={car.hostName}
        size={44}
        sx={{ flexShrink: 0 }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
          {verified ? (
            <VerifiedOutlined sx={{ fontSize: 16, color: 'success.main', flexShrink: 0 }} aria-label={t('detail.verifiedHost')} />
          ) : null}
          <Typography fontWeight={800} noWrap>
            {car.hostName}
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" noWrap>
          {t('detail.hostResponds', { time: car.hostResponseTime })} · {t('detail.trips', { count: car.hostTrips })}
        </Typography>
      </Box>
    </Stack>
  )
}

function SameAreaPanel({ listings, theme }: { listings: Car[]; theme: Theme }) {
  const t = useT()
  if (listings.length === 0) return null
  return (
    <Paper elevation={0} sx={{ mt: 2, p: { xs: 2, md: 2.25 }, ...listRowSurface(theme) }}>
      <Typography variant="h6" component="h2" sx={{ ...detailSectionHeadingSx, mb: 1.25 }}>
        {t('detail.moreInArea')}
      </Typography>
      <Stack spacing={1}>
        {listings.map((other) => (
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
            <Typography variant="body2" fontWeight={800} color="text.primary" sx={{ flexShrink: 0 }}>
              {formatPeso(other.pricePerDay)}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
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
  const toggleSaved = useCarsStore((s) => s.toggleSaved)
  const car = cars.find((c) => c.id === id)
  const saved = useCarsStore((s) => !!(id && s.savedCarIds.includes(id)))
  const { isLoading: vehiclesLoading } = useVehicles()
  const bookPanelRef = useRef<HTMLDivElement | null>(null)

  useOfferGeoPrompt('car-detail', Boolean(car))
  const user = useAuthStore((s) => s.user)
  const initBooking = useBookingStore((s) => s.initBooking)

  const [trip, setTrip] = useState<{ pickup: Dayjs | null; dropoff: Dayjs | null }>(() => {
    const i = initialTripFromSearchStore()
    return { pickup: i.pickup, dropoff: i.dropoff }
  })
  const { pickup, dropoff } = trip

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

  const canReserve = Boolean(pickup && dropoff && !conflict && car?.available)
  const nights = pricingHooks.pricing?.days ?? null
  const totalLabel = pricingHooks.pricing != null ? formatPeso(pricingHooks.pricing.total) : null

  if (vehiclesLoading && !car) {
    return <CarDetailSkeleton />
  }

  if (!car) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '50vh', py: 6 }}>
        <Container maxWidth="sm" sx={containerGutters}>
          <Paper elevation={0} sx={{ p: 4, ...softInteractiveSurface(theme, false) }}>
            <PageHeader title={t('detail.notFoundTitle')} subtitle={t('detail.notFoundSubtitle')} dense />
            <Button
              component={RouterLink}
              to={backToResults}
              variant="contained"
              size="large"
              sx={{ mt: 2, borderRadius: 2, ...primaryCtaShadow(theme) }}
            >
              {t('detail.backToResults')}
            </Button>
          </Paper>
        </Container>
      </Box>
    )
  }

  const twoWheeler = isTwoWheeler(car)
  const verifiedHost = car.hostTrips >= 10 && car.rating >= 4.5
  const specLine =
    twoWheeler && car.engineCapacity
      ? `${car.type} · ${car.engineCapacity} cc · ${car.transmission} · ${car.fuel}`
      : `${car.type} · ${t('detail.specSeats', { count: car.seats })} · ${car.transmission} · ${car.fuel}`
  const ratingLabel = Number.isFinite(car.rating) ? car.rating.toFixed(1) : null

  const bookPickerFieldSx = useMemo(
    () => ({
      '& .MuiOutlinedInput-root': {
        borderRadius: 2,
        bgcolor: (th: Theme) =>
          th.palette.mode === 'dark' ? alpha(th.palette.common.white, 0.06) : alpha(th.palette.grey[50], 0.96),
        '&:hover': {
          bgcolor: (th: Theme) => alpha(th.palette.primary.main, th.palette.mode === 'dark' ? 0.1 : 0.045),
        },
        '&.Mui-focused': {
          bgcolor: 'background.paper',
        },
      },
    }),
    [],
  )

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

  const ctaLabel = !canReserve ? t('detail.chooseDates') : user ? t('detail.reserve') : t('detail.signInReserve')
  const stickyCtaAction = !canReserve ? scrollToBook : reserve

  const gallery = (
    <ListingPhotoGallery
      images={car.images}
      alt={`${car.year} ${car.make} ${car.model}`}
      contain={twoWheeler}
      unavailable={!car.available}
      saved={saved}
      onToggleSaved={() => toggleSaved(car.id)}
      variant={isMdUp ? 'desktop' : 'mobile'}
      share={{
        carId: car.id,
        title: `${car.year} ${car.make} ${car.model}`,
        location: car.location,
        priceLabel: formatPeso(car.pricePerDay),
      }}
    />
  )

  const shareControl = (
    <ListingShareControl
      carId={car.id}
      title={`${car.year} ${car.make} ${car.model}`}
      location={car.location}
      priceLabel={formatPeso(car.pricePerDay)}
      variant="button"
    />
  )

  const titleBlock = (
    <Box sx={{ mt: { xs: 0.5, md: 2.5 } }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start" justifyContent="space-between">
        <Typography
          variant="h2"
          component="h1"
          sx={{ mb: 0.75, fontWeight: 800, letterSpacing: '-0.03em', fontSize: { xs: '1.45rem', sm: '1.75rem', md: '2rem' }, minWidth: 0 }}
        >
          {car.year} {car.make} {car.model}
        </Typography>
        {shareControl}
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
        {specLine}
      </Typography>
      <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.75 }}>
        {ratingLabel ? (
          <Stack direction="row" alignItems="center" spacing={0.4}>
            <Star sx={{ fontSize: 16, color: 'text.primary' }} aria-hidden />
            <Typography variant="body2" fontWeight={700}>
              {ratingLabel}
            </Typography>
            {car.reviewCount > 0 ? (
              <Typography variant="body2" color="text.secondary">
                ({car.reviewCount})
              </Typography>
            ) : null}
          </Stack>
        ) : null}
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          {t('detail.trips', { count: car.hostTrips })}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
        <PlaceOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
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
        sx={{ display: 'inline-block' }}
      >
        {t('detail.compareHosts')} →
      </Link>
    </Box>
  )

  const bookPanel = (
    <Paper
      ref={bookPanelRef}
      id="book-panel"
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.25 },
        pb: { xs: 2.25, md: 2.75 },
        position: { xs: 'static', md: 'sticky' },
        top: { md: 88 },
        scrollMarginTop: { xs: 88, md: 96 },
        borderRadius: `${rhRadius.lg}px`,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: rhElev.elev2,
        bgcolor: 'background.paper',
      }}
    >
      <Typography sx={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: { xs: '1.5rem', md: '1.75rem' }, lineHeight: 1.2 }}>
        {formatPeso(car.pricePerDay)}
        <Typography component="span" variant="body2" color="text.secondary" fontWeight={600}>
          {' '}
          {t('common.perDay')}
        </Typography>
      </Typography>

      <Box sx={{ mt: 1.75 }}>
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
          stacked
          size="small"
          spacing={1.5}
          showHumanReadableSummary={false}
          showPolicyCaption={false}
          preferDesktopPickers
          slotProps={{
            textField: { sx: bookPickerFieldSx },
          }}
        />
      </Box>

      {pickup?.isValid() && dropoff?.isValid() ? (
        <Box sx={{ mt: 1.25 }}>
          <TripClockSummary pickup={pickup} dropoff={dropoff} />
        </Box>
      ) : null}

      {conflict && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {t('detail.conflict')}
        </Alert>
      )}
      {!car.available && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {t('detail.listingUnavailable')}
        </Alert>
      )}

      {pricingHooks.pricing ? (
        <Box sx={{ mt: 1.75 }}>
          <PriceBreakdown
            pricing={pricingHooks.pricing}
            pricePerDay={car.pricePerDay}
            emptyMessage={t('detail.selectDates')}
            dense
          />
        </Box>
      ) : null}

      {isMdUp && (
        <Button
          fullWidth
          size="large"
          variant="contained"
          sx={{ mt: 2, py: 1.25, borderRadius: 999, fontSize: '1rem', fontWeight: 800, ...primaryCtaShadow(theme) }}
          disabled={!canReserve}
          onClick={reserve}
        >
          {ctaLabel}
        </Button>
      )}

      <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mt: 1.25, lineHeight: 1.45 }}>
        {t('detail.noCharge')}
      </Typography>

      {isMdUp ? (
        <>
          <Divider sx={{ my: 2 }} />
          <HostRow car={car} verified={verifiedHost} />
        </>
      ) : null}
    </Paper>
  )

  const storyBlock = (
    <Box sx={{ mt: { xs: 0.5, md: 2.5 } }}>
      <Typography variant="h6" component="h2" sx={{ ...detailSectionHeadingSx, mb: 1 }}>
        {twoWheeler ? t('detail.aboutVehicle') : t('detail.aboutCar')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.65 }}>
        {car.description}
      </Typography>

      <VehicleFacts car={car} />

      <Typography variant="h6" component="h2" sx={{ ...detailSectionHeadingSx, mt: 3.5, mb: 1.25 }}>
        {t('detail.included')}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 1,
        }}
      >
        {car.features.map((f) => (
          <Stack key={f} direction="row" spacing={1} alignItems="center">
            <CheckCircleOutline sx={{ fontSize: 20, color: 'primary.main', flexShrink: 0 }} aria-hidden />
            <Typography variant="body2" fontWeight={600}>
              {f}
            </Typography>
          </Stack>
        ))}
      </Box>

      {!isMdUp ? (
        <Paper elevation={0} sx={{ mt: 3, p: 2, ...listRowSurface(theme) }}>
          <Typography variant="h6" component="h2" sx={{ ...detailSectionHeadingSx, mb: 1.25 }}>
            {t('detail.hostedBy')}
          </Typography>
          <HostRow car={car} verified={verifiedHost} />
        </Paper>
      ) : null}

      <AvailabilityCalendar car={car} pickup={pickup} dropoff={dropoff} onEditDates={scrollToBook} />

      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, mt: 3.5, ...listRowSurface(theme) }}>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <PlaceOutlined color="primary" />
          <Box>
            <Typography variant="h6" component="h2" sx={detailSectionHeadingSx}>
              {t('detail.pickup')}
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
    </Box>
  )

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        minHeight: '100vh',
        pb: {
          xs: `calc(${MOBILE_TAB_BAR_INSET_PX + MOBILE_FOOTER_ADDITIONAL_CLEAR_PX + DETAIL_STICKY_RESERVE_PX}px + env(safe-area-inset-bottom, 0px))`,
          md: 10,
        },
      }}
    >
      {!isMdUp && gallery}

      <Container maxWidth="lg" sx={{ pt: { xs: 1.5, md: 3 }, ...containerGutters }}>
        <Link
          component={RouterLink}
          to={backToResults}
          underline="hover"
          color="primary"
          fontWeight={700}
          variant="body2"
          sx={{ display: { xs: 'inline-flex', sm: 'none' }, mb: 1.5, alignItems: 'center' }}
        >
          ← {t('detail.backToResults')}
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
            {t('nav.home')}
          </Link>
          <Link component={RouterLink} to={backToResults} underline="hover" color="inherit">
            {t('detail.backToResults')}
          </Link>
          <Typography color="text.primary" noWrap sx={{ maxWidth: { sm: 220, md: 320 } }}>
            {car.make} {car.model}
          </Typography>
        </Breadcrumbs>

        <Grid container spacing={{ xs: 2.5, md: 4 }}>
          {isMdUp ? (
            <>
              <Grid item md={8}>
                {gallery}
                {titleBlock}
                {storyBlock}
              </Grid>
              <Grid item md={4}>
                {bookPanel}
              </Grid>
            </>
          ) : (
            <>
              <Grid item xs={12}>
                {titleBlock}
              </Grid>
              <Grid item xs={12}>
                {bookPanel}
              </Grid>
              <Grid item xs={12}>
                {storyBlock}
              </Grid>
            </>
          )}
        </Grid>

        <Box sx={{ mt: { xs: 1, md: 2 } }}>
          <SameAreaPanel listings={sameArea} theme={theme} />
        </Box>
      </Container>

      {!isMdUp && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: MOBILE_TAB_BAR_STACK_BOTTOM,
            zIndex: theme.zIndex.appBar - 1,
            borderRadius: `${rhRadius.lg}px ${rhRadius.lg}px 0 0`,
            borderTop: '1px solid',
            borderColor: 'divider',
            px: 2,
            pt: 1.25,
            pb: 1.25,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: 'background.paper',
            boxShadow: rhElev.elev2,
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            {totalLabel && canReserve ? (
              <>
                <Typography variant="caption" color="text.secondary" fontWeight={650} display="block">
                  {nights ? t('detail.totalDays', { count: nights }) : t('detail.total')}
                </Typography>
                <Typography variant="subtitle1" fontWeight={800} color="text.primary" noWrap>
                  {totalLabel}
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="caption" color="text.secondary" fontWeight={650} display="block">
                  {t('detail.from')}
                </Typography>
                <Typography variant="subtitle1" fontWeight={800} color="text.primary" noWrap>
                  {formatPeso(car.pricePerDay)}
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5, fontWeight: 600 }}>
                    {t('common.perDay')}
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
            {ctaLabel}
          </Button>
        </Paper>
      )}
    </Box>
  )
}
