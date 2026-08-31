import { zodResolver } from '@hookform/resolvers/zod'
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Paper,
  Stack,
  Step,
  StepButton,
  Stepper,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { alpha, type Theme } from '@mui/material/styles'
import { Elements } from '@stripe/react-stripe-js'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'

import StripePaymentForm from '@/components/booking/StripePaymentForm'
import DateRangePicker from '@/components/common/DateRangePicker'
import PriceBreakdown from '@/components/common/PriceBreakdown'
import PageHeader from '@/components/layout/PageHeader'
import { MOBILE_TAB_BAR_STACK_BOTTOM } from '@/components/layout/MobileBottomNav'
import BookingPageSkeleton from '@/components/skeletons/BookingPageSkeleton'
import TripClockSummary from '@/features/landing/components/TripClockSummary'
import BookingDriverStep from '@/features/booking/components/BookingDriverStep'
import { createDriverSchema, hasCompleteDriverProfile, type DriverFormValues } from '@/features/booking/components/driverSchema'
import BookingTripSummary from '@/features/booking/components/BookingTripSummary'
import { useDateValidation } from '@/hooks/useDateValidation'
import { usePricing } from '@/hooks/usePricing'
import { useT } from '@/hooks/useT'
import { useVehicles } from '@/hooks/useVehicles'
import { getStripe } from '@/lib/stripe'
import { e164ToNationalMobileDigits, formatPhilippineDriversLicenseInput } from '@/lib/philippineContact'
import { useAuthStore } from '@/store/useAuthStore'
import { useBookingStore } from '@/store/useBookingStore'
import { useCarsStore } from '@/store/useCarsStore'
import { useSnackbarStore } from '@/store/useSnackbarStore'
import { containerGutters, listRowSurface, primaryCtaShadow } from '@/theme/pageStyles'
import { rhElev, rhRadius } from '@/theme/tokens'
import { formatPeso } from '@/utils/formatCurrency'
import { formatTripDateTime } from '@/utils/dateUtils'

const STEPS = [
  { short: 'booking.stepTrip', aria: 'booking.stepTripAria' },
  { short: 'booking.stepYou', aria: 'booking.stepYouAria' },
  { short: 'booking.stepPay', aria: 'booking.stepPayAria' },
  { short: 'booking.stepDone', aria: 'booking.stepDoneAria' },
] as const

const DRIVER_FORM_ID = 'booking-driver-form'

