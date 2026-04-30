import { Box, Typography, useMediaQuery, useTheme } from '@mui/material'
import { alpha, keyframes } from '@mui/material/styles'
import type { SxProps, Theme } from '@mui/material/styles'
import { useId } from 'react'

/** Near lane: left → right (same as traffic flow). */
const driveLtr = keyframes`
  0% {
    transform: translate3d(-35%, 0, 0);
  }
  100% {
    transform: translate3d(380%, 0, 0);
  }
`

/** Far lane: right → left — oncoming traffic meeting the near lane. */
const driveRtl = keyframes`
  0% {
    transform: translate3d(380%, 0, 0);
  }
  100% {
    transform: translate3d(-35%, 0, 0);
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

/**
 * Compact sedan side view (facing right): wheels, glazing, hood, and trunk read as a small car icon.
 */
function CarIconSide({ scale = 1 }: VehicleProps) {
  const theme = useTheme()
  const gid = useId().replace(/:/g, '')
  const bodyGrad = `url(#car-body-${gid})`
  const glass = alpha(theme.palette.common.white, theme.palette.mode === 'dark' ? 0.2 : 0.45)
  const tire = alpha(theme.palette.grey[800], 0.92)
  const rim = alpha(theme.palette.grey[400], 0.95)
  const shadow = alpha(theme.palette.primary.dark, 0.2)
  const head = alpha(theme.palette.warning.light ?? '#FBBF24', 0.9)

  return (
    <svg
      viewBox="0 0 112 42"
      width={54 * scale}
      height={20 * scale}
      style={{
        display: 'block',
        filter: `drop-shadow(0 2px 5px ${shadow})`,
      }}
      aria-hidden
    >
      <defs>
        <linearGradient id={`car-body-${gid}`} x1="0%" y1="50%" x2="100%" y2="70%">
          <stop offset="0%" stopColor={alpha(theme.palette.primary.main, 0.75)} />
          <stop offset="45%" stopColor={theme.palette.primary.main} />
          <stop offset="100%" stopColor={theme.palette.primary.dark} />
        </linearGradient>
      </defs>

      {/* Rear wheel */}
      <circle cx="24" cy="29" r="8.5" fill={tire} />
      <circle cx="24" cy="29" r="5" fill={rim} />
      <circle cx="24" cy="29" r="2" fill={alpha(theme.palette.grey[700], 0.35)} />

      {/* Front wheel */}
      <circle cx="82" cy="29" r="8.5" fill={tire} />
      <circle cx="82" cy="29" r="5" fill={rim} />
      <circle cx="82" cy="29" r="2" fill={alpha(theme.palette.grey[700], 0.35)} />

      {/* Rocker / sill */}
      <path
        d="M14 29 L96 29 L93 31 L17 31 Z"
        fill={alpha(theme.palette.common.black, 0.38)}
      />

      {/* Hood + windshield + roof + cabin + trunk (sedan silhouette) */}
      <path
        fill={bodyGrad}
        d="M22 29 L21 26 L24 21 L42 17 L76 17 L93 21 L98 27 L96 29 L22 29 Z"
      />
      <path fill={glass} d="M44 17.8 L71 17.8 L73 21 L42 21 Z" />
      <path
        fill={alpha(theme.palette.common.black, 0.12)}
        d="M24 26 L93 26 L92 27 L25 27 Z"
      />

      {/* Bumper highlights */}
      <path
        fill={alpha(theme.palette.common.white, 0.15)}
        d="M93 26 L96 26 L94 27.8 L93 27 Z"
      />
      <ellipse cx="100" cy="24" rx="2.8" ry="2" fill={head} opacity={0.85} />
    </svg>
  )
}

/**
 * Sport-standard motorcycle side view (facing right): fork, tank, seat, twin wheels.
 */
