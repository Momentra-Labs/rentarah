import AirportShuttle from '@mui/icons-material/AirportShuttle'
import Bolt from '@mui/icons-material/Bolt'
import DirectionsCar from '@mui/icons-material/DirectionsCar'
import Key from '@mui/icons-material/Key'
import LocalOffer from '@mui/icons-material/LocalOffer'
import Security from '@mui/icons-material/Security'
import Shield from '@mui/icons-material/Shield'
import Star from '@mui/icons-material/Star'
import Verified from '@mui/icons-material/Verified'
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

import CarCard from '../components/common/CarCard'
import DateRangePicker from '../components/common/DateRangePicker'
import { useCarsStore } from '../store/useCarsStore'
import { useSearchStore } from '../store/useSearchStore'

const LOCATIONS = ['Makati', 'BGC', 'Ortigas', 'Quezon City', 'Pasig', 'Taguig']

const CATS = [
  { icon: DirectionsCar, label: 'SUV', type: 'SUV' },
  { icon: DirectionsCar, label: 'Sedan', type: 'Sedan' },
  { icon: Star, label: 'Luxury', type: 'Luxury' },
  { icon: LocalOffer, label: 'Budget', type: 'Budget' },
  { icon: Bolt, label: 'Electric', type: 'Electric' },
  { icon: AirportShuttle, label: 'Truck', type: 'Truck' },
] as const

export default function LandingPage() {
  const navigate = useNavigate()
  const cars = useCarsStore((s) => s.cars)
  const setLocation = useSearchStore((s) => s.setLocation)
  const setDates = useSearchStore((s) => s.setDates)
  const setFilter = useSearchStore((s) => s.setFilter)

  const [loc, setLoc] = useState('Makati')
  const [pickup, setPickup] = useState<Dayjs | null>(() => dayjs().add(1, 'day'))
  const [dropoff, setDropoff] = useState<Dayjs | null>(() => dayjs().add(4, 'day'))

  const featured = useMemo(() => cars.slice(0, 3), [cars])

  const catCounts = useMemo(() => {
    const m: Record<string, number> = {}
    cars.forEach((c) => {
      m[c.type] = (m[c.type] ?? 0) + 1
    })
    return m
  }, [cars])

  const search = () => {
    setLocation(`${loc}, Metro Manila`)
    setDates(pickup, dropoff)
    setFilter({ types: [] })
    const params = new URLSearchParams()
    params.set('location', `${loc}, Metro Manila`)
    if (pickup?.isValid()) params.set('pickup', pickup.format('YYYY-MM-DD'))
    if (dropoff?.isValid()) params.set('dropoff', dropoff.format('YYYY-MM-DD'))
    navigate(`/search?${params.toString()}`)
  }

  return (
    <Box>
      <Box
        sx={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.96), rgba(255,255,255,0.96)),
            repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(0,0,0,0.04) 24px, rgba(0,0,0,0.04) 25px),
            repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(0,0,0,0.04) 24px, rgba(0,0,0,0.04) 25px)
          `,
          py: { xs: 6, md: 10 },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip label="🇵🇭 Available in Metro Manila" color="primary" sx={{ mb: 2, fontWeight: 600 }} />
              <Typography variant="h1" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
                {'Rent any car,\nanywhere in the city.'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 520 }}>
                Browse trusted hosts, transparent PHP pricing, and flexible pickup across NCR — no hidden fees on Day 1.
              </Typography>
              <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                <Typography variant="body2" color="text.secondary">
                  <strong>2,400+</strong> cars
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>98%</strong> satisfaction
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>₱0</strong> hidden fees
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Stack spacing={2}>
                  <Autocomplete
                    options={LOCATIONS}
                    value={loc}
                    onChange={(_, v) => setLoc(v ?? 'Makati')}
                    renderInput={(params) => <TextField {...params} label="Location" />}
                  />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Box flex={1}>
                      <DateRangePicker
                        pickup={pickup}
                        dropoff={dropoff}
                        onChange={({ pickup: p, dropoff: d }) => {
                          setPickup(p)
                          setDropoff(d)
                        }}
                        minDate={dayjs()}
                        spacing={1}
                      />
                    </Box>
                  </Stack>
                  <Button variant="contained" size="large" fullWidth onClick={search}>
                    Search Available Cars
                  </Button>
                  <Typography variant="body2" textAlign="center">
                    <RouterLink to="/search" style={{ color: '#1A56DB', textDecoration: 'none', fontWeight: 600 }}>
                      or browse all cars →
                    </RouterLink>
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box sx={{ bgcolor: 'grey.50', py: 10 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ mb: 4, textAlign: 'center' }}>
            Browse by category
          </Typography>
          <Grid container spacing={2}>
            {CATS.map(({ icon: Icon, label, type }) => (
              <Grid item xs={6} sm={4} md={2} key={type}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => {
                    setFilter({ types: [type] })
                    navigate('/search?types=' + encodeURIComponent(type))
                  }}
                >
                  <Icon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography fontWeight={700}>{label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {catCounts[type] ?? 0} cars
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4">Top picks this week</Typography>
          <Button component={RouterLink} to="/search" color="primary">
            View all →
          </Button>
        </Stack>
        <Grid container spacing={3}>
          {cars.length === 0
            ? [0, 1, 2].map((i) => (
                <Grid item xs={12} md={4} key={i}>
                  <Skeleton variant="rectangular" height={340} sx={{ borderRadius: 2 }} />
                </Grid>
              ))
            : featured.map((car) => (
                <Grid item xs={12} md={4} key={car.id}>
                  <CarCard car={car} onNavigate={(c) => navigate(`/cars/${c.id}`)} onReserve={(c) => navigate(`/cars/${c.id}`)} />
                </Grid>
              ))}
        </Grid>
      </Container>

      <Box id="how" sx={{ bgcolor: 'grey.50', py: 10 }}>
        <Container maxWidth="md">
          <Typography variant="h4" textAlign="center" sx={{ mb: 4 }}>
            How it works
          </Typography>
          <Grid container spacing={4}>
            {[
              { n: '1', t: 'Search', d: 'Pick location & dates that fit your trip.' },
              { n: '2', t: 'Book', d: 'Verify driver details and pay securely (test mode).' },
              { n: '3', t: 'Drive', d: 'Meet your host, grab the keys, and hit the road.' },
            ].map((s) => (
              <Grid item xs={12} md={4} key={s.n}>
                <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                  <Typography variant="h3" color="primary.main">
                    {s.n}
                  </Typography>
                  <Typography variant="h6" sx={{ my: 1 }}>
                    {s.t}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {s.d}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box sx={{ py: 10 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {[
              { icon: Shield, t: 'Insured trips', d: 'Protection options on every booking.' },
              { icon: Verified, t: 'Verified hosts', d: 'Profiles and reviews you can trust.' },
              { icon: Security, t: 'Secure payments', d: 'Stripe test mode — card never stored here.' },
              { icon: Key, t: 'Flexible pickup', d: 'Metro Manila locations with clear addresses.' },
            ].map(({ icon: Icon, t, d }) => (
              <Grid item xs={12} sm={6} md={3} key={t}>
                <Stack spacing={1} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: '#EFF6FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'primary.main',
                    }}
                  >
                    <Icon />
                  </Box>
                  <Typography variant="h6">{t}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {d}
                  </Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  )
}
