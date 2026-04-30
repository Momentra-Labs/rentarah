import { Box, LinearProgress, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion, useReducedMotion } from 'framer-motion'

import LoadingRoadScene from './LoadingRoadScene'
import RentaraLoadingLogo from './RentaraLoadingLogo'

/**
 * Full-viewport splash: native-style safe areas, glass center card, thin indeterminate progress (mobile-app feel).
 */
export default function LoadingScreen() {
  const theme = useTheme()
  const reduceMotion = useReducedMotion()
  const isXs = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true })
  const primary = theme.palette.primary.main

  const surface = theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.45) : alpha('#fff', 0.78)
  const surfaceBorder = alpha(primary, theme.palette.mode === 'dark' ? 0.22 : 0.14)

  return (
    <Box
      role="status"
      aria-busy="true"
      aria-label="Loading application"
      sx={{
        position: 'relative',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        overflow: 'hidden',
        // Safe-area: avoid notch / home indicator (PWA / mobile browsers)
        paddingTop: `max(env(safe-area-inset-top, 0px), ${theme.spacing(2)})`,
        paddingBottom: `max(env(safe-area-inset-bottom, 0px), ${theme.spacing(1)})`,
        paddingLeft: `max(env(safe-area-inset-left, 0px), ${theme.spacing(2)})`,
        paddingRight: `max(env(safe-area-inset-right, 0px), ${theme.spacing(2)})`,
        background:
          theme.palette.mode === 'dark'
            ? `radial-gradient(120% 80% at 50% -10%, ${alpha(primary, 0.28)} 0%, transparent 52%),
               linear-gradient(165deg, ${theme.palette.grey[900]} 0%, ${alpha(theme.palette.grey[900], 0.94)} 40%, #070a12 100%)`
            : `radial-gradient(105% 70% at 50% -5%, ${alpha(primary, 0.2)} 0%, transparent 50%),
               linear-gradient(180deg, ${alpha(theme.palette.primary.light, 1)} 0%, ${theme.palette.grey[50]} 38%, ${alpha(theme.palette.background.default, 1)} 100%)`,
      }}
    >
      {/* Soft vignette — depth without noisy animation */}
      <Box
        aria-hidden
        sx={{
          pointerEvents: 'none',
          position: 'absolute',
          inset: 0,
          background:
            theme.palette.mode === 'dark'
              ? `radial-gradient(ellipse 85% 55% at 50% 100%, ${alpha(primary, 0.12)}, transparent 70%)`
              : `radial-gradient(ellipse 90% 50% at 50% 110%, ${alpha(primary, 0.08)}, transparent 65%)`,
        }}
      />

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: reduceMotion ? 0 : 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ width: '100%', maxWidth: 340, transformOrigin: 'center top' }}
        >
          <Stack
            alignItems="center"
            sx={{
              width: '100%',
              px: { xs: 2.25, sm: 2.75 },
              py: { xs: 3, sm: 3.75 },
              borderRadius: { xs: 4, sm: 5 },
              background: surface,
              backdropFilter: 'blur(22px)',
              WebkitBackdropFilter: 'blur(22px)',
              border: `1px solid ${surfaceBorder}`,
              boxShadow:
                theme.palette.mode === 'dark'
                  ? `0 12px 40px ${alpha(theme.palette.common.black, 0.42)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.06)}`
                  : `0 16px 48px -18px ${alpha(theme.palette.grey[900], 0.12)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.92)}`,
            }}
          >
            <RentaraLoadingLogo />

            <Typography
              component="span"
              variant="subtitle1"
              sx={{
                mt: 1.75,
                fontWeight: 800,
                fontSize: isXs ? '1.2rem' : '1.28rem',
                letterSpacing: '-0.035em',
                color: theme.palette.text.primary,
                fontFamily: theme.typography.fontFamily,
              }}
            >
              RentaraH
            </Typography>
            <Typography
              variant="caption"
              sx={{
                mt: 0.35,
                display: 'block',
                fontWeight: 600,
                fontSize: '0.68rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: alpha(theme.palette.text.secondary, 0.88),
              }}
            >
              Find your ride
            </Typography>

            <Box sx={{ width: '100%', mt: { xs: 1.75, sm: 2 }, pt: { xs: 0.75, sm: 1 } }}>
              <LoadingRoadScene />
            </Box>
          </Stack>
        </motion.div>
      </Box>

      <Box sx={{ width: '100%', mt: 1 }}>
        <LinearProgress
          variant="indeterminate"
          sx={{
            height: 3,
            borderRadius: '3px',
            bgcolor: alpha(primary, theme.palette.mode === 'dark' ? 0.15 : 0.1),
            '& .MuiLinearProgress-bar': {
              borderRadius: '3px',
              bgcolor: alpha(primary, theme.palette.mode === 'dark' ? 0.85 : 0.95),
            },
          }}
        />
        {!reduceMotion && (
          <Typography
            variant="caption"
            component="span"
            sx={{
              mt: 0.75,
              display: 'block',
              width: '100%',
              textAlign: 'center',
              fontWeight: 500,
              fontSize: '0.65rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: alpha(theme.palette.text.secondary, 0.75),
            }}
          >
            Loading
          </Typography>
        )}
      </Box>
    </Box>
  )
}
