import Add from '@mui/icons-material/Add'
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
  Fab,
  Grid,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material'
import { useMemo, useState } from 'react'

import ListingForm from '../components/host/ListingForm'
import PageHeader from '../components/layout/PageHeader'
import EarningsCard, { EarningsPlaceholderChart } from '../components/host/EarningsCard'
import { useAuthStore } from '../store/useAuthStore'
import { useBookingStore } from '../store/useBookingStore'
import { useCarsStore } from '../store/useCarsStore'
import { useSnackbarStore } from '../store/useSnackbarStore'
import { formatPeso } from '../utils/formatCurrency'
import { containerGutters, listRowSurface, primaryCtaShadow, softInteractiveSurface } from '../theme/pageStyles'

export default function HostDashboardPage() {
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)
  const becomeHost = useAuthStore((s) => s.becomeHost)
  const cars = useCarsStore((s) => s.cars)
  const updateListing = useCarsStore((s) => s.updateListing)
  const bookings = useBookingStore((s) => s.bookings)
  const cancelBooking = useBookingStore((s) => s.cancelBooking)

  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showInfo = useSnackbarStore((s) => s.showInfo)

  const [tab, setTab] = useState(0)
  const [listingOpen, setListingOpen] = useState(false)

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
            subtitle="Turn your idle car into income with rentaHub — same polished experience as the renter app."
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

        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tab icon={<DirectionsCar />} iconPosition="start" label="My listings" />
          <Tab icon={<MonetizationOn />} iconPosition="start" label="Earnings" />
          <Tab icon={<EventAvailable />} iconPosition="start" label="Booking requests" />
          <Tab icon={<Settings />} iconPosition="start" label="Listing settings" />
        </Tabs>

      {tab === 0 && (
        <Grid container spacing={{ xs: 2.5, md: 3 }} alignItems="stretch">
          {hostCars.map((car) => (
            <Grid item xs={12} md={6} key={car.id} sx={{ display: 'flex' }}>
              <Card elevation={0} sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', ...listRowSurface(theme) }}>
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ flex: 1 }}>
                    <Box
                      component="img"
                      src={car.images[0] ?? undefined}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=250&fit=crop'
                      }}
                      sx={{
                        width: 140,
                        height: 88,
                        objectFit: 'cover',
                        borderRadius: 2,
                        bgcolor: 'grey.200',
                        flexShrink: 0,
                      }}
                    />
                    <Stack flex={1} spacing={1}>
                      <Typography fontWeight={700}>
                        {car.year} {car.make} {car.model}
                      </Typography>
                      <Typography color="primary" fontWeight={700}>
                        {formatPeso(car.pricePerDay)}/day
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2">Active listing</Typography>
                        <Switch
                          checked={car.available}
                          onChange={(_, checked) => {
                            updateListing(car.id, { available: checked })
                            showInfo(checked ? 'Listing is live' : 'Listing paused')
                          }}
                        />
                      </Stack>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {hostCars.length === 0 && (
            <Stack spacing={1.5} alignItems="flex-start" sx={{ py: 1 }}>
              <Typography color="text.secondary">No listings yet — add a vehicle to appear in search for renters.</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => setListingOpen(true)} sx={{ borderRadius: 2, ...primaryCtaShadow(theme) }}>
                Add listing
              </Button>
            </Stack>
          )}
        </Grid>
      )}

      {tab === 1 && (
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

      {tab === 2 && (
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

      {tab === 3 && (
        <Paper elevation={0} sx={{ p: 3, ...softInteractiveSurface(theme, false) }}>
          <Typography variant="body1" color="text.secondary">
            Listing policies, instant book, and guest requirements would live here — mock only for MVP.
          </Typography>
        </Paper>
      )}

      <ListingForm open={listingOpen} onClose={() => setListingOpen(false)} />

      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          right: 16,
          bottom: `max(24px, calc(16px + env(safe-area-inset-bottom)))`,
          display: tab === 0 ? 'inline-flex' : 'none',
        }}
        onClick={() => setListingOpen(true)}
        aria-label="add listing"
      >
        <Add />
      </Fab>
      </Container>
    </Box>
  )
}