function MotorcycleIconSide({ scale = 1 }: VehicleProps) {
  const theme = useTheme()
  const gid = useId().replace(/:/g, '')
  const bodyGrad = `url(#moto-body-${gid})`
  const tire = alpha(theme.palette.grey[800], 0.92)
  const rim = alpha(theme.palette.grey[500], 0.55)
  const shadow = alpha(theme.palette.primary.dark, 0.18)
  const chrome = alpha(theme.palette.grey[300], 0.6)

  return (
    <svg
      viewBox="0 0 106 52"
      width={52 * scale}
      height={25 * scale}
      style={{
        display: 'block',
        filter: `drop-shadow(0 2px 5px ${shadow})`,
      }}
      aria-hidden
    >
      <defs>
        <linearGradient id={`moto-body-${gid}`} x1="0%" y1="0%" x2="100%" y2="80%">
          <stop offset="0%" stopColor={theme.palette.primary.light} />
          <stop offset="55%" stopColor={theme.palette.primary.main} />
          <stop offset="100%" stopColor={theme.palette.primary.dark} />
        </linearGradient>
        <linearGradient id={`moto-frame-${gid}`} x1="0%" y1="100%" x2="90%" y2="0%">
          <stop offset="0%" stopColor={theme.palette.primary.dark} />
          <stop offset="100%" stopColor={theme.palette.primary.main} />
        </linearGradient>
      </defs>

      {/* Swingarm & chain area */}
      <path
        d="M22 38 L52 34 L74 38"
        stroke={alpha(theme.palette.grey[900], 0.5)}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Frame spine */}
      <path
        d="M52 34 L62 21 L74 38"
        stroke={`url(#moto-frame-${gid})`}
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Engine / crankcase */}
      <ellipse cx="56" cy="33" rx="14" ry="8" fill={alpha(theme.palette.primary.dark, 0.92)} />

      {/* Fuel tank */}
      <path
        fill={bodyGrad}
        d="M58 20 Q52 17 56 13 Q64 11 71 17 L69 21 Q61 18 58 20 Z"
      />

      {/* Seat */}
      <path
        fill={alpha(theme.palette.grey[900], 0.82)}
        d="M40 21 L54 21 L52 25 L37 26 Z"
      />

      {/* Front fork + telescope */}
      <path
        d="M71 17 L82 37"
        stroke={chrome}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M78 37 L82 37" stroke={chrome} strokeWidth="5" strokeLinecap="round" />

      {/* Handlebar stub */}
      <path
        d="M71 17 L66 13"
        stroke={alpha(theme.palette.grey[900], 0.7)}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Headlight */}
      <circle cx="88" cy="14" r="4.5" fill={alpha(theme.palette.common.white, 0.85)} opacity={0.95} />
      <circle cx="89" cy="14" r="2" fill={alpha(theme.palette.primary.light, 0.4)} />

      {/* Front fender */}
      <path
        fill={alpha(theme.palette.primary.dark, 0.82)}
        d="M76 37 Q84 31 94 37 L94 40 Q84 36 76 39 Z"
      />

      {/* Wheels on top — reads more like a parked side profile */}
      <circle cx="22" cy="38" r="11" fill={tire} />
      <circle cx="22" cy="38" r="6.5" fill={rim} />
      <circle cx="86" cy="38" r="11" fill={tire} />
      <circle cx="86" cy="38" r="6.5" fill={rim} />
    </svg>
  )
}

function LaneVehicle({
  reduceMotion,
  durationSec,
  delaySec,
  sx,
  scale = 1,
  dir,
  variant,
}: {
  reduceMotion: boolean
  durationSec: number
  delaySec: number
  sx: SxProps<Theme>
  scale?: number
  dir: 'ltr' | 'rtl'
  variant: 'car' | 'moto'
}) {
  const kf = dir === 'ltr' ? driveLtr : driveRtl

  /** Static spread when reduced motion — reads as queued traffic in both lanes. */
  const staticLeftBySlot = `${[8, 28, 48, 70, 40, 60][Math.min(5, Math.floor(Math.abs(delaySec + 47) * 3) % 6)]}%`

  const Node = variant === 'car' ? CarIconSide : MotorcycleIconSide

  return (
    <Box
      sx={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'flex-end',
        ...(reduceMotion
          ? { left: staticLeftBySlot }
          : {
              left: 0,
              animation: `${kf} ${durationSec}s linear infinite`,
              animationDelay: `${delaySec}s`,
            }),
        ...sx,
      }}
    >
      {/* Mirror RTL so headlights face into the direction of travel (toward-centre lane). */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', transform: dir === 'rtl' ? 'scaleX(-1)' : 'none' }}>
        <Node scale={scale} />
      </Box>
    </Box>
  )
}

/**
 * Decorative two-lane road: near traffic LTR, far lane RTL (meeting procession), clearer car & bike silhouettes.
 */
