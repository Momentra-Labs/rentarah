import AccessTime from '@mui/icons-material/AccessTime'
import ExploreOutlined from '@mui/icons-material/ExploreOutlined'
import MapOutlined from '@mui/icons-material/MapOutlined'
import AirportShuttle from '@mui/icons-material/AirportShuttle'
import ArrowForward from '@mui/icons-material/ArrowForward'
import Bolt from '@mui/icons-material/Bolt'
import BookOnline from '@mui/icons-material/BookOnline'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import DirectionsCar from '@mui/icons-material/DirectionsCar'
import Key from '@mui/icons-material/Key'
import LocalOffer from '@mui/icons-material/LocalOffer'
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined'
import SearchRounded from '@mui/icons-material/SearchRounded'
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
  ButtonBase,
  Chip,
  Container,
  Divider,
  Grid,
  InputAdornment,
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
import { useEffect, useMemo, useState, type ElementType } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

import CarCard from '../components/common/CarCard'
import { MOBILE_TAB_BAR_INSET_PX } from '../components/layout/MobileBottomNav'
import { prefetchPath } from '../lib/routePrefetch'
import { useOfferGeoPrompt } from '../hooks/useOfferGeoPrompt'
import DateRangePicker, { mergePickerInputLabelProps } from '../components/common/DateRangePicker'
import HeroAmbientBackground from '../components/landing/HeroAmbientBackground'
import { HERO_TRUST_SPECS, HeroTrustStatCell } from '../components/landing/HeroTrustStats'
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

type CarBodyCategory = (typeof CATS)[number]['type']
type BrowseCategoryItem =
  | { key: string; label: string; Icon: ElementType; kind: 'carType'; carType: CarBodyCategory }
  | { key: string; label: string; Icon: ElementType; kind: 'motorcycle' }

