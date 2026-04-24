import { zodResolver } from '@hookform/resolvers/zod'
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Elements } from '@stripe/react-stripe-js'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'

import StripePaymentForm from '../components/booking/StripePaymentForm'
import PriceBreakdown from '../components/common/PriceBreakdown'
import { getStripe } from '../lib/stripe'
import { useAuthStore } from '../store/useAuthStore'
import { useBookingStore } from '../store/useBookingStore'
import { useCarsStore } from '../store/useCarsStore'
import { useSnackbarStore } from '../store/useSnackbarStore'
import { formatPeso } from '../utils/formatCurrency'
import { useDateValidation } from '../hooks/useDateValidation'
import { usePricing } from '../hooks/usePricing'
import PageHeader from '../components/layout/PageHeader'
import { containerGutters, listRowSurface, primaryCtaShadow } from '../theme/pageStyles'

const driverSchema = z.object({
  firstName: z.string().min(2, 'Required'),
  lastName: z.string().min(2, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^(\+63|0)[0-9]{10}$/, 'Invalid PH number'),
  licenseNumber: z.string().min(6, 'Invalid license'),
  licenseExpiry: z.string().min(1, 'Required'),
})

type DriverValues = z.infer<typeof driverSchema>

const steps = ['Review trip', 'Driver details', 'Payment', 'Confirmed']

