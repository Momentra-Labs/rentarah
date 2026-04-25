import { Box, Typography, useMediaQuery, useTheme } from '@mui/material'
import { alpha, keyframes } from '@mui/material/styles'
import { useId } from 'react'

/** Vehicles travel left → right in a seamless loop. */
const drive = keyframes`
  0% {
    transform: translateX(-40%);
  }
  100% {
    transform: translateX(420%);
  }
`

const laneScroll = keyframes`
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 48px 0;
  }
`

type VehicleProps = { scale?: number }

/** Soft blue-slate wheels so the scene doesn’t read as heavy charcoal-on-blue. */
function CarSilhouette({ scale = 1 }: VehicleProps) {
  const theme = useTheme()
  const gid = useId().replace(/:/g, '')
  const wheel = theme.palette.grey[400]
  const shadow = alpha(theme.palette.primary.dark, 0.18)

  return (
    <svg
      viewBox="0 0 72 36"
      width={46 * scale}
      height={23 * scale}
      style={{
        display: 'block',
        filter: `drop-shadow(0 2px 8px ${shadow})`,
      }}
      aria-hidden
    >
      <defs>
        <linearGradient id={`lc-${gid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={alpha(theme.palette.primary.main, 0.55)} />
          <stop offset="55%" stopColor={theme.palette.primary.main} />
          <stop offset="100%" stopColor={theme.palette.primary.dark} />
        </linearGradient>
      </defs>
      <ellipse cx="16" cy="30" rx="9" ry="5.5" fill={wheel} />
      <ellipse cx="56" cy="30" rx="9" ry="5.5" fill={wheel} />
      <path d="M6 22 L66 22 L64 16 L48 10 L26 10 L10 14 Z" fill={`url(#lc-${gid})`} />
      <path d="M28 10 L44 10 L42 6 L30 6 Z" fill={alpha(theme.palette.common.white, 0.42)} />
    </svg>
  )
}

function MotoSilhouette({ scale = 1 }: VehicleProps) {
  const theme = useTheme()
  const gid = useId().replace(/:/g, '')
  const wheel = theme.palette.grey[400]
  const strokeUrl = `url(#lm-${gid})`
  const shadow = alpha(theme.palette.primary.dark, 0.16)

  return (
    <svg
      viewBox="0 0 64 44"
      width={36 * scale}
      height={25 * scale}
      style={{
        display: 'block',
        filter: `drop-shadow(0 2px 8px ${shadow})`,
      }}
      aria-hidden
    >
      <defs>
        <linearGradient id={`lm-${gid}`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={theme.palette.primary.dark} />
          <stop offset="100%" stopColor={theme.palette.primary.main} />
        </linearGradient>
      </defs>
      <circle cx="14" cy="34" r="8" fill={wheel} />
      <circle cx="50" cy="34" r="8" fill={wheel} />
      <path
        d="M14 34 L32 14 L50 34 M32 14 L34 8 L40 8"
        stroke={strokeUrl}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="34" cy="8" r="3.5" fill={theme.palette.primary.main} />
    </svg>
  )
}

/**
 * Decorative road loop — palette tuned to stay in the primary / cool-grey family (no harsh charcoal).
 */
export default function LoadingRoadScene() {
  const theme = useTheme()
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  /** Blue-slate road: readable lanes without a “muddy” black strip */
  const roadTop = '#6B7C8E'
  const roadBottom = '#5A6A7A'
  const lane = alpha(theme.palette.common.white, 0.72)

  const vehicleMotion = (duration: number, delay: string) =>
    reduceMotion
      ? { animation: 'none', transform: 'translateX(0)' }
      : {
          animation: `${drive} ${duration}s linear infinite`,
          animationDelay: delay,
        }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: { xs: 260, sm: 300, md: 340 },
        mx: 'auto',
        mt: { xs: 1.25, sm: 1.5 },
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'relative',
          height: { xs: 92, sm: 108 },
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.12),
          boxShadow: `0 1px 3px ${alpha(theme.palette.primary.dark, 0.06)}`,
          background: `linear-gradient(175deg, 
            ${alpha(theme.palette.primary.light, 0.85)} 0%, 
            ${alpha(theme.palette.grey[50], 0.97)} 48%,
            ${alpha(theme.palette.grey[100], 0.9)} 100%)`,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bottom: '42%',
            background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.07)} 0%, transparent 92%)`,
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '42%',
            background: `linear-gradient(180deg, ${roadTop} 0%, ${roadBottom} 100%)`,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '42%',
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 20px,
              ${lane} 20px,
              ${lane} 27px
            )`,
            backgroundSize: '48px 4px',
            backgroundPosition: '0 50%',
            backgroundRepeat: 'repeat-x',
            opacity: 0.92,
            ...(reduceMotion
              ? {}
              : { animation: `${laneScroll} 1.05s linear infinite` }),
            pointerEvents: 'none',
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            left: reduceMotion ? '8%' : 0,
            bottom: 14,
            display: 'flex',
            alignItems: 'flex-end',
            ...vehicleMotion(5.2, '-1.2s'),
          }}
        >
          <CarSilhouette scale={1} />
        </Box>

        <Box
          sx={{
            position: 'absolute',
            left: reduceMotion ? '52%' : 0,
            bottom: 16,
            display: 'flex',
            alignItems: 'flex-end',
            ...vehicleMotion(7.4, '-3.5s'),
          }}
        >
          <MotoSilhouette scale={0.95} />
        </Box>

        <Box
          sx={{
            position: 'absolute',
            left: reduceMotion ? '22%' : 0,
            bottom: 42,
            opacity: 0.9,
            transform: 'scale(0.78)',
            transformOrigin: 'bottom left',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-end',
              ...vehicleMotion(9.5, '-0.8s'),
            }}
          >
            <MotoSilhouette scale={0.9} />
          </Box>
        </Box>

        <Box
          sx={{
            position: 'absolute',
            left: reduceMotion ? '68%' : 0,
            bottom: 46,
            opacity: 0.88,
            transform: 'scale(0.72)',
            transformOrigin: 'bottom left',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-end',
              ...vehicleMotion(11, '-5s'),
            }}
          >
            <CarSilhouette scale={0.85} />
          </Box>
        </Box>
      </Box>

      <Typography
        variant="caption"
        component="p"
        aria-hidden
        sx={{
          mt: 1.25,
          textAlign: 'center',
          fontWeight: 500,
          lineHeight: 1.5,
          fontSize: { xs: '0.7rem', sm: '0.75rem' },
          px: 1.5,
          maxWidth: 300,
          mx: 'auto',
          color: alpha(theme.palette.text.secondary, 0.9),
          letterSpacing: '0.02em',
        }}
      >
        Enjoy the ride — cars and bikes on the move while we finish loading.
      </Typography>
    </Box>
  )
}
