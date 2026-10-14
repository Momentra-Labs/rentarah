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
  Chip,
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
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

import { MOBILE_TAB_BAR_INSET_PX } from '@/components/layout/MobileBottomNav'
import { prefetchPath } from '@/lib/routePrefetch'
import { useOfferGeoPrompt } from '@/hooks/useOfferGeoPrompt'
import DateRangePicker, { mergePickerInputLabelProps } from '@/components/common/DateRangePicker'
import { highlightPickupMatch, pickupAreaFilter } from '@/components/search/PhPickupCityAutocomplete'
import LandingAudiencePaths from '@/features/landing/components/LandingAudiencePaths'
import LandingFeaturedRides from '@/features/landing/components/LandingFeaturedRides'
import HeroProofRow from '@/features/landing/components/HeroProofRow'
import TripClockSummary from '@/features/landing/components/TripClockSummary'
import TripVehicleTypePicker, { type TripVehicleType } from '@/features/landing/components/TripVehicleTypePicker'
import { useTripSearchPreview } from '@/features/landing/hooks/useTripSearchPreview'
import { useSearchStore } from '@/store/useSearchStore'
import { withLandingCtaSx } from '@/theme/pageStyles'
import { rhElev, rhFocusRing, rhRadius } from '@/theme/tokens'
import { PH_PICKUP_AREAS } from '@/data/phPickupAreas'
import { useT } from '@/hooks/useT'
import { formatSearchDateTimeParam, withDefaultDropoffTime, withDefaultPickupTime } from '@/utils/dateUtils'

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
}: {
  Icon: (typeof WHY_RENTARAH)[number]['Icon']
  title: string
  line: string
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
          borderRadius: `${rhRadius.md}px`,
          bgcolor: (th) => alpha(th.palette.primary.main, 0.08),
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

/** Hidden visually, still read by screen readers (keeps the section labelled on phones). */
const visuallyHiddenSx = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const

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

  const [loc, setLoc] = useState('')
  const [pickupAreaQuery, setPickupAreaQuery] = useState('')
  const [pickup, setPickup] = useState<Dayjs | null>(() => withDefaultPickupTime(dayjs().add(1, 'day')))
  const [dropoff, setDropoff] = useState<Dayjs | null>(() => withDefaultDropoffTime(dayjs().add(4, 'day')))
  const [vehicleType, setVehicleType] = useState<TripVehicleType>('all')
  const preview = useTripSearchPreview(loc.trim() || 'Philippines', vehicleType, pickup, dropoff)
  const placeLabel = loc === 'BGC, Taguig' ? 'BGC' : loc.trim()

  const tripPlannerFieldSx = useMemo(
    () => ({
      '& .MuiFormControl-root, &.MuiFormControl-root': {
        overflow: 'visible',
      },
      '& .MuiOutlinedInput-root': {
        overflow: 'visible',
        borderRadius: `${rhRadius.md}px`,
        bgcolor: 'background.paper',
        transition: 'background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.18s ease',
        '& fieldset': {
          borderColor: 'divider',
          transition: 'border-color 0.18s ease',
        },
        '&:hover fieldset': {
          borderColor: alpha(theme.palette.primary.main, 0.4),
        },
        '&.Mui-focused': {
          bgcolor: 'background.paper',
          boxShadow: rhFocusRing,
        },
        '&.Mui-focused fieldset': {
          borderWidth: '1px',
          borderColor: theme.palette.primary.main,
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
    setFilter({ types: [], vehicleType })
    const params = new URLSearchParams()
    params.set('location', area)
    if (vehicleType !== 'all') params.set('vt', vehicleType)
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
          bgcolor: 'background.default',
          pt: { xs: 2, sm: landingSectionPy.sm, md: landingSectionPy.md },
          pb: { xs: 2, sm: landingSectionPy.sm, md: landingSectionPy.md },
        }}
      >
        <Container maxWidth="lg" sx={{ px: landingGutters, position: 'relative', zIndex: 1 }}>
          <Grid container spacing={{ xs: 2.5, md: 4 }} alignItems="stretch">
            <Grid item xs={12} md={6} lg={7} sx={{ order: { xs: 1, md: 1 }, display: 'flex', alignItems: { xs: 'stretch', md: 'center' } }}>
              <Stack
                data-onboarding="hero"
                spacing={{ xs: 1.5, md: 1.75 }}
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
                      fontSize: { xs: '0.9375rem', sm: '1.0625rem' },
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
                      variant="outlined"
                      size="large"
                      startIcon={<MapOutlined />}
                      endIcon={<ArrowForward />}
                      sx={withLandingCtaSx(
                        theme,
                        {
                          fontWeight: 800,
                          borderRadius: `${rhRadius.md}px`,
                          minHeight: 48,
                          px: 2.25,
                          flex: { sm: '0 0 auto' },
                          borderWidth: '1.5px',
                          '&:hover': { borderWidth: '1.5px' },
                        },
                      )}
                    >
                      {t('landing.exploreMap')}
                    </Button>
                    <Button
                      component={RouterLink}
                      to="/become-a-host"
                      variant="text"
                      color="inherit"
                      size="large"
                      startIcon={<GarageOutlined />}
                      sx={withLandingCtaSx(theme, {
                        fontWeight: 700,
                        borderRadius: `${rhRadius.md}px`,
                        minHeight: 48,
                        px: 1.75,
                        flex: { sm: '0 0 auto' },
                        color: 'text.secondary',
                        '@media (hover: hover) and (pointer: fine)': {
                          '&:hover': { color: 'text.primary', bgcolor: alpha(theme.palette.text.primary, 0.04) },
                        },
                      })}
                    >
                      {t('landing.listVehicle')}
                    </Button>
                  </Stack>

                <Box sx={{ pt: { md: 0.5 } }}>
                  <HeroProofRow />
                </Box>

                <Box component="section" aria-labelledby="landing-trust-heading">
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="baseline"
                    flexWrap="wrap"
                    useFlexGap
                    sx={{
                      mb: { sm: 1.25 },
                      [theme.breakpoints.down('sm')]: visuallyHiddenSx,
                    }}
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
                    component="ul"
                    sx={{
                      display: { xs: 'grid', sm: 'none' },
                      gridTemplateColumns: '1fr 1fr',
                      gap: 0.75,
                      listStyle: 'none',
                      m: 0,
                      p: 0,
                    }}
                  >
                    {WHY_RENTARAH.map(({ Icon, titleKey }) => (
                      <Stack
                        key={titleKey}
                        component="li"
                        direction="row"
                        alignItems="center"
                        spacing={0.6}
                        sx={{
                          minWidth: 0,
                          pl: 1,
                          pr: 1.25,
                          py: 0.6,
                          borderRadius: `${rhRadius.pill}px`,
                          bgcolor: alpha(theme.palette.primary.main, 0.06),
                          border: '1px solid',
                          borderColor: alpha(theme.palette.primary.main, 0.12),
                        }}
                      >
                        <Icon sx={{ fontSize: 16, color: 'primary.main' }} aria-hidden />
                        <Typography
                          component="span"
                          noWrap
                          sx={{ fontWeight: 700, fontSize: '0.8125rem', lineHeight: 1.2, color: 'text.primary', minWidth: 0 }}
                        >
                          {t(titleKey)}
                        </Typography>
                      </Stack>
                    ))}
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
                    px: { xs: 2, sm: 2.25, md: 2.5 },
                    pb: { xs: 2, sm: 2.25, md: 2.5 },
                    pt: { xs: 2, sm: 2.25, md: 2.5 },
                    borderRadius: `${rhRadius.lg}px`,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    boxShadow: rhElev.elev1,
                    transition: 'box-shadow 0.25s ease, border-color 0.2s ease',
                    '@media (hover: hover)': {
                      '&:hover': {
                        boxShadow: rhElev.elev2,
                        borderColor: 'divider',
                      },
                    },
                  }}
                >
                  <Stack spacing={{ xs: 1.5, sm: 1.5, md: 1.75 }}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Box
                        sx={{
                          width: { xs: 34, sm: 38 },
                          height: { xs: 34, sm: 38 },
                          flexShrink: 0,
                          borderRadius: `${rhRadius.md}px`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          color: 'primary.main',
                        }}
                        aria-hidden
                      >
                        <DirectionsCar sx={{ fontSize: { xs: 19, sm: 21 } }} />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          variant="h6"
                          component="h2"
                          sx={{
                            fontWeight: 800,
                            letterSpacing: '-0.02em',
                            fontSize: { xs: '1.125rem', sm: '1.3rem' },
                            lineHeight: 1.2,
                          }}
                        >
                          {t('landing.findVehicle')}
                        </Typography>
                      </Box>
                    </Stack>

                    <TripVehicleTypePicker
                      value={vehicleType}
                      onChange={setVehicleType}
                      availableTypes={preview.availableTypes}
                    />

                    <Box>
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
                            ? t('landing.noCityMatch', { query: pickupAreaQuery.trim() })
                            : t('landing.startTypingCity')
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
                            elevation: 0,
                            sx: {
                              mt: 1,
                              borderRadius: `${rhRadius.md}px`,
                              border: '1px solid',
                              borderColor: 'divider',
                              boxShadow: rhElev.elev2,
                              '& .MuiAutocomplete-listbox': {
                                py: 0.5,
                                '& .MuiAutocomplete-option': {
                                  borderRadius: `${rhRadius.sm}px`,
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
                                  {t('landing.allCities')}
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
                            label={t('landing.pickupCity')}
                            placeholder={t('landing.pickupCityPlaceholder')}
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
                            inputProps={{ ...params.inputProps, 'aria-label': t('landing.pickupCity'), autoComplete: 'off' }}
                            InputLabelProps={mergePickerInputLabelProps(params.InputLabelProps)}
                          />
                        )}
                      />
                      {!loc && preview.popularAreas.length > 0 ? (
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.75}
                          sx={{
                            mt: 1,
                            overflowX: 'auto',
                            scrollbarWidth: 'none',
                            '&::-webkit-scrollbar': { display: 'none' },
                            '& > *': { flexShrink: 0 },
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mr: 0.25 }}>
                            {t('landing.popular')}
                          </Typography>
                          {preview.popularAreas.map((area) => (
                            <Chip
                              key={area}
                              label={area.split(',')[0]}
                              size="small"
                              clickable
                              onClick={() => {
                                setLoc(area)
                                setPickupAreaQuery(area)
                              }}
                              sx={{
                                height: 28,
                                fontWeight: 600,
                                fontSize: '0.8125rem',
                                borderRadius: `${rhRadius.pill}px`,
                                bgcolor: alpha(theme.palette.text.primary, 0.05),
                                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' },
                              }}
                            />
                          ))}
                        </Stack>
                      ) : null}
                    </Box>

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
                      <TripClockSummary pickup={pickup} dropoff={dropoff} compact />
                    </Stack>

                    {preview.matchCount === 0 ? (
                      <Box
                        role="status"
                        sx={{
                          px: 1.5,
                          py: 1.25,
                          borderRadius: `${rhRadius.md}px`,
                          bgcolor: alpha(theme.palette.warning.main, 0.1),
                          border: '1px solid',
                          borderColor: alpha(theme.palette.warning.main, 0.3),
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {t('landing.noMatches', { place: placeLabel || t('landing.thePhilippines') })}
                        </Typography>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 0.75 }}>
                          {vehicleType !== 'all' ? (
                            <Button size="small" onClick={() => setVehicleType('all')} sx={{ fontWeight: 700, px: 1, minHeight: 32 }}>
                              {t('landing.tryAnyType')}
                            </Button>
                          ) : null}
                          {loc ? (
                            <Button
                              size="small"
                              onClick={() => {
                                setLoc('')
                                setPickupAreaQuery('')
                              }}
                              sx={{ fontWeight: 700, px: 1, minHeight: 32 }}
                            >
                              {t('landing.tryAllPh')}
                            </Button>
                          ) : null}
                        </Stack>
                      </Box>
                    ) : null}

                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={search}
                      endIcon={<ArrowForward sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                      sx={withLandingCtaSx(
                        theme,
                        {
                          py: { xs: 1.1, sm: 1.2 },
                          minHeight: { xs: 46, sm: 48 },
                          borderRadius: `${rhRadius.md}px`,
                          fontSize: { xs: '0.9375rem', sm: '1rem' },
                          fontWeight: 800,
                        },
                        true,
                      )}
                    >
                      {preview.matchCount && preview.matchCount > 0
                        ? t(
                            placeLabel
                              ? preview.matchCount === 1
                                ? 'landing.showRidesInOne'
                                : 'landing.showRidesInOther'
                              : preview.matchCount === 1
                                ? 'landing.showRidesOne'
                                : 'landing.showRidesOther',
                            { count: preview.matchCount, place: placeLabel },
                          )
                        : placeLabel
                          ? t('landing.searchIn', { place: placeLabel })
                          : t('landing.searchAvailable')}
                    </Button>
                  </Stack>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <LandingFeaturedRides
        sectionPy={{ xs: 3, sm: landingSectionPy.sm, md: landingSectionPy.md }}
        headingMb={landingHeadingMb}
        gutters={landingGutters}
      />

      <LandingAudiencePaths
        onFindVehicle={focusTripPlanner}
        sectionPy={{ xs: 2.5, sm: landingSectionPy.sm, md: landingSectionPy.md }}
        headingMb={landingHeadingMb}
        gutters={landingGutters}
      />
    </Box>
  )
}