export default function BookingPage() {
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))
  const { carId } = useParams<{ carId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)

  const car = useCarsStore((s) => s.cars.find((c) => c.id === carId))
  const selectedCar = useBookingStore((s) => s.selectedCar)
  const pickup = useBookingStore((s) => s.pickup)
  const dropoff = useBookingStore((s) => s.dropoff)
  const step = useBookingStore((s) => s.step)
  const bookingRef = useBookingStore((s) => s.bookingRef)
  const setStep = useBookingStore((s) => s.setStep)
  const setUserDetails = useBookingStore((s) => s.setUserDetails)
  const confirmBooking = useBookingStore((s) => s.confirmBooking)
  const resetFlow = useBookingStore((s) => s.reset)

  const showSuccess = useSnackbarStore((s) => s.showSuccess)

  const { isRangeAvailable } = useDateValidation(car ?? null)
  const pricing = usePricing(car ?? null, pickup, dropoff)

  const conflict =
    car && pickup && dropoff ? !isRangeAvailable(pickup, dropoff) : false

  const df = useForm<DriverValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      licenseNumber: user?.licenseNumber ?? '',
      licenseExpiry: '',
    },
  })

  useEffect(() => {
    if (!carId || !car) {
      navigate('/search')
      return
    }
    if (!selectedCar || selectedCar.id !== carId) {
      navigate(`/cars/${carId}`)
    }
  }, [car, carId, navigate, selectedCar])

  useEffect(() => {
    if (user) {
      df.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        licenseNumber: user.licenseNumber,
        licenseExpiry: df.getValues('licenseExpiry'),
      })
    }
  }, [user, df])

  const stripePromise = getStripe()

  const next = () => setStep(step + 1)
  const back = () => setStep(Math.max(0, step - 1))

  const onDriverSubmit = df.handleSubmit((data) => {
    setUserDetails(data)
    updateProfile({
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      licenseNumber: data.licenseNumber,
    })
    next()
  })

  const onPaid = () => {
    try {
      const ref = confirmBooking()
      showSuccess(`Booking confirmed! Ref: ${ref}`)
    } catch (e) {
      useSnackbarStore.getState().showError(e instanceof Error ? e.message : 'Failed')
    }
  }

  if (!car || !pickup || !dropoff) {
    return null
  }

  const showAside = step < 3
  const tripSummaryAside = (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        ...listRowSurface(theme),
        position: { md: 'sticky' },
        top: { md: 96 },
      }}
    >
      <Box
        component="img"
        src={car.images[0]}
        alt=""
        sx={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 2, mb: 2 }}
      />
      <Typography fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
        {car.year} {car.make} {car.model}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {pickup.format('MMM D')} → {dropoff.format('MMM D, YYYY')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {car.location}
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Stack direction="row" justifyContent="space-between" alignItems="baseline">
        <Typography fontWeight={700}>Total</Typography>
        <Typography variant="h6" color="primary.main" component="span">
          {pricing.pricing ? formatPeso(pricing.pricing.total) : '—'}
        </Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        {step === 2 ? 'Due at checkout (test mode).' : 'Full breakdown in the next steps.'}
      </Typography>
    </Paper>
  )

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 2, sm: 4 }, pb: { xs: `max(24px, env(safe-area-inset-bottom))`, sm: 4 } }}>
      <Container maxWidth="lg" sx={containerGutters}>
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, mb: { xs: 3, md: 4 }, ...listRowSurface(theme) }}>
          <Box sx={{ overflowX: 'auto', pb: 0.5 }}>
            <Stepper
              activeStep={step}
              alternativeLabel
              sx={{
                minWidth: { xs: 520, md: '100%' },
                '& .MuiStepLabel-label': { fontSize: { xs: '0.65rem', sm: '0.75rem' }, whiteSpace: 'nowrap' },
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        </Paper>

        <Grid container spacing={{ xs: 2, md: 3 }} alignItems="flex-start">
          <Grid item xs={12} md={showAside ? 8 : 12}>
            {step === 0 && (
              <Stack spacing={2.5}>
                <PageHeader overline="Checkout" title="Review your trip" subtitle="Confirm dates and pricing before driver details." dense />
                {conflict && (
                  <Alert severity="error" action={<Button onClick={() => navigate(`/cars/${car.id}`)}>Change dates</Button>}>
                    Selected dates have a conflict with existing bookings.
                  </Alert>
                )}
                {!isMdUp && (
                  <Card elevation={0} sx={listRowSurface(theme)}>
                    <CardContent>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Box component="img" src={car.images[0]} sx={{ width: { xs: '100%', sm: 120 }, height: { xs: 160, sm: 80 }, objectFit: 'cover', borderRadius: 2 }} />
                        <Box>
                          <Typography fontWeight={700}>
                            {car.year} {car.make} {car.model}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {pickup.format('MMM D')} → {dropoff.format('MMM D, YYYY')}
                          </Typography>
                          <Typography variant="body2">{car.location}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                )}
                {pricing.pricing && <PriceBreakdown pricing={pricing.pricing} pricePerDay={car.pricePerDay} />}
                <Alert severity="info">Free cancellation up to 24h before pickup (mock policy).</Alert>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
                  <Button onClick={() => navigate(`/cars/${car.id}`)} sx={{ order: { xs: 2, sm: 1 } }}>
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    disabled={conflict}
                    onClick={next}
                    sx={{ order: { xs: 1, sm: 2 }, minHeight: 48, borderRadius: 2, ...primaryCtaShadow(theme) }}
                  >
                    Continue
                  </Button>
                </Stack>
              </Stack>
            )}

            {step === 1 && (
              <Stack component="form" spacing={2.5} onSubmit={onDriverSubmit}>
                <PageHeader
                  overline="Checkout"
                  title="Driver details"
                  subtitle="We’ve pre-filled your account details where we could. Update anything that’s changed — we’ll use this for the rental agreement and host contact."
                  dense
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField label="First name" fullWidth {...df.register('firstName')} error={!!df.formState.errors.firstName} helperText={df.formState.errors.firstName?.message} />
                  <TextField label="Last name" fullWidth {...df.register('lastName')} error={!!df.formState.errors.lastName} helperText={df.formState.errors.lastName?.message} />
                </Stack>
                <TextField label="Email" fullWidth {...df.register('email')} error={!!df.formState.errors.email} helperText={df.formState.errors.email?.message} />
                <TextField label="Phone" placeholder="+639xxxxxxxxx" fullWidth {...df.register('phone')} error={!!df.formState.errors.phone} helperText={df.formState.errors.phone?.message} />
                <TextField label="License number" fullWidth {...df.register('licenseNumber')} error={!!df.formState.errors.licenseNumber} helperText={df.formState.errors.licenseNumber?.message} />
                <TextField label="License expiry" type="date" InputLabelProps={{ shrink: true }} fullWidth {...df.register('licenseExpiry')} error={!!df.formState.errors.licenseExpiry} helperText={df.formState.errors.licenseExpiry?.message} />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
                  <Button type="button" variant="outlined" onClick={back} sx={{ order: { xs: 2, sm: 1 } }}>
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{ order: { xs: 1, sm: 2 }, minHeight: 48, borderRadius: 2, ...primaryCtaShadow(theme) }}
                  >
                    Continue
                  </Button>
                </Stack>
              </Stack>
            )}

            {step === 2 && (
              <Stack spacing={2.5}>
                <PageHeader overline="Checkout" title="Payment" subtitle="Test mode only — no real charges." dense />
                {!isMdUp && (
                  <Card elevation={0} sx={{ mb: 2, ...listRowSurface(theme) }}>
                    <CardContent>
                      <Typography fontWeight={700}>Order total</Typography>
                      <Typography variant="h5" color="primary">
                        {pricing.pricing ? formatPeso(pricing.pricing.total) : '—'}
                      </Typography>
                    </CardContent>
                  </Card>
                )}
                {stripePromise ? (
                  <Elements stripe={stripePromise}>
                    <StripePaymentForm
                      onSuccess={() => {
                        onPaid()
                      }}
                    />
                  </Elements>
                ) : (
                  <Alert severity="warning">
                    Add <code>VITE_STRIPE_KEY</code> to <code>.env</code>. For local testing you can skip payment:{' '}
                    <Button size="small" onClick={onPaid}>
                      Mock confirm
                    </Button>
                  </Alert>
                )}
                <Button variant="outlined" onClick={back}>
                  Back
                </Button>
              </Stack>
            )}

            {step === 3 && bookingRef && (
              <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <Stack alignItems="center" spacing={2} textAlign="center">
                  <CheckCircleOutline sx={{ fontSize: 96, color: 'success.main' }} />
                  <Typography variant="h3" sx={{ fontSize: { xs: '1.5rem', sm: '2.5rem' } }}>
                    Booking Confirmed!
                  </Typography>
                  <Typography variant="h5" color="primary">
                    {bookingRef}
                  </Typography>
                  <Typography variant="body1">Your plate: {car.plateNumber}</Typography>
                  <Card elevation={0} sx={{ width: '100%', maxWidth: 420, ...listRowSurface(theme) }}>
                    <CardContent>
                      <Typography fontWeight={700}>
                        {car.make} {car.model}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pickup.format('MMM D')} – {dropoff.format('MMM D, YYYY')}
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 1 }}>
                        {pricing.pricing ? formatPeso(pricing.pricing.total) : ''}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Button variant="contained" onClick={() => { resetFlow(); navigate('/dashboard') }} sx={{ borderRadius: 2, ...primaryCtaShadow(theme) }}>
                      View My Trips
                    </Button>
                    <Button variant="outlined" onClick={() => { resetFlow(); navigate('/search') }}>
                      Browse More Cars
                    </Button>
                  </Stack>
                </Stack>
              </motion.div>
            )}
          </Grid>

          {showAside && (
            <Grid item md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
              {tripSummaryAside}
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  )
}
