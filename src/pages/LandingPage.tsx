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
  useMediaQuery,
  useTheme,
} from '@mui/material'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

import CarCard from '../components/common/CarCard'
import { useMobileLightMotion } from '../hooks/useMobileLightMotion'
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

export default function LandingPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true })
  const navigate = useNavigate()
  const cars = useCarsStore((s) => s.cars)
  const setLocation = useSearchStore((s) => s.setLocation)
  const setDates = useSearchStore((s) => s.setDates)
  const setFilter = useSearchStore((s) => s.setFilter)
  const lightMotion = useMobileLightMotion()

  const fadeUpVariants = useMemo(
    () =>
      lightMotion
        ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
        : { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } },
    [lightMotion],
  )

  /** Tighter margins on mobile = fewer whileInView recalculations while scrolling. */
  const landingViewport = useMemo(
    () =>
      lightMotion
        ? { once: true, amount: 0.06, margin: '0px 0px -24px 0px' as const }
        : { once: true, amount: 0.12, margin: '0px 0px -80px 0px' as const },
    [lightMotion],
  )

  const tHero = useMemo(() => (lightMotion ? { duration: 0.2 } : { duration: 0.32 }), [lightMotion])
  const tHeroDelay = useMemo(
    () => (lightMotion ? { duration: 0.2 } : { duration: 0.32, delay: 0.06 }),
    [lightMotion],
  )
  const tSection = useMemo(() => (lightMotion ? { duration: 0.26 } : { duration: 0.4 }), [lightMotion])

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
    <Box
      component="main"
      sx={{
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        ...(isMobile && {
          '& .MuiButton-root, & .MuiCard-root, & a[role="button"]': {
            WebkitTapHighlightColor: 'transparent',
          },
        }),
      }}
    >
      {/* Hero + trip planner (mobile: planner first = app-style “search” entry) */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(165deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${theme.palette.background.default} 42%, ${alpha(theme.palette.grey[50], 1)} 100%)`,
          pt: { xs: 2, md: 8 },
          pb: { xs: 3, md: 9 },
        }}
      >
        <HeroAmbientBackground />
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, position: 'relative', zIndex: 1 }}>
          <Grid container spacing={{ xs: 3, md: 5 }} alignItems="stretch">
            <Grid item xs={12} md={6} lg={7} sx={{ order: { xs: 2, md: 1 } }}>
              <motion.div initial="hidden" animate="visible" variants={fadeUpVariants} transition={tHero}>
                <Stack
                  data-onboarding="hero"
                  spacing={{ xs: 2, md: 3 }}
                  sx={{ maxWidth: 560 }}
                >
                  <Chip
                    label="Available across the Philippines"
                    color="primary"
                    size="small"
                    sx={{
                      alignSelf: 'flex-start',
                      fontWeight: 600,
                      borderRadius: '999px',
                      px: { xs: 0.75, sm: 0.5 },
                      py: 0.25,
                      fontSize: { xs: '0.7rem', sm: '0.8125rem' },
                      height: { xs: 26, sm: 32 },
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
                      lineHeight: { xs: 1.12, sm: 1.08 },
                      fontSize: { xs: '1.65rem', sm: '2.125rem', md: theme.typography.h1.fontSize },
                      fontWeight: 800,
                      whiteSpace: { xs: 'normal', sm: 'pre-line' },
                    }}
                  >
                    {'Rent the right ride—\ncars and motorcycles\nfor trips anywhere in the PH.'}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.9rem', sm: '1rem', md: '1.0625rem' },
                      lineHeight: { xs: 1.55, sm: 1.65 },
                    }}
                  >
                    Transparent pricing in PHP, verified hosts, and pickup from Luzon to Mindanao — from sedans to sport
                    bikes, book in minutes and ride with confidence.
                  </Typography>

                  <Stack spacing={{ xs: 1.25, sm: 1.5 }} sx={{ pt: 0.5 }}>
                    {/* Mobile: one primary CTA + plan + text link (tab bar = Map; no duplicate map buttons). */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'stretch' } }}>
                      <Button
                        component={RouterLink}
                        to="/search"
                        variant="contained"
                        size="large"
                        endIcon={<ArrowForward />}
                        sx={{
                          py: { xs: 1.15, sm: 1.35 },
                          px: { xs: 2, sm: 2.5 },
                          minHeight: { xs: 48, sm: 42 },
                          borderRadius: { xs: 2.5, sm: 2 },
                          fontSize: { xs: '0.9375rem', sm: '1rem' },
                          fontWeight: 700,
                          width: { xs: '100%', sm: 'auto' },
                          boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
                          '&:hover': {
                            boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                          },
                        }}
                      >
                        Browse vehicles
                      </Button>
                      {!isMobile ? <MapCTAButton variant="hero" to="/map" /> : null}
                    </Stack>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={{ xs: 1, sm: 1.5 }}
                      alignItems={{ xs: 'stretch', sm: 'center' }}
                    >
                      <Button
                        href="#trip-search"
                        variant="outlined"
                        color="primary"
                        size="large"
                        fullWidth={isMobile}
                        sx={{
                          py: { xs: 1.15, sm: 1.35 },
                          px: { xs: 2, sm: 2.5 },
                          minHeight: { xs: 48, sm: 42 },
                          borderRadius: { xs: 2.5, sm: 2 },
                          fontSize: { xs: '0.9375rem', sm: '1rem' },
                          fontWeight: 600,
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
                          textAlign: { xs: 'center', sm: 'center' },
                          alignSelf: { xs: 'center', sm: 'auto' },
                          fontWeight: 600,
                          fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                          border: 'none',
                          background: 'none',
                          fontFamily: 'inherit',
                          color: 'primary.main',
                          textDecoration: 'underline',
                          '&:hover': { color: 'primary.dark' },
                        }}
                      >
                        {isMobile ? 'Preview map on this page' : 'See map preview on this page'}
                      </Link>
                    </Stack>
                  </Stack>

                  <Stack
                    direction="row"
                    flexWrap="wrap"
                    useFlexGap
                    spacing={1.25}
                    sx={{
                      pt: 1,
                      justifyContent: { xs: 'space-between', sm: 'flex-start' },
                      gap: { xs: 1, sm: 1.25 },
                    }}
                  >
                    {[
                      { k: '2,400+', l: 'vehicles listed' },
                      { k: '98%', l: 'happy renters' },
                      { k: '₱0', l: 'hidden fees' },
                    ].map((s) => (
                      <Paper
                        key={s.k}
                        elevation={0}
                        sx={{
                          flex: { xs: '1 1 calc(33.333% - 8px)', sm: '0 0 auto' },
                          minWidth: { xs: 0, sm: 104 },
                          maxWidth: { xs: 'none', sm: 'none' },
                          px: { xs: 1, sm: 2 },
                          py: { xs: 0.85, sm: 1.25 },
                          borderRadius: { xs: 2, sm: 2 },
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: alpha(theme.palette.background.default, 0.85),
                          backdropFilter: 'blur(8px)',
                          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                          '@media (hover: hover)': {
                            '&:hover': {
                              borderColor: alpha(theme.palette.primary.main, 0.35),
                              boxShadow: softShadow,
                            },
                          },
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          fontWeight={800}
                          color="text.primary"
                          sx={{ lineHeight: 1.2, fontSize: { xs: '0.85rem', sm: '0.875rem' } }}
                        >
                          {s.k}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                          {s.l}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Stack>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={6} lg={5} sx={{ order: { xs: 1, md: 2 } }}>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUpVariants}
                transition={tHeroDelay}
                style={{ height: '100%' }}
              >
                <Paper
                  id="trip-search"
                  data-onboarding="search"
                  elevation={0}
                  sx={{
                    height: '100%',
                    p: { xs: 2, sm: 3 },
                    borderRadius: { xs: 2.5, md: 3 },
                    border: '1px solid',
                    borderColor: { xs: alpha(theme.palette.divider, 0.9), sm: 'divider' },
                    boxShadow: { xs: `0 1px 0 ${alpha('#000', 0.04)}, 0 8px 24px ${alpha('#000', 0.07)}`, sm: softShadow },
                    transition: 'box-shadow 0.25s ease, border-color 0.2s ease',
                    '@media (hover: hover)': {
                      '&:hover': {
                        boxShadow: softShadowHover,
                        borderColor: alpha(theme.palette.primary.main, 0.15),
                      },
                    },
                  }}
                >
                  <Stack spacing={{ xs: 2, sm: 2.5 }}>
                    <Box>
                      <Typography
                        variant="overline"
                        color="primary"
                        sx={{ fontWeight: 700, letterSpacing: { xs: '0.1em', sm: '0.08em' }, fontSize: { xs: '0.65rem', sm: '0.7rem' } }}
                      >
                        Plan a trip
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ mt: 0.5, fontWeight: 800, letterSpacing: '-0.02em', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                      >
                        Where & when?
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
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
                        py: { xs: 1.2, sm: 1.35 },
                        minHeight: { xs: 50, sm: 48 },
                        borderRadius: { xs: 2.5, sm: 2 },
                        fontSize: { xs: '0.95rem', sm: '1rem' },
                        fontWeight: 700,
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
      <Box id="categories" sx={{ bgcolor: 'grey.50', py: { xs: 4.5, md: 9 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={landingViewport}
            variants={fadeUpVariants}
            transition={tSection}
          >
            <Stack
              spacing={0.75}
              sx={{
                mb: { xs: 2.5, md: 4 },
                textAlign: { xs: 'left', md: 'center' },
                maxWidth: { xs: 'none', md: 640 },
                mx: { md: 'auto' },
              }}
            >
              <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: '0.08em', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                Explore
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: { xs: '1.35rem', sm: '2rem', md: '2.125rem' } }}>
                Browse by category
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' }, lineHeight: 1.55 }}>
                Jump into the fleet that fits your plans — SUVs, sedans, EVs, and motorcycles.
              </Typography>
            </Stack>
            <Grid container spacing={{ xs: 1.5, sm: 2.5 }}>
              {CATS.map(({ icon: Icon, label, type }) => (
                <Grid item xs={6} sm={4} md={2} key={type}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 1.75, sm: 2.25 },
                      height: '100%',
                      textAlign: 'center',
                      cursor: 'pointer',
                      borderRadius: { xs: 2, sm: 2.5 },
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.default',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                      '@media (hover: hover)': {
                        '&:hover': {
                          borderColor: alpha(theme.palette.primary.main, 0.45),
                          boxShadow: softShadowHover,
                          transform: 'translateY(-3px)',
                        },
                      },
                      '&:active': { transform: { xs: 'scale(0.98)', sm: 'translateY(-1px)' } },
                    }}
                    onClick={() => {
                      setFilter({ types: [type], vehicleType: 'all' })
                      const q = new URLSearchParams()
                      q.set('types', type)
                      navigate('/search?' + q.toString())
                    }}
                  >
                    <Icon sx={{ fontSize: { xs: 32, sm: 44 }, color: 'primary.main', mb: { xs: 0.75, sm: 1 } }} />
                    <Typography fontWeight={700} sx={{ fontSize: { xs: '0.8125rem', sm: '0.9375rem' } }}>
                      {label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                      {catCounts[type] ?? 0} listed
                    </Typography>
                  </Paper>
                </Grid>
              ))}
              <Grid item xs={6} sm={4} md={2} key="motorcycles-cat">
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 1.75, sm: 2.25 },
                    height: '100%',
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: { xs: 2, sm: 2.5 },
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.default',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                    '@media (hover: hover)': {
                      '&:hover': {
                        borderColor: alpha(theme.palette.primary.main, 0.45),
                        boxShadow: softShadowHover,
                        transform: 'translateY(-3px)',
                      },
                    },
                    '&:active': { transform: { xs: 'scale(0.98)', sm: 'translateY(-1px)' } },
                  }}
                  onClick={() => {
                    setFilter({ types: [], vehicleType: 'motorcycle' })
                    navigate('/search?vt=motorcycle')
                  }}
                >
                  <TwoWheeler sx={{ fontSize: { xs: 32, sm: 44 }, color: 'primary.main', mb: { xs: 0.75, sm: 1 } }} />
                  <Typography fontWeight={700} sx={{ fontSize: { xs: '0.8125rem', sm: '0.9375rem' } }}>
                    Motorcycles
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
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
        <Container maxWidth="lg" sx={{ py: { xs: 0, md: 1 }, px: { xs: 2, sm: 3 }, pb: { xs: 4, md: 6 } }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={landingViewport}
            variants={fadeUpVariants}
            transition={tSection}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'flex-end' }}
              spacing={2}
              sx={{ mb: { xs: 2.5, sm: 3 }, gap: 2 }}
            >
              <Box sx={{ maxWidth: 520 }}>
                <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: '0.08em', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  Two wheels
                </Typography>
                <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 800, letterSpacing: '-0.02em', fontSize: { xs: '1.35rem', sm: '2rem', md: '2.125rem' } }}>
                  Motorcycles nationwide
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6, fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
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
                sx={{
                  flexShrink: 0,
                  borderWidth: 2,
                  borderRadius: 2.5,
                  minHeight: { xs: 46, sm: 40 },
                  fontWeight: 700,
                  '&:hover': { borderWidth: 2 },
                }}
              >
                See all motorcycles
              </Button>
            </Stack>
            <Grid container spacing={{ xs: 2, md: 3 }}>
              {motoPicks.map((car) => (
                <Grid item xs={12} sm={6} md={3} key={car.id}>
                  <Box sx={{ height: '100%', '& .MuiCard-root': { borderRadius: { xs: 2.5, sm: 3 }, height: '100%' } }}>
                    <CarCard car={car} onNavigate={(c) => navigate(`/cars/${c.id}`)} onReserve={(c) => navigate(`/cars/${c.id}`)} />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      )}

      {/* Featured */}
      <Container maxWidth="lg" sx={{ py: { xs: 4.5, md: 9 }, px: { xs: 2, sm: 3 } }} data-onboarding="listings">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={landingViewport}
          variants={fadeUpVariants}
          transition={tSection}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'flex-end' }}
            spacing={2}
            sx={{ mb: { xs: 2.5, md: 4 }, gap: 2 }}
          >
            <Box sx={{ maxWidth: 520 }}>
              <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: '0.08em', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                Hand-picked
              </Typography>
              <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 800, letterSpacing: '-0.02em', fontSize: { xs: '1.35rem', sm: '2rem', md: '2.125rem' } }}>
                Top picks this week
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6, fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
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
              sx={{
                flexShrink: 0,
                borderWidth: 2,
                borderRadius: 2.5,
                minHeight: { xs: 46, sm: 40 },
                fontWeight: 700,
                '&:hover': { borderWidth: 2 },
              }}
            >
              View all
            </Button>
          </Stack>
          <Grid container spacing={{ xs: 2, md: 3.5 }}>
            {cars.length === 0
              ? [0, 1, 2].map((i) => (
                  <Grid item xs={12} md={4} key={i}>
                    <Skeleton variant="rounded" height={380} sx={{ borderRadius: 3 }} />
                  </Grid>
                ))
              : featured.map((car) => (
                  <Grid item xs={12} sm={6} md={4} key={car.id}>
                    <Box sx={{ height: '100%', '& .MuiCard-root': { borderRadius: { xs: 2.5, sm: 3 }, height: '100%' } }}>
                      <CarCard car={car} onNavigate={(c) => navigate(`/cars/${c.id}`)} onReserve={(c) => navigate(`/cars/${c.id}`)} />
                    </Box>
                  </Grid>
                ))}
          </Grid>
        </motion.div>
      </Container>

      {/* How it works */}
      <Box id="how" sx={{ bgcolor: 'grey.50', py: { xs: 4.5, md: 9 } }}>
        <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={landingViewport}
            variants={fadeUpVariants}
            transition={tSection}
          >
            <Stack spacing={0.75} sx={{ mb: { xs: 2.5, sm: 4 }, textAlign: { xs: 'left', sm: 'center' } }}>
              <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: '0.08em', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                Simple flow
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: { xs: '1.35rem', sm: '2rem', md: '2.125rem' } }}>
                How it works
              </Typography>
            </Stack>
            <Grid container spacing={{ xs: 1.5, sm: 3 }}>
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
                      p: { xs: 2.25, sm: 3 },
                      height: '100%',
                      borderRadius: { xs: 2.5, sm: 3 },
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.default',
                      transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                      '@media (hover: hover)': {
                        '&:hover': {
                          boxShadow: softShadow,
                          borderColor: alpha(theme.palette.primary.main, 0.12),
                        },
                      },
                    }}
                  >
                    <Stack
                      direction={{ xs: 'row', sm: 'column' }}
                      spacing={{ xs: 2, sm: 0 }}
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                    >
                      <Box
                        sx={{
                          flexShrink: 0,
                          width: { xs: 48, sm: 56 },
                          height: { xs: 48, sm: 56 },
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                        }}
                      >
                        <Icon sx={{ fontSize: { xs: 26, sm: 30 } }} aria-hidden />
                      </Box>
                      <Box sx={{ textAlign: { xs: 'left', sm: 'center' }, minWidth: 0, pt: { sm: 1.5 } }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1rem', sm: '1.25rem' }, mb: 0.75 }}>
                          {s.t}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                          {s.d}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
                )
              })}
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* Trust — mobile: list-style rows; desktop: 4-up grid */}
      <Box sx={{ py: { xs: 4.5, md: 9 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={landingViewport}
            variants={fadeUpVariants}
            transition={tSection}
          >
            <Stack
              spacing={0.75}
              sx={{
                mb: { xs: 2.5, md: 5 },
                textAlign: { xs: 'left', md: 'center' },
                maxWidth: { xs: 'none', md: 560 },
                mx: { md: 'auto' },
              }}
            >
              <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: '0.08em', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                Why renters choose us
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: { xs: '1.35rem', sm: '2rem', md: '2.125rem' } }}>
                Trust built into every trip
              </Typography>
            </Stack>
            <Grid container spacing={{ xs: 1.5, md: 4 }}>
              {[
                { icon: Shield, t: 'Insured trips', d: 'Protection options on every booking.' },
                { icon: Verified, t: 'Verified hosts', d: 'Profiles and reviews you can trust.' },
                { icon: Security, t: 'Secure payments', d: 'Stripe test mode — your card stays with Stripe.' },
                { icon: Key, t: 'Flexible pickup', d: 'City pickup points with clear addresses across the PH.' },
              ].map(({ icon: Icon, t, d }) => (
                <Grid item xs={12} sm={6} md={3} key={t}>
                  <Stack
                    direction={{ xs: 'row', sm: 'column' }}
                    spacing={1.5}
                    alignItems={{ xs: 'flex-start', sm: 'flex-start' }}
                    sx={{
                      p: { xs: 2, sm: 2.5 },
                      borderRadius: { xs: 2.5, sm: 3 },
                      height: '100%',
                      border: '1px solid',
                      borderColor: { xs: 'divider', sm: 'transparent' },
                      bgcolor: { xs: 'background.paper', sm: 'transparent' },
                      transition: 'background-color 0.2s ease, border-color 0.2s ease',
                      '@media (hover: hover)': {
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                          borderColor: alpha(theme.palette.primary.main, 0.12),
                        },
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: { xs: 44, sm: 48 },
                        height: { xs: 44, sm: 48 },
                        borderRadius: '50%',
                        flexShrink: 0,
                        bgcolor: 'primary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'primary.main',
                      }}
                    >
                      <Icon fontSize="small" />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
                        {t}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, mt: 0.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        {d}
                      </Typography>
                    </Box>
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