export default function BookingPage() {
  const t = useT()
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))
  const { carId } = useParams<{ carId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)

  const { isLoading: vehiclesLoading } = useVehicles()
  const car = useCarsStore((s) => s.cars.find((c) => c.id === carId))
  const selectedCar = useBookingStore((s) => s.selectedCar)
  const pickup = useBookingStore((s) => s.pickup)
  const dropoff = useBookingStore((s) => s.dropoff)
  const step = useBookingStore((s) => s.step)
  const bookingRef = useBookingStore((s) => s.bookingRef)
  const setStep = useBookingStore((s) => s.setStep)
  const setTripDates = useBookingStore((s) => s.setTripDates)
  const setUserDetails = useBookingStore((s) => s.setUserDetails)
  const confirmBooking = useBookingStore((s) => s.confirmBooking)
  const resetFlow = useBookingStore((s) => s.reset)

  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const dropoffRef = useRef<Dayjs | null>(dropoff)
  dropoffRef.current = dropoff

  const { isRangeAvailable } = useDateValidation(car ?? null)
  const pricing = usePricing(car ?? null, pickup, dropoff)
  const conflict = car && pickup && dropoff ? !isRangeAvailable(pickup, dropoff) : false

  const [editingDriver, setEditingDriver] = useState(() => !hasCompleteDriverProfile(user))

  const driverSchema = useMemo(() => createDriverSchema(t, () => dropoffRef.current), [t])

  const df = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      phone: e164ToNationalMobileDigits(user?.phone ?? ''),
      licenseNumber: formatPhilippineDriversLicenseInput(user?.licenseNumber ?? ''),
      licenseExpiry: '',
      isDriver: false,
    },
  })

  useEffect(() => {
    if (vehiclesLoading) return
    if (!carId || !car) {
      navigate('/search')
      return
    }
    if (!selectedCar || selectedCar.id !== carId) {
      navigate(`/cars/${carId}`)
    }
  }, [car, carId, navigate, selectedCar, vehiclesLoading])

  useEffect(() => {
    if (!user) return
    df.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: e164ToNationalMobileDigits(user.phone),
      licenseNumber: formatPhilippineDriversLicenseInput(user.licenseNumber),
      licenseExpiry: df.getValues('licenseExpiry'),
      isDriver: df.getValues('isDriver'),
    })
  }, [user, df])

  const stripePromise = getStripe()

  const next = () => setStep(step + 1)
  const back = () => setStep(Math.max(0, step - 1))

  const onDriverSubmit = df.handleSubmit((data) => {
    setUserDetails({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      licenseNumber: data.licenseNumber,
      licenseExpiry: data.licenseExpiry,
    })
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
      showSuccess(t('booking.confirmedSnackbar', { ref }))
    } catch (e) {
      useSnackbarStore.getState().showError(e instanceof Error ? e.message : t('booking.confirmFailed'))
    }
  }

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

  if (vehiclesLoading && !car) {
    return <BookingPageSkeleton />
  }

  if (!car || !pickup || !dropoff) {
    return (
      <Box sx={{ py: 8, px: 2 }} role="status" aria-live="polite">
        <Typography color="text.secondary" textAlign="center">
          {t('booking.preparing')}
        </Typography>
      </Box>
    )
  }

  const showAside = step < 3
  const showStickyCta = !isMdUp && step < 2
  const amountLabel = pricing.pricing ? formatPeso(pricing.pricing.total) : '—'
  const listingHref = `/cars/${car.id}`

  const goToStep = (index: number) => {
    if (step >= 3 || index >= step) return
    setStep(index)
  }

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        minHeight: '100vh',
        py: { xs: 2, sm: 4 },
        pb: {
          xs: showStickyCta
            ? `calc(88px + 68px + env(safe-area-inset-bottom, 0px))`
            : `max(24px, env(safe-area-inset-bottom))`,
          md: 4,
        },
      }}
    >
      <Container maxWidth="lg" sx={containerGutters}>
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, mb: { xs: 3, md: 4 }, ...listRowSurface(theme) }}>
          <Stepper
            activeStep={step}
            alternativeLabel
            sx={{
              width: '100%',
              '& .MuiStepLabel-label': {
                fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                fontWeight: 600,
                mt: { xs: 0.5, sm: 0.75 },
              },
              '& .MuiStepLabel-label.Mui-active': { fontWeight: 800 },
            }}
          >
            {STEPS.map((item, i) => (
              <Step key={item.short} completed={step > i}>
                <StepButton
                  disabled={step >= 3 || i >= step}
                  onClick={() => goToStep(i)}
                  aria-label={t(item.aria)}
                >
                  {t(item.short)}
                </StepButton>
              </Step>
            ))}
          </Stepper>
        </Paper>

        <Grid container spacing={{ xs: 2, md: 3 }} alignItems="flex-start">
          <Grid item xs={12} md={showAside ? 8 : 12}>
            {step === 0 && (
              <Stack spacing={2.5}>
                <PageHeader
                  overline={t('booking.checkout')}
                  title={t('booking.reviewTitle')}
                  subtitle={t('booking.reviewSubtitle')}
                  dense
                />
                {!isMdUp && (
                  <Card elevation={0} sx={listRowSurface(theme)}>
                    <CardContent>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Box
                          component="img"
                          src={car.images[0]}
                          alt=""
                          sx={{ width: { xs: '100%', sm: 120 }, height: { xs: 160, sm: 80 }, objectFit: 'cover', borderRadius: 2 }}
                        />
                        <Box>
                          <Typography fontWeight={700}>
                            {car.year} {car.make} {car.model}
                          </Typography>
                          <Typography variant="body2">{car.location}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                )}
                <DateRangePicker
                  pickup={pickup}
                  dropoff={dropoff}
                  onChange={({ pickup: p, dropoff: d }) => {
                    if (p?.isValid() && d?.isValid()) setTripDates(p, d)
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
                <TripClockSummary pickup={pickup} dropoff={dropoff} />
                {conflict && (
                  <Alert
                    severity="error"
                    action={
                      <Button component={RouterLink} to={listingHref} color="inherit" size="small">
                        {t('booking.viewListing')}
                      </Button>
                    }
                  >
                    {t('booking.conflict')}
                  </Alert>
                )}
                {pricing.pricing && (
                  <PriceBreakdown pricing={pricing.pricing} pricePerDay={car.pricePerDay} dense />
                )}
                <Alert severity="info">{t('booking.cancelPolicy')}</Alert>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  justifyContent="space-between"
                >
                  <Button component={RouterLink} to={listingHref} sx={{ order: { xs: 2, sm: 1 } }}>
                    {t('booking.back')}
                  </Button>
                  {isMdUp ? (
                    <Button
                      variant="contained"
                      disabled={conflict}
                      onClick={next}
                      sx={{
                        order: { xs: 1, sm: 2 },
                        minHeight: 48,
                        borderRadius: 2,
                        fontWeight: 800,
                        textTransform: 'none',
                        ...primaryCtaShadow(theme),
                      }}
                    >
                      {t('booking.continue')}
                    </Button>
                  ) : null}
                </Stack>
              </Stack>
            )}

            {step === 1 && (
              <BookingDriverStep
                theme={theme}
                user={user}
                editing={editingDriver}
                onEdit={() => setEditingDriver(true)}
                dropoff={dropoff}
                register={df.register}
                control={df.control}
                errors={df.formState.errors}
                onBack={back}
                onSubmit={onDriverSubmit}
                showFooter={isMdUp}
                formId={DRIVER_FORM_ID}
              />
            )}

            {step === 2 && (
              <Stack spacing={2.5}>
                <PageHeader
                  overline={t('booking.checkout')}
                  title={t('booking.payTitle')}
                  subtitle={t('booking.paySubtitle')}
                  dense
                />
                {pricing.pricing && (
                  <PriceBreakdown pricing={pricing.pricing} pricePerDay={car.pricePerDay} dense />
                )}
                {stripePromise ? (
                  <Elements stripe={stripePromise}>
                    <StripePaymentForm
                      amountLabel={amountLabel}
                      onSuccess={() => {
                        onPaid()
                      }}
                    />
                  </Elements>
                ) : (
                  <Alert severity="info">
                    {t('booking.stripeUnavailable')}{' '}
                    {import.meta.env.DEV ? (
                      <Button size="small" onClick={onPaid} sx={{ ml: 0.5 }}>
                        {t('booking.confirmWithoutCard')}
                      </Button>
                    ) : (
                      t('booking.contactSupport')
                    )}
                  </Alert>
                )}
                <Button variant="outlined" onClick={back}>
                  {t('booking.back')}
                </Button>
              </Stack>
            )}

            {step === 3 && bookingRef && (
              <Stack alignItems="center" spacing={2.5} sx={{ py: { xs: 1, md: 2 } }}>
                <CheckCircleOutline sx={{ fontSize: 88, color: 'success.main' }} />
                <Typography variant="h3" sx={{ fontSize: { xs: '1.5rem', sm: '2.25rem' }, fontWeight: 800, textAlign: 'center' }}>
                  {t('booking.confirmedTitle')}
                </Typography>
                <Typography variant="h6" color="primary" fontWeight={800}>
                  {t('booking.confirmedRef', { ref: bookingRef })}
                </Typography>
                <Card elevation={0} sx={{ width: '100%', maxWidth: 480, ...listRowSurface(theme) }}>
                  <CardContent>
                    <Typography fontWeight={800}>
                      {car.year} {car.make} {car.model}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {formatTripDateTime(pickup)} – {formatTripDateTime(dropoff)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {car.location}
                    </Typography>
                    {car.plateNumber ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {t('booking.plate', { plate: car.plateNumber })}
                      </Typography>
                    ) : null}
                    <Typography variant="h6" sx={{ mt: 1.25, fontWeight: 800 }}>
                      {amountLabel}
                    </Typography>
                  </CardContent>
                </Card>
                <Box sx={{ width: '100%', maxWidth: 480, textAlign: 'left' }}>
                  <Typography fontWeight={800} sx={{ mb: 1.25 }}>
                    {t('booking.nextTitle')}
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2">{t('booking.next1')}</Typography>
                    <Typography variant="body2">{t('booking.next2', { location: car.location })}</Typography>
                    <Typography variant="body2">{t('booking.next3')}</Typography>
                  </Stack>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%', maxWidth: 480 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => {
                      resetFlow()
                      navigate('/dashboard?nav=trips')
                    }}
                    sx={{ borderRadius: 2, fontWeight: 800, textTransform: 'none', ...primaryCtaShadow(theme) }}
                  >
                    {t('booking.viewTrips')}
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => {
                      resetFlow()
                      navigate('/search')
                    }}
                  >
                    {t('booking.browseMore')}
                  </Button>
                </Stack>
              </Stack>
            )}
          </Grid>

          {showAside && (
            <Grid item md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
              <BookingTripSummary
                car={car}
                pickup={pickup}
                dropoff={dropoff}
                pricing={pricing.pricing}
                theme={theme}
                caption={step === 2 ? t('booking.dueTestMode') : undefined}
              />
            </Grid>
          )}
        </Grid>
      </Container>

      {showStickyCta && (
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
            <Typography variant="caption" color="text.secondary" fontWeight={650} display="block">
              {t('booking.total')}
            </Typography>
            <Typography variant="subtitle1" fontWeight={800} color="text.primary" noWrap>
              {amountLabel}
            </Typography>
          </Box>
          {step === 0 ? (
            <Button
              variant="contained"
              size="large"
              disabled={conflict}
              onClick={next}
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
              {t('booking.continue')}
            </Button>
          ) : (
            <Button
              variant="contained"
              size="large"
              type="submit"
              form={DRIVER_FORM_ID}
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
              {t('booking.continue')}
            </Button>
          )}
        </Paper>
      )}
    </Box>
  )
}
