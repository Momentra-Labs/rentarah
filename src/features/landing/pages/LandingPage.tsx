import ArrowForward from '@mui/icons-material/ArrowForward'
import DirectionsCar from '@mui/icons-material/DirectionsCar'
import GarageOutlined from '@mui/icons-material/GarageOutlined'
import MapOutlined from '@mui/icons-material/MapOutlined'
import Key from '@mui/icons-material/Key'
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined'
import Security from '@mui/icons-material/Security'
import Shield from '@mui/icons-material/Shield'
import Verified from '@mui/icons-material/Verified'
import {
  alpha,
  Autocomplete,
  Box,
  Button,
  Container,
  Grid,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

import { MOBILE_TAB_BAR_INSET_PX } from '@/components/layout/MobileBottomNav'
import { prefetchPath } from '@/lib/routePrefetch'
import { useOfferGeoPrompt } from '@/hooks/useOfferGeoPrompt'
import DateRangePicker, { mergePickerInputLabelProps } from '@/components/common/DateRangePicker'
import HeroAmbientBackground from '@/components/landing/HeroAmbientBackground'
import { HERO_TRUST_SPECS, HeroTrustStatCell } from '@/components/landing/HeroTrustStats'
import { highlightPickupMatch, pickupAreaFilter } from '@/components/search/PhPickupCityAutocomplete'
import LandingAudiencePaths from '@/features/landing/components/LandingAudiencePaths'
import { useSearchStore } from '@/store/useSearchStore'
import { softShadow, softShadowHover } from '@/theme/pageStyles'
import { PH_PICKUP_AREAS } from '@/data/phPickupAreas'
import { useT } from '@/hooks/useT'
import {
  formatPickupReturnRentSpanHuman,
  formatSearchDateTimeParam,
  withDefaultDropoffTime,
  withDefaultPickupTime,
} from '@/utils/dateUtils'

const WHY_RENTARAH = [
  { Icon: Shield, titleKey: 'landing.insured' as const, lineKey: 'landing.insuredLine' as const },
  { Icon: Verified, titleKey: 'landing.verified' as const, lineKey: 'landing.verifiedLine' as const },
  { Icon: Security, titleKey: 'landing.secure' as const, lineKey: 'landing.secureLine' as const },
  { Icon: Key, titleKey: 'landing.flexible' as const, lineKey: 'landing.flexibleLine' as const },
] as const

function WhyPointRow({
  Icon,
  title,
  line,
  compact,
}: {
  Icon: (typeof WHY_RENTARAH)[number]['Icon']
  title: string
  line: string
  compact?: boolean
}) {
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="flex-start"
      sx={{ minWidth: 0, width: '100%' }}
    >
      <Box
        sx={{
          width: { xs: 28, sm: 32 },
          height: { xs: 28, sm: 32 },
          borderRadius: 1.5,
          bgcolor: (th) => alpha(th.palette.primary.main, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'primary.main',
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: { xs: 15, sm: 16 } }} aria-hidden />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="body2"
          fontWeight={800}
          title={compact ? `${title} · ${line}` : undefined}
          sx={{
            fontSize: { xs: '0.75rem', sm: '0.8125rem' },
            lineHeight: 1.25,
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 0.15, lineHeight: 1.4 }}
        >
          {line}
        </Typography>
      </Box>
    </Stack>
  )
}

export default function LandingPage() {
  const t = useT()
  const theme = useTheme()
  /** Matches {@link MOBILE_TAB_BAR_INSET_PX}: raised Map tab + row — scrollable content must clear the fixed bar. */
  const mobileNavClearBottom = `calc(${MOBILE_TAB_BAR_INSET_PX}px + env(safe-area-inset-bottom, 0px))`
  const landingGutters = { xs: 2, sm: 3 } as const
  /** Shared vertical rhythm for hero + every homepage section. */
  const landingSectionPy = { xs: 4, sm: 5, md: 6 } as const
  const landingHeadingMb = { xs: 2.5, md: 3 } as const
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true })
  const isXs = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true })
  const reduceWhyMotion = useReducedMotion()
  const [whyIndex, setWhyIndex] = useState(0)
  const whyPoint = WHY_RENTARAH[whyIndex]
  const navigate = useNavigate()
  const setLocation = useSearchStore((s) => s.setLocation)
  const setDates = useSearchStore((s) => s.setDates)
  const setFilter = useSearchStore((s) => s.setFilter)

  useOfferGeoPrompt('landing')

  useEffect(() => {
    prefetchPath('/search')
    prefetchPath('/search/model')
    prefetchPath('/map')
    prefetchPath('/become-a-host')
  }, [])

  useEffect(() => {
    if (!isXs) {
      setWhyIndex(0)
      return
    }
    const id = window.setInterval(() => {
      setWhyIndex((i) => (i + 1) % WHY_RENTARAH.length)
    }, 2000)
    return () => window.clearInterval(id)
  }, [isXs])

  const [loc, setLoc] = useState('')
  const [pickupAreaQuery, setPickupAreaQuery] = useState('')
  const [pickup, setPickup] = useState<Dayjs | null>(() => withDefaultPickupTime(dayjs().add(1, 'day')))
  const [dropoff, setDropoff] = useState<Dayjs | null>(() => withDefaultDropoffTime(dayjs().add(4, 'day')))
  const tripLength = useMemo(
    () => (pickup?.isValid() && dropoff?.isValid() ? formatPickupReturnRentSpanHuman(pickup, dropoff) : null),
    [pickup, dropoff],
  )

  const tripPlannerFieldSx = useMemo(
    () => ({
      '& .MuiFormControl-root, &.MuiFormControl-root': {
        overflow: 'visible',
      },
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
        [theme.breakpoints.down('sm')]: {
          alignItems: 'center',
          minHeight: 48,
        },
        [theme.breakpoints.between('sm', 'md')]: {
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
        [theme.breakpoints.down('sm')]: {
          fontSize: '1rem',
          lineHeight: 1.42,
          paddingTop: `${theme.spacing(1.375)}`,
          paddingBottom: `${theme.spacing(1.375)}`,
          paddingLeft: `${theme.spacing(1.25)}`,
        },
        [theme.breakpoints.between('sm', 'md')]: {
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
        fontWeight: 600,
        lineHeight: 1.25,
        [theme.breakpoints.down('md')]: {
          fontSize: '1rem',
          lineHeight: 1.2,
        },
        '&.MuiInputLabel-shrink': {
          fontSize: '0.75rem',
          letterSpacing: '0.02em',
          bgcolor: theme.palette.background.paper,
          px: 0.5,
          ml: -0.25,
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
    }),
    [theme],
  )

  const search = () => {
    const area = loc.trim() || 'Philippines'
    setLocation(area)
    setDates(pickup, dropoff)
    setFilter({ types: [], vehicleType: 'all' })
    const params = new URLSearchParams()
    params.set('location', area)
    if (pickup?.isValid()) params.set('pickup', formatSearchDateTimeParam(pickup))
    if (dropoff?.isValid()) params.set('dropoff', formatSearchDateTimeParam(dropoff))
    navigate(`/search?${params.toString()}`)
  }

  const focusTripPlanner = () => {
    const el = document.getElementById('trip-search')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      const focusable = el.querySelector<HTMLElement>('input, button, [tabindex]:not([tabindex="-1"])')
      focusable?.focus({ preventScroll: true })
      return
    }
    navigate('/search')
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
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(168deg, ${alpha(theme.palette.primary.main, 0.078)} 0%, ${theme.palette.background.default} 38%, ${alpha(theme.palette.grey[50], 1)} 92%)`,
          pt: { xs: 2, sm: landingSectionPy.sm, md: landingSectionPy.md },
          pb: { xs: 2, sm: landingSectionPy.sm, md: landingSectionPy.md },
        }}
      >
        <HeroAmbientBackground />
        <Container maxWidth="lg" sx={{ px: landingGutters, position: 'relative', zIndex: 1 }}>
          <Grid container spacing={{ xs: 1, md: 4 }} alignItems="stretch">
            <Grid item xs={12} md={6} lg={7} sx={{ order: { xs: 1, md: 1 }, display: 'flex', alignItems: { xs: 'stretch', md: 'center' } }}>
              <Stack
                data-onboarding="hero"
                spacing={{ xs: 1, md: 1.75 }}
                sx={{
                  width: '100%',
                  pr: { md: 0.5 },
                }}
              >
                  <Typography
                    component="h1"
                    variant="h1"
                    sx={{
                      letterSpacing: '-0.035em',
                      lineHeight: { xs: 1.15, md: 1.08 },
                      fontSize: { xs: '1.7rem', sm: '2.25rem', md: 'clamp(2.15rem, 3.2vw, 2.65rem)' },
                      fontWeight: 800,
                      color: 'text.primary',
                      textWrap: 'balance',
                    }}
                  >
                    {t('landing.heroTitle')}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      display: { xs: 'none', sm: 'block' },
                      fontSize: { xs: '0.975rem', sm: '1.0625rem' },
                      lineHeight: 1.55,
                      maxWidth: '36em',
                      fontWeight: 500,
                    }}
                  >
                    {t('landing.heroSubtitle')}
                  </Typography>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.25}
                    sx={{ display: { xs: 'none', sm: 'flex' }, width: '100%', maxWidth: { md: 460 } }}
                  >
                    <Button
                      component={RouterLink}
                      to="/map"
                      variant="contained"
                      size="large"
                      startIcon={<MapOutlined />}
                      endIcon={<ArrowForward />}
                      sx={{
                        fontWeight: 800,
                        borderRadius: 2,
                        minHeight: 48,
                        px: 2.25,
                        flex: { sm: 1 },
                        boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.28)}`,
                      }}
                    >
                      {t('landing.exploreMap')}
                    </Button>
                    <Button
                      component={RouterLink}
                      to="/become-a-host"
                      variant="outlined"
                      color="inherit"
                      size="large"
                      startIcon={<GarageOutlined />}
                      sx={{
                        fontWeight: 800,
                        borderRadius: 2,
                        minHeight: 48,
                        px: 2.25,
                        flex: { sm: 1 },
                        borderColor: alpha(theme.palette.text.primary, 0.18),
                      }}
                    >
                      {t('landing.listVehicle')}
                    </Button>
                  </Stack>

                <Stack
                  direction="row"
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.divider, 0.95),
                    overflow: 'hidden',
                    bgcolor: alpha(theme.palette.background.paper, 0.82),
                    width: '100%',
                  }}
                  aria-label="RentaraH at a glance"
                >
                  {HERO_TRUST_SPECS.map((spec, i) => (
                    <Box
                      key={spec.key}
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        px: { xs: 1.15, sm: 1.75, md: 2 },
                        py: { xs: 1.35, md: 1.75 },
                        borderLeft: i > 0 ? '1px solid' : 'none',
                        borderColor: 'divider',
                      }}
                    >
                      <HeroTrustStatCell spec={spec} index={i} />
                    </Box>
                  ))}
                </Stack>

                <Box component="section" aria-labelledby="landing-trust-heading">
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="baseline"
                    flexWrap="wrap"
                    useFlexGap
                    sx={{ mb: { xs: 1, sm: 1.25 } }}
                  >
                    <Typography
                      id="landing-trust-heading"
                      variant="overline"
                      component="h2"
                      color="primary"
                      sx={{ fontWeight: 800, letterSpacing: '0.14em', fontSize: '0.6875rem', lineHeight: 1.2 }}
                    >
                      {t('landing.whyTitle')}
                    </Typography>
                    <Typography
                      component="span"
                      sx={{
                        display: { xs: 'none', sm: 'inline' },
                        fontWeight: 800,
                        letterSpacing: '-0.025em',
                        fontSize: '1rem',
                        lineHeight: 1.25,
                      }}
                    >
                      {t('landing.whyHeading')}
                    </Typography>
                  </Stack>
                  <Box
                    sx={{
                      display: { xs: 'block', sm: 'none' },
                      overflow: 'hidden',
                      minHeight: 48,
                    }}
                    aria-live="polite"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <Box
                        key={whyPoint.titleKey}
                        component={motion.div}
                        initial={reduceWhyMotion ? false : { y: 12, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={reduceWhyMotion ? { opacity: 1 } : { y: -12, opacity: 0 }}
                        transition={{ duration: 0.28, ease: 'easeOut' }}
                        sx={{ display: 'flex', alignItems: 'flex-start' }}
                      >
                        <WhyPointRow
                          Icon={whyPoint.Icon}
                          title={t(whyPoint.titleKey)}
                          line={t(whyPoint.lineKey)}
                          compact
                        />
                      </Box>
                    </AnimatePresence>
                  </Box>
                  <Box
                    sx={{
                      display: { xs: 'none', sm: 'grid' },
                      gridTemplateColumns: '1fr 1fr',
                      gap: 1.25,
                    }}
                  >
                    {WHY_RENTARAH.map(({ Icon, titleKey, lineKey }) => (
                      <WhyPointRow key={titleKey} Icon={Icon} title={t(titleKey)} line={t(lineKey)} />
                    ))}
                  </Box>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} md={6} lg={5} sx={{ order: { xs: 2, md: 2 } }}>
              <Box sx={{ height: '100%' }}>
                <Paper
                  id="trip-search"
                  data-onboarding="search"
                  elevation={0}
                  aria-label={t('landing.findVehicle')}
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    height: '100%',
                    scrollMarginBottom: { xs: mobileNavClearBottom, md: undefined },
                    px: { xs: 1.75, sm: 2.25, md: 2.5 },
                    pb: { xs: 1.75, sm: 2.25, md: 2.5 },
                    pt: { xs: 1.75, sm: 2.25, md: 2.5 },
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
                  <Stack spacing={{ xs: 1.5, sm: 1.5, md: 1.75 }}>
                    <Stack
                      direction="row"
                      spacing={1.25}
                      alignItems="flex-start"
                      sx={{ display: { xs: 'none', sm: 'flex' } }}
                    >
                      <Box
                        sx={{
                          width: { xs: 38, sm: 42 },
                          height: { xs: 38, sm: 42 },
                          flexShrink: 0,
                          borderRadius: 2,
                          display: { xs: 'none', sm: 'flex' },
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                        }}
                        aria-hidden
                      >
                        <DirectionsCar sx={{ fontSize: { xs: 20, sm: 22 } }} />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          variant="h6"
                          component="h2"
                          sx={{
                            fontWeight: 800,
                            letterSpacing: '-0.025em',
                            fontSize: { xs: '1.15rem', sm: '1.3rem' },
                            lineHeight: 1.2,
                          }}
                        >
                          {t('landing.findVehicle')}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: { xs: 'none', sm: 'block' },
                            mt: 0.4,
                            lineHeight: 1.5,
                            fontWeight: 500,
                            fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                          }}
                        >
                          {t('landing.findVehicleHint')}
                        </Typography>
                      </Box>
                    </Stack>

                    <Autocomplete
                        options={[...PH_PICKUP_AREAS]}
                        value={loc || null}
                        inputValue={pickupAreaQuery}
                        onInputChange={(_, next, reason) => {
                          if (reason === 'reset') {
                            setPickupAreaQuery(loc)
                            return
                          }
                          setPickupAreaQuery(next)
                        }}
                        onChange={(_, v) => {
                          setLoc(v ?? '')
                          setPickupAreaQuery(v ?? '')
                        }}
                        filterOptions={pickupAreaFilter}
                        openOnFocus
                        autoHighlight
                        autoComplete
                        includeInputInList
                        clearOnEscape
                        handleHomeEndKeys
                        selectOnFocus
                        clearOnBlur={false}
                        noOptionsText={
                          pickupAreaQuery.trim()
                            ? `No city matches “${pickupAreaQuery.trim()}”`
                            : 'Start typing a city'
                        }
                        ListboxProps={{
                          sx: { maxHeight: 300 },
                        }}
                        sx={{
                          overflow: 'visible',
                          pt: { xs: 0, sm: 0.5 },
                          '& .MuiAutocomplete-popupIndicator': {
                            color: 'text.secondary',
                          },
                          '& .MuiAutocomplete-clearIndicator': {
                            visibility: 'visible',
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
                                py: 0.5,
                                '& .MuiAutocomplete-option': {
                                  borderRadius: 1.25,
                                  mx: 0.75,
                                  my: 0.125,
                                  minHeight: 44,
                                  alignItems: 'center',
                                },
                              },
                            },
                          },
                        }}
                        renderOption={(props, option) => {
                          const nationwide = option === 'Philippines'
                          return (
                            <Box component="li" {...props} key={option}>
                              <LocationOnOutlined
                                sx={{
                                  fontSize: 18,
                                  mr: 1.25,
                                  color: nationwide ? 'primary.main' : 'text.secondary',
                                  flexShrink: 0,
                                }}
                                aria-hidden
                              />
                              <Typography component="span" sx={{ fontWeight: 650, fontSize: '0.9375rem', minWidth: 0 }}>
                                {highlightPickupMatch(option, pickupAreaQuery)}
                              </Typography>
                              {nationwide && (
                                <Typography
                                  component="span"
                                  sx={{
                                    ml: 'auto',
                                    pl: 1,
                                    fontSize: '0.6875rem',
                                    fontWeight: 700,
                                    color: 'primary.main',
                                    letterSpacing: '0.02em',
                                  }}
                                >
                                  All cities
                                </Typography>
                              )}
                            </Box>
                          )
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            margin="none"
                            size={isMobile ? 'small' : 'medium'}
                            sx={tripPlannerFieldSx}
                            label="Pickup city"
                            placeholder="Type to search — Cebu, Davao, Makati…"
                            helperText={loc ? t('landing.searchAround', { place: loc }) : undefined}
                            FormHelperTextProps={{
                              sx: { display: { xs: 'none', sm: 'block' }, mx: 0, mt: 0.6, fontWeight: 600 },
                            }}
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <>
                                  <InputAdornment position="start">
                                    <LocationOnOutlined
                                      sx={{
                                        fontSize: 22,
                                        color: loc ? 'primary.main' : 'text.secondary',
                                      }}
                                      aria-hidden
                                    />
                                  </InputAdornment>
                                  {params.InputProps.startAdornment}
                                </>
                              ),
                            }}
                            inputProps={{ ...params.inputProps, 'aria-label': 'Pickup city', autoComplete: 'off' }}
                            InputLabelProps={mergePickerInputLabelProps(params.InputLabelProps)}
                          />
                        )}
                      />

                    <Stack spacing={{ xs: 1.5, sm: 0.75 }} sx={{ pt: 0 }}>
                      <DateRangePicker
                        pickup={pickup}
                        dropoff={dropoff}
                        onChange={({ pickup: p, dropoff: d }) => {
                          setPickup(p)
                          setDropoff(d)
                        }}
                        minDate={dayjs()}
                        spacing={isXs ? 1.5 : isMobile ? 1 : 1.75}
                        size={isMobile ? 'small' : 'medium'}
                        stacked
                        showPolicyCaption={false}
                        showHumanReadableSummary={false}
                        preferDesktopPickers
                        pickupLabel={t('picker.pickup')}
                        dropoffLabel={t('picker.return')}
                        slotProps={{
                          textField: {
                            sx: tripPlannerFieldSx,
                          },
                        }}
                      />
                      {tripLength ? (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          aria-live="polite"
                          sx={{ fontWeight: 600, lineHeight: 1.45, px: 0.25 }}
                        >
                          {tripLength}
                        </Typography>
                      ) : null}
                    </Stack>

                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={search}
                      endIcon={<ArrowForward sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                      sx={{
                        py: { xs: 1.1, sm: 1.2 },
                        minHeight: { xs: 46, sm: 48 },
                        borderRadius: 2,
                        fontSize: { xs: '0.9375rem', sm: '1rem' },
                        fontWeight: 800,
                        boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
                        '&:hover': {
                          boxShadow: `0 6px 18px ${alpha(theme.palette.primary.main, 0.38)}`,
                        },
                      }}
                    >
                      {loc.trim()
                        ? t('landing.searchIn', { place: loc === 'BGC, Taguig' ? 'BGC' : loc })
                        : t('landing.searchAvailable')}
                    </Button>
                  </Stack>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <LandingAudiencePaths
        onFindVehicle={focusTripPlanner}
        sectionPy={{ xs: 2.5, sm: landingSectionPy.sm, md: landingSectionPy.md }}
        headingMb={landingHeadingMb}
        gutters={landingGutters}
      />
    </Box>
  )
}
