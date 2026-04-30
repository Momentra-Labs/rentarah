import { Box, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { motion, useReducedMotion } from 'framer-motion'
import { useId } from 'react'

export type RentaraLoadingLogoProps = {
  freezeDecorations?: boolean
}

/**
 * Vector loading mark inspired by the RentaraH lockup: map pin with circular cutout,
 * car on the left and motorcycle on the right — animated for the splash screen only.
 */
export default function RentaraLoadingLogo({ freezeDecorations = false }: RentaraLoadingLogoProps) {
  const theme = useTheme()
  const reduceMotion = useReducedMotion()
  const isCompact = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true })
  const uid = useId().replace(/:/g, '')
  const primary = theme.palette.primary.main
  const primarySoft = alpha(theme.palette.primary.main, 0.22)

  const maskId = `rentara-pin-mask-${uid}`
  const gradId = `rentara-pin-grad-${uid}`

  const floatActive = !reduceMotion && !freezeDecorations

  /** Tighter drift on phones — reads calmer alongside URL bar motion. */
  const floatMain = isCompact
    ? { y: [0, -2.25, -1.75, -3.25, 0], rotate: [0, -0.85, 0.65, -0.45, 0] }
    : { y: [0, -4, -3, -5, 0], rotate: [0, -1.2, 0.9, -0.6, 0] }
  const floatPeriod = isCompact ? 4.8 : 4.2

  return (
    <Box
      sx={{
        width: { xs: '100%', sm: '88%' },
        maxWidth: { xs: 112, sm: 160, md: 184 },
        mx: 'auto',
        filter: `drop-shadow(0 6px 18px ${alpha(theme.palette.primary.dark, 0.12)})`,
      }}
    >
      <motion.div
        initial={floatActive ? { opacity: 0, scale: 0.92 } : false}
        animate={
          floatActive
            ? {
                opacity: 1,
                scale: 1,
                ...floatMain,
              }
            : { opacity: 1, scale: 1 }
        }
        transition={{
          opacity: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
          scale: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
          y: { duration: floatPeriod, repeat: Infinity, ease: [0.45, 0, 0.55, 1] },
          rotate: { duration: floatPeriod, repeat: Infinity, ease: [0.45, 0, 0.55, 1] },
        }}
        style={{ transformOrigin: '50% 65%' }}
      >
        <svg
          viewBox="0 0 120 148"
          width="100%"
          style={{ display: 'block', height: 'auto' }}
          aria-hidden
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.palette.primary.light} />
              <stop offset="55%" stopColor={theme.palette.primary.main} />
              <stop offset="100%" stopColor={theme.palette.primary.dark} />
            </linearGradient>
            <mask id={maskId}>
              <rect x="0" y="0" width="120" height="148" fill="white" />
              <circle cx="60" cy="56" r="19.5" fill="black" />
            </mask>
          </defs>

          <g mask={`url(#${maskId})`}>
            <path
              fill={`url(#${gradId})`}
              d="M60 13 C30 13 7 37 7 65 C7 93 60 135 60 135 C60 135 113 93 113 65 C113 37 90 13 60 13 Z"
            />
          </g>

          {/* Inner ring — gentle “breathing” */}
          <motion.circle
            cx="60"
            cy="56"
            fill="none"
            stroke={alpha(primary, 0.35)}
            strokeWidth="1.25"
            initial={{ r: 19.5, opacity: 0.35 }}
            animate={
              floatActive
                ? { r: [19.5, 21.2, 19.5], opacity: [0.35, 0.65, 0.35] }
                : { r: 19.5, opacity: 0.4 }
            }
            transition={
              floatActive
                ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0 }
            }
          />

          {/* Car — left of pin, facing right */}
          <g transform="translate(9, 62) scale(0.92)">
            <ellipse cx="11" cy="30" rx="6.5" ry="5" fill={primary} />
            <ellipse cx="41" cy="30" rx="6.5" ry="5" fill={primary} />
            <path
              fill={primary}
              d="M1.5 21 L50 21 L47 13.5 L35 8.5 H17 L5 13.5 Z"
            />
            <path
              fill={alpha(theme.palette.common.white, 0.38)}
              d="M18 9.5 H34 L40 11.5 L38 14 H20 L14 11.5 Z"
            />
          </g>

          {/* Motorcycle — right of pin */}
          <g transform="translate(71, 60) scale(0.95)">
            <circle cx="11" cy="33" r="7.5" fill={primary} />
            <circle cx="41" cy="33" r="7.5" fill={primary} />
            <path
              d="M11 33 L25 14 L41 33 M25 14 L27 6.5 L34 6.5"
              stroke={primary}
              strokeWidth="3.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <circle cx="27" cy="6.5" r="3.2" fill={primary} />
          </g>

          {/* Highlight glint on pin — slow sweep */}
          {floatActive && (
            <motion.path
              fill={alpha(theme.palette.common.white, 0.22)}
              d="M38 28 Q60 18 82 28 Q60 24 38 28"
              animate={{ opacity: [0.1, 0.5, 0.1] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {/* Soft ripples from the pin tip — drawn last so they read on the canvas */}
          {floatActive &&
            [0, 0.55, 1.1].map((delay) => (
              <motion.circle
                key={delay}
                cx="60"
                cy="135"
                fill="none"
                stroke={primarySoft}
                strokeWidth="2"
                initial={{ r: 3, opacity: 0.45 }}
                animate={{ r: 26, opacity: 0 }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  delay,
                  ease: 'easeOut',
                }}
              />
            ))}
        </svg>
      </motion.div>
    </Box>
  )
}
