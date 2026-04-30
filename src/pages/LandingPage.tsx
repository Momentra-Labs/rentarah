import AccessTime from '@mui/icons-material/AccessTime'
import ExploreOutlined from '@mui/icons-material/ExploreOutlined'
import MapOutlined from '@mui/icons-material/MapOutlined'
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
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

import CarCard from '../components/common/CarCard'
import { prefetchPath } from '../lib/routePrefetch'
import { useOfferGeoPrompt } from '../hooks/useOfferGeoPrompt'
import DateRangePicker from '../components/common/DateRangePicker'
import HeroAmbientBackground from '../components/landing/HeroAmbientBackground'
import {
  LandingCarouselSlide,
  LandingExploreListingHint,
  LandingListingCarousel,
} from '../components/landing/LandingListingCarousel'
import { useCarsStore } from '../store/useCarsStore'
import { useSearchStore } from '../store/useSearchStore'
import { softShadow, softShadowHover } from '../theme/pageStyles'
import type { Car } from '../types'
import { formatSearchDateTimeParam, withDefaultDropoffTime, withDefaultPickupTime } from '../utils/dateUtils'

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

const HERO_TRUST_NUMBERS = [
  { k: '2,400+', l: 'vehicles listed' },
  { k: '98%', l: 'happy renters' },
  { k: '₱0', l: 'hidden fees' },
] as const

/** Condensed under hero headline (replaces tall “How it works” + Trust page sections). */
const HERO_FLOW_COMPACT = [
  { Icon: SearchRounded, title: 'Search', line: 'Choose area and dates that fit your trip.' },
  { Icon: BookOnline, title: 'Book', line: 'Confirm details and pay securely (test mode).' },
  { Icon: DirectionsCar, title: 'Drive', line: 'Meet your host, grab the keys, and go.' },
] as const

const HERO_WHY_COMPACT = [
  { Icon: Shield, title: 'Insured trips', line: 'Protection options on every booking.' },
  { Icon: Verified, title: 'Verified hosts', line: 'Profiles and reviews you can trust.' },
  { Icon: Security, title: 'Secure payments', line: 'Stripe test mode — card stays with Stripe.' },
  { Icon: Key, title: 'Flexible pickup', line: 'City pickup points with clear addresses across the PH.' },
] as const

