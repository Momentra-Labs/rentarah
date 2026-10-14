import ArrowForward from '@mui/icons-material/ArrowForward'
import DirectionsCar from '@mui/icons-material/DirectionsCar'
import GarageOutlined from '@mui/icons-material/GarageOutlined'
import { Box, Button, Container, Grid, Stack, Typography, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useMemo } from 'react'
import { Link as RouterLink } from 'react-router-dom'

import { useT } from '@/hooks/useT'
import { useCarsStore } from '@/store/useCarsStore'
import { withLandingCtaSx } from '@/theme/pageStyles'
import { rhElev, rhRadius } from '@/theme/tokens'
import { formatPeso } from '@/utils/formatCurrency'

export type LandingAudiencePathsProps = {
  onFindVehicle: () => void
  sectionPy: { xs: number; sm: number; md: number }
  headingMb?: { xs: number; md: number }
  gutters?: { xs: number; sm: number }
}

type PathStep = { title: string; line: string }

type PathDef = {
  key: 'renter' | 'host'
  eyebrow: string
  title: string
  body: string
  /** Real catalog figure shown on the photo — makes each path concrete. */
  stat: string | null
  image: string
  Icon: typeof DirectionsCar
  steps: readonly PathStep[]
  cta: { label: string } & ({ onClick: () => void } | { to: string })
}

const unsplash = (id: string) => `https://images.unsplash.com/${id}?w=960&h=540&fit=crop&q=75`

/**
 * Dual-path entry for renters and hosts — one photo-led card each, one action each.
 */
