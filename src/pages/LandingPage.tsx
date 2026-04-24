import AirportShuttle from '@mui/icons-material/AirportShuttle'
import ArrowForward from '@mui/icons-material/ArrowForward'
import Bolt from '@mui/icons-material/Bolt'
import BookOnline from '@mui/icons-material/BookOnline'
import DirectionsCar from '@mui/icons-material/DirectionsCar'
import Key from '@mui/icons-material/Key'
import SearchRounded from '@mui/icons-material/SearchRounded'
import LocalOffer from '@mui/icons-material/LocalOffer'
import Security from '@mui/icons-material/Security'
import Shield from '@mui/icons-material/Shield'
import Star from '@mui/icons-material/Star'
import TwoWheeler from '@mui/icons-material/TwoWheeler'
import Verified from '@mui/icons-material/Verified'
import {
  alpha,
  Autocomplete,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Link,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

import CarCard from '../components/common/CarCard'
import { useOfferGeoPrompt } from '../hooks/useOfferGeoPrompt'
import DateRangePicker from '../components/common/DateRangePicker'
import HeroAmbientBackground from '../components/landing/HeroAmbientBackground'
import LandingMapFab from '../components/landing/LandingMapFab'
import MapCTAButton from '../components/landing/MapCTAButton'
import MapPreview from '../components/landing/MapPreview'
import { useCarsStore } from '../store/useCarsStore'
import { useSearchStore } from '../store/useSearchStore'
import { softShadow, softShadowHover } from '../theme/pageStyles'
import type { Car } from '../types'

const LOCATIONS = [
  'Makati',
  'BGC, Taguig',
  'Ortigas, Pasig',
  'Quezon City',
  'Cebu City',
  'Davao City',
  'Iloilo City',
  'Baguio',
  'Cagayan de Oro',
  'Philippines',
]

const CATS = [
  { icon: DirectionsCar, label: 'SUV', type: 'SUV' },
  { icon: DirectionsCar, label: 'Sedan', type: 'Sedan' },
  { icon: Star, label: 'Luxury', type: 'Luxury' },
  { icon: LocalOffer, label: 'Budget', type: 'Budget' },
  { icon: Bolt, label: 'Electric', type: 'Electric' },
  { icon: AirportShuttle, label: 'Truck', type: 'Truck' },
] as const

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

/** Slightly conservative: fewer scroll callbacks + less motion work while fast-scrolling. */
const viewport = { once: true, amount: 0.12, margin: '0px 0px -80px 0px' }

export default function LandingPage() {
  const theme = useTheme()
  const navigate = useNavigate()
  const cars = useCarsStore((s) => s.cars)
  const setLocation = useSearchStore((s) => s.setLocation)
  const setDates = useSearchStore((s) => s.setDates)
  const setFilter = useSearchStore((s) => s.setFilter)

  useOfferGeoPrompt('landing')

  const [loc, setLoc] = useState('Makati')
  const [pickup, setPickup] = useState<Dayjs | null>(() => dayjs().add(1, 'day'))
  const [dropoff, setDropoff] = useState<Dayjs | null>(() => dayjs().add(4, 'day'))

  const motorcycleListings = useMemo(() => cars.filter((c) => c.vehicleType === 'motorcycle'), [cars])

  const motoPicks = useMemo(() => motorcycleListings.slice(0, 4), [motorcycleListings])

  const featured = useMemo(() => {
    const sortByRating = (a: Car, b: Car) => b.rating - a.rating
    const topCars = cars.filter((c) => c.vehicleType === 'car').sort(sortByRating)
    const topMoto = motorcycleListings.length ? [...motorcycleListings].sort(sortByRating)[0] : null
    const out: Car[] = []
    if (topCars[0]) out.push(topCars[0])
    if (topMoto) out.push(topMoto)
    if (topCars[1]) out.push(topCars[1])
    for (const c of [...cars].sort(sortByRating)) {
      if (out.length >= 3) break
      if (!out.some((x) => x.id === c.id)) out.push(c)
    }
    return out.slice(0, 3)
  }, [cars, motorcycleListings])

  const catCounts = useMemo(() => {
    const m: Record<string, number> = {}
    cars.forEach((c) => {
      m[c.type] = (m[c.type] ?? 0) + 1
    })
    return m
  }, [cars])

  const search = () => {
    setLocation(loc)
    setDates(pickup, dropoff)
    setFilter({ types: [], vehicleType: 'all' })
    const params = new URLSearchParams()
    params.set('location', loc)
    if (pickup?.isValid()) params.set('pickup', pickup.format('YYYY-MM-DD'))
    if (dropoff?.isValid()) params.set('dropoff', dropoff.format('YYYY-MM-DD'))
    navigate(`/search?${params.toString()}`)
  }

  return (
    <Box component="main">
      {/* Hero + trip planner */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(165deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${theme.palette.background.default} 42%, ${alpha(theme.palette.grey[50], 1)} 100%)`,
          pt: { xs: 5, md: 8 },
          pb: { xs: 6, md: 9 },
        }}
      >
        <HeroAmbientBackground />
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, position: 'relative', zIndex: 1 }}>
          <Grid container spacing={{ xs: 4, md: 5 }} alignItems="stretch">
            <Grid item xs={12} md={6} lg={7}>
              <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.32 }}>
                <Stack spacing={{ xs: 2.5, md: 3 }} sx={{ maxWidth: 560 }}>
                  <Chip
                    label="Available across the Philippines"
                    color="primary"
                    size="small"
                    sx={{
                      alignSelf: 'flex-start',
                      fontWeight: 600,
                      borderRadius: '999px',
                      px: 0.5,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.dark',
                      border: '1px solid',
                      borderColor: alpha(theme.palette.primary.main, 0.2),
                    }}
                  />
                  <Typography
                    variant="h1"
                    sx={{
                      letterSpacing: '-0.03em',
                      lineHeight: 1.08,
                      whiteSpace: { xs: 'normal', sm: 'pre-line' },
                    }}
                  >
                    {'Rent the right ride—\ncars and motorcycles\nfor trips anywhere in the PH.'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: { md: '1.0625rem' }, lineHeight: 1.65 }}>
                    Transparent pricing in PHP, verified hosts, and pickup from Luzon to Mindanao — from sedans to sport
                    bikes, book in minutes and ride with confidence.
                  </Typography>

                  <Stack spacing={1.5} sx={{ pt: 0.5 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'stretch' } }}>
                      <Button
                        component={RouterLink}
                        to="/search"
                        variant="contained"
                        size="large"
                        endIcon={<ArrowForward />}
                        sx={{
                          py: 1.35,
                          px: 2.5,
                          borderRadius: 2,
                          fontSize: '1rem',
                          boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
                          '&:hover': {
                            boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                          },
                        }}
                      >
                        Browse vehicles
                      </Button>
                      <MapCTAButton variant="hero" to="/map" />
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                      <Button
                        href="#trip-search"
                        variant="outlined"
                        color="primary"
                        size="large"
                        sx={{
                          py: 1.35,
                          px: 2.5,
                          borderRadius: 2,
                          fontSize: '1rem',
                          borderWidth: 2,
                          '&:hover': { borderWidth: 2 },
                        }}
                      >
                        Plan a trip
                      </Button>
                      <Link
                        component="button"
                        type="button"
                        variant="body2"
                        onClick={() =>
                          document
                            .getElementById('explore-map-preview')
                            ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                        sx={{
                          cursor: 'pointer',
                          textAlign: { xs: 'left', sm: 'center' },
                          fontWeight: 600,
                          border: 'none',
                          background: 'none',
                          fontFamily: 'inherit',
                          color: 'primary.main',
                          textDecoration: 'underline',
                          '&:hover': { color: 'primary.dark' },
                        }}
                      >
                        See map preview on this page
                      </Link>
                    </Stack>
                  </Stack>

                  <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1.5} sx={{ pt: 1 }}>
                    {[
                      { k: '2,400+', l: 'vehicles listed' },
                      { k: '98%', l: 'happy renters' },
                      { k: '₱0', l: 'hidden fees' },
                    ].map((s) => (
                      <Paper
                        key={s.k}
                        elevation={0}
                        sx={{
                          px: 2,
                          py: 1.25,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: alpha(theme.palette.background.default, 0.85),
                          backdropFilter: 'blur(8px)',
                          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                          '&:hover': {
                            borderColor: alpha(theme.palette.primary.main, 0.35),
                            boxShadow: softShadow,
                          },
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
                          {s.k}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                          {s.l}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Stack>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={6} lg={5}>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                transition={{ duration: 0.32, delay: 0.06 }}
                style={{ height: '100%' }}
              >
                <Paper
                  id="trip-search"
                  elevation={0}
                  sx={{
                    height: '100%',
                    p: { xs: 2.5, sm: 3 },
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: softShadow,
                    transition: 'box-shadow 0.25s ease, border-color 0.2s ease',
                    '&:hover': {
                      boxShadow: softShadowHover,
                      borderColor: alpha(theme.palette.primary.main, 0.15),
                    },
                  }}
                >
                  <Stack spacing={2.5}>
                    <Box>
                      <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.7rem' }}>
                        Plan a trip
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 700, letterSpacing: '-0.02em' }}>
                        Where & when?
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
                        Add dates to see cars and bikes that match your schedule.
                      </Typography>
                    </Box>

                    <Autocomplete
                      options={LOCATIONS}
                      value={loc}
                      onChange={(_, v) => setLoc(v ?? 'Makati')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Pick-up area"
                          placeholder="Choose area"
                          inputProps={{ ...params.inputProps, 'aria-label': 'Pick-up area' }}
                        />
                      )}
                    />

                    <DateRangePicker
                      pickup={pickup}
                      dropoff={dropoff}
                      onChange={({ pickup: p, dropoff: d }) => {
                        setPickup(p)
                        setDropoff(d)
                      }}
                      minDate={dayjs()}
                      spacing={1.5}
                      pickupLabel="Pick-up date"
                      dropoffLabel="Return date"
                    />

                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={search}
                      endIcon={<ArrowForward />}
                      sx={{
                        py: 1.35,
                        borderRadius: 2,
                        fontSize: '1rem',
                        boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
                        '&:hover': {
                          boxShadow: `0 6px 18px ${alpha(theme.palette.primary.main, 0.38)}`,
                        },
                      }}
                    >
                      Search available vehicles
                    </Button>

                    <Typography variant="body2" textAlign="center" color="text.secondary">
                      <Link component={RouterLink} to="/search" underline="hover" fontWeight={600} color="primary">
                        Skip dates — browse all vehicles
                      </Link>
                    </Typography>
                  </Stack>
                </Paper>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <MapPreview cars={cars} />

      {/* Categories */}
      <Box id="categories" sx={{ bgcolor: 'grey.50', py: { xs: 7, md: 9 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={fadeUp}
            transition={{ duration: 0.4 }}
          >
            <Stack spacing={1} sx={{ mb: { xs: 3, md: 4 }, textAlign: 'center', maxWidth: 640, mx: 'auto' }}>
              <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: '0.08em' }}>
                Explore
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                Browse by category
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Jump into the fleet that fits your plans — SUVs, sedans, EVs, and motorcycles.
              </Typography>
            </Stack>
            <Grid container spacing={{ xs: 2, sm: 2.5 }}>
              {CATS.map(({ icon: Icon, label, type }) => (
                <Grid item xs={6} sm={4} md={2} key={type}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.25,
                      height: '100%',
                      textAlign: 'center',
                      cursor: 'pointer',
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.default',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                      '&:hover': {
                        borderColor: alpha(theme.palette.primary.main, 0.45),
                        boxShadow: softShadowHover,
                        transform: 'translateY(-3px)',
                      },
                      '&:active': { transform: 'translateY(-1px)' },
                    }}
                    onClick={() => {
                      setFilter({ types: [type], vehicleType: 'all' })
                      const q = new URLSearchParams()
                      q.set('types', type)
                      navigate('/search?' + q.toString())
                    }}
                  >
                    <Icon sx={{ fontSize: 44, color: 'primary.main', mb: 1 }} />
                    <Typography fontWeight={700} sx={{ fontSize: '0.9375rem' }}>
                      {label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {catCounts[type] ?? 0} listed
                    </Typography>
                  </Paper>
                </Grid>
              ))}
              <Grid item xs={6} sm={4} md={2} key="motorcycles-cat">
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.25,
                    height: '100%',
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.default',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                    '&:hover': {
                      borderColor: alpha(theme.palette.primary.main, 0.45),
                      boxShadow: softShadowHover,
                      transform: 'translateY(-3px)',
                    },
                    '&:active': { transform: 'translateY(-1px)' },
                  }}
                  onClick={() => {
                    setFilter({ types: [], vehicleType: 'motorcycle' })
                    navigate('/search?vt=motorcycle')
                  }}
                >
                  <TwoWheeler sx={{ fontSize: 44, color: 'primary.main', mb: 1 }} />
                  <Typography fontWeight={700} sx={{ fontSize: '0.9375rem' }}>
                    Motorcycles
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {motorcycleListings.length} listed
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* Motorcycles spotlight */}
      {motoPicks.length > 0 && (
        <Container maxWidth="lg" sx={{ py: { xs: 0, md: 1 }, px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 6 } }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={fadeUp}
            transition={{ duration: 0.4 }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
              spacing={2}
              sx={{ mb: 3, gap: 2 }}
            >
              <Box sx={{ maxWidth: 520 }}>
                <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: '0.08em' }}>
                  Two wheels
                </Typography>
                <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 700, letterSpacing: '-0.02em' }}>
                  Motorcycles nationwide
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>
                  Sport, naked, and touring bikes with helmets on many listings — filter the full range on search.
                </Typography>
              </Box>
              <Button
                component={RouterLink}
                to="/search?vt=motorcycle"
                variant="outlined"
                color="primary"
                size="medium"
                onClick={() => setFilter({ types: [], vehicleType: 'motorcycle' })}
                endIcon={<ArrowForward />}
                sx={{ flexShrink: 0, borderWidth: 2, borderRadius: 2, '&:hover': { borderWidth: 2 } }}
              >
                See all motorcycles
              </Button>
            </Stack>
            <Grid container spacing={{ xs: 2.5, md: 3 }}>
              {motoPicks.map((car) => (
                <Grid item xs={12} sm={6} md={3} key={car.id}>
                  <Box sx={{ height: '100%', '& .MuiCard-root': { borderRadius: 3, height: '100%' } }}>
                    <CarCard car={car} onNavigate={(c) => navigate(`/cars/${c.id}`)} onReserve={(c) => navigate(`/cars/${c.id}`)} />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      )}

      {/* Featured */}
      <Container maxWidth="lg" sx={{ py: { xs: 7, md: 9 }, px: { xs: 2, sm: 3 } }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={fadeUp}
          transition={{ duration: 0.4 }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
            spacing={2}
            sx={{ mb: { xs: 3, md: 4 }, gap: 2 }}
          >
            <Box sx={{ maxWidth: 520 }}>
              <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: '0.08em' }}>
                Hand-picked
              </Typography>
              <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 700, letterSpacing: '-0.02em' }}>
                Top picks this week
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>
                Mix of top-rated cars and a standout motorcycle this week — tap a card for details and booking.
              </Typography>
            </Box>
            <Button
              component={RouterLink}
              to="/search"
              variant="outlined"
              color="primary"
              size="medium"
              endIcon={<ArrowForward />}
              sx={{ flexShrink: 0, borderWidth: 2, borderRadius: 2, '&:hover': { borderWidth: 2 } }}
            >
              View all
            </Button>
          </Stack>
          <Grid container spacing={{ xs: 2.5, md: 3.5 }}>
            {cars.length === 0
              ? [0, 1, 2].map((i) => (
                  <Grid item xs={12} md={4} key={i}>
                    <Skeleton variant="rounded" height={380} sx={{ borderRadius: 3 }} />
                  </Grid>
                ))
              : featured.map((car) => (
                  <Grid item xs={12} sm={6} md={4} key={car.id}>
                    <Box sx={{ height: '100%', '& .MuiCard-root': { borderRadius: 3, height: '100%' } }}>
                      <CarCard car={car} onNavigate={(c) => navigate(`/cars/${c.id}`)} onReserve={(c) => navigate(`/cars/${c.id}`)} />
                    </Box>
                  </Grid>
                ))}
          </Grid>
        </motion.div>
      </Container>

      {/* How it works */}
      <Box id="how" sx={{ bgcolor: 'grey.50', py: { xs: 7, md: 9 } }}>
        <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={fadeUp}
            transition={{ duration: 0.4 }}
          >
            <Stack spacing={1} sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: '0.08em' }}>
                Simple flow
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                How it works
              </Typography>
            </Stack>
            <Grid container spacing={3}>
              {[
                { icon: SearchRounded, t: 'Search', d: 'Choose area and dates that fit your trip.' },
                { icon: BookOnline, t: 'Book', d: 'Confirm details and pay securely (test mode).' },
                { icon: DirectionsCar, t: 'Drive', d: 'Meet your host, grab the keys, and go.' },
              ].map((s) => {
                const Icon = s.icon
                return (
                <Grid item xs={12} md={4} key={s.t}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      height: '100%',
                      textAlign: 'center',
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.default',
                      transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                      '&:hover': {
                        boxShadow: softShadow,
                        borderColor: alpha(theme.palette.primary.main, 0.12),
                      },
                    }}
                  >
                    <Box
                      sx={{
                        mx: 'auto',
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                      }}
                    >
                      <Icon sx={{ fontSize: 30 }} aria-hidden />
                    </Box>
                    <Typography variant="h6" sx={{ my: 1.5, fontWeight: 700 }}>
                      {s.t}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {s.d}
                    </Typography>
                  </Paper>
                </Grid>
                )
              })}
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* Trust */}
      <Box sx={{ py: { xs: 7, md: 9 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={fadeUp}
            transition={{ duration: 0.4 }}
          >
            <Stack spacing={1} sx={{ mb: { xs: 4, md: 5 }, textAlign: 'center', maxWidth: 560, mx: 'auto' }}>
              <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: '0.08em' }}>
                Why renters choose us
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                Trust built into every trip
              </Typography>
            </Stack>
            <Grid container spacing={{ xs: 3, md: 4 }}>
              {[
                { icon: Shield, t: 'Insured trips', d: 'Protection options on every booking.' },
                { icon: Verified, t: 'Verified hosts', d: 'Profiles and reviews you can trust.' },
                { icon: Security, t: 'Secure payments', d: 'Stripe test mode — your card stays with Stripe.' },
                { icon: Key, t: 'Flexible pickup', d: 'City pickup points with clear addresses across the PH.' },
              ].map(({ icon: Icon, t, d }) => (
                <Grid item xs={12} sm={6} md={3} key={t}>
                  <Stack
                    spacing={1.5}
                    alignItems="flex-start"
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      height: '100%',
                      border: '1px solid transparent',
                      transition: 'background-color 0.2s ease, border-color 0.2s ease',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                        borderColor: alpha(theme.palette.primary.main, 0.12),
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        bgcolor: 'primary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'primary.main',
                      }}
                    >
                      <Icon fontSize="small" />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                      {t}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {d}
                    </Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>
      <LandingMapFab />
    </Box>
  )
}
