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

import ListingForm from '../components/host/ListingForm'
import PageHeader from '../components/layout/PageHeader'
import { MOBILE_TAB_BAR_FAB_BOTTOM } from '../components/layout/MobileBottomNav'
import EarningsCard, { EarningsPlaceholderChart } from '../components/host/EarningsCard'
import { useAuthStore } from '../store/useAuthStore'
import { useBookingStore } from '../store/useBookingStore'
import { useCarsStore } from '../store/useCarsStore'
import { useSnackbarStore } from '../store/useSnackbarStore'
import { formatPeso } from '../utils/formatCurrency'
import { containerGutters, dashboardSectionTabsSx, listRowSurface, primaryCtaShadow, softInteractiveSurface } from '../theme/pageStyles'

export default function HostDashboardPage() {
  const theme = useTheme()
  const [searchParams] = useSearchParams()
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
    if (user?.isHost && searchParams.get('section') === 'list') {
      setTab(0)
    }
  }, [searchParams, user?.isHost])

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

  if (!user) return null

  if (!user.isHost) {
    return (
      <Box sx={{ bgcolor: 'grey.50', py: { xs: 7, md: 9 } }}>
        <Container maxWidth="md" sx={containerGutters}>
          <PageHeader
            title="Become a host"
            subtitle="Turn your idle car into income with Rentara — same polished experience as the renter app."
            dense
            align="center"
          />
          <Grid container spacing={{ xs: 2.5, md: 3 }} sx={{ mt: 1 }} alignItems="stretch">
            <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
              <Paper elevation={0} sx={{ p: 3, width: '100%', height: '100%', ...listRowSurface(theme) }}>
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
              <Paper elevation={0} sx={{ p: 3, width: '100%', height: '100%', ...listRowSurface(theme) }}>
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
              <Paper elevation={0} sx={{ p: 3, width: '100%', height: '100%', ...listRowSurface(theme) }}>
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
        <PageHeader
          overline="Host"
          title="Host dashboard"
          subtitle={`Manage listings and driver requests for ${user.firstName}.`}
          dense
        />

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile={false}
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

      {tab === 0 && (
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
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2.5,
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
            <Stack spacing={1.5} alignItems="flex-start" sx={{ py: 1 }}>
              <Typography color="text.secondary">No listings yet — add a vehicle to appear in search for renters.</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  setEditingCarId(null)
                  setListingOpen(true)
                }}
                sx={{ borderRadius: 2, ...primaryCtaShadow(theme) }}
              >
                Add listing
              </Button>
            </Stack>
          )}
        </Grid>
      )}

      {tab === 2 && (
        <Grid container spacing={{ xs: 2.5, md: 3 }} alignItems="stretch">
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', minWidth: 0 }}>
            <EarningsCard title="Total earned" value={earningsMock.total} icon="money" />
          </Grid>
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', minWidth: 0 }}>
            <EarningsCard title="This month (mock)" value={earningsMock.month} icon="calendar" />
          </Grid>
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', minWidth: 0 }}>
            <EarningsCard title="Active bookings" value={String(earningsMock.active)} icon="car" />
          </Grid>
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', minWidth: 0 }}>
            <EarningsCard title="Avg. rating" value="4.9 ★" icon="star" />
          </Grid>
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2.5, ...softInteractiveSurface(theme, false) }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Weekly performance (mock)
              </Typography>
              <EarningsPlaceholderChart />
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" component="p" sx={{ m: 0 }}>
              Recent payouts are simulated — connect a real payout method in production.
            </Typography>
          </Grid>
        </Grid>
      )}

      {tab === 3 && (
        <Stack spacing={2}>
          {hostBookings.length === 0 && <Typography color="text.secondary">No bookings for your vehicles yet.</Typography>}
          {hostBookings.map((b) => (
            <Card key={b.id} elevation={0} sx={{ width: '100%', ...listRowSurface(theme) }}>
              <CardContent
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'stretch', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={700}>{b.carName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {b.renterName}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {b.pickup} → {b.dropoff}
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
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
                    />
                    <Button
                      component={RouterLink}
                      to={`/messages/${b.id}`}
                      size="small"
                      variant="contained"
                      color="primary"
                      disabled={b.status === 'cancelled'}
                    >
                      Message
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={b.status === 'cancelled' || b.status === 'confirmed'}
                      onClick={() => showSuccess('Booking accepted (mock)')}
                    >
                      {b.status === 'confirmed' ? 'Confirmed' : 'Accept'}
                    </Button>
                    <Button
                      size="small"
                      disabled={b.status === 'cancelled'}
                      onClick={() => {
                        cancelBooking(b.id)
                        showInfo('Booking declined / cancelled')
                      }}
                    >
                      Decline
                    </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {tab === 1 && (
        <Paper elevation={0} sx={{ p: 3, ...softInteractiveSurface(theme, false) }}>
          <Typography variant="body1" color="text.secondary">
            Listing policies, instant book, and guest requirements would live here — mock only for MVP.
          </Typography>
        </Paper>
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