export default function LoadingRoadScene({ freezeDecorations = false }: { freezeDecorations?: boolean }) {
  const theme = useTheme()
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const motionOff = reduceMotion || freezeDecorations
  /** Blue-slate road */
  const roadTop = '#6B7C8E'
  const roadBottom = '#5A6A7A'
  const lane = alpha(theme.palette.common.white, 0.72)

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
          height: { xs: 96, sm: 112 },
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.12),
          boxShadow: `0 1px 3px ${alpha(theme.palette.primary.dark, 0.06)}`,
          background:
            theme.palette.mode === 'dark'
              ? `linear-gradient(175deg, 
            ${alpha(theme.palette.primary.dark, 0.35)} 0%, 
            ${alpha(theme.palette.grey[800], 0.95)} 48%,
            ${alpha(theme.palette.grey[900], 0.88)} 100%)`
              : `linear-gradient(175deg, 
            ${alpha(theme.palette.primary.light, 0.88)} 0%, 
            ${alpha(theme.palette.grey[50], 0.98)} 48%,
            ${alpha(theme.palette.grey[100], 0.92)} 100%)`,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bottom: '44%',
            background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.07)} 0%, transparent 92%)`,
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '44%',
            background: `linear-gradient(180deg, ${roadTop} 0%, ${roadBottom} 100%)`,
          }}
        />

        {/* Dash center line between opposing lanes */}
        <Box
          sx={{
            position: 'absolute',
            left: '5%',
            right: '5%',
            bottom: '22%',
            height: 0,
            borderTop: `2px dashed ${alpha('#FACC15', 0.72)}`,
            opacity: 0.95,
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '44%',
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 20px,
              ${lane} 20px,
              ${lane} 27px
            )`,
            backgroundSize: '48px 4px',
            backgroundPosition: '0 62%',
            backgroundRepeat: 'repeat-x',
            opacity: 0.88,
            ...(motionOff
              ? {}
              : { animation: `${laneScroll} 1.05s linear infinite` }),
            pointerEvents: 'none',
          }}
        />

        {/* Far lane — RTL oncoming procession (mirror faces travel direction) */}
        <LaneVehicle
          reduceMotion={motionOff}
          dir="rtl"
          variant="car"
          durationSec={7.6}
          delaySec={-2.4}
          scale={0.9}
          sx={{ bottom: { xs: 25, sm: 29 }, opacity: 0.94 }}
        />
        <LaneVehicle
          reduceMotion={motionOff}
          dir="rtl"
          variant="moto"
          durationSec={9.2}
          delaySec={-0.85}
          scale={0.86}
          sx={{ bottom: { xs: 25, sm: 29 }, opacity: 0.92 }}
        />
        <LaneVehicle
          reduceMotion={motionOff}
          dir="rtl"
          variant="car"
          durationSec={11.8}
          delaySec={-6.4}
          scale={0.82}
          sx={{ bottom: { xs: 28, sm: 32 }, opacity: 0.88 }}
        />

        {/* Near lane — LTR curb procession */}
        <LaneVehicle
          reduceMotion={motionOff}
          dir="ltr"
          variant="moto"
          durationSec={5.85}
          delaySec={-1.95}
          scale={1}
          sx={{ bottom: { xs: 8, sm: 10 }, opacity: 1 }}
        />
        <LaneVehicle
          reduceMotion={motionOff}
          dir="ltr"
          variant="car"
          durationSec={8.05}
          delaySec={-4.25}
          scale={0.96}
          sx={{ bottom: { xs: 8, sm: 10 }, opacity: 1 }}
        />
        <LaneVehicle
          reduceMotion={motionOff}
          dir="ltr"
          variant="moto"
          durationSec={10.9}
          delaySec={-8.05}
          scale={0.9}
          sx={{ bottom: { xs: 8, sm: 10 }, opacity: 0.97 }}
        />
      </Box>

      <Typography
        variant="caption"
        component="p"
        aria-hidden
        sx={{
          mt: 1,
          textAlign: 'center',
          fontWeight: 600,
          lineHeight: 1.45,
          fontSize: { xs: '0.68rem', sm: '0.72rem' },
          px: 1,
          maxWidth: 280,
          mx: 'auto',
          color: alpha(theme.palette.text.secondary, 0.82),
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        Preparing your marketplace
      </Typography>
    </Box>
  )
}
