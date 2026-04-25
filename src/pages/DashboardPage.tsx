import {
  Avatar,
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
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'

import CarCard from '../components/common/CarCard'
import PageHeader from '../components/layout/PageHeader'
import { useAuthStore } from '../store/useAuthStore'
import { useBookingStore } from '../store/useBookingStore'
import { useCarsStore } from '../store/useCarsStore'
import { useSnackbarStore } from '../store/useSnackbarStore'
import { formatPeso } from '../utils/formatCurrency'
import { containerGutters, listRowSurface, primaryCtaShadow } from '../theme/pageStyles'

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

  const cars = useCarsStore((s) => s.cars)
  const savedIds = useCarsStore((s) => s.savedCarIds)

  const [tab, setTab] = useState(0)

  useEffect(() => {
    if (searchParams.get('nav') === 'trips') {
      setTab(0)
    }
  }, [searchParams])

  const [pf, setPf] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    licenseNumber: user?.licenseNumber ?? '',
  })

  const mine = useMemo(() => bookings.filter((b) => b.userId === user?.id), [bookings, user?.id])
  const upcoming = mine.filter((b) => b.status !== 'cancelled' && !dayjs(b.dropoff).isBefore(dayjs(), 'day'))
  const past = mine.filter((b) => dayjs(b.dropoff).isBefore(dayjs(), 'day') || b.status === 'cancelled')
  const savedCars = useMemo(() => cars.filter((c) => savedIds.includes(c.id)), [cars, savedIds])

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, pb: { xs: `max(24px, env(safe-area-inset-bottom))`, sm: 4 }, ...containerGutters }}>
        <PageHeader overline="Your account" title="Dashboard" subtitle="Trips, saved cars, reviews, and profile settings." dense />

        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3, mt: -1 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, fontWeight: 700 }}>{user?.avatar}</Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em">
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
            <Chip label="Verified" color="success" size="small" sx={{ mt: 0.75, fontWeight: 600 }} />
          </Box>
        </Stack>

        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v)
            if (v >= 2) {
              setSearchParams(
                (prev) => {
                  const n = new URLSearchParams(prev)
                  n.delete('nav')
                  return n
                },
                { replace: true },
              )
            }
          }}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="Account sections"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            mb: 3,
            minHeight: 48,
            '& .MuiTab-root': {
              minWidth: 0,
              minHeight: 48,
              px: { xs: 1, sm: 1.5 },
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
            },
          }}
        >
        <Tab label={shortTabLabels ? 'Upcoming' : 'Upcoming trips'} />
        <Tab label="Past" />
        <Tab label="Saved" />
        <Tab label="Reviews" />
        <Tab label="Profile" />
      </Tabs>

      {tab === 0 && (
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
                        {b.pickup} → {b.dropoff}
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

      {tab === 1 && (
        <Stack spacing={2.5}>
          {past.length === 0 && <Typography color="text.secondary">No past rentals yet.</Typography>}
          {past.map((b) => (
            <Card key={b.id} elevation={0} sx={{ opacity: 0.92, ...listRowSurface(theme) }}>
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} alignItems={{ sm: 'center' }}>
                  <Box>
                    <Typography fontWeight={700}>{b.carName}</Typography>
                    <Typography variant="body2">
                      {b.pickup} – {b.dropoff}
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

      {tab === 2 && (
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

      {tab === 3 && <Typography color="text.secondary">Leave reviews after a trip (coming soon).</Typography>}

      {tab === 4 && (
        <Stack spacing={2} maxWidth={480} sx={{ pt: 0.5 }}>
          <TextField label="First name" value={pf.firstName} onChange={(e) => setPf({ ...pf, firstName: e.target.value })} fullWidth />
          <TextField label="Last name" value={pf.lastName} onChange={(e) => setPf({ ...pf, lastName: e.target.value })} fullWidth />
          <TextField label="Email" value={pf.email} disabled fullWidth />
          <TextField label="Phone" value={pf.phone} onChange={(e) => setPf({ ...pf, phone: e.target.value })} fullWidth />
          <TextField label="License" value={pf.licenseNumber} onChange={(e) => setPf({ ...pf, licenseNumber: e.target.value })} fullWidth />
          <Button
            variant="contained"
            onClick={() => {
              updateProfile({
                firstName: pf.firstName,
                lastName: pf.lastName,
                phone: pf.phone,
                licenseNumber: pf.licenseNumber,
              })
              useSnackbarStore.getState().showSuccess('Profile updated')
            }}
            sx={{ borderRadius: 2, alignSelf: 'flex-start', ...primaryCtaShadow(theme) }}
          >
            Save changes
          </Button>
          <Divider />
          <Button onClick={() => logout()} color="inherit" sx={{ alignSelf: 'flex-start' }}>
            Sign out
          </Button>
        </Stack>
      )}
      </Container>
    </Box>
  )
}
