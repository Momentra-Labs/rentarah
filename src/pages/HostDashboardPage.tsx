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
} from '@mui/material'
import { useMemo, useState } from 'react'

import ListingForm from '../components/host/ListingForm'
import EarningsCard, { EarningsPlaceholderChart } from '../components/host/EarningsCard'
import { useAuthStore } from '../store/useAuthStore'
import { useBookingStore } from '../store/useBookingStore'
import { useCarsStore } from '../store/useCarsStore'
import { useSnackbarStore } from '../store/useSnackbarStore'
import { formatPeso } from '../utils/formatCurrency'

export default function HostDashboardPage() {
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
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="md">
          <Typography variant="h3" align="center" gutterBottom fontWeight={800}>
            Become a host
          </Typography>
          <Typography align="center" color="text.secondary" sx={{ mb: 4 }}>
            Turn your idle car into income with rentaHub.
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: '100%', borderRadius: 3 }}>
                <MonetizationOn sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6" fontWeight={700}>
                  Earn money
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Set your price and earn every time someone books your vehicle.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: '100%', borderRadius: 3 }}>
                <Speed sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6" fontWeight={700}>
                  Easy management
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Track bookings, payouts, and requests from one dashboard.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: '100%', borderRadius: 3 }}>
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
            <Button size="large" variant="contained" onClick={() => becomeHost()}>
              Start listing
            </Button>
          </Stack>
        </Container>
      </Box>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3, pb: 10 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Host dashboard
          </Typography>
          <Typography color="text.secondary">
            Manage listings and driver requests for {user.firstName}.
          </Typography>
        </Box>
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tab icon={<DirectionsCar />} iconPosition="start" label="My listings" />
        <Tab icon={<MonetizationOn />} iconPosition="start" label="Earnings" />
        <Tab icon={<EventAvailable />} iconPosition="start" label="Booking requests" />
        <Tab icon={<Settings />} iconPosition="start" label="Listing settings" />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={2}>
          {hostCars.map((car) => (
            <Grid item xs={12} md={6} key={car.id}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={2}>
                    <Box component="img" src={car.images[0]} sx={{ width: 140, height: 88, objectFit: 'cover', borderRadius: 2 }} />
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
            <Typography color="text.secondary">No listings yet — add your first car.</Typography>
          )}
        </Grid>
      )}

      {tab === 1 && (
        <Stack spacing={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <EarningsCard title="Total earned" value={earningsMock.total} icon="money" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <EarningsCard title="This month (mock)" value={earningsMock.month} icon="calendar" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <EarningsCard title="Active bookings" value={String(earningsMock.active)} icon="car" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <EarningsCard title="Avg. rating" value="4.9 ★" icon="star" />
            </Grid>
          </Grid>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Weekly performance (mock)
            </Typography>
            <EarningsPlaceholderChart />
          </Paper>
          <Typography variant="body2" color="text.secondary">
            Recent payouts are simulated — connect a real payout method in production.
          </Typography>
        </Stack>
      )}

      {tab === 2 && (
        <Stack spacing={2}>
          {hostBookings.length === 0 && <Typography color="text.secondary">No bookings for your vehicles yet.</Typography>}
          {hostBookings.map((b) => (
            <Card key={b.id} variant="outlined">
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
                  <Box>
                    <Typography fontWeight={700}>{b.carName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {b.renterName}
                    </Typography>
                    <Typography variant="body2">
                      {b.pickup} → {b.dropoff}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatPeso(b.total)}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={b.status}
                      color={b.status === 'cancelled' ? 'default' : b.status === 'confirmed' ? 'success' : 'warning'}
                      size="small"
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={b.status === 'cancelled'}
                      onClick={() => showSuccess('Message sent (mock)')}
                    >
                      Accept
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
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {tab === 3 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="body1" color="text.secondary">
            Listing policies, instant book, and guest requirements would live here — mock only for MVP.
          </Typography>
        </Paper>
      )}

      <ListingForm open={listingOpen} onClose={() => setListingOpen(false)} />

      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 24, right: 24, display: tab === 0 ? 'inline-flex' : 'none' }}
        onClick={() => setListingOpen(true)}
        aria-label="add listing"
      >
        <Add />
      </Fab>
    </Container>
  )
}
