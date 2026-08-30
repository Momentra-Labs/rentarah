import ArrowForward from '@mui/icons-material/ArrowForward'
import DirectionsCar from '@mui/icons-material/DirectionsCar'
import GarageOutlined from '@mui/icons-material/GarageOutlined'
import MapOutlined from '@mui/icons-material/MapOutlined'
import {
  Box,
  Button,
  Container,
  Grid,
  Stack,
  Typography,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Link as RouterLink } from 'react-router-dom'

import { useT } from '@/hooks/useT'
import { softShadow, softShadowHover } from '@/theme/pageStyles'

export type LandingAudiencePathsProps = {
  onFindVehicle: () => void
  sectionPy: { xs: number; sm: number; md: number }
  headingMb?: { xs: number; md: number }
  gutters?: { xs: number; sm: number }
}

type PathStep = { n: number; title: string; line: string }

type PathDef =
  | {
      key: 'renter'
      eyebrow: string
      title: string
      body: string
      steps: readonly PathStep[]
      Icon: typeof DirectionsCar
      accent: 'primary'
      primary: { label: string; onClick: () => void }
      secondary: { label: string; to: string; Icon: typeof MapOutlined }
    }
  | {
      key: 'host'
      eyebrow: string
      title: string
      body: string
      steps: readonly PathStep[]
      Icon: typeof GarageOutlined
      accent: 'neutral'
      primary: { label: string; to: string }
      secondary: { label: string; to: string; Icon: typeof GarageOutlined }
    }

/**
 * Dual-path entry for renters and hosts — primary home navigation after the hero.
 */
