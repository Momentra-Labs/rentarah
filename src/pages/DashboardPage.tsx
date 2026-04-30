import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline'
import FavoriteBorder from '@mui/icons-material/FavoriteBorder'
import HistoryOutlined from '@mui/icons-material/HistoryOutlined'
import PersonOutline from '@mui/icons-material/PersonOutline'
import PhotoCameraOutlined from '@mui/icons-material/PhotoCameraOutlined'
import RateReviewOutlined from '@mui/icons-material/RateReviewOutlined'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'

import CarCard from '../components/common/CarCard'
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
import { containerGutters, dashboardSectionTabsSx, listRowSurface, primaryCtaShadow } from '../theme/pageStyles'

function tabIndexFromNav(nav: string | null): number {
  if (nav === 'profile') return 0
  if (nav === 'trips') return 1
  if (nav === 'past') return 2
  if (nav === 'saved') return 3
  if (nav === 'reviews') return 4
  return 0
}

export default function DashboardPage() {
  const theme = useTheme()
  const shortTabLabels = useMediaQuery(theme.breakpoints.down('md'))
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

  const cars = useCarsStore((s) => s.cars)
  const savedIds = useCarsStore((s) => s.savedCarIds)

  const [tab, setTab] = useState(() =>
    tabIndexFromNav(typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('nav') : null),
  )

  useEffect(() => {
    const nav = searchParams.get('nav')
    if (nav === 'trips' || nav === 'profile' || nav === 'past' || nav === 'saved' || nav === 'reviews') {
      setTab(tabIndexFromNav(nav))
      return
    }
    setTab(0)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('nav', 'profile')
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
    if (tab !== 0 || !user) return
    setPf({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      phone: e164ToNationalMobileDigits(user.phone ?? ''),
      licenseNumber: formatPhilippineDriversLicenseInput(user.licenseNumber ?? ''),
    })
  }, [tab, user])

  const mine = useMemo(() => bookings.filter((b) => b.userId === user?.id), [bookings, user?.id])
  const upcoming = mine.filter((b) => b.status !== 'cancelled' && !dayjs(b.dropoff).isBefore(dayjs(), 'day'))
  const past = mine.filter((b) => dayjs(b.dropoff).isBefore(dayjs(), 'day') || b.status === 'cancelled')
  const savedCars = useMemo(() => cars.filter((c) => savedIds.includes(c.id)), [cars, savedIds])

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

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, pb: { xs: `max(24px, env(safe-area-inset-bottom))`, sm: 4 }, ...containerGutters }}>
        <PageHeader overline="Your account" title="Dashboard" subtitle="Trips, saved cars, reviews, and profile settings." dense />

        <Card
          elevation={0}
          sx={{
            mb: 3,
            mt: -0.5,
            borderRadius: 3,
            border: 1,
            borderColor: 'divider',
            overflow: 'hidden',
            background: (t) =>
              t.palette.mode === 'light'
                ? `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.06)} 0%, ${alpha(t.palette.background.paper, 1)} 45%, ${alpha(t.palette.primary.light, 0.12)} 100%)`
                : `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.14)} 0%, ${t.palette.background.paper} 55%)`,
            boxShadow: (t) => `0 1px 0 ${alpha(t.palette.common.black, 0.04)}, 0 12px 40px -12px ${alpha(t.palette.primary.main, 0.12)}`,
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ sm: 'center' }}>
              <Box sx={{ position: 'relative', alignSelf: { xs: 'center', sm: 'flex-start' } }}>
                <UserAvatar
                  avatar={user?.avatar}
                  firstName={user?.firstName}
                  lastName={user?.lastName}
                  size={72}
                  sx={{
                    boxShadow: (t) =>
                      `0 0 0 3px ${t.palette.background.paper}, 0 0 0 5px ${alpha(t.palette.primary.main, 0.35)}`,
                  }}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0, textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography
                  component="h2"
                  variant="h5"
                  sx={{ fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2, color: 'text.primary' }}
                >
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5, fontWeight: 500, wordBreak: 'break-word' }}
                >
                  {user?.email}
                </Typography>
                <Stack
                  direction="row"
                  flexWrap="wrap"
                  alignItems="center"
                  justifyContent={{ xs: 'center', sm: 'flex-start' }}
                  useFlexGap
                  sx={{ mt: 1.25, gap: 1 }}
                >
                  <Chip
                    size="small"
                    icon={<CheckCircleOutline sx={{ '&&': { fontSize: 16 } }} />}
                    label="Identity verified"
                    color="success"
                    variant="outlined"
                    sx={{ fontWeight: 600, borderRadius: 2, bgcolor: (t) => alpha(t.palette.success.main, 0.06) }}
                  />
                  {user?.isHost && (
                    <Chip size="small" label="Host" color="primary" variant="outlined" sx={{ fontWeight: 600, borderRadius: 2 }} />
                  )}
                  {user?.createdAt && (
                    <Typography variant="caption" color="text.secondary" sx={{ width: { xs: '100%', sm: 'auto' }, textAlign: { xs: 'center', sm: 'left' } }}>
                      Member since {dayjs(user.createdAt).format('MMM YYYY')}
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v)
            setSearchParams(
              (prev) => {
                const n = new URLSearchParams(prev)
                const keys: Record<number, string> = {
                  0: 'profile',
                  1: 'trips',
                  2: 'past',
                  3: 'saved',
                  4: 'reviews',
                }
                const key = keys[v]
                if (key) n.set('nav', key)
                return n
              },
              { replace: true },
            )
          }}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile={false}
          aria-label="Account sections"
          sx={dashboardSectionTabsSx}
        >
          <Tab icon={<PersonOutline fontSize="small" />} iconPosition="start" label="Profile" />
          <Tab
            icon={<CalendarMonthOutlined fontSize="small" />}
            iconPosition="start"
            label={shortTabLabels ? 'Upcoming' : 'Upcoming trips'}
          />
          <Tab icon={<HistoryOutlined fontSize="small" />} iconPosition="start" label="Past" />
          <Tab icon={<FavoriteBorder fontSize="small" />} iconPosition="start" label="Saved" />
          <Tab icon={<RateReviewOutlined fontSize="small" />} iconPosition="start" label="Reviews" />
        </Tabs>

      {tab === 0 && (
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
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={800} letterSpacing="-0.02em" sx={{ color: 'text.primary' }}>
                Profile & contact
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
                Keep your name and contact details up to date for drivers and support.
              </Typography>
            </Box>
            <Stack spacing={2.5} alignItems="stretch" sx={{ width: '100%' }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                sx={{ width: '100%' }}
              >
                <UserAvatar
                  avatar={user?.avatar}
                  firstName={user?.firstName}
                  lastName={user?.lastName}
                  size={88}
                  sx={{
                    flexShrink: 0,
                    boxShadow: (t) =>
                      `0 0 0 2px ${t.palette.background.paper}, 0 0 0 3px ${alpha(t.palette.primary.main, 0.25)}`,
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ letterSpacing: '-0.02em', color: 'text.primary' }}>
                    Profile photo
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5, lineHeight: 1.5 }}>
                    JPG or PNG — shown on your account, nav menu, and new listings you publish.
                  </Typography>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    aria-label="Upload profile photo"
                    onChange={onAvatarFileChange}
                  />
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
                      {avatarBusy ? 'Processing…' : 'Upload photo'}
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
                        Remove photo
                      </Button>
                    ) : null}
                  </Stack>
                </Box>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
                <TextField
                  label="First name"
                  value={pf.firstName}
                  onChange={(e) => setPf({ ...pf, firstName: e.target.value })}
                  fullWidth
                  size="small"
                  sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <TextField
                  label="Last name"
                  value={pf.lastName}
                  onChange={(e) => setPf({ ...pf, lastName: e.target.value })}
                  fullWidth
                  size="small"
                  sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Stack>
              <TextField
                label="Email"
                value={pf.email}
                disabled
                fullWidth
                size="small"
                helperText="Sign-in address — contact support to change"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
                <PhilippineNationalMobileTextField
                  label="Phone"
                  value={pf.phone}
                  onChange={(digits) => setPf({ ...pf, phone: digits })}
                  fullWidth
                  size="small"
                  helperText="10 digits starting with 9 (you can paste 09…)."
                  sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <PhilippineDriversLicenseTextField
                  label="License number"
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
                Save changes
              </Button>
            </Stack>
            <Divider sx={{ my: 3 }} />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Session
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
              Sign out
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Stack spacing={2.5}>
          {upcoming.length === 0 && <Typography color="text.secondary">No upcoming trips.</Typography>}
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
                    <Chip label={b.status} color="success" size="small" />
                    <Button component={RouterLink} to={`/messages/${b.id}`} size="small" variant="contained" color="primary" sx={{ borderRadius: 1.5 }}>
                      Message
                    </Button>
                    <Button component={RouterLink} to={`/cars/${b.carId}`} size="small" variant="outlined" color="primary" sx={{ borderRadius: 1.5 }}>
                      View
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        cancelBooking(b.id)
                        showInfo('Booking cancelled')
                      }}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {tab === 2 && (
        <Stack spacing={2.5}>
          {past.length === 0 && <Typography color="text.secondary">No past rentals yet.</Typography>}
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
                  <Button component={RouterLink} to={`/messages/${b.id}`} size="small" variant="outlined" sx={{ borderRadius: 1.5, alignSelf: { xs: 'flex-start', sm: 'center' } }}>
                    Message
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {tab === 3 && (
        <Grid container spacing={{ xs: 2.5, md: 3 }}>
          {savedCars.map((car) => (
            <Grid item xs={12} md={6} key={car.id}>
              <Box sx={{ height: '100%', '& .MuiCard-root': { borderRadius: 3, height: '100%' } }}>
                <CarCard car={car} onNavigate={(c) => navigate(`/cars/${c.id}`)} />
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      {tab === 4 && <Typography color="text.secondary">Leave reviews after a trip (coming soon).</Typography>}
      </Container>
    </Box>
  )
}
