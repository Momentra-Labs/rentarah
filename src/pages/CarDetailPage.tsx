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
import { usePricing } from '../hooks/usePricing'
import { useAuthStore } from '../store/useAuthStore'
import { useBookingStore } from '../store/useBookingStore'
import { useCarsStore } from '../store/useCarsStore'
import { formatPeso } from '../utils/formatCurrency'

export default function CarDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const cars = useCarsStore((s) => s.cars)
  const car = cars.find((c) => c.id === id)
  const user = useAuthStore((s) => s.user)
  const initBooking = useBookingStore((s) => s.initBooking)

  const [pickup, setPickup] = useState<Dayjs | null>(() => dayjs().add(1, 'day'))
  const [dropoff, setDropoff] = useState<Dayjs | null>(() => dayjs().add(4, 'day'))
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
      <Box p={4}>
        <Typography>Car not found.</Typography>
        <Button component={RouterLink} to="/search">
          Back to search
        </Button>
      </Box>
    )
  }

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
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 8 }}>
      <Container maxWidth="lg" sx={{ pt: 3 }}>
        <Breadcrumbs separator={<ChevronRight fontSize="small" />} sx={{ mb: 3 }}>
          <Link component={RouterLink} to="/" underline="hover" color="inherit">
            Home
          </Link>
          <Link component={RouterLink} to="/search" underline="hover" color="inherit">
            Browse Cars
          </Link>
          <Typography color="text.primary">
            {car.make} {car.model}
          </Typography>
        </Breadcrumbs>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Box
                component="img"
                src={car.images[activeImg]}
                alt={`${car.make} ${car.model}`}
                sx={{
                  width: '100%',
                  height: 520,
                  objectFit: 'cover',
                  borderRadius: '16px',
                  border: '1px solid',
                  borderColor: 'divider',
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
                    objectFit: 'cover',
                    borderRadius: 2,
                    cursor: 'pointer',
                    opacity: activeImg === i ? 1 : 0.6,
                    border: activeImg === i ? '2px solid' : '1px solid',
                    borderColor: activeImg === i ? 'primary.main' : 'divider',
                  }}
                />
              ))}
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ my: 2 }}>
              {car.tags.map((t) => (
                <Chip key={t} label={t} color="primary" variant="outlined" />
              ))}
            </Stack>
            <Typography variant="h2" sx={{ mb: 1 }}>
              {car.year} {car.make} {car.model}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <StarRating value={car.rating} reviews={car.reviewCount} />
              <Typography variant="body2" color="text.secondary">
                {car.hostTrips}+ trips · Hosted by <strong>{car.hostName}</strong>
              </Typography>
            </Stack>
            <Chip icon={<LocationOn />} label={car.location} sx={{ mt: 2 }} />

            <Typography variant="h4" sx={{ mt: 4, mb: 1 }}>
              About this car
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {car.description}
            </Typography>

            <Typography variant="h4" sx={{ mt: 4, mb: 2 }}>
              What&apos;s included
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {car.features.map((f) => (
                <Chip key={f} label={f} variant="outlined" />
              ))}
            </Stack>

            <AvailabilityCalendar car={car} pickup={pickup} dropoff={dropoff} />

            <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2, mt: 4 }}>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <LocationOn color="primary" />
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Pickup &amp; return
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {car.location}
                  </Typography>
                  <Button size="small" sx={{ mt: 1 }} disabled>
                    Get directions (mock)
                  </Button>
                </Box>
              </Stack>
              <Box
                sx={{
                  mt: 2,
                  height: 140,
                  borderRadius: 2,
                  bgcolor: 'grey.200',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.secondary',
                }}
              >
                Map preview
              </Box>
            </Paper>

            <ReviewsList car={car} />
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: '20px', position: 'sticky', top: 96 }}>
              <Typography variant="h3" color="primary.main">
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
                  onChange={({ pickup: p, dropoff: d }) => {
                    setPickup(p)
                    setDropoff(d)
                  }}
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
                sx={{ mt: 2 }}
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
              <Button fullWidth variant="outlined" sx={{ mt: 2 }} disabled>
                Message (coming soon)
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