const BROWSE_CATEGORY_ITEMS: BrowseCategoryItem[] = [
  ...CATS.map(
    (c): BrowseCategoryItem => ({
      key: `cat-${c.type}`,
      label: c.label,
      Icon: c.icon,
      kind: 'carType',
      carType: c.type,
    }),
  ),
  { key: 'vehicle-motorcycle', label: 'Motorcycles', Icon: TwoWheeler, kind: 'motorcycle' },
]

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
  /** Matches {@link MOBILE_TAB_BAR_INSET_PX}: raised Map tab + row — scrollable content must clear the fixed bar. */
  const mobileNavClearBottom = `calc(${MOBILE_TAB_BAR_INSET_PX}px + env(safe-area-inset-bottom, 0px))`
  /** One rhythm for spacing between hero / categories / listings (footer clears the tab bar — no duplicate inset here). */
  const landingSectionPy = { xs: 3.25, sm: 4, md: 6.5 } as const
  /** Motorcycle + Top picks sections: identical outer padding so listing tracks line up. */
  const landingListingsSectionContainerSx = { px: { xs: 2, sm: 3 }, py: landingSectionPy } as const
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

  const tripPlannerFieldSx = useMemo(
    () => ({
      '& .MuiOutlinedInput-root': {
        overflow: 'visible',
        borderRadius: 2,
        bgcolor:
          theme.palette.mode === 'dark'
            ? alpha(theme.palette.common.white, 0.06)
            : alpha(theme.palette.grey[50], 0.96),
        transition: 'background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.18s ease',
        '& fieldset': {
          borderColor: alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.55 : 0.92),
          transition: 'border-color 0.18s ease, border-width 0.08s ease',
        },
        '&:hover fieldset': {
          borderColor: alpha(theme.palette.primary.main, 0.32),
        },
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.1 : 0.045),
        },
        '&.Mui-focused': {
          bgcolor: theme.palette.background.paper,
          boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.14)}`,
        },
        '&.Mui-focused fieldset': {
          borderWidth: '2px',
          borderColor: alpha(theme.palette.primary.main, 0.55),
        },
        [theme.breakpoints.down('md')]: {
          alignItems: 'center',
          minHeight: 44,
        },
      },
      '& .MuiOutlinedInput-input': {
        minWidth: 0,
        textOverflow: 'ellipsis',
        [theme.breakpoints.up('md')]: {
          paddingLeft: `${theme.spacing(1.375)}`,
        },
        [theme.breakpoints.down('md')]: {
          fontSize: '1rem',
          lineHeight: 1.42,
          paddingTop: `${theme.spacing(1.125)}`,
          paddingBottom: `${theme.spacing(1.125)}`,
          paddingLeft: `${theme.spacing(1.25)}`,
        },
      },
      '& .MuiAutocomplete-root .MuiOutlinedInput-input': {
        [theme.breakpoints.down('md')]: {
          paddingRight: `${theme.spacing(7)}`,
        },
        [theme.breakpoints.up('md')]: {
          paddingRight: `${theme.spacing(4)}`,
        },
      },
      '& .MuiInputLabel-root': {
        [theme.breakpoints.down('md')]: {
          fontSize: '1rem',
          lineHeight: 1.2,
          '&.MuiInputLabel-shrink': {
            fontSize: '0.8125rem',
            letterSpacing: '0.015em',
          },
        },
        '&.Mui-focused': {
          color: 'primary.main',
        },
      },
      '& .MuiAutocomplete-input': {
        [theme.breakpoints.down('md')]: {
          minWidth: `${theme.spacing(2)}`,
          fontSize: '1rem',
          lineHeight: 1.45,
        },
      },
      '& .MuiAutocomplete-endAdornment .MuiSvgIcon-root': {
        [theme.breakpoints.down('md')]: {
          fontSize: 20,
        },
      },
      '& .MuiInputAdornment-positionStart .MuiSvgIcon-root': {
        [theme.breakpoints.down('md')]: {
          fontSize: 20,
        },
      },
      '& .MuiInputAdornment-positionEnd': {
        flexShrink: 0,
      },
      '& .MuiInputAdornment-positionEnd .MuiIconButton-root': {
        [theme.breakpoints.down('md')]: {
          color: theme.palette.text.secondary,
          padding: `${theme.spacing(0.875)}`,
        },
      },
      '& .MuiInputAdornment-positionEnd svg': {
        [theme.breakpoints.down('md')]: {
          fontSize: '1.35rem',
        },
      },
      '& .MuiFormHelperText-root': {
        fontSize: { xs: '0.6875rem', sm: '0.75rem' },
        letterSpacing: '0.015em',
        lineHeight: 1.42,
        mt: '4px',
        mx: 0,
        mb: 0,
      },
    }),
    [theme],
  )

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
          pb: landingSectionPy,
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
                      {HERO_TRUST_SPECS.map((spec, i) => (
                        <Box
                          key={spec.key}
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
                          <HeroTrustStatCell spec={spec} index={i} />
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
                    scrollMarginBottom: { xs: mobileNavClearBottom, md: undefined },
                    /** Slightly tighter px so the full form fits narrow viewports comfortably */
                    px: { xs: 1.35, sm: 1.75, md: 2.05 },
                    pb: { xs: 1.65, sm: 2.35, md: 2.65 },
                    pt: { xs: 2, sm: 2.65, md: 2.85 },
                    borderRadius: { xs: 2.75, md: 3 },
                    border: '1px solid',
                    borderColor: { xs: alpha(theme.palette.divider, 0.9), sm: 'divider' },
                    boxShadow: { xs: `0 1px 0 ${alpha('#000', 0.04)}, 0 8px 24px ${alpha('#000', 0.07)}`, sm: softShadow },
                    transition: 'box-shadow 0.25s ease, border-color 0.2s ease',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: '0 0 auto 0',
                      height: 3,
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
                  <Stack spacing={{ xs: 1.2, sm: 1.4, md: 1.65 }}>
                    <Box component="header" sx={{ pb: { xs: 0.125, sm: 0 } }}>
                      <Stack direction="row" spacing={{ xs: 1, sm: 1.1 }} alignItems="flex-start">
                        <Box
                          sx={{
                            width: { xs: 38, sm: 44 },
                            height: { xs: 38, sm: 44 },
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
                          <DirectionsCar sx={{ fontSize: { xs: 20, sm: 23 } }} />
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
                              mt: 0.25,
                              fontWeight: 800,
                              letterSpacing: '-0.025em',
                              fontSize: { xs: '1.1rem', sm: '1.32rem', md: '1.375rem' },
                              lineHeight: { xs: 1.18, sm: 1.15 },
                            }}
                          >
                            Where are you picking up?
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mt: { xs: 0.3, sm: 0.4 },
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
                              mt: { xs: 0.5, sm: 0 },
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

                    <Stack component="section" spacing={{ xs: 1.15, sm: 1.35 }} aria-labelledby="landing-location-heading">
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
                        freeSolo={false}
                        selectOnFocus
                        clearOnBlur={false}
                        onChange={(_, v) => setLoc(v ?? 'Makati')}
                        sx={{
                          '& .MuiAutocomplete-popupIndicator': {
                            color: 'text.secondary',
                          },
                        }}
                        slotProps={{
                          paper: {
                            elevation: 8,
                            sx: {
                              mt: 1,
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: alpha(theme.palette.divider, 0.9),
                              boxShadow: `0 14px 42px ${alpha('#000', 0.1)}`,
                              '& .MuiAutocomplete-listbox': {
                                py: 0.75,
                                '& .MuiAutocomplete-option': {
                                  borderRadius: 1.25,
                                  mx: 0.75,
                                  my: 0.125,
                                },
                              },
                            },
                          },
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            margin="none"
                            size={isMobile ? 'small' : 'medium'}
                            sx={tripPlannerFieldSx}
                            label="Pickup area"
                            placeholder="Search or pick a metro"
                            helperText="We match listings tagged in that area — use Philippines to search nationwide."
                            FormHelperTextProps={{
                              sx: { mt: 0.5, mx: 0, mb: 0 },
                            }}
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <>
                                  <InputAdornment position="start">
                                    <LocationOnOutlined
                                      sx={{
                                        fontSize: 20,
                                        color: 'primary.main',
                                        opacity: 0.75,
                                      }}
                                      aria-hidden
                                    />
                                  </InputAdornment>
                                  {params.InputProps.startAdornment}
                                </>
                              ),
                            }}
                            inputProps={{ ...params.inputProps, 'aria-label': 'Pick-up area', autoComplete: 'off' }}
                            InputLabelProps={mergePickerInputLabelProps(params.InputLabelProps)}
                          />
                        )}
                      />
                    </Stack>

                    <Box
                      role="presentation"
                      sx={{
                        height: 1,
                        alignSelf: 'stretch',
                        my: { xs: 0, sm: 0.125 },
                        bgcolor: alpha(theme.palette.divider, 0.95),
                      }}
                    />

                    <Stack component="section" spacing={{ xs: 1.15, sm: 1.35 }} aria-labelledby="landing-schedule-heading">
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
                        spacing={isMobile ? 1.1 : 1.5}
                        size={isMobile ? 'small' : 'medium'}
                        stacked
                        showPolicyCaption={false}
                        showHumanReadableSummary
                        denseSummary
                        preferDesktopPickers
                        pickupLabel="Pick-up"
                        dropoffLabel="Return"
                        slotProps={{
                          textField: {
                            sx: tripPlannerFieldSx,
                          },
                        }}
                      />
                      <Box
                        sx={{
                          display: { xs: 'none', sm: 'flex' },
                          gap: 1,
                          alignItems: 'flex-start',
                          p: { sm: 1.15, md: 1.25 },
                          mt: { sm: 0.25 },
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
                      sx={{
                        pt: { xs: 1.75, sm: 2 },
                        mt: { sm: 0.25 },
                        borderTop: {
                          xs: `1px solid ${alpha(theme.palette.divider, 0.92)}`,
                          sm: `1px solid ${alpha(theme.palette.divider, 0.65)}`,
                        },
                      }}
                    >
                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        onClick={search}
                        endIcon={<ArrowForward sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                        sx={{
                          py: { xs: 1, sm: 1.2 },
                          px: { xs: 1.25, sm: 2 },
                          minHeight: { xs: 44, sm: 48 },
                          borderRadius: { xs: 2.25, sm: 2 },
                          fontSize: { xs: '0.8125rem', sm: '1rem' },
                          fontWeight: 700,
                          letterSpacing: '0.01em',
                          lineHeight: { xs: 1.3, sm: 1.43 },
                          '& .MuiButton-label': {
                            whiteSpace: { xs: 'normal', sm: 'nowrap' },
                            textAlign: 'center',
                          },
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

      <Box
        id="categories"
        component="section"
        aria-labelledby="landing-categories-heading"
        sx={{
          py: landingSectionPy,
          background: `linear-gradient(180deg, ${theme.palette.grey[50]} 0%, ${alpha(theme.palette.background.default, 1)} 55%, ${theme.palette.grey[50]} 100%)`,
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          <Paper
            elevation={0}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: { xs: 2, md: 2.5 },
              border: '1px solid',
              borderColor: alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.52 : 0.88),
              bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.45 : 0.99),
              boxShadow: `0 1px 0 ${alpha(theme.palette.common.black, theme.palette.mode === 'light' ? 0.04 : 0.2)}`,
            }}
          >
            <Box
              aria-hidden
              sx={{
                height: 2,
                width: '100%',
                background: `linear-gradient(90deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 42%, ${alpha(theme.palette.primary.light, 0.88)} 100%)`,
              }}
            />
            <Stack sx={{ px: { xs: 1.65, sm: 2, md: 2.35 }, py: { xs: 1.65, sm: 1.85, md: 2.25 } }} spacing={{ xs: 1.35, md: 1.5 }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 1.35, sm: 1.5 }}
                alignItems={{ xs: 'stretch', sm: 'flex-start' }}
                justifyContent="space-between"
                sx={{
                  pb: { xs: 1.35, md: 1.5 },
                  gap: { xs: 1.25, sm: 1.5 },
                  borderBottom: '1px solid',
                  borderColor: alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.5 : 0.88),
                }}
              >
                <Stack spacing={{ xs: 0.35, sm: 0.5 }} sx={{ textAlign: 'left', maxWidth: { sm: 'min(560px, 100%)', md: 580 }, minWidth: 0 }}>
                  <Typography
                    variant="overline"
                    color="primary"
                    sx={{
                      fontWeight: 800,
                      letterSpacing: '0.14em',
                      fontSize: { xs: '0.625rem', sm: '0.6875rem' },
                      lineHeight: 1.2,
                    }}
                  >
                    Explore
                  </Typography>
                  <Typography
                    id="landing-categories-heading"
                    variant="h4"
                    sx={{
                      fontWeight: 900,
                      letterSpacing: '-0.03em',
                      fontSize: { xs: '1.35rem', sm: '1.65rem', md: '1.85rem' },
                      lineHeight: { xs: 1.12, sm: 1.1 },
                      color: 'text.primary',
                    }}
                  >
                    Browse by category
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontWeight: 500,
                      fontSize: { xs: '0.8125rem', sm: '0.875rem', md: '0.9rem' },
                      lineHeight: 1.45,
                      maxWidth: 480,
                    }}
                  >
                    Tap a category — Search opens with filters applied.
                  </Typography>
                </Stack>
                <Button
                  component={RouterLink}
                  to="/search"
                  variant="outlined"
                  color="inherit"
                  size="medium"
                  endIcon={<ChevronRightRounded />}
                  sx={{
                    flexShrink: 0,
                    textTransform: 'none',
                    fontWeight: 800,
                    fontSize: { xs: '0.8125rem', sm: undefined },
                    borderRadius: 2.25,
                    px: { xs: 2, sm: 2.25 },
                    py: { xs: 0.875, sm: 0.9 },
                    minHeight: { xs: 44, sm: 42 },
                    alignSelf: { xs: 'stretch', sm: 'center' },
                    borderColor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.28 : 0.16),
                    color: 'text.primary',
                    bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.25 : 0.96),
                    '&:hover': {
                      borderColor: alpha(theme.palette.primary.main, 0.5),
                      bgcolor: alpha(theme.palette.primary.main, 0.065),
                      boxShadow: 'none',
                    },
                  }}
                >
                  View entire fleet
                </Button>
              </Stack>

              <Box
                component="nav"
                aria-label="Vehicle categories"
                sx={{
                  border: '1px solid',
                  borderColor: alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.45 : 0.9),
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  bgcolor: alpha(theme.palette.background.default, theme.palette.mode === 'dark' ? 0.25 : 0.42),
                }}
              >
                <Stack
                  divider={
                    <Divider
                      component="div"
                      role="presentation"
                      sx={{ borderColor: alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.42 : 0.88) }}
                    />
                  }
                >
                  {BROWSE_CATEGORY_ITEMS.map((def) => {
                    const isMoto = def.kind === 'motorcycle'
                    const n = isMoto ? motorcycleListings.length : (catCounts[def.carType] ?? 0)
                    const Icon = def.Icon

                    const handleNavigate = () => {
                      if (isMoto) {
                        setFilter({ types: [], vehicleType: 'motorcycle' })
                        navigate('/search?vt=motorcycle')
                        return
                      }
                      setFilter({ types: [def.carType], vehicleType: 'all' })
                      const q = new URLSearchParams()
                      q.set('types', def.carType)
                      navigate(`/search?${q.toString()}`)
                    }

                    const countLabel =
                      `${n.toLocaleString('en-PH')} ` + (n === 1 ? 'vehicle' : 'vehicles')

                    return (
                      <ButtonBase
                        key={def.key}
                        focusRipple
                        aria-label={`Browse ${def.label}: ${countLabel} available.`}
                        onClick={handleNavigate}
                        sx={{
                          width: '100%',
                          display: 'block',
                          textAlign: 'left',
                          WebkitTapHighlightColor: 'transparent',
                          '@media (hover: hover) and (pointer: fine)': {
                            '&:hover .browse-flat-row': {
                              bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.12 : 0.054),
                            },
                            '&:hover .browse-flat-chevron': {
                              color: 'primary.main',
                              opacity: 1,
                              transform: 'translateX(2px)',
                            },
                          },
                          '@media (prefers-reduced-motion: reduce)': {
                            '&:hover .browse-flat-chevron': {
                              transform: 'none',
                            },
                          },
                          '&:focus-visible': {
                            outline: `2px solid ${theme.palette.primary.main}`,
                            outlineOffset: -2,
                            position: 'relative',
                            zIndex: 1,
                          },
                        }}
                      >
                        <Box
                          className="browse-flat-row"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: { xs: 1.35, sm: 1.5 },
                            px: { xs: 1.35, sm: 1.75 },
                            py: { xs: 1.35, sm: 1.4 },
                            minHeight: { xs: 52, sm: 54 },
                            transition: 'background-color 0.18s ease',
                            bgcolor: 'transparent',
                            borderLeft: '3px solid transparent',
                          }}
                        >
                          <Box
                            sx={{
                              flexShrink: 0,
                              width: 36,
                              height: 36,
                              borderRadius: 1.5,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: 'primary.main',
                              border: '1px solid',
                              borderColor: alpha(theme.palette.primary.main, 0.14),
                            }}
                            aria-hidden
                          >
                            <Icon sx={{ fontSize: 20 }} />
                          </Box>
                          <Typography
                            component="span"
                            sx={{
                              flex: 1,
                              minWidth: 0,
                              fontWeight: 700,
                              fontSize: { xs: '0.921875rem', sm: '0.9375rem' },
                              letterSpacing: '-0.018em',
                              lineHeight: 1.28,
                              color: 'text.primary',
                            }}
                          >
                            {def.label}
                          </Typography>
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{
                              flexShrink: 0,
                              fontWeight: 700,
                              fontVariantNumeric: 'tabular-nums',
                              fontSize: '0.75rem',
                              color: 'text.secondary',
                              maxWidth: { xs: '42%', sm: 'none' },
                              textAlign: 'right',
                            }}
                          >
                            {countLabel}
                          </Typography>
                          <ChevronRightRounded
                            className="browse-flat-chevron"
                            sx={{
                              flexShrink: 0,
                              fontSize: { xs: 20, sm: 22 },
                              color: 'text.secondary',
                              opacity: 0.5,
                              transition: 'color 0.18s ease, opacity 0.18s ease, transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                            aria-hidden
                          />
                        </Box>
                      </ButtonBase>
                    )
                  })}
                </Stack>
              </Box>
            </Stack>
          </Paper>
        </Container>
      </Box>

      {/* Motorcycles spotlight */}
      {motoPicks.length > 0 && (
        <Container maxWidth="lg" sx={landingListingsSectionContainerSx}>
          <Box component="section">
            <Stack spacing={{ xs: 1.375, md: 1.75 }} sx={{ mb: { xs: 2.25, md: 3.25 }, maxWidth: 560 }}>
              <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: '0.08em', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                Two wheels
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: { xs: '1.35rem', sm: '2rem', md: '2.125rem' } }}>
                Motorcycles nationwide
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                Sport, naked, and touring bikes — swipe for more picks, then dig into the map or motorcycle list below.
              </Typography>
            </Stack>
            <LandingListingCarousel
              exploreCta={<LandingExploreListingHint embedded listHref="/search?vt=motorcycle" variant="motorcycles" />}
            >
              {motoPicks.map((car) => (
                <LandingCarouselSlide key={car.id}>
                  <Box
                    sx={{
                      height: '100%',
                      width: '100%',
                      minWidth: 0,
                      '& .MuiCard-root': { borderRadius: { xs: 2.5, sm: 3 }, height: '100%' },
                    }}
                  >
                    <CarCard car={car} onNavigate={(c) => navigate(`/cars/${c.id}`)} onReserve={(c) => navigate(`/cars/${c.id}`)} />
                  </Box>
                </LandingCarouselSlide>
              ))}
            </LandingListingCarousel>
          </Box>
        </Container>
      )}

      {/* Featured */}
      <Container
        maxWidth="lg"
        sx={landingListingsSectionContainerSx}
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
          <LandingListingCarousel
            exploreCta={<LandingExploreListingHint embedded listHref="/search" />}
          >
            {cars.length === 0
              ? [0, 1, 2].map((i) => (
                  <LandingCarouselSlide key={i}>
                    <Skeleton variant="rounded" height={380} sx={{ borderRadius: 3 }} />
                  </LandingCarouselSlide>
                ))
              : featured.map((car) => (
                  <LandingCarouselSlide key={car.id}>
                    <Box
                      sx={{
                        height: '100%',
                        width: '100%',
                        minWidth: 0,
                        '& .MuiCard-root': { borderRadius: { xs: 2.5, sm: 3 }, height: '100%' },
                      }}
                    >
                      <CarCard car={car} onNavigate={(c) => navigate(`/cars/${c.id}`)} onReserve={(c) => navigate(`/cars/${c.id}`)} />
                    </Box>
                  </LandingCarouselSlide>
                ))}
          </LandingListingCarousel>
        </Box>
      </Container>

    </Box>
  )
}
