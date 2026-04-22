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
} from '@mui/material'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

import CarCard from '../components/common/CarCard'
import { useAuthStore } from '../store/useAuthStore'
import { useBookingStore } from '../store/useBookingStore'
import { useCarsStore } from '../store/useCarsStore'
import { useSnackbarStore } from '../store/useSnackbarStore'
import { formatPeso } from '../utils/formatCurrency'

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const logout = useAuthStore((s) => s.logout)
  const bookings = useBookingStore((s) => s.bookings)
  const cancelBooking = useBookingStore((s) => s.cancelBooking)
  const showInfo = useSnackbarStore((s) => s.showInfo)

  const cars = useCarsStore((s) => s.cars)
  const savedIds = useCarsStore((s) => s.savedCarIds)

  const [tab, setTab] = useState(0)
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
    <Container maxWidth="lg" sx={{ py: 3, px: { xs: 2, sm: 3 }, pb: { xs: `max(24px, env(safe-area-inset-bottom))`, sm: 3 } }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>{user?.avatar}</Avatar>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            {user?.firstName} {user?.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
          <Chip label="Verified" color="success" size="small" sx={{ mt: 0.5 }} />
        </Box>
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tab label="Upcoming" />
        <Tab label="Past" />
        <Tab label="Saved" />
        <Tab label="Reviews" />
        <Tab label="Profile" />
      </Tabs>

      {tab === 0 && (
        <Stack spacing={2}>
          {upcoming.length === 0 && <Typography color="text.secondary">No upcoming trips.</Typography>}
          {upcoming.map((b) => (
            <Card key={b.id} variant="outlined">
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
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={b.status} color="success" size="small" />
                    <Button component={RouterLink} to={`/cars/${b.carId}`} size="small" variant="outlined">
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
        <Stack spacing={2}>
          {past.length === 0 && <Typography color="text.secondary">No past rentals yet.</Typography>}
          {past.map((b) => (
            <Card key={b.id} variant="outlined" sx={{ opacity: 0.9 }}>
              <CardContent>
                <Typography fontWeight={700}>{b.carName}</Typography>
                <Typography variant="body2">
                  {b.pickup} – {b.dropoff}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {tab === 2 && (
        <Grid container spacing={2}>
          {savedCars.map((car) => (
            <Grid item xs={12} md={6} key={car.id}>
              <CarCard car={car} onNavigate={(c) => navigate(`/cars/${c.id}`)} />
            </Grid>
          ))}
        </Grid>
      )}

      {tab === 3 && <Typography color="text.secondary">Leave reviews after a trip (coming soon).</Typography>}

      {tab === 4 && (
        <Stack spacing={2} maxWidth={480}>
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
          >
            Save changes
          </Button>
          <Divider />
          <Button onClick={() => logout()}>Sign out</Button>
        </Stack>
      )}
    </Container>
  )
}
