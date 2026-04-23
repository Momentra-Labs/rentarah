import { Box, Typography } from '@mui/material'
import { keyframes } from '@mui/material/styles'

import RentaraLogoMark from './RentaraLogoMark'

/**
 * Single-letter bounce: quick upward move then settle.
 *
 * Animation design:
 * - Every letter runs the same keyframes and total duration (2.1s), so the loop lines up
 *   with no “jump cut” when the animation repeats.
 * - `animation-delay: i * 0.14s` offsets each letter in time, producing a left-to-right wave.
 * - Long flat tail (22% → 100%) keeps most letters still so the bounce reads sequentially,
 *   not as a jumbled chorus.
 */
const letterJump = keyframes`
  0%,
  100% {
    transform: translateY(0);
  }
  10% {
    transform: translateY(-14px);
  }
  22% {
    transform: translateY(0);
  }
`

const WORD = 'Rentara'

/**
 * Full-viewport branded loader: logo (with text fallback) plus sequential “jumping” letters.
 */
export default function LoadingScreen() {
  return (
    <Box
      role="status"
      aria-busy="true"
      aria-label="Loading"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: (t) => t.zIndex.modal + 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ mb: { xs: 0.5, sm: 0.75, md: 1 }, transition: 'opacity 0.25s ease' }}>
        <RentaraLogoMark size="lg" />
      </Box>

      <Typography
        component="div"
        sx={{
          fontFamily: '"Urbanist", "Inter", sans-serif',
          fontWeight: 700,
          fontSize: { xs: 'clamp(1.85rem, 8.5vw, 2.65rem)', md: 'clamp(2rem, 3vw, 2.75rem)' },
          letterSpacing: '-0.04em',
          color: 'text.primary',
          lineHeight: 1.05,
          mt: { xs: -0.25, sm: -0.5 },
        }}
        aria-hidden
      >
        {WORD.split('').map((letter, i) => (
          <Box
            component="span"
            key={`${i}-${letter}`}
            sx={{
              display: 'inline-block',
              animation: `${letterJump} 2.1s ease-in-out infinite`,
              // Wave: each letter starts slightly later; same period as siblings → seamless repeat
              animationDelay: `${i * 0.14}s`,
              '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
              },
            }}
          >
            {letter}
          </Box>
        ))}
      </Typography>
    </Box>
  )
}
