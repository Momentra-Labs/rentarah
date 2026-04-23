import ChevronRight from '@mui/icons-material/ChevronRight'
import LocationOn from '@mui/icons-material/LocationOn'
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Link,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material'
import dayjs from 'dayjs'
import { motion } from 'framer-motion'
import type { Dayjs } from 'dayjs'
import { useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'

import DateRangePicker from '../components/common/DateRangePicker'
import PriceBreakdown from '../components/common/PriceBreakdown'
import StarRating from '../components/common/StarRating'
import AvailabilityCalendar from '../components/detail/AvailabilityCalendar'
import ReviewsList from '../components/detail/ReviewsList'
import CarDetailSkeleton from '../components/skeletons/CarDetailSkeleton'
import { useDateValidation } from '../hooks/useDateValidation'
import { useOfferGeoPrompt } from '../hooks/useOfferGeoPrompt'
import { usePricing } from '../hooks/usePricing'
import { useAuthStore } from '../store/useAuthStore'
import { useBookingStore } from '../store/useBookingStore'
import { useCarsStore } from '../store/useCarsStore'
import { useSearchStore } from '../store/useSearchStore'
import { formatPeso } from '../utils/formatCurrency'
import { getVehicleType, isTwoWheeler, VEHICLE_TYPE_LABELS } from '../utils/vehicleUtils'
import PageHeader from '../components/layout/PageHeader'
import RentaraMap from '../components/map/RentaraMap'
import { containerGutters, listRowSurface, primaryCtaShadow, softInteractiveSurface } from '../theme/pageStyles'
import { getCarPickupLatLng } from '../utils/mapPickupLocation'

/** Match Browse search dates when opening from listings; else fallback window. */
function initialTripFromSearchStore(): { pickup: Dayjs; dropoff: Dayjs } {
  const { pickup: p, dropoff: d } = useSearchStore.getState()
  if (p?.isValid()) {
    if (d?.isValid() && d.isAfter(p, 'day')) {
      return { pickup: p, dropoff: d }
    }
    return { pickup: p, dropoff: p.add(3, 'day') }
  }
  const t = dayjs()
  return { pickup: t.add(1, 'day'), dropoff: t.add(4, 'day') }
}

export default function CarDetailPage() {
  const theme = useTheme()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const cars = useCarsStore((s) => s.cars)
  const car = cars.find((c) => c.id === id)
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

  if (cars.length === 0) {
    return <CarDetailSkeleton />
  }

  if (!car) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '50vh', py: 6 }}>
        <Container maxWidth="sm" sx={containerGutters}>
          <Paper elevation={0} sx={{ p: 4, ...softInteractiveSurface(theme, false) }}>
            <PageHeader title="We couldn’t find that vehicle" subtitle="It may have been removed. Head back to listings and keep browsing." dense />
            <Button component={RouterLink} to="/search" variant="contained" size="large" sx={{ mt: 2, borderRadius: 2, ...primaryCtaShadow(theme) }}>
              Back to browse
            </Button>
          </Paper>
        </Container>
      </Box>
    )
  }

  const vehicleClass = getVehicleType(car)
  const twoWheeler = isTwoWheeler(car)

  const reserve = () => {
    if (!pickup?.isValid() || !dropoff?.isValid() || conflict) return
    if (!user) {
      navigate('/', { state: { auth: true } })
      return
    }
    initBooking(car, pickup, dropoff)
    navigate(`/booking/${car.id}`)
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: { xs: 8, md: 10 } }}>
      <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 4 }, ...containerGutters }}>
        <Breadcrumbs
          separator={<ChevronRight fontSize="small" />}
          sx={{ mb: { xs: 2, md: 3 }, flexWrap: 'wrap', '& .MuiBreadcrumbs-separator': { mx: 0.5 } }}
        >
          <Link component={RouterLink} to="/" underline="hover" color="inherit">
            Home
          </Link>
          <Link component={RouterLink} to="/search" underline="hover" color="inherit">
            Browse vehicles
          </Link>
          <Typography color="text.primary">
            {car.make} {car.model}
          </Typography>
        </Breadcrumbs>

        <Grid container spacing={{ xs: 3, md: 4 }}>
          <Grid item xs={12} md={8} order={{ xs: 2, md: 1 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Box
                component="img"
                src={car.images[activeImg]}
                alt={`${car.make} ${car.model}`}
                sx={{
                  width: '100%',
                  height: { xs: 240, sm: 360, md: 520 },
                  objectFit: twoWheeler ? 'contain' : 'cover',
                  bgcolor: twoWheeler ? 'grey.100' : undefined,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                }}
              />
            </motion.div>
            <Stack direction="row" spacing={1} sx={{ mt: 2, overflowX: 'auto' }}>
              {car.images.map((src, i) => (
                <Box
                  key={src + i}
                  component="img"
                  src={src}
                  onClick={() => setActiveImg(i)}
                  sx={{
                    width: 96,
                    height: 64,
                    objectFit: twoWheeler ? 'contain' : 'cover',
                    bgcolor: twoWheeler ? 'grey.100' : undefined,
                    borderRadius: 2,
                    cursor: 'pointer',
                    opacity: activeImg === i ? 1 : 0.6,
                    border: activeImg === i ? '2px solid' : '1px solid',
                    borderColor: activeImg === i ? 'primary.main' : 'divider',
                    transition: 'opacity 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
                    '&:hover': { opacity: 1 },
                  }}
                />
              ))}
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center" sx={{ my: 2 }}>
              <Chip size="small" label={VEHICLE_TYPE_LABELS[vehicleClass]} color="primary" />
              {car.tags.map((t) => (
                <Chip key={t} label={t} color="primary" variant="outlined" />
              ))}
            </Stack>
            <Typography variant="h2" component="h1" sx={{ mb: 1, fontSize: { xs: '1.5rem', sm: '1.75rem', md: undefined } }}>
              {car.year} {car.make} {car.model}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <StarRating value={car.rating} reviews={car.reviewCount} />
              <Typography variant="body2" color="text.secondary">
                {car.hostTrips}+ trips · Hosted by <strong>{car.hostName}</strong>
              </Typography>
            </Stack>
            <Chip icon={<LocationOn />} label={car.location} sx={{ mt: 2 }} />

            <Typography variant="overline" color="primary" sx={{ mt: 4, display: 'block', fontWeight: 700, letterSpacing: '0.08em' }}>
              Details
            </Typography>
            <Typography variant="h5" component="h2" sx={{ mb: 1, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {twoWheeler ? 'About this vehicle' : 'About this car'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {car.description}
            </Typography>

            {twoWheeler && (car.engineCapacity != null || car.transmissionType != null || car.helmetIncluded != null) && (
              <Box sx={{ mt: 2 }}>
                <Stack direction="row" flexWrap="wrap" useFlexGap gap={1.5} sx={{ pt: 0.5 }}>
                  {car.engineCapacity != null && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`${car.engineCapacity} cc engine`}
                    />
                  )}
                  {car.transmissionType != null && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={car.transmissionType === 'automatic' ? 'Automatic transmission' : 'Manual transmission'}
                    />
                  )}
                  {car.helmetIncluded != null && (
                    <Chip
                      size="small"
                      variant="outlined"
                      color={car.helmetIncluded ? 'success' : 'default'}
                      label={car.helmetIncluded ? 'Helmet included' : 'Helmet not included'}
                    />
                  )}
                </Stack>
              </Box>
            )}

            <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2, fontWeight: 700, letterSpacing: '-0.02em' }}>
              What&apos;s included
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {car.features.map((f) => (
                <Chip key={f} label={f} variant="outlined" />
              ))}
            </Stack>

            <AvailabilityCalendar car={car} pickup={pickup} dropoff={dropoff} />

            <Paper elevation={0} sx={{ p: 3, mt: 4, ...listRowSurface(theme) }}>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <LocationOn color="primary" />
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Pickup &amp; return
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
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

          <Grid item xs={12} md={4} order={{ xs: 1, md: 2 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, md: 3 },
                position: { xs: 'static', md: 'sticky' },
                top: { md: 96 },
                ...softInteractiveSurface(theme),
              }}
            >
              <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: '0.08em' }}>
                Book
              </Typography>
              <Typography variant="h3" color="primary.main" sx={{ mt: 0.5, fontWeight: 800 }}>
                {formatPeso(car.pricePerDay)}
                <Typography component="span" variant="body1" color="text.secondary">
                  {' '}
                  / day
                </Typography>
              </Typography>
              <StarRating value={car.rating} reviews={car.reviewCount} />
              <Box sx={{ mt: 2 }}>
                <DateRangePicker
                  pickup={pickup}
                  dropoff={dropoff}
                  onChange={({ pickup: p, dropoff: d }) => setTrip({ pickup: p, dropoff: d })}
                  minDate={dayjs()}
                />
              </Box>
              {conflict && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Selected dates overlap unavailable nights.
                </Alert>
              )}
              {pricingHooks.pricing && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                  <Box sx={{ mt: 2 }}>
                    <PriceBreakdown pricing={pricingHooks.pricing} pricePerDay={car.pricePerDay} />
                  </Box>
                </motion.div>
              )}
              <Button
                fullWidth
                size="large"
                variant="contained"
                sx={{ mt: 2, py: 1.25, borderRadius: 2, fontSize: '1rem', ...primaryCtaShadow(theme) }}
                disabled={!pickup || !dropoff || conflict || !car.available}
                onClick={reserve}
              >
                Reserve
              </Button>
              <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mt: 1 }}>
                You won&apos;t be charged yet
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  {car.hostAvatar}
                </Box>
                <Box>
                  <Typography fontWeight={700}>{car.hostName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Responds {car.hostResponseTime}
                  </Typography>
                </Box>
              </Stack>
              <Button fullWidth variant="outlined" color="primary" sx={{ mt: 2, borderRadius: 2, borderWidth: 2, '&:hover': { borderWidth: 2 } }} disabled>
                Message (coming soon)
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
