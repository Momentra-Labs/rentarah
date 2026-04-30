import Add from '@mui/icons-material/Add'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import Edit from '@mui/icons-material/Edit'
import MonetizationOn from '@mui/icons-material/MonetizationOn'
import Settings from '@mui/icons-material/Settings'
import DirectionsCar from '@mui/icons-material/DirectionsCar'
import EventAvailable from '@mui/icons-material/EventAvailable'
import Shield from '@mui/icons-material/Shield'
import Speed from '@mui/icons-material/Speed'
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined'
import {
  alpha,
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
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'

import UserAvatar from '../components/common/UserAvatar'
import ListingForm from '../components/host/ListingForm'
import PageHeader from '../components/layout/PageHeader'
import { MOBILE_TAB_BAR_FAB_BOTTOM } from '../components/layout/MobileBottomNav'
import HostEarningsSection from '../components/host/HostEarningsSection'
import { useAuthStore } from '../store/useAuthStore'
import { useBookingStore } from '../store/useBookingStore'
import { useCarsStore } from '../store/useCarsStore'
import { useSnackbarStore } from '../store/useSnackbarStore'
import { formatBookingStoredDate } from '../utils/dateUtils'
import { formatPeso } from '../utils/formatCurrency'
import {
  containerGutters,
  dashboardSectionTabsSx,
  dashboardTabsBarWrapSx,
  listRowSurface,
  primaryCtaShadow,
} from '../theme/pageStyles'

const HOST_TAB_SECTION_KEYS = ['listings', 'settings', 'earnings', 'bookings'] as const

function hostSectionToTab(section: string | null): number {
  if (section == null || section === '' || section === 'list' || section === 'listings') return 0
  if (section === 'settings') return 1
  if (section === 'earnings') return 2
  if (section === 'bookings' || section === 'requests') return 3
  return 0
}

export default function HostDashboardPage() {
  const theme = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const becomeHost = useAuthStore((s) => s.becomeHost)
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
  const shortTabLabels = useMediaQuery(theme.breakpoints.down('md'))

  const closeListingForm = useCallback(() => {
    setListingOpen(false)
    setEditingCarId(null)
  }, [])

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

  if (!user) return null

  if (!user.isHost) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 7, md: 9 } }}>
        <Container maxWidth="md" sx={containerGutters}>
          <PageHeader overline="Hosting" title="Become a host" dense align="center" />
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ maxWidth: 520, mx: 'auto', mt: -0.75, mb: { xs: 2.5, md: 3 }, lineHeight: 1.65 }}
          >
            List a vehicle once, then manage calendars, messages, and requests from one place — aligned with how renters
            browse in RentaraH.
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
              Start listing
            </Button>
          </Stack>
        </Container>
      </Box>
    )
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, pb: { xs: 12, md: 10 }, ...containerGutters }}>
        <PageHeader overline="Host" title="Host dashboard" dense />

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
            boxShadow: (t) =>
              `0 1px 0 ${alpha(t.palette.common.black, 0.04)}, 0 12px 40px -12px ${alpha(t.palette.primary.main, 0.12)}`,
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ sm: 'center' }}>
              <Box sx={{ position: 'relative', alignSelf: { xs: 'center', sm: 'flex-start' } }}>
                <UserAvatar
                  avatar={user.avatar}
                  firstName={user.firstName}
                  lastName={user.lastName}
                  size={72}
                  sx={{
                    boxShadow: (t) =>
                      `0 0 0 3px ${t.palette.background.paper}, 0 0 0 5px ${alpha(t.palette.primary.main, 0.35)}`,
                  }}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0, textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500, wordBreak: 'break-word' }}>
                  {user.email}
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
                    icon={<StorefrontOutlined sx={{ '&&': { fontSize: 16 } }} />}
                    label="Host account"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 600, borderRadius: 2 }}
                  />
                  <Chip
                    size="small"
                    icon={<DirectionsCar sx={{ '&&': { fontSize: 16 } }} />}
                    label={hostCars.length === 1 ? '1 listing' : `${hostCars.length} listings`}
                    variant="outlined"
                    sx={{ fontWeight: 600, borderRadius: 2 }}
                  />
                  {pendingBookingsCount > 0 ? (
                    <Chip size="small" label={`${pendingBookingsCount} pending`} color="warning" sx={{ fontWeight: 700, borderRadius: 2 }} />
                  ) : null}
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Box sx={dashboardTabsBarWrapSx}>
          <Tabs
            value={tab}
            onChange={(_, v) => {
              setTab(v)
              setSearchParams(
                (prev) => {
                  const n = new URLSearchParams(prev)
                  const idx = typeof v === 'number' ? v : 0
                  n.set(
                    'section',
                    (HOST_TAB_SECTION_KEYS as readonly string[])[Math.min(HOST_TAB_SECTION_KEYS.length - 1, Math.max(0, idx))] ?? 'listings',
                  )
                  return n
                },
                { replace: true },
              )
            }}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            aria-label="Host dashboard sections"
            sx={dashboardSectionTabsSx}
          >
            <Tab
              icon={<DirectionsCar fontSize="small" />}
              iconPosition="start"
              label={shortTabLabels ? 'Listings' : 'My listings'}
            />
            <Tab
              icon={<Settings fontSize="small" />}
              iconPosition="start"
              label={shortTabLabels ? 'Settings' : 'Listing settings'}
            />
            <Tab icon={<MonetizationOn fontSize="small" />} iconPosition="start" label="Earnings" />
            <Tab
              icon={<EventAvailable fontSize="small" />}
              iconPosition="start"
              label={shortTabLabels ? 'Bookings' : 'Booking requests'}
            />
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
                  Your listings
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, maxWidth: 560, lineHeight: 1.55 }}>
                  Add another vehicle in a few taps — edits take effect instantly in this demo.
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
                Add listing
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
                        /day
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
                            showInfo(checked ? 'Listing is live' : 'Listing paused')
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                          {car.available ? 'Active on search' : 'Hidden from search'}
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
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={<DeleteOutline fontSize="small" />}
                        onClick={() => setDeleteForId(car.id)}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                      >
                        Remove
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
                  No listings yet
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 420, mx: 'auto' }}>
                  Publish a vehicle to appear in Browse and Map. Edit photos, pricing, and availability anytime.
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
                  Add listing
                </Button>
              </Paper>
            </Grid>
          )}
        </Grid>
        </>
      )}

      {tab === 1 && (
        <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2.5, pb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
              Listing preferences
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
              These controls will mirror host policies once wired to your backend — structured now so the dashboard feels finished.
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.25 } }}>
            <Typography fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
              Instant Book
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              Let qualified renters confirm without asking you each time — great when your calendar stays open.
            </Typography>
            <Typography variant="caption" color="primary.main" sx={{ mt: 1, fontWeight: 600, display: 'block' }}>
              Recommended for steady availability · demo stub
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.25 } }}>
            <Typography fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
              Turnover buffer
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              Minimum window between drop-off and the next pickup for cleaning or maintenance.
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
              Demo · not persisted
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.25 } }}>
            <Typography fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
              Guest verification
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              Require verified ID and contact details before confirming a reservation.
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
              Demo · not persisted
            </Typography>
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

      {tab === 3 && (
        <Stack spacing={2}>
          {hostBookings.length === 0 ? (
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
                No booking requests yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 440, mx: 'auto' }}>
                Keep listings active and priced competitively — drivers will appear here once they initiate a reservation.
              </Typography>
            </Paper>
          ) : (
            <>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                Requests & confirmations
              </Typography>
              {hostBookings.map((b) => (
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
                        label={b.status}
                        color={b.status === 'cancelled' ? 'default' : b.status === 'confirmed' ? 'success' : 'warning'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                      <Button
                        component={RouterLink}
                        to={`/messages/${b.id}`}
                        size="small"
                        variant="contained"
                        color="primary"
                        disabled={b.status === 'cancelled'}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                      >
                        Message
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={b.status === 'cancelled' || b.status === 'confirmed'}
                        onClick={() => showSuccess('Booking accepted (mock)')}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                      >
                        {b.status === 'confirmed' ? 'Confirmed' : 'Accept'}
                      </Button>
                      <Button
                        size="small"
                        variant="text"
                        color="inherit"
                        disabled={b.status === 'cancelled'}
                        onClick={() => {
                          cancelBooking(b.id)
                          showInfo('Booking declined / cancelled')
                        }}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                      >
                        Decline
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
        <DialogTitle>Remove this listing?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Renters can no longer find or book it. This cannot be undone in the demo, but you can add a new listing
            anytime.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button onClick={() => setDeleteForId(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (deleteForId) {
                removeListing(deleteForId)
                showSuccess('Listing removed')
              }
              setDeleteForId(null)
            }}
          >
            Remove
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
        aria-label="add listing"
      >
        <Add />
      </Fab>
      </Container>
    </Box>
  )
}
