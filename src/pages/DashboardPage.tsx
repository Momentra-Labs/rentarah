import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import FavoriteBorder from '@mui/icons-material/FavoriteBorder'
import HistoryOutlined from '@mui/icons-material/HistoryOutlined'
import PersonOutline from '@mui/icons-material/PersonOutline'
import PhotoCameraOutlined from '@mui/icons-material/PhotoCameraOutlined'
import RateReviewOutlined from '@mui/icons-material/RateReviewOutlined'
import {
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'

import type { BookingRecord, BookingStatus, IdentityVerificationStatus } from '../types'

import CarCard from '../components/common/CarCard'
import EmptyState from '../components/ui/EmptyState'
import UserAvatar from '../components/common/UserAvatar'
import PhilippineDriversLicenseTextField from '../components/auth/PhilippineDriversLicenseTextField'
import PhilippineNationalMobileTextField from '../components/auth/PhilippineNationalMobileTextField'
import PageHeader from '../components/layout/PageHeader'
import { formatBookingStoredDate } from '../utils/dateUtils'
import { useAuthStore } from '../store/useAuthStore'
import { compressAvatarImageFileToJpegDataUrl } from '../lib/compressIdentityImage'
import {
  e164ToNationalMobileDigits,
  formatPhilippineDriversLicenseInput,
  isValidPhilippineDriversLicense,
  nationalMobileDigitsToE164,
  normalizePhilippineDriversLicense,
} from '../lib/philippineContact'
import {
  isProfilePhotoAvatar,
  resolveAvatarAfterRemovePhoto,
} from '../lib/userAvatarUtils'
import { useBookingStore } from '../store/useBookingStore'
import { useCarsStore } from '../store/useCarsStore'
import { useSnackbarStore } from '../store/useSnackbarStore'
import { formatPeso } from '../utils/formatCurrency'
import { containerGutters, dashboardSectionTabsSx, dashboardTabsBarWrapSx, listRowSurface, primaryCtaShadow } from '../theme/pageStyles'
import CarGridSkeleton from '../components/skeletons/CarGridSkeleton'
import DashboardPageSkeleton from '../components/skeletons/DashboardPageSkeleton'
import { useT } from '../hooks/useT'
import { useVehicles } from '../hooks/useVehicles'

const RENTER_TAB_NAV_KEYS = ['trips', 'past', 'saved', 'reviews', 'profile'] as const

type RenterTabNav = (typeof RENTER_TAB_NAV_KEYS)[number]

const BOOKING_STATUS_SORT: Record<BookingStatus, number> = {
  pending: 0,
  confirmed: 1,
  cancelled: 2,
}

export function renterNavToTab(nav: string | null): number {
  if (nav === 'trips' || nav == null || nav === '') return 0
  if (nav === 'past') return 1
  if (nav === 'saved') return 2
  if (nav === 'reviews') return 3
  if (nav === 'profile') return 4
  return 0
}

export function bookingStatusLabel(status: BookingStatus): string {
  if (status === 'pending') return 'Pending'
  if (status === 'confirmed') return 'Confirmed'
  return 'Cancelled'
}

export function pastBookingLabel(status: BookingStatus): string {
  return status === 'cancelled' ? 'Cancelled' : 'Completed'
}

export function sortRenterBookingsByPriority(bookings: BookingRecord[]): BookingRecord[] {
  return [...bookings].sort((a, b) => BOOKING_STATUS_SORT[a.status] - BOOKING_STATUS_SORT[b.status])
}

export type RenterIdentityGate = 'approved' | 'pending_review' | 'unverified'

export function renterIdentityGate(status: IdentityVerificationStatus | undefined): RenterIdentityGate {
  if (status === 'approved') return 'approved'
  if (status === 'pending_review') return 'pending_review'
  return 'unverified'
}

export type RenterNextStep = {
  text: string
  actionLabel: string
  tone: 'warning' | 'primary'
  target: 'trips' | 'verify' | 'search'
}

export function getRenterNextStep(
  pendingBookingsCount: number,
  upcomingCount: number,
  identity: RenterIdentityGate,
): RenterNextStep | null {
  if (pendingBookingsCount > 0) {
    return {
      text:
        pendingBookingsCount === 1
          ? '1 booking is waiting for the host'
          : `${pendingBookingsCount} bookings are waiting for the host`,
      actionLabel: 'View trips',
      tone: 'warning',
      target: 'trips',
    }
  }
  if (identity === 'unverified') {
    return {
      text: 'Verify your identity to book with confidence',
      actionLabel: 'Verify',
      tone: 'primary',
      target: 'verify',
    }
  }
  if (upcomingCount === 0) {
    return {
      text: 'Find a vehicle for your next trip',
      actionLabel: 'Browse',
      tone: 'primary',
      target: 'search',
    }
  }
  return null
}

export default function DashboardPage() {
  const t = useT()
  const theme = useTheme()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const logout = useAuthStore((s) => s.logout)
  const bookings = useBookingStore((s) => s.bookings)
  const cancelBooking = useBookingStore((s) => s.cancelBooking)
  const showInfo = useSnackbarStore((s) => s.showInfo)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  const { isLoading: vehiclesLoading } = useVehicles()
  const cars = useCarsStore((s) => s.cars)
  const savedIds = useCarsStore((s) => s.savedCarIds)

  const [tab, setTab] = useState(() =>
    renterNavToTab(typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('nav') : null),
  )

  const goToNav = useCallback(
    (nav: RenterTabNav) => {
      setTab(renterNavToTab(nav))
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('nav', nav)
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  useEffect(() => {
    const nav = searchParams.get('nav')
    if (nav === 'trips' || nav === 'profile' || nav === 'past' || nav === 'saved' || nav === 'reviews') {
      setTab(renterNavToTab(nav))
      return
    }
    setTab(0)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('nav', 'trips')
        return next
      },
      { replace: true },
    )
  }, [searchParams, setSearchParams])

  const [pf, setPf] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    phone: e164ToNationalMobileDigits(user?.phone ?? ''),
    licenseNumber: formatPhilippineDriversLicenseInput(user?.licenseNumber ?? ''),
  })

  useEffect(() => {
    if (tab !== 4 || !user) return
    setPf({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      phone: e164ToNationalMobileDigits(user.phone ?? ''),
      licenseNumber: formatPhilippineDriversLicenseInput(user.licenseNumber ?? ''),
    })
  }, [tab, user])

  const mine = useMemo(() => bookings.filter((b) => b.userId === user?.id), [bookings, user?.id])
  const upcoming = useMemo(
    () =>
      sortRenterBookingsByPriority(
        mine.filter((b) => b.status !== 'cancelled' && !dayjs(b.dropoff).isBefore(dayjs(), 'day')),
      ),
    [mine],
  )
  const past = useMemo(
    () =>
      sortRenterBookingsByPriority(
        mine.filter((b) => dayjs(b.dropoff).isBefore(dayjs(), 'day') || b.status === 'cancelled'),
      ),
    [mine],
  )
  const savedCars = useMemo(() => cars.filter((c) => savedIds.includes(c.id)), [cars, savedIds])
  const pendingBookingsCount = useMemo(
    () => upcoming.filter((b) => b.status === 'pending').length,
    [upcoming],
  )
  const nextStep = useMemo(
    () => getRenterNextStep(pendingBookingsCount, upcoming.length, renterIdentityGate(user?.identityVerification?.status)),
    [pendingBookingsCount, upcoming.length, user?.identityVerification?.status],
  )

  const onNextStepAction = useCallback(() => {
    if (!nextStep) return
    if (nextStep.target === 'trips') {
      goToNav('trips')
      return
    }
    if (nextStep.target === 'verify') {
      navigate('/verify-identity')
      return
    }
    navigate('/search')
  }, [goToNav, navigate, nextStep])

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)

  const pickAvatarPhoto = () => avatarInputRef.current?.click()

  const onAvatarFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file || !user) return
      setAvatarBusy(true)
      try {
        const jpeg = await compressAvatarImageFileToJpegDataUrl(file)
        updateProfile({ avatar: jpeg })
        showSuccess('Profile photo updated')
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Could not use that photo. Try JPG or PNG.')
      } finally {
        setAvatarBusy(false)
      }
    },
    [showError, showSuccess, updateProfile, user],
  )

  const removeAvatarPhoto = useCallback(() => {
    if (!user) return
    updateProfile({ avatar: resolveAvatarAfterRemovePhoto(user) })
    showSuccess('Photo removed')
  }, [showSuccess, updateProfile, user])

  if (vehiclesLoading && cars.length === 0 && mine.length === 0) {
    return <DashboardPageSkeleton />
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, pb: { xs: `max(24px, env(safe-area-inset-bottom))`, sm: 4 }, ...containerGutters }}>
        <PageHeader
          overline={t('renter.overline')}
          title={t('renter.greeting', { name: user?.firstName ?? t('renter.greetingFallback') })}
          subtitle={t('renter.subtitle')}
          dense
        />

        {nextStep ? (
          <Paper
            elevation={0}
            sx={{
              mb: 2,
              mt: -0.5,
              px: { xs: 1.75, sm: 2 },
              py: 1.25,
              borderRadius: 2,
              border: 1,
              borderColor: nextStep.tone === 'warning' ? 'warning.light' : 'divider',
              bgcolor: (t) =>
                nextStep.tone === 'warning'
                  ? alpha(t.palette.warning.main, t.palette.mode === 'light' ? 0.08 : 0.16)
                  : alpha(t.palette.primary.main, t.palette.mode === 'light' ? 0.06 : 0.14),
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              gap={1.5}
              flexWrap="wrap"
              useFlexGap
            >
              <Typography variant="body2" sx={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
                {nextStep.target === 'trips'
                  ? pendingBookingsCount === 1
                    ? t('renter.nextPendingOne')
                    : t('renter.nextPendingOther', { count: pendingBookingsCount })
                  : nextStep.target === 'verify'
                    ? t('renter.nextVerify')
                    : t('renter.nextBrowse')}
              </Typography>
              <Button
                size="small"
                variant="contained"
                color={nextStep.tone === 'warning' ? 'warning' : 'primary'}
                onClick={onNextStepAction}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, flexShrink: 0 }}
              >
                {nextStep.target === 'trips'
                  ? t('renter.viewTrips')
                  : nextStep.target === 'verify'
                    ? t('renter.verify')
                    : t('renter.browse')}
              </Button>
            </Stack>
          </Paper>
        ) : null}

        <Box sx={dashboardTabsBarWrapSx}>
          <Tabs
            value={tab}
            onChange={(_, v) => {
              const idx = typeof v === 'number' ? v : 0
              const nav = RENTER_TAB_NAV_KEYS[Math.min(RENTER_TAB_NAV_KEYS.length - 1, Math.max(0, idx))] ?? 'trips'
              goToNav(nav)
            }}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            aria-label="Account sections"
            sx={dashboardSectionTabsSx}
          >
            <Tab
              icon={<CalendarMonthOutlined fontSize="small" />}
              iconPosition="start"
              label={
                <Badge
                  badgeContent={pendingBookingsCount}
                  color="warning"
                  invisible={pendingBookingsCount === 0}
                  max={99}
                  sx={{
                    '& .MuiBadge-badge': {
                      position: 'relative',
                      transform: 'none',
                      ml: 0.75,
                      fontSize: 10,
                      fontWeight: 800,
                      minWidth: 18,
                      height: 18,
                    },
                  }}
                >
                  {t('renter.trips')}
                </Badge>
              }
            />
            <Tab icon={<HistoryOutlined fontSize="small" />} iconPosition="start" label={t('renter.past')} />
            <Tab icon={<FavoriteBorder fontSize="small" />} iconPosition="start" label={t('renter.saved')} />
            <Tab icon={<RateReviewOutlined fontSize="small" />} iconPosition="start" label={t('renter.reviews')} />
            <Tab icon={<PersonOutline fontSize="small" />} iconPosition="start" label={t('renter.profile')} />
          </Tabs>
        </Box>

      {tab === 4 && (
        <Card
          elevation={0}
          sx={{
            ...listRowSurface(theme),
            maxWidth: 560,
            width: '100%',
            mx: 'auto',
            borderRadius: 3,
          }}
        >
          <CardContent
            sx={{
              px: { xs: 2, sm: 3.5 },
              py: { xs: 2, sm: 3.5 },
              '&:last-child': { pb: { xs: 2, sm: 3.5 } },
            }}
          >
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={800} letterSpacing="-0.02em" sx={{ color: 'text.primary' }}>
                {t('renter.profileTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
                {t('renter.profileHint')}
              </Typography>
            </Box>
            <Stack spacing={2.5} alignItems="stretch" sx={{ width: '100%' }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ letterSpacing: '-0.02em', color: 'text.primary' }}>
                  {t('renter.photo')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.25, lineHeight: 1.5 }}>
                  {t('renter.photoHint')}
                </Typography>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  aria-label="Upload profile photo"
                  onChange={onAvatarFileChange}
                />
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap sx={{ gap: 1.5 }}>
                  <UserAvatar avatar={user?.avatar} firstName={user?.firstName} lastName={user?.lastName} size={56} />
                  <Stack direction="row" flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                    <Button
                      type="button"
                      variant="outlined"
                      size="small"
                      startIcon={<PhotoCameraOutlined />}
                      disabled={avatarBusy || !user}
                      onClick={pickAvatarPhoto}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                      {avatarBusy ? t('renter.processing') : t('renter.changePhoto')}
                    </Button>
                    {user && isProfilePhotoAvatar(user.avatar) ? (
                      <Button
                        type="button"
                        variant="text"
                        size="small"
                        color="inherit"
                        disabled={avatarBusy}
                        onClick={removeAvatarPhoto}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        {t('renter.removePhoto')}
                      </Button>
                    ) : null}
                  </Stack>
                </Stack>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
                <TextField
                  label={t('auth.firstName')}
                  value={pf.firstName}
                  onChange={(e) => setPf({ ...pf, firstName: e.target.value })}
                  fullWidth
                  size="small"
                  sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <TextField
                  label={t('auth.lastName')}
                  value={pf.lastName}
                  onChange={(e) => setPf({ ...pf, lastName: e.target.value })}
                  fullWidth
                  size="small"
                  sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Stack>
              <TextField
                label={t('auth.email')}
                value={pf.email}
                disabled
                fullWidth
                size="small"
                helperText="Sign-in address — contact support to change"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
                <PhilippineNationalMobileTextField
                  label={t('auth.mobile')}
                  value={pf.phone}
                  onChange={(digits) => setPf({ ...pf, phone: digits })}
                  fullWidth
                  size="small"
                  helperText="10 digits starting with 9 (you can paste 09…)."
                  sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <PhilippineDriversLicenseTextField
                  label={t('auth.license')}
                  value={pf.licenseNumber}
                  onChange={(v) => setPf({ ...pf, licenseNumber: v })}
                  fullWidth
                  size="small"
                  helperText="Long LTO numbers format with hyphens (e.g. N12-34-567890)."
                  sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Stack>
              <Button
                variant="contained"
                fullWidth
                onClick={() => {
                  const phone = nationalMobileDigitsToE164(pf.phone)
                  const licenseNumber = normalizePhilippineDriversLicense(pf.licenseNumber)
                  if (!phone) {
                    showError('Enter 10 digits after +63 starting with 9.')
                    return
                  }
                  if (!isValidPhilippineDriversLicense(licenseNumber)) {
                    showError('License must match your LTO card (e.g. N12-34-567890 or N12345678).')
                    return
                  }
                  updateProfile({
                    firstName: pf.firstName.trim(),
                    lastName: pf.lastName.trim(),
                    phone,
                    licenseNumber,
                  })
                  setPf((prev) => ({
                    ...prev,
                    phone: e164ToNationalMobileDigits(phone),
                    licenseNumber: formatPhilippineDriversLicenseInput(licenseNumber),
                  }))
                  showSuccess('Profile updated')
                }}
                sx={{
                  py: 1.25,
                  borderRadius: 2,
                  fontWeight: 700,
                  ...primaryCtaShadow(theme),
                  alignSelf: { xs: 'stretch', sm: 'flex-start' },
                  width: { xs: '100%', sm: 'auto' },
                  minWidth: { sm: 200 },
                  px: { sm: 3 },
                }}
              >
                {t('renter.saveChanges')}
              </Button>
            </Stack>
            <Divider sx={{ my: 3 }} />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {t('renter.session')}
            </Typography>
            <Button
              onClick={() => logout()}
              color="inherit"
              variant="outlined"
              fullWidth
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: 'divider',
                py: 1.15,
                alignSelf: { xs: 'stretch', sm: 'flex-start' },
                width: { xs: '100%', sm: 'auto' },
                minWidth: { sm: 200 },
              }}
            >
              {t('nav.signOut')}
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === 0 && (
        <Stack spacing={2.5}>
          {upcoming.length === 0 && (
            <EmptyState
              title={t('renter.noUpcoming')}
              description={t('renter.noUpcomingDesc')}
              actionLabel={t('renter.browseVehicles')}
              onAction={() => navigate('/search')}
            />
          )}
          {upcoming.map((b) => (
            <Card key={b.id} elevation={0} sx={listRowSurface(theme)}>
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
                  <Stack direction="row" spacing={2}>
                    <Box component="img" src={b.carImage} sx={{ width: 120, height: 72, objectFit: 'cover', borderRadius: 2 }} />
                    <Box>
                      <Typography fontWeight={700}>{b.carName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatBookingStoredDate(b.pickup)} → {formatBookingStoredDate(b.dropoff)}
                      </Typography>
                      <Typography>{formatPeso(b.total)}</Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Chip
                      label={
                        b.status === 'pending'
                          ? t('renter.pending')
                          : b.status === 'confirmed'
                            ? t('renter.confirmed')
                            : t('renter.cancelled')
                      }
                      color={b.status === 'pending' ? 'warning' : 'success'}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                    <Button
                      component={RouterLink}
                      to={`/messages/${b.id}`}
                      size="small"
                      variant={b.status === 'pending' ? 'contained' : 'outlined'}
                      color="primary"
                      sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 700 }}
                    >
                      {t('renter.message')}
                    </Button>
                    <Button component={RouterLink} to={`/cars/${b.carId}`} size="small" variant="outlined" color="primary" sx={{ borderRadius: 1.5 }}>
                      {t('renter.view')}
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        cancelBooking(b.id)
                        showInfo('Booking cancelled')
                      }}
                    >
                      {t('renter.cancel')}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {tab === 1 && (
        <Stack spacing={2.5}>
          {past.length === 0 && (
            <EmptyState
              title={t('renter.noPast')}
              description={t('renter.noPastDesc')}
            />
          )}
          {past.map((b) => (
            <Card key={b.id} elevation={0} sx={{ opacity: 0.92, ...listRowSurface(theme) }}>
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} alignItems={{ sm: 'center' }}>
                  <Box>
                    <Typography fontWeight={700}>{b.carName}</Typography>
                    <Typography variant="body2">
                      {formatBookingStoredDate(b.pickup)} – {formatBookingStoredDate(b.dropoff)}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Chip
                      label={b.status === 'cancelled' ? t('renter.cancelled') : t('renter.completed')}
                      color={b.status === 'cancelled' ? 'default' : 'success'}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                    <Button component={RouterLink} to={`/messages/${b.id}`} size="small" variant="outlined" sx={{ borderRadius: 1.5, alignSelf: { xs: 'flex-start', sm: 'center' } }}>
                      {t('renter.message')}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {tab === 2 &&
        (vehiclesLoading && savedCars.length === 0 ? (
          <CarGridSkeleton count={4} />
        ) : savedCars.length === 0 ? (
          <EmptyState
            title={t('renter.noSaved')}
            description={t('renter.noSavedDesc')}
            actionLabel={t('renter.browseVehicles')}
            onAction={() => navigate('/search')}
          />
        ) : (
          <Grid container spacing={{ xs: 2.5, md: 3 }}>
            {savedCars.map((car) => (
              <Grid item xs={12} md={6} key={car.id}>
                <Box sx={{ height: '100%', '& .MuiCard-root': { borderRadius: 3, height: '100%' } }}>
                  <CarCard car={car} onNavigate={(c) => navigate(`/cars/${c.id}`)} />
                </Box>
              </Grid>
            ))}
          </Grid>
        ))}

      {tab === 3 && (
        <EmptyState
          title={t('renter.reviewsSoon')}
          description={t('renter.reviewsSoonDesc')}
        />
      )}
      </Container>
    </Box>
  )
}