export default function LandingAudiencePaths({
  onFindVehicle,
  sectionPy,
  headingMb = { xs: 2.5, md: 3 },
  gutters = { xs: 2, sm: 3 },
}: LandingAudiencePathsProps) {
  const theme = useTheme()
  const t = useT()
  const cars = useCarsStore((s) => s.cars)

  const priceRange = useMemo(() => {
    const prices = cars.map((c) => c.pricePerDay).filter((p) => Number.isFinite(p) && p > 0)
    return prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null
  }, [cars])

  const paths: readonly PathDef[] = [
    {
      key: 'renter',
      eyebrow: t('landing.renters'),
      title: t('landing.renterTitle'),
      body: t('landing.renterBody'),
      stat: priceRange ? t('landing.renterStat', { price: formatPeso(priceRange.min) }) : null,
      image: unsplash('photo-1556189250-72ba954cfc2b'),
      Icon: DirectionsCar,
      steps: [
        { title: t('landing.searchStep'), line: t('landing.searchStepLine') },
        { title: t('landing.bookStep'), line: t('landing.bookStepLine') },
        { title: t('landing.driveStep'), line: t('landing.driveStepLine') },
      ],
      cta: { label: t('landing.searchVehicles'), onClick: onFindVehicle },
    },
    {
      key: 'host',
      eyebrow: t('landing.hosts'),
      title: t('landing.hostTitle'),
      body: t('landing.hostBody'),
      stat: priceRange
        ? t('landing.hostStat', { min: formatPeso(priceRange.min), max: formatPeso(priceRange.max) })
        : null,
      image: unsplash('photo-1621007947382-bb3c3994e3fb'),
      Icon: GarageOutlined,
      steps: [
        { title: t('landing.listStep'), line: t('landing.listStepLine') },
        { title: t('landing.acceptStep'), line: t('landing.acceptStepLine') },
        { title: t('landing.earnStep'), line: t('landing.earnStepLine') },
      ],
      cta: { label: t('landing.startHosting'), to: '/become-a-host' },
    },
  ]

  return (
    <Box component="section" aria-labelledby="landing-paths-heading" sx={{ py: sectionPy, bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ px: gutters }}>
        <Stack spacing={0.75} sx={{ mb: headingMb, maxWidth: 560 }}>
          <Typography
            variant="overline"
            sx={{ fontWeight: 800, letterSpacing: '0.14em', fontSize: '0.6875rem', color: 'primary.main', lineHeight: 1.2 }}
          >
            {t('landing.getStarted')}
          </Typography>
          <Typography
            id="landing-paths-heading"
            component="h2"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.035em',
              // Matches the “Popular rides” heading — section titles shouldn't rival the hero h1.
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' },
              lineHeight: 1.12,
              color: 'text.primary',
              textWrap: 'balance',
            }}
          >
            {t('landing.twoWays')}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontWeight: 500, lineHeight: 1.55, fontSize: { xs: '0.9375rem', sm: '1rem' } }}
          >
            {t('landing.twoWaysSub')}
          </Typography>
        </Stack>

        <Grid container spacing={{ xs: 2.5, md: 3 }} alignItems="stretch">
          {paths.map((path) => {
            const isRenter = path.key === 'renter'
            const accent = isRenter ? theme.palette.primary.main : theme.palette.text.primary
            const Icon = path.Icon

            const ctaSx = withLandingCtaSx(
              theme,
              {
                alignSelf: { xs: 'stretch', sm: 'flex-start' },
                px: 2.5,
                minHeight: 48,
                borderRadius: `${rhRadius.md}px`,
                fontWeight: 800,
                fontSize: '0.9375rem',
                ...(isRenter
                  ? {}
                  : {
                      color: 'background.paper',
                      bgcolor: 'text.primary',
                      '@media (hover: hover) and (pointer: fine)': {
                        '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.86) },
                      },
                    }),
              },
              isRenter,
            )

            return (
              <Grid key={path.key} item xs={12} md={6}>
                <Box
                  component="article"
                  aria-labelledby={`landing-path-${path.key}`}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: `${rhRadius.lg}px`,
                    boxShadow: rhElev.elev1,
                    overflow: 'hidden',
                    transition: 'box-shadow 0.25s ease',
                    '@media (hover: hover)': {
                      '&:hover': { boxShadow: rhElev.elev2 },
                      '&:hover .path-photo': { transform: 'scale(1.03)' },
                    },
                  }}
                >
                  {/* Photo header with audience tag + real price figure */}
                  <Box sx={{ position: 'relative', height: { xs: 150, sm: 180 }, overflow: 'hidden', bgcolor: 'grey.200' }}>
                    <Box
                      component="img"
                      className="path-photo"
                      src={path.image}
                      alt=""
                      loading="lazy"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        transition: 'transform 0.5s ease',
                      }}
                    />
                    <Box
                      aria-hidden
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, rgba(10,14,25,0.05) 30%, rgba(10,14,25,0.72) 100%)',
                      }}
                    />
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.75}
                      sx={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        pl: 0.75,
                        pr: 1.25,
                        py: 0.5,
                        borderRadius: `${rhRadius.pill}px`,
                        bgcolor: alpha(theme.palette.common.white, 0.94),
                        boxShadow: '0 1px 6px rgba(15,23,42,0.16)',
                      }}
                    >
                      <Icon sx={{ fontSize: 16, color: accent }} aria-hidden />
                      <Typography
                        component="span"
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.6875rem',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: isRenter ? 'primary.main' : 'grey.900',
                        }}
                      >
                        {path.eyebrow}
                      </Typography>
                    </Stack>
                    {path.stat ? (
                      <Typography
                        sx={{
                          position: 'absolute',
                          left: 16,
                          right: 16,
                          bottom: 12,
                          color: 'common.white',
                          fontWeight: 800,
                          fontSize: { xs: '1rem', sm: '1.0625rem' },
                          letterSpacing: '-0.01em',
                          textShadow: '0 1px 8px rgba(0,0,0,0.35)',
                        }}
                      >
                        {path.stat}
                      </Typography>
                    ) : null}
                  </Box>

                  <Stack useFlexGap spacing={{ xs: 2.25, sm: 2.5 }} sx={{ p: { xs: 2, sm: 2.5 }, flex: 1 }}>
                    <Box>
                      <Typography
                        id={`landing-path-${path.key}`}
                        component="h3"
                        sx={{
                          fontWeight: 800,
                          letterSpacing: '-0.025em',
                          fontSize: { xs: '1.2rem', sm: '1.35rem' },
                          lineHeight: 1.2,
                        }}
                      >
                        {path.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.75, lineHeight: 1.55, fontWeight: 500, fontSize: { xs: '0.875rem', sm: '0.9375rem' } }}
                      >
                        {path.body}
                      </Typography>
                    </Box>

                    {/* Horizontal 3-step strip with a connector line behind the numbers */}
                    <Box
                      component="ol"
                      aria-label={t('landing.stepsAria', { who: path.eyebrow })}
                      sx={{
                        m: 0,
                        p: 0,
                        listStyle: 'none',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                        gap: 1.5,
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 13,
                          left: 14,
                          right: 14,
                          height: '2px',
                          borderRadius: 1,
                          bgcolor: alpha(accent, 0.14),
                        },
                      }}
                    >
                      {path.steps.map((step, i) => (
                        <Box
                          key={step.title}
                          component="li"
                          sx={{
                            position: 'relative',
                            minWidth: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: i === 0 ? 'flex-start' : i === path.steps.length - 1 ? 'flex-end' : 'center',
                            textAlign: i === 0 ? 'left' : i === path.steps.length - 1 ? 'right' : 'center',
                          }}
                        >
                          <Box
                            aria-hidden
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              display: 'grid',
                              placeItems: 'center',
                              position: 'relative',
                              bgcolor: i === 0 ? accent : 'background.paper',
                              color: i === 0 ? 'background.paper' : accent,
                              border: '2px solid',
                              borderColor: i === 0 ? accent : alpha(accent, 0.3),
                              fontSize: '0.75rem',
                              fontWeight: 800,
                            }}
                          >
                            {i + 1}
                          </Box>
                          <Typography sx={{ mt: 1, fontWeight: 800, fontSize: '0.875rem', lineHeight: 1.25 }}>
                            {step.title}
                          </Typography>
                          <Typography
                            sx={{ mt: 0.25, fontSize: '0.8125rem', fontWeight: 500, lineHeight: 1.35, color: 'text.secondary' }}
                          >
                            {step.line}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column' }}>
                      {'onClick' in path.cta ? (
                        <Button variant="contained" size="large" onClick={path.cta.onClick} endIcon={<ArrowForward />} sx={ctaSx}>
                          {path.cta.label}
                        </Button>
                      ) : (
                        <Button
                          component={RouterLink}
                          to={path.cta.to}
                          variant="contained"
                          size="large"
                          color="inherit"
                          endIcon={<ArrowForward />}
                          sx={ctaSx}
                        >
                          {path.cta.label}
                        </Button>
                      )}
                    </Box>
                  </Stack>
                </Box>
              </Grid>
            )
          })}
        </Grid>
      </Container>
    </Box>
  )
}