export default function LandingAudiencePaths({
  onFindVehicle,
  sectionPy,
  headingMb = { xs: 2.5, md: 3 },
  gutters = { xs: 2, sm: 3 },
}: LandingAudiencePathsProps) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const t = useT()

  const paths: readonly PathDef[] = [
    {
      key: 'renter',
      eyebrow: t('landing.renters'),
      title: t('landing.renterTitle'),
      body: t('landing.renterBody'),
      steps: [
        { n: 1, title: t('landing.searchStep'), line: t('landing.searchStepLine') },
        { n: 2, title: t('landing.bookStep'), line: t('landing.bookStepLine') },
        { n: 3, title: t('landing.driveStep'), line: t('landing.driveStepLine') },
      ],
      Icon: DirectionsCar,
      accent: 'primary',
      primary: { label: t('landing.searchVehicles'), onClick: onFindVehicle },
      secondary: { label: t('landing.exploreMap'), to: '/map', Icon: MapOutlined },
    },
    {
      key: 'host',
      eyebrow: t('landing.hosts'),
      title: t('landing.hostTitle'),
      body: t('landing.hostBody'),
      steps: [
        { n: 1, title: t('landing.listStep'), line: t('landing.listStepLine') },
        { n: 2, title: t('landing.acceptStep'), line: t('landing.acceptStepLine') },
        { n: 3, title: t('landing.earnStep'), line: t('landing.earnStepLine') },
      ],
      Icon: GarageOutlined,
      accent: 'neutral',
      primary: { label: t('landing.startHosting'), to: '/become-a-host' },
      secondary: { label: t('landing.seeHosting'), to: '/become-a-host', Icon: GarageOutlined },
    },
  ]

  return (
    <Box
      component="section"
      aria-labelledby="landing-paths-heading"
      sx={{
        py: sectionPy,
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="lg" sx={{ px: gutters, position: 'relative' }}>
        <Stack
          spacing={1}
          alignItems="flex-start"
          sx={{
            mb: headingMb,
            textAlign: 'left',
            maxWidth: 560,
          }}
        >
          <Typography
            variant="overline"
            sx={{
              fontWeight: 800,
              letterSpacing: '0.14em',
              fontSize: '0.6875rem',
              color: 'primary.main',
              lineHeight: 1.2,
            }}
          >
            {t('landing.getStarted')}
          </Typography>
          <Typography
            id="landing-paths-heading"
            variant="h4"
            component="h2"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.035em',
              fontSize: { xs: '1.7rem', sm: '2.25rem', md: 'clamp(2.15rem, 3.2vw, 2.65rem)' },
              lineHeight: { xs: 1.15, md: 1.08 },
              color: 'text.primary',
            }}
          >
            {t('landing.twoWays')}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              fontWeight: 500,
              lineHeight: 1.55,
              fontSize: { xs: '0.9375rem', sm: '1rem' },
              maxWidth: 440,
            }}
          >
            {t('landing.twoWaysSub')}
          </Typography>
        </Stack>

        <Grid container spacing={{ xs: 3, md: 4 }} alignItems="stretch">
          {paths.map((path, index) => {
            const Icon = path.Icon
            const isPrimaryAccent = path.accent === 'primary'
            const accentMain = isPrimaryAccent ? theme.palette.primary.main : theme.palette.text.primary

            return (
              <Grid key={path.key} item xs={12} md={6} lg={index === 0 ? 7 : 5}>
                <Box
                  component="article"
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    gap: { xs: 1.5, md: 1.75 },
                    px: { xs: 1.5, sm: 2.25, md: 2.5 },
                    pt: { xs: 1.5, sm: 2.25, md: 2.5 },
                    pb: { xs: 1.5, sm: 2.25, md: 2.5 },
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: { xs: alpha(theme.palette.divider, 0.9), sm: 'divider' },
                    borderRadius: { xs: 2.75, md: 3 },
                    boxShadow: { xs: `0 1px 0 ${alpha('#000', 0.04)}, 0 8px 24px ${alpha('#000', 0.07)}`, sm: softShadow },
                    overflow: 'hidden',
                    transition: 'box-shadow 0.25s ease, border-color 0.2s ease',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: '0 0 auto 0',
                      height: 3,
                      background: isPrimaryAccent
                        ? `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.light, 0.75)})`
                        : `linear-gradient(90deg, ${alpha(theme.palette.text.primary, 0.45)}, ${alpha(theme.palette.text.primary, 0.12)})`,
                    },
                    '@media (hover: hover)': {
                      '&:hover': {
                        boxShadow: softShadowHover,
                        borderColor: alpha(theme.palette.primary.main, 0.15),
                      },
                      '&:hover .path-cta': {
                        transform: 'translateY(-1px)',
                      },
                      '&:hover .path-arrow': {
                        transform: 'translateX(3px)',
                      },
                    },
                    '@media (prefers-reduced-motion: reduce)': {
                      '&:hover .path-cta, &:hover .path-arrow': {
                        transform: 'none',
                      },
                    },
                  }}
                >
                  <Stack direction="row" spacing={1.25} alignItems="flex-start">
                    <Box
                      sx={{
                        width: { xs: 38, sm: 42 },
                        height: { xs: 38, sm: 42 },
                        flexShrink: 0,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: isPrimaryAccent
                          ? alpha(theme.palette.primary.main, 0.1)
                          : alpha(theme.palette.text.primary, isDark ? 0.12 : 0.06),
                        color: isPrimaryAccent ? 'primary.main' : 'text.primary',
                      }}
                      aria-hidden
                    >
                      <Icon sx={{ fontSize: { xs: 20, sm: 22 } }} />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        component="p"
                        sx={{
                          m: 0,
                          fontWeight: 800,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          fontSize: '0.6875rem',
                          lineHeight: 1.2,
                          color: isPrimaryAccent ? 'primary.main' : 'text.secondary',
                        }}
                      >
                        {path.eyebrow}
                      </Typography>
                      <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                          mt: 0.4,
                          fontWeight: 800,
                          letterSpacing: '-0.025em',
                          fontSize: { xs: '1.15rem', sm: '1.3rem' },
                          lineHeight: 1.2,
                          color: 'text.primary',
                        }}
                      >
                        {path.title}
                      </Typography>
                    </Box>
                  </Stack>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      lineHeight: 1.55,
                      fontWeight: 500,
                      fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                    }}
                  >
                    {path.body}
                  </Typography>

                  <Box
                    component="ol"
                    aria-label={`${path.eyebrow} steps`}
                    sx={{
                      m: 0,
                      p: 0,
                      listStyle: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                    }}
                  >
                    {path.steps.map((step) => (
                      <Box
                        key={step.title}
                        component="li"
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1.25,
                          minWidth: 0,
                        }}
                      >
                        <Box
                          sx={{
                            width: 22,
                            height: 22,
                            mt: 0.15,
                            borderRadius: '50%',
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                            bgcolor: isPrimaryAccent
                              ? alpha(theme.palette.primary.main, 0.1)
                              : alpha(theme.palette.text.primary, 0.06),
                            color: accentMain,
                            fontSize: '0.6875rem',
                            fontWeight: 800,
                            lineHeight: 1,
                          }}
                        >
                          {step.n}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            component="span"
                            sx={{
                              display: 'block',
                              fontWeight: 800,
                              fontSize: '0.875rem',
                              letterSpacing: '-0.01em',
                              color: 'text.primary',
                            }}
                          >
                            {step.title}
                          </Typography>
                          <Typography
                            component="span"
                            sx={{
                              display: 'block',
                              mt: 0.15,
                              fontSize: '0.8125rem',
                              fontWeight: 500,
                              lineHeight: 1.4,
                              color: 'text.secondary',
                            }}
                          >
                            {step.line}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  <Stack spacing={1} sx={{ mt: 'auto', pt: 0.5 }}>
                    {path.key === 'renter' ? (
                      <Button
                        className="path-cta"
                        variant="contained"
                        size="large"
                        fullWidth
                        onClick={path.primary.onClick}
                        endIcon={<ArrowForward className="path-arrow" sx={{ transition: 'transform 0.2s ease' }} />}
                        sx={{
                          py: 1.15,
                          borderRadius: 2,
                          fontWeight: 800,
                          minHeight: 48,
                          fontSize: '0.9375rem',
                          boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.28)}`,
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        }}
                      >
                        {path.primary.label}
                      </Button>
                    ) : (
                      <Button
                        className="path-cta"
                        component={RouterLink}
                        to={path.primary.to}
                        variant="contained"
                        size="large"
                        fullWidth
                        color="inherit"
                        endIcon={<ArrowForward className="path-arrow" sx={{ transition: 'transform 0.2s ease' }} />}
                        sx={{
                          py: 1.15,
                          borderRadius: 2,
                          fontWeight: 800,
                          minHeight: 48,
                          fontSize: '0.9375rem',
                          color: 'common.white',
                          bgcolor: 'text.primary',
                          boxShadow: `0 4px 14px ${alpha(theme.palette.common.black, 0.18)}`,
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.text.primary, 0.88),
                            boxShadow: `0 6px 18px ${alpha(theme.palette.common.black, 0.22)}`,
                          },
                        }}
                      >
                        {path.primary.label}
                      </Button>
                    )}

                    <Button
                      component={RouterLink}
                      to={path.secondary.to}
                      variant="text"
                      color="primary"
                      size="medium"
                      fullWidth
                      startIcon={<path.secondary.Icon sx={{ fontSize: 18 }} />}
                      sx={{
                        fontWeight: 700,
                        minHeight: 40,
                        color: isPrimaryAccent ? 'primary.main' : 'text.secondary',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.06),
                          color: 'primary.main',
                        },
                      }}
                    >
                      {path.secondary.label}
                    </Button>
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