export default function LandingPage() {
  const theme = useTheme()
  const landingBottomPaddingXs = `max(${theme.spacing(5)}, calc(112px + env(safe-area-inset-bottom, 0px)))`
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true })
  const navigate = useNavigate()
  const cars = useCarsStore((s) => s.cars)
  const setLocation = useSearchStore((s) => s.setLocation)
  const setDates = useSearchStore((s) => s.setDates)
  const setFilter = useSearchStore((s) => s.setFilter)

  useOfferGeoPrompt('landing')

  useEffect(() => {
    prefetchPath('/search')
    prefetchPath('/search/model')
    prefetchPath('/map')
  }, [])

  const [loc, setLoc] = useState('Makati')
  const [pickup, setPickup] = useState<Dayjs | null>(() => withDefaultPickupTime(dayjs().add(1, 'day')))
  const [dropoff, setDropoff] = useState<Dayjs | null>(() => withDefaultDropoffTime(dayjs().add(4, 'day')))

  const motorcycleListings = useMemo(() => cars.filter((c) => c.vehicleType === 'motorcycle'), [cars])

  const motoPicks = useMemo(() => motorcycleListings.slice(0, 10), [motorcycleListings])

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
    if (pickup?.isValid()) params.set('pickup', formatSearchDateTimeParam(pickup))
    if (dropoff?.isValid()) params.set('dropoff', formatSearchDateTimeParam(dropoff))
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
          background: `linear-gradient(168deg, ${alpha(theme.palette.primary.main, 0.078)} 0%, ${theme.palette.background.default} 38%, ${alpha(theme.palette.grey[50], 1)} 92%)`,
          pt: { xs: 2.25, md: 9 },
          pb: { xs: 4.5, md: 10 },
        }}
      >
        <HeroAmbientBackground />
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, position: 'relative', zIndex: 1 }}>
          <Grid container spacing={{ xs: 2.5, md: 6 }} alignItems="stretch">
            <Grid item xs={12} md={6} lg={7} sx={{ order: { xs: 2, md: 1 } }}>
              <Box component="div">
                <Stack
                  data-onboarding="hero"
                  spacing={{ xs: 2.5, sm: 2.75, md: 3.25 }}
                  sx={{
                    maxWidth: { xs: '100%', sm: 620, md: 640 },
                    width: '100%',
                    pr: { md: 0.5 },
                  }}
                >
                  <Chip
                    icon={
                      <ExploreOutlined
                        sx={{
                          fontSize: '1.05rem !important',
                          color: `${theme.palette.primary.main} !important`,
                        }}
                      />
                    }
                    label="Available Luzon to Mindanao"
                    size="small"
                    sx={{
                      alignSelf: 'flex-start',
                      fontWeight: 700,
                      borderRadius: '999px',
                      px: { xs: 0.5, sm: 0.75 },
                      py: 0.375,
                      height: { xs: 30, sm: 34 },
                      fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                      letterSpacing: '0.02em',
                      bgcolor: alpha(theme.palette.primary.main, 0.09),
                      color: 'primary.dark',
                      border: '1px solid',
                      borderColor: alpha(theme.palette.primary.main, 0.22),
                      '& .MuiChip-icon': { ml: 0.5 },
                      '& .MuiChip-label': { px: 0.5 },
                    }}
                  />

                  <Typography
                    component="h1"
                    variant="h1"
                    sx={{
                      letterSpacing: '-0.035em',
                      lineHeight: { xs: 1.12, sm: 1.06, md: 1.05 },
                      fontSize: { xs: '1.85rem', sm: '2.25rem', md: 'clamp(2.25rem, 3.4vw, 2.85rem)' },
                      fontWeight: 800,
                      textWrap: 'balance',
                      fontFeatureSettings: '"ss01"',
                    }}
                  >
                    <Box component="span" sx={{ display: 'block', color: 'text.primary' }}>
                      Rent the right ride,
                    </Box>
                    <Box
                      component="span"
                      sx={{
                        display: 'block',
                        color: 'primary.main',
                        fontWeight: 900,
                        mt: { xs: 0.25, sm: 0.35 },
                      }}
                    >
                      cars & motorcycles
                    </Box>
                    <Box
                      component="span"
                      sx={{
                        display: 'block',
                        color: 'text.primary',
                        fontWeight: 800,
                        mt: { xs: 0.25, sm: 0.35 },
                        fontSize: { xs: '0.92em', sm: '0.94em', md: '0.95em' },
                        opacity: 0.98,
                      }}
                    >
                      nationwide — transparent PHP, verified hosts.
                    </Box>
                  </Typography>

                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.9375rem', sm: '1.05rem', md: '1.0625rem' },
                      lineHeight: { xs: 1.62, sm: 1.68 },
                      maxWidth: { xs: '100%', md: '36em' },
                      fontWeight: 500,
                    }}
                  >
                    From city errands to long highway runs, pick dates and a pickup area — matched listings with clear
                    nightly rates, no surprise line items.
                  </Typography>

                  <Box
                    sx={{
                      width: '100%',
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                      bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.06 : 0.92),
                      boxShadow: `0 14px 42px ${alpha(theme.palette.primary.main, 0.07)}, 0 2px 8px ${alpha('#000', 0.04)}`,
                      overflow: 'hidden',
                      mt: { xs: 0.25, md: 0.5 },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'stretch', sm: 'stretch' },
                        width: '100%',
                      }}
                    >
                      {HERO_TRUST_NUMBERS.map((s, i) => (
                        <Box
                          key={s.k}
                          sx={{
                            flex: 1,
                            minWidth: 0,
                            px: { xs: 2, sm: 2.25, md: 2.75 },
                            py: { xs: 1.65, sm: 1.85, md: 2 },
                            textAlign: { xs: 'center', sm: 'left' },
                            borderTop: {
                              xs: i > 0 ? `1px solid ${alpha(theme.palette.divider, 0.85)}` : undefined,
                              sm: 'none',
                            },
                            borderLeft: {
                              xs: 'none',
                              sm: i > 0 ? `1px solid ${alpha(theme.palette.divider, 0.85)}` : undefined,
                            },
                            bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.03 : 0.02),
                          }}
                        >
                          <Typography
                            component="span"
                            variant="h6"
                            sx={{
                              display: 'block',
                              fontWeight: 900,
                              fontVariantNumeric: 'tabular-nums',
                              lineHeight: 1.15,
                              fontSize: { xs: '1.05rem', sm: '1.2rem', md: '1.25rem' },
                              letterSpacing: '-0.03em',
                              color: 'text.primary',
                            }}
                          >
                            {s.k}
                          </Typography>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: 'block',
                              mt: 0.5,
                              fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                              lineHeight: 1.45,
                              fontWeight: 600,
                            }}
                          >
                            {s.l}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    useFlexGap
                    sx={{ pt: { xs: 0.25, sm: 0.5 }, alignItems: { xs: 'stretch', sm: 'center' }, flexWrap: 'wrap' }}
                  >
                    <Button
                      component={RouterLink}
                      to="/map"
                      variant="contained"
                      color="primary"
                      size="medium"
                      startIcon={<MapOutlined />}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        borderRadius: 2.25,
                        py: 1.125,
                        px: 2,
                        boxShadow: `0 8px 22px ${alpha(theme.palette.primary.main, 0.28)}`,
                      }}
                    >
                      Explore the map
                    </Button>
                    <Button
                      component={RouterLink}
                      to="/search"
                      variant="outlined"
                      color="inherit"
                      size="medium"
                      startIcon={<SearchRounded />}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        borderRadius: 2.25,
                        py: 1.125,
                        borderColor: alpha(theme.palette.text.primary, 0.14),
                        bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.12 : 0.55),
                        '&:hover': {
                          borderColor: alpha(theme.palette.primary.main, 0.5),
                          bgcolor: alpha(theme.palette.primary.main, 0.06),
                        },
                      }}
                    >
                      Browse fleet
                    </Button>
                  </Stack>
                  <Box
                    id="how"
                    component="section"
                    aria-labelledby="landing-how-heading"
                    sx={{
                      borderRadius: { xs: 2.5, sm: 0 },
                      px: { xs: 2, sm: 0 },
                      py: { xs: 2, sm: 0 },
                      bgcolor: { xs: alpha(theme.palette.primary.main, 0.035), sm: 'transparent' },
                      border: { xs: `1px solid ${alpha(theme.palette.primary.main, 0.09)}`, sm: 'none' },
                    }}
                  >
                    <Stack spacing={{ xs: 1.125, sm: 1.25, md: 1.75 }}>
                      <Box>
                        <Typography
                          variant="caption"
                          color="primary"
                          sx={{
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            fontSize: { xs: '0.6375rem', sm: '0.65rem', md: '0.6875rem' },
                          }}
                        >
                          Simple flow
                        </Typography>
                        <Typography
                          id="landing-how-heading"
                          variant="subtitle1"
                          component="h2"
                          sx={{
                            fontWeight: 800,
                            letterSpacing: '-0.02em',
                            lineHeight: 1.28,
                            mt: { xs: 0.35, md: 0.5 },
                            fontSize: { xs: '1.0125rem', sm: '1.0625rem', md: '1.125rem' },
                          }}
                        >
                          How it works
                        </Typography>
                      </Box>
                      <Stack spacing={{ xs: 1.375, sm: 1.25, md: 2 }}>
                        {HERO_FLOW_COMPACT.map(({ Icon, title, line }, idx) => (
                          <Stack
                            key={title}
                            direction="row"
                            spacing={{ xs: 1.375, sm: 1.5, md: 1.75 }}
                            alignItems="flex-start"
                            sx={{
                              pb: idx < HERO_FLOW_COMPACT.length - 1 ? { xs: 1.375, sm: 0 } : 0,
                              borderBottom:
                                idx < HERO_FLOW_COMPACT.length - 1 ? { xs: `1px solid ${alpha(theme.palette.divider, 0.65)}`, sm: 'none' } : undefined,
                            }}
                          >
                            <Box
                              sx={{
                                flexShrink: 0,
                                width: { xs: 40, sm: 36, md: 40 },
                                height: { xs: 40, sm: 36, md: 40 },
                                borderRadius: { xs: 2, sm: 1.5, md: 2 },
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: 'primary.main',
                                mt: { xs: 0.0625, sm: 0 },
                              }}
                            >
                              <Icon sx={{ fontSize: { xs: 21, sm: 20, md: 22 } }} aria-hidden />
                            </Box>
                            <Box sx={{ minWidth: 0, pt: { xs: 0.25, sm: 0.25, md: 0.375 } }}>
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                sx={{
                                  fontSize: { xs: '0.84375rem', sm: '0.895rem', md: '0.9375rem' },
                                  lineHeight: { xs: 1.32, md: 1.35 },
                                }}
                              >
                                {title}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  display: 'block',
                                  mt: { xs: 0.3125, md: 0.375 },
                                  fontSize: { xs: '0.709375rem', sm: '0.78125rem', md: '0.8125rem' },
                                  lineHeight: { xs: 1.5, md: 1.55 },
                                  overflowWrap: 'break-word',
                                  wordBreak: 'normal',
                                }}
                              >
                                {line}
                              </Typography>
                            </Box>
                          </Stack>
                        ))}
                      </Stack>
                    </Stack>
                  </Box>

                  <Stack
                    spacing={{ xs: 1.125, sm: 1.25, md: 2 }}
                    component="section"
                    aria-labelledby="landing-trust-heading"
                    sx={{
                      borderRadius: { xs: 2.5, sm: 0 },
                      px: { xs: 2, sm: 0 },
                      py: { xs: 2, sm: 0 },
                      bgcolor: { xs: alpha(theme.palette.grey[50], 0.92), sm: 'transparent' },
                      border: { xs: `1px solid ${alpha(theme.palette.divider, 0.75)}`, sm: 'none' },
                      boxShadow: { xs: `inset 0 1px 0 ${alpha('#fff', 0.65)}`, sm: 'none' },
                    }}
                  >
                    <Box sx={{ width: '100%', maxWidth: '100%', mx: 0 }}>
                      <Box sx={{ mb: { xs: 1.25, sm: 1.5 } }}>
                        <Typography
                          variant="caption"
                          color="primary"
                          sx={{
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            fontSize: { xs: '0.6375rem', sm: '0.65rem', md: '0.6875rem' },
                          }}
                        >
                          Why renters choose us
                        </Typography>
                        <Typography
                          id="landing-trust-heading"
                          variant="subtitle1"
                          component="h2"
                          sx={{
                            fontWeight: 800,
                            letterSpacing: '-0.02em',
                            lineHeight: 1.28,
                            mt: { xs: 0.35, md: 0.5 },
                            fontSize: { xs: '1.0125rem', sm: '1.0625rem', md: '1.125rem' },
                          }}
                        >
                          Trust built into every trip
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, minmax(0, 1fr))',
                          },
                          gap: { xs: 0, sm: 1.5, md: 2 },
                          width: '100%',
                          alignItems: 'stretch',
                        }}
                      >
                        {HERO_WHY_COMPACT.map(({ Icon, title, line }, idx) => {
                          const isLastMobile = idx === HERO_WHY_COMPACT.length - 1
                          return (
                            <Box
                              key={title}
                              sx={{
                                minWidth: 0,
                                pb: {
                                  xs: isLastMobile ? 0 : 1.375,
                                  sm: 0,
                                },
                                borderBottom: {
                                  xs: isLastMobile ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.55)}`,
                                  sm: 'none',
                                },
                                borderRadius: { xs: 0, sm: 2 },
                                bgcolor: {
                                  xs: 'transparent',
                                  sm: alpha(theme.palette.background.paper, 0.94),
                                },
                                border: {
                                  xs: 'none',
                                  sm: `1px solid ${alpha(theme.palette.divider, 0.72)}`,
                                },
                                boxShadow: {
                                  xs: 'none',
                                  sm: `0 2px 12px ${alpha('#000', 0.035)}`,
                                },
                                px: { xs: 0, sm: 1.25, md: 1.5 },
                                py: { xs: 0, sm: 1.25, md: 1.5 },
                              }}
                            >
                              <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ width: '100%' }}>
                                <Box
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    flexShrink: 0,
                                    bgcolor: alpha(theme.palette.primary.main, 0.11),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'primary.main',
                                    mt: 0.125,
                                  }}
                                >
                                  <Icon sx={{ fontSize: 17 }} aria-hidden />
                                </Box>
                                <Box sx={{ minWidth: 0, flex: 1, pt: 0 }}>
                                  <Typography
                                    variant="body2"
                                    fontWeight={700}
                                    sx={{
                                      fontSize: { xs: '0.875rem', sm: '0.84375rem', md: '0.90625rem' },
                                      lineHeight: { xs: 1.33, md: 1.35 },
                                      letterSpacing: '-0.015em',
                                    }}
                                  >
                                    {title}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      display: 'block',
                                      mt: { xs: 0.35, sm: 0.3, md: 0.45 },
                                      fontSize: { xs: '0.75rem', sm: '0.75rem', md: '0.8125rem' },
                                      lineHeight: { xs: 1.5, md: 1.55 },
                                      overflowWrap: 'break-word',
                                      wordBreak: 'normal',
                                    }}
                                  >
                                    {line}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Box>
                          )
                        })}
                      </Box>
                    </Box>
                  </Stack>
                </Stack>
              </Box>
            </Grid>

            <Grid item xs={12} md={6} lg={5} sx={{ order: { xs: 1, md: 2 } }}>
              <Box sx={{ height: '100%' }}>
                <Paper
                  id="trip-search"
                  data-onboarding="search"
                  elevation={0}
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    height: '100%',
                    /** 16px inset @ xs — 8px grid, compact without feeling cramped */
                    p: { xs: 2, sm: 3.25, md: 3.5 },
                    pt: { xs: 2.25, sm: 3.5, md: 3.75 },
                    borderRadius: { xs: 2.75, md: 3 },
                    border: '1px solid',
                    borderColor: { xs: alpha(theme.palette.divider, 0.9), sm: 'divider' },
                    boxShadow: { xs: `0 1px 0 ${alpha('#000', 0.04)}, 0 8px 24px ${alpha('#000', 0.07)}`, sm: softShadow },
                    transition: 'box-shadow 0.25s ease, border-color 0.2s ease',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: '0 0 auto 0',
                      height: 4,
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.light, 0.75)})`,
                    },
                    '@media (hover: hover)': {
                      '&:hover': {
                        boxShadow: softShadowHover,
                        borderColor: alpha(theme.palette.primary.main, 0.15),
                      },
                    },
                  }}
                >
                  <Stack spacing={{ xs: 1.75, md: 2.75 }}>
                    <Box component="header" sx={{ pt: { xs: 0.25, sm: 0 } }}>
                      <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <Box
                          sx={{
                            width: { xs: 44, sm: 48 },
                            height: { xs: 44, sm: 48 },
                            flexShrink: 0,
                            borderRadius: 2.25,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: 'primary.main',
                          }}
                          aria-hidden
                        >
                          <DirectionsCar sx={{ fontSize: { xs: 24, sm: 26 } }} />
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="overline"
                            color="primary"
                            sx={{
                              fontWeight: 800,
                              letterSpacing: { xs: '0.1em', sm: '0.09em' },
                              fontSize: { xs: '0.625rem', sm: '0.7rem' },
                              lineHeight: 1.2,
                            }}
                          >
                            Trip planner
                          </Typography>
                          <Typography
                            variant="h6"
                            component="h2"
                            sx={{
                              mt: 0.35,
                              fontWeight: 800,
                              letterSpacing: '-0.025em',
                              fontSize: { xs: '1.1875rem', sm: '1.4rem', md: '1.4375rem' },
                              lineHeight: { xs: 1.2, sm: 1.15 },
                            }}
                          >
                            Where are you picking up?
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mt: { xs: 0.5, sm: 0.75 },
                              lineHeight: 1.57,
                              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                              display: { xs: 'none', sm: 'block' },
                            }}
                          >
                            Set area and{' '}
                            <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                              dates with times
                            </Box>{' '}
                            so results match real availability — pricing uses calendar days between pick-up and return.
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              mt: 1,
                              display: { xs: 'block', sm: 'none' },
                              lineHeight: 1.5,
                              fontSize: '0.75rem',
                              letterSpacing: '0.01em',
                              maxWidth: 340,
                            }}
                          >
                            Area + dates & times. Rates use days between pickup and drop-off.
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

                    <Stack component="section" spacing={1} aria-labelledby="landing-location-heading">
                      <Typography
                        id="landing-location-heading"
                        variant="overline"
                        component="h3"
                        sx={{
                          fontWeight: 800,
                          letterSpacing: '0.12em',
                          fontSize: { xs: '0.625rem', sm: '0.65rem' },
                          color: 'text.secondary',
                          lineHeight: 1.25,
                        }}
                      >
                        Location
                      </Typography>
                      <Autocomplete
                        options={LOCATIONS}
                        value={loc}
                        onChange={(_, v) => setLoc(v ?? 'Makati')}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.grey[50], 0.9),
                            transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                            '&.Mui-focused': {
                              bgcolor: 'background.paper',
                              boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.14)}`,
                            },
                          },
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            size={isMobile ? 'small' : 'medium'}
                            label="Pick-up area"
                            placeholder="e.g. Makati, Cebu City"
                            inputProps={{ ...params.inputProps, 'aria-label': 'Pick-up area' }}
                            InputLabelProps={{ sx: { fontWeight: 600, fontSize: isMobile ? '0.875rem' : undefined } }}
                          />
                        )}
                      />
                    </Stack>

                    <Box
                      role="presentation"
                      sx={{
                        height: 1,
                        alignSelf: 'stretch',
                        bgcolor: alpha(theme.palette.divider, 0.95),
                      }}
                    />

                    <Stack component="section" spacing={1} aria-labelledby="landing-schedule-heading">
                      <Typography
                        id="landing-schedule-heading"
                        variant="overline"
                        component="h3"
                        sx={{
                          fontWeight: 800,
                          letterSpacing: '0.12em',
                          fontSize: { xs: '0.625rem', sm: '0.65rem' },
                          color: 'text.secondary',
                          lineHeight: 1.25,
                        }}
                      >
                        Schedule
                      </Typography>
                      <DateRangePicker
                        pickup={pickup}
                        dropoff={dropoff}
                        onChange={({ pickup: p, dropoff: d }) => {
                          setPickup(p)
                          setDropoff(d)
                        }}
                        minDate={dayjs()}
                        spacing={isMobile ? 1.25 : 2}
                        size={isMobile ? 'small' : 'medium'}
                        stacked
                        showPolicyCaption={false}
                        pickupLabel="Pick-up"
                        dropoffLabel="Return"
                        slotProps={{
                          textField: {
                            sx: {
                              '& .MuiOutlinedInput-root': {
                                bgcolor: alpha(theme.palette.grey[50], 0.9),
                                transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
                                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                                '&.Mui-focused': {
                                  bgcolor: 'background.paper',
                                  boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.14)}`,
                                },
                              },
                            },
                          },
                        }}
                      />
                      <Box
                        sx={{
                          display: { xs: 'none', sm: 'flex' },
                          gap: 1.25,
                          alignItems: 'flex-start',
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.045),
                          border: '1px solid',
                          borderColor: alpha(theme.palette.primary.main, 0.14),
                        }}
                      >
                        <AccessTime sx={{ fontSize: 20, color: 'primary.main', mt: 0.2, flexShrink: 0, opacity: 0.95 }} aria-hidden />
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.55, fontSize: '0.75rem' }}>
                          Times help hosts coordinate hand-offs. Your rate still uses{' '}
                          <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            calendar days
                          </Box>{' '}
                          between pick-up and return dates.
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack
                      spacing={1}
                      sx={{
                        pt: { xs: 1.5, sm: 1 },
                        mt: { xs: 0.25, sm: 0 },
                        borderTop: {
                          xs: `1px solid ${alpha(theme.palette.divider, 0.95)}`,
                          sm: 'none',
                        },
                      }}
                    >
                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        onClick={search}
                        endIcon={<ArrowForward />}
                        sx={{
                          py: { xs: 1.125, sm: 1.35 },
                          minHeight: { xs: 44, sm: 48 },
                          borderRadius: { xs: 2.25, sm: 2 },
                          fontSize: { xs: '0.921875rem', sm: '1rem' },
                          fontWeight: 700,
                          letterSpacing: '0.01em',
                          boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
                          '&:hover': {
                            boxShadow: `0 6px 18px ${alpha(theme.palette.primary.main, 0.38)}`,
                          },
                        }}
                      >
                        Search available vehicles
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box id="categories" sx={{ bgcolor: 'grey.50', py: { xs: 4.5, md: 9 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          <Box component="section">
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
                      transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                      '@media (hover: hover)': {
                        '&:hover': {
                          borderColor: alpha(theme.palette.primary.main, 0.45),
                          boxShadow: softShadowHover,
                        },
                      },
                      '&:active': { transform: { xs: 'scale(0.98)', sm: 'none' } },
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
                    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                    '@media (hover: hover)': {
                      '&:hover': {
                        borderColor: alpha(theme.palette.primary.main, 0.45),
                        boxShadow: softShadowHover,
                      },
                    },
                    '&:active': { transform: { xs: 'scale(0.98)', sm: 'none' } },
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
          </Box>
        </Container>
      </Box>

      {/* Motorcycles spotlight */}
      {motoPicks.length > 0 && (
        <Container maxWidth="lg" sx={{ pt: { xs: 0, md: 1 }, px: { xs: 2, sm: 3 }, pb: { xs: 3, sm: 3.5, md: 7 } }}>
          <Box component="section">
            <Stack spacing={{ xs: 1.25, md: 1.75 }} sx={{ mb: { xs: 1.375, sm: 2 }, maxWidth: 560 }}>
              <Box>
                <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: '0.08em', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  Two wheels
                </Typography>
                <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 800, letterSpacing: '-0.02em', fontSize: { xs: '1.35rem', sm: '2rem', md: '2.125rem' } }}>
                  Motorcycles nationwide
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: { xs: 0.625, sm: 1 }, lineHeight: 1.6, fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                  Sport, naked, and touring bikes — swipe for more picks, then dig into the map or motorcycle list below.
                </Typography>
              </Box>
            </Stack>
            <LandingListingCarousel>
              {motoPicks.map((car) => (
                <LandingCarouselSlide key={car.id}>
                  <Box sx={{ height: '100%', '& .MuiCard-root': { borderRadius: { xs: 2.5, sm: 3 }, height: '100%' } }}>
                    <CarCard car={car} onNavigate={(c) => navigate(`/cars/${c.id}`)} onReserve={(c) => navigate(`/cars/${c.id}`)} />
                  </Box>
                </LandingCarouselSlide>
              ))}
            </LandingListingCarousel>
            <LandingExploreListingHint listHref="/search?vt=motorcycle" variant="motorcycles" />
          </Box>
        </Container>
      )}

      {/* Featured */}
      <Container
        maxWidth="lg"
        sx={{
          px: { xs: 2, sm: 3 },
          pt: { xs: 2.75, md: 9 },
          pb: { xs: landingBottomPaddingXs, md: 9 },
        }}
        data-onboarding="listings"
      >
        <Box component="section">
          <Stack spacing={{ xs: 1.375, md: 1.75 }} sx={{ mb: { xs: 2.25, md: 3.25 }, maxWidth: 560 }}>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: '0.08em', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
              Hand-picked
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: { xs: '1.35rem', sm: '2rem', md: '2.125rem' } }}>
              Top picks this week
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
              Swipe picks below, then browse the entire fleet on search or pinpoint availability on the map.
            </Typography>
          </Stack>
          <LandingListingCarousel>
            {cars.length === 0
              ? [0, 1, 2].map((i) => (
                  <LandingCarouselSlide key={i}>
                    <Skeleton variant="rounded" height={380} sx={{ borderRadius: 3 }} />
                  </LandingCarouselSlide>
                ))
              : featured.map((car) => (
                  <LandingCarouselSlide key={car.id}>
                    <Box sx={{ height: '100%', '& .MuiCard-root': { borderRadius: { xs: 2.5, sm: 3 }, height: '100%' } }}>
                      <CarCard car={car} onNavigate={(c) => navigate(`/cars/${c.id}`)} onReserve={(c) => navigate(`/cars/${c.id}`)} />
                    </Box>
                  </LandingCarouselSlide>
                ))}
          </LandingListingCarousel>
          <LandingExploreListingHint listHref="/search" />
        </Box>
      </Container>

    </Box>
  )
}
