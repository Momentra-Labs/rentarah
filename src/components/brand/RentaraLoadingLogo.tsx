import { Box, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useId } from 'react'

/** Static splash mark — no Framer subtree (fewer layouts on first paint). */
export default function RentaraLoadingLogo() {
  const theme = useTheme()
  const uid = useId().replace(/:/g, '')
  const primary = theme.palette.primary.main

  const maskId = `rentara-pin-mask-${uid}`
  const gradId = `rentara-pin-grad-${uid}`

  return (
    <Box
      sx={{
        width: { xs: '100%', sm: '88%' },
        maxWidth: { xs: 112, sm: 160, md: 184 },
        mx: 'auto',
        filter: `drop-shadow(0 6px 18px ${alpha(theme.palette.primary.dark, 0.12)})`,
      }}
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

        <circle cx="60" cy="56" r="19.5" fill="none" stroke={alpha(primary, 0.4)} strokeWidth="1.25" />

        <g transform="translate(9, 62) scale(0.92)">
          <ellipse cx="11" cy="30" rx="6.5" ry="5" fill={primary} />
          <ellipse cx="41" cy="30" rx="6.5" ry="5" fill={primary} />
          <path fill={primary} d="M1.5 21 L50 21 L47 13.5 L35 8.5 H17 L5 13.5 Z" />
          <path fill={alpha(theme.palette.common.white, 0.38)} d="M18 9.5 H34 L40 11.5 L38 14 H20 L14 11.5 Z" />
        </g>

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
      </svg>
    </Box>
  )
}
