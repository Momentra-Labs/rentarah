import Add from '@mui/icons-material/Add'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import Edit from '@mui/icons-material/Edit'
import MonetizationOn from '@mui/icons-material/MonetizationOn'
import Settings from '@mui/icons-material/Settings'
import DirectionsCar from '@mui/icons-material/DirectionsCar'
import EventAvailable from '@mui/icons-material/EventAvailable'
import Shield from '@mui/icons-material/Shield'
import Speed from '@mui/icons-material/Speed'
import {
  alpha,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fab,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'

import ListingForm from '@/components/host/ListingForm'
import PageHeader from '@/components/layout/PageHeader'
import { MOBILE_TAB_BAR_FAB_BOTTOM } from '@/components/layout/MobileBottomNav'
import HostEarningsSection from '@/components/host/HostEarningsSection'
import HostDashboardPageSkeleton from '@/components/skeletons/HostDashboardPageSkeleton'
import { useT } from '@/hooks/useT'
import { useVehicles } from '@/hooks/useVehicles'
import { useAuthStore } from '@/store/useAuthStore'
import { useBookingStore } from '@/store/useBookingStore'
import { useCarsStore } from '@/store/useCarsStore'
import { useSnackbarStore } from '@/store/useSnackbarStore'
import type { BookingRecord, BookingStatus } from '@/types'
import { formatBookingStoredDate } from '@/utils/dateUtils'
import { formatPeso } from '@/utils/formatCurrency'
import {
  containerGutters,
  dashboardSectionTabsSx,
  dashboardTabsBarWrapSx,
  listRowSurface,
  primaryCtaShadow,
} from '@/theme/pageStyles'

const HOST_TAB_SECTION_KEYS = ['listings', 'bookings', 'earnings', 'settings'] as const

type HostTabSection = (typeof HOST_TAB_SECTION_KEYS)[number]

const BOOKING_STATUS_SORT: Record<BookingStatus, number> = {
  pending: 0,
  confirmed: 1,
  cancelled: 2,
}

export function hostSectionToTab(section: string | null): number {
  if (section == null || section === '' || section === 'list' || section === 'listings') return 0
  if (section === 'bookings' || section === 'requests') return 1
  if (section === 'earnings') return 2
  if (section === 'settings') return 3
  return 0
}

export function bookingStatusLabel(status: BookingStatus): string {
  if (status === 'pending') return 'Pending'
  if (status === 'confirmed') return 'Confirmed'
  return 'Cancelled'
}

export function sortHostBookingsByPriority(bookings: BookingRecord[]): BookingRecord[] {
  return [...bookings].sort((a, b) => BOOKING_STATUS_SORT[a.status] - BOOKING_STATUS_SORT[b.status])
}

export type HostNextStep = {
  text: string
  actionLabel: string
  tone: 'warning' | 'primary' | 'neutral'
  target: 'bookings' | 'listings' | 'add-listing'
}

export function getHostNextStep(
  pendingBookingsCount: number,
  listingCount: number,
  pausedListingsCount: number,
): HostNextStep | null {
  if (pendingBookingsCount > 0) {
    return {
      text:
        pendingBookingsCount === 1
          ? '1 booking request needs a reply'
          : `${pendingBookingsCount} booking requests need a reply`,
      actionLabel: 'Review',
      tone: 'warning',
      target: 'bookings',
    }
  }
  if (listingCount === 0) {
    return {
      text: 'Add a vehicle to start getting bookings',
      actionLabel: 'Add listing',
      tone: 'primary',
      target: 'add-listing',
    }
  }
  if (listingCount > 0 && pausedListingsCount === listingCount) {
    return {
      text:
        pausedListingsCount === 1
          ? '1 listing is hidden from search'
          : `${pausedListingsCount} listings are hidden from search`,
      actionLabel: 'View listings',
      tone: 'neutral',
      target: 'listings',
    }
  }
  return null
}

export default function HostDashboardPage() {
  const t = useT()
  const theme = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const becomeHost = useAuthStore((s) => s.becomeHost)
  const { isLoading: vehiclesLoading } = useVehicles()
  const cars = useCarsStore((s) => s.cars)
  const updateListing = useCarsStore((s) => s.updateListing)
  const removeListing = useCarsStore((s) => s.removeListing)
  const bookings = useBookingStore((s) => s.bookings)
  const cancelBooking = useBookingStore((s) => s.cancelBooking)

  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showInfo = useSnackbarStore((s) => s.showInfo)

  const [tab, setTab] = useState(0)
  const [listingOpen, setListingOpen] = useState(false)
  const [editingCarId, setEditingCarId] = useState<string | null>(null)
  const [deleteForId, setDeleteForId] = useState<string | null>(null)

  const closeListingForm = useCallback(() => {
    setListingOpen(false)
    setEditingCarId(null)
  }, [])

  const goToSection = useCallback(
    (section: HostTabSection) => {
      setTab(hostSectionToTab(section))
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev)
          n.set('section', section)
          return n
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  useEffect(() => {
    if (!user?.isHost) return
    const raw = searchParams.get('section')
    const recognized =
      raw == null ||
      raw === '' ||
      raw === 'list' ||
      raw === 'listings' ||
      raw === 'settings' ||
      raw === 'earnings' ||
      raw === 'bookings' ||
      raw === 'requests'
    if (!recognized) {
      setTab(0)
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev)
          n.set('section', 'listings')
          return n
        },
        { replace: true },
      )
      return
    }
    setTab(hostSectionToTab(raw))
    if (raw == null || raw === '') {
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev)
          n.set('section', 'listings')
          return n
        },
        { replace: true },
      )
    }
  }, [searchParams, setSearchParams, user?.isHost])

  const hostCars = useMemo(() => cars.filter((c) => c.hostId === user?.id), [cars, user?.id])

  const hostBookings = useMemo(
    () => (user ? bookings.filter((b) => b.hostId === user.id) : []),
    [bookings, user],
  )

  const earningsMock = useMemo(() => {
    const total = hostBookings.reduce((acc, b) => (b.status === 'cancelled' ? acc : acc + b.total), 0)
    return {
      total,
      month: Math.round(total * 0.15) || 0,
      active: hostBookings.filter((b) => b.status !== 'cancelled').length,
    }
  }, [hostBookings])

  const pendingBookingsCount = useMemo(
    () => hostBookings.filter((b) => b.status === 'pending').length,
    [hostBookings],
  )

  const sortedHostBookings = useMemo(() => sortHostBookingsByPriority(hostBookings), [hostBookings])

  const pausedListingsCount = useMemo(
    () => hostCars.filter((c) => !c.available).length,
    [hostCars],
  )

  const nextStep = useMemo(
    () => getHostNextStep(pendingBookingsCount, hostCars.length, pausedListingsCount),
    [hostCars.length, pausedListingsCount, pendingBookingsCount],
  )

  const onNextStepAction = useCallback(() => {
    if (!nextStep) return
    if (nextStep.target === 'bookings') {
      goToSection('bookings')
      return
    }
    if (nextStep.target === 'listings') {
      goToSection('listings')
      return
    }
    setEditingCarId(null)
    setListingOpen(true)
  }, [goToSection, nextStep])

  if (!user) return null

  if (user.isHost && vehiclesLoading && hostCars.length === 0) {
    return <HostDashboardPageSkeleton />
  }

  if (!user.isHost) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 7, md: 9 } }}>
        <Container maxWidth="md" sx={containerGutters}>
          <PageHeader overline={t('host.overline')} title={t('host.becomeTitle')} dense align="center" />
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ maxWidth: 520, mx: 'auto', mt: -0.75, mb: { xs: 2.5, md: 3 }, lineHeight: 1.65 }}
          >
            {t('host.becomeBody')}
          </Typography>
          <Grid container spacing={{ xs: 2.5, md: 3 }} alignItems="stretch">
            <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
              <Paper elevation={0} sx={{ p: 3, width: '100%', height: '100%', borderRadius: 3, ...listRowSurface(theme) }}>
                <MonetizationOn sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6" fontWeight={700}>
                  Earn money
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Set your price and earn every time someone books your vehicle.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
              <Paper elevation={0} sx={{ p: 3, width: '100%', height: '100%', borderRadius: 3, ...listRowSurface(theme) }}>
                <Speed sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6" fontWeight={700}>
                  Easy management
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Track bookings, payouts, and requests from one dashboard.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
              <Paper elevation={0} sx={{ p: 3, width: '100%', height: '100%', borderRadius: 3, ...listRowSurface(theme) }}>
                <Shield sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6" fontWeight={700}>
                  Protection
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Mock coverage — real products would include verified trips and support.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          <Stack alignItems="center" sx={{ mt: 4 }}>
            <Button size="large" variant="contained" onClick={() => becomeHost()} sx={{ borderRadius: 2, py: 1.25, px: 3, ...primaryCtaShadow(theme) }}>
              {t('host.startListing')}
            </Button>
          </Stack>
        </Container>
      </Box>
    )
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, pb: { xs: 12, md: 10 }, ...containerGutters }}>
        <PageHeader
          overline={t('host.overline')}
          title={t('host.greeting', { name: user.firstName })}
          subtitle={t('host.subtitle')}
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
                  : nextStep.tone === 'primary'
                    ? alpha(t.palette.primary.main, t.palette.mode === 'light' ? 0.06 : 0.14)
                    : t.palette.background.paper,
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
                {nextStep.target === 'bookings'
                  ? pendingBookingsCount === 1
                    ? t('host.nextPendingOne')
                    : t('host.nextPendingOther', { count: pendingBookingsCount })
                  : nextStep.target === 'add-listing'
                    ? t('host.nextAdd')
                    : pausedListingsCount === 1
                      ? t('host.nextPausedOne')
                      : t('host.nextPausedOther', { count: pausedListingsCount })}
              </Typography>
              <Button
                size="small"
                variant="contained"
                color={nextStep.tone === 'warning' ? 'warning' : 'primary'}
                onClick={onNextStepAction}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, flexShrink: 0 }}
              >
                {nextStep.target === 'bookings'
                  ? t('host.review')
                  : nextStep.target === 'add-listing'
                    ? t('host.addListing')
                    : t('host.viewListings')}
              </Button>
            </Stack>
          </Paper>
        ) : null}

        <Box sx={dashboardTabsBarWrapSx}>
          <Tabs
            value={tab}
            onChange={(_, v) => {
              const idx = typeof v === 'number' ? v : 0
              const section = HOST_TAB_SECTION_KEYS[Math.min(HOST_TAB_SECTION_KEYS.length - 1, Math.max(0, idx))] ?? 'listings'
              goToSection(section)
            }}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            aria-label="Host dashboard sections"
            sx={dashboardSectionTabsSx}
          >
            <Tab icon={<DirectionsCar fontSize="small" />} iconPosition="start" label={t('host.listings')} />
            <Tab
              icon={<EventAvailable fontSize="small" />}
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
                  {t('host.requests')}
                </Badge>
              }
            />
            <Tab icon={<MonetizationOn fontSize="small" />} iconPosition="start" label={t('host.earnings')} />
            <Tab icon={<Settings fontSize="small" />} iconPosition="start" label={t('host.settings')} />
          </Tabs>
        </Box>

      {tab === 0 && (
        <>
          {hostCars.length > 0 ? (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              justifyContent="space-between"
              sx={{ mb: { xs: 2.25, md: 2.75 } }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {t('host.yourListings')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, maxWidth: 560, lineHeight: 1.55 }}>
                  {t('host.yourListingsHint')}
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Add />}
                sx={{
                  flexShrink: 0,
                  alignSelf: { xs: 'stretch', sm: 'center' },
                  borderRadius: 2,
                  py: { xs: 1.125, sm: 0.875 },
                  ...primaryCtaShadow(theme),
                }}
                onClick={() => {
                  setEditingCarId(null)
                  setListingOpen(true)
                }}
              >
                {t('host.addListing')}
              </Button>
            </Stack>
          ) : null}
          <Grid container spacing={{ xs: 2.5, md: 3 }} alignItems="stretch">
          {hostCars.map((car) => (
            <Grid item xs={12} md={6} key={car.id} sx={{ display: 'flex' }}>
              <Card
                elevation={0}
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  borderRadius: 3,
                  ...listRowSurface(theme),
                }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  alignItems="stretch"
                  spacing={0}
                  sx={{ flex: 1 }}
                >
                  <Box
                    component="img"
                    src={car.images[0] ?? undefined}
                    alt={`${car.year} ${car.make} ${car.model}`}
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=250&fit=crop'
                    }}
                    sx={{
                      width: { xs: '100%', sm: 168 },
                      minHeight: { xs: 160, sm: 120 },
                      maxHeight: { xs: 200, sm: 160 },
                      objectFit: 'cover',
                      bgcolor: 'grey.200',
                      flexShrink: 0,
                    }}
                  />
                  <CardContent
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      py: 2.5,
                      '&:last-child': { pb: 2.5 },
                    }}
                  >
                    <Typography variant="h6" component="h3" fontWeight={800} letterSpacing="-0.02em" sx={{ pr: 0.5 }}>
                      {car.year} {car.make} {car.model}
                    </Typography>
                    <Typography color="primary.main" fontWeight={800} fontSize="1.1rem" sx={{ mt: 0.5 }}>
                      {formatPeso(car.pricePerDay)}
                      <Typography component="span" variant="body2" color="text.secondary" fontWeight={600} sx={{ ml: 0.5 }}>
                        {t('common.perDay')}
                      </Typography>
                    </Typography>
                    <FormControlLabel
                      sx={{ alignItems: 'center', mt: 1.5, ml: 0, mr: 0, gap: 1 }}
                      control={
                        <Switch
                          size="small"
                          checked={car.available}
                          onChange={(_, checked) => {
                            updateListing(car.id, { available: checked })
                            showInfo(checked ? t('host.listingLive') : t('host.listingPaused'))
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                          {car.available ? t('host.activeOnSearch') : t('host.hiddenFromSearch')}
                        </Typography>
                      }
                    />
                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 'auto', pt: 2 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Edit fontSize="small" />}
                        onClick={() => {
                          setEditingCarId(car.id)
                          setListingOpen(true)
                        }}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                      >
                        {t('common.edit')}
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={<DeleteOutline fontSize="small" />}
                        onClick={() => setDeleteForId(car.id)}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                      >
                        {t('common.remove')}
                      </Button>
                    </Stack>
                  </CardContent>
                </Stack>
              </Card>
            </Grid>
          ))}
          {hostCars.length === 0 && (
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3.5, sm: 5 },
                  textAlign: 'center',
                  borderRadius: 3,
                  ...listRowSurface(theme),
                }}
              >
                <DirectionsCar sx={{ fontSize: 52, color: 'text.secondary', opacity: 0.45, mb: 1 }} />
                <Typography variant="h6" component="p" sx={{ fontWeight: 800, letterSpacing: '-0.02em', m: 0 }}>
                  {t('host.noListings')}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 420, mx: 'auto' }}>
                  {t('host.noListingsDesc')}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  sx={{ mt: 2.5, borderRadius: 2, ...primaryCtaShadow(theme) }}
                  onClick={() => {
                    setEditingCarId(null)
                    setListingOpen(true)
                  }}
                >
                  {t('host.addListing')}
                </Button>
              </Paper>
            </Grid>
          )}
        </Grid>
        </>
      )}

      {tab === 3 && (
        <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2.5, pb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
              Listing preferences
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
              Host policy controls are coming soon. Preferences below are previews and are not saved yet.
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.25 }, opacity: 0.72 }}>
            <Typography fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
              Instant Book
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              Let qualified renters confirm without asking you each time — great when your calendar stays open.
            </Typography>
            <Chip size="small" label="Coming soon" sx={{ mt: 1, fontWeight: 700 }} />
          </Box>
          <Divider />
          <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.25 }, opacity: 0.72 }}>
            <Typography fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
              Turnover buffer
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              Minimum window between drop-off and the next pickup for cleaning or maintenance.
            </Typography>
            <Chip size="small" label="Coming soon" sx={{ mt: 1, fontWeight: 700 }} />
          </Box>
          <Divider />
          <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.25 }, opacity: 0.72 }}>
            <Typography fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
              Guest verification
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              Require verified ID and contact details before confirming a reservation.
            </Typography>
            <Chip size="small" label="Coming soon" sx={{ mt: 1, fontWeight: 700 }} />
          </Box>
        </Paper>
      )}

      {tab === 2 && (
        <HostEarningsSection
          totalEarned={earningsMock.total}
          monthEarned={earningsMock.month}
          activeBookings={earningsMock.active}
          avgRatingLabel="4.9 ★"
        />
      )}

      {tab === 1 && (
        <Stack spacing={2}>
          {sortedHostBookings.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3.5, sm: 4 },
                borderRadius: 3,
                textAlign: 'center',
                ...listRowSurface(theme),
              }}
            >
              <EventAvailable sx={{ fontSize: 52, color: 'text.secondary', opacity: 0.45, mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
                {t('host.noRequests')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 440, mx: 'auto' }}>
                {t('host.noRequestsDesc')}
              </Typography>
            </Paper>
          ) : (
            <>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                {t('host.requestsTitle')}
              </Typography>
              {sortedHostBookings.map((b) => (
                <Card key={b.id} elevation={0} sx={{ width: '100%', borderRadius: 3, ...listRowSurface(theme) }}>
                  <CardContent
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'stretch', sm: 'center' },
                      justifyContent: 'space-between',
                      gap: 2,
                      py: 2,
                      '&:last-child': { pb: 2 },
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
                        {b.carName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {b.renterName}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.75 }}>
                        {formatBookingStoredDate(b.pickup)} → {formatBookingStoredDate(b.dropoff)}
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="primary.main" sx={{ mt: 0.5 }}>
                        {formatPeso(b.total)}
                      </Typography>
                    </Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                      useFlexGap
                      sx={{ flexShrink: 0, justifyContent: { xs: 'flex-end', sm: 'flex-end' } }}
                    >
                      <Chip
                        label={
                          b.status === 'pending'
                            ? t('host.pending')
                            : b.status === 'confirmed'
                              ? t('host.confirmed')
                              : t('host.cancelled')
                        }
                        color={b.status === 'cancelled' ? 'default' : b.status === 'confirmed' ? 'success' : 'warning'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                      <Button
                        component={RouterLink}
                        to={`/messages/${b.id}`}
                        size="small"
                        variant={b.status === 'pending' ? 'outlined' : 'contained'}
                        color="primary"
                        disabled={b.status === 'cancelled'}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                      >
                        {t('host.message')}
                      </Button>
                      <Button
                        size="small"
                        variant={b.status === 'pending' ? 'contained' : 'outlined'}
                        disabled={b.status === 'cancelled' || b.status === 'confirmed'}
                        onClick={() => showSuccess('Booking accepted (mock)')}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: b.status === 'pending' ? 700 : 600 }}
                      >
                        {b.status === 'confirmed' ? t('host.confirmed') : t('host.accept')}
                      </Button>
                      <Button
                        size="small"
                        variant="text"
                        color="inherit"
                        disabled={b.status === 'cancelled'}
                        onClick={() => {
                          cancelBooking(b.id)
                          showInfo(t('host.bookingDeclined'))
                        }}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                      >
                        {t('host.decline')}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </Stack>
      )}

      <ListingForm open={listingOpen} onClose={closeListingForm} editingCarId={editingCarId} />

      <Dialog open={deleteForId != null} onClose={() => setDeleteForId(null)} fullWidth maxWidth="xs">
        <DialogTitle>{t('host.removeTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t('host.removeBody')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button onClick={() => setDeleteForId(null)}>{t('common.cancel')}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (deleteForId) {
                removeListing(deleteForId)
                showSuccess(t('host.listingRemoved'))
              }
              setDeleteForId(null)
            }}
          >
            {t('common.remove')}
          </Button>
        </DialogActions>
      </Dialog>

      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          right: 16,
          bottom: {
            xs: MOBILE_TAB_BAR_FAB_BOTTOM,
            md: `max(24px, calc(16px + env(safe-area-inset-bottom)))`,
          },
          display: tab === 0 ? 'inline-flex' : 'none',
        }}
        onClick={() => {
          setEditingCarId(null)
          setListingOpen(true)
        }}
        aria-label={t('host.addListingAria')}
      >
        <Add />
      </Fab>
      </Container>
    </Box>
  )
}
