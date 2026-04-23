import { Box, Typography } from '@mui/material'
import { useCallback, useState } from 'react'

import { RENTARA_LOGO_SRC } from './rentaraLogoAsset'

export type RentaraLogoMarkSize = 'sm' | 'md' | 'lg'

const HEIGHT_PX: Record<RentaraLogoMarkSize, number> = {
  /** Mobile `Toolbar` (56px) — icon slightly taller than word cap height */
  sm: 48,
  /** Desktop sidebar row (64px, matches main `Toolbar`) — prominent mark like reference */
  md: 52,
  /** Loading screen — `md`+ breakpoint (see responsive `heightSx` for xs/sm) */
  lg: 172,
}

export type RentaraLogoMarkProps = {
  size?: RentaraLogoMarkSize
  /** When true, shows the wordmark text if the image errors (default: true). */
  showTextFallback?: boolean
  className?: string
}

/**
 * Brand mark: SVG (embedded raster) with graceful degradation to the “Rentara” wordmark.
 */
export default function RentaraLogoMark({ size = 'md', showTextFallback = true, className }: RentaraLogoMarkProps) {
  const [imgFailed, setImgFailed] = useState(false)

  const onError = useCallback(() => {
    setImgFailed(true)
  }, [])

  const h = HEIGHT_PX[size]

  if (imgFailed && !showTextFallback) {
    return null
  }

  if (imgFailed && showTextFallback) {
    return (
      <Typography
        component="span"
        data-rentara-logo
        className={className}
        sx={{
          display: 'inline-block',
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          fontSize: size === 'sm' ? '1.2rem' : size === 'md' ? '1.35rem' : '3rem',
          lineHeight: 1,
          color: 'text.primary',
        }}
      >
        Rentara
      </Typography>
    )
  }

  const heightSx =
    size === 'lg'
      ? {
          xs: 118,
          sm: 146,
          md: HEIGHT_PX.lg,
        }
      : h

  const maxWidthSx =
    size === 'lg'
      ? {
          xs: 'min(92vw, 400px)',
          sm: 448,
          md: 520,
        }
      : {
          xs: size === 'md' ? 200 : 150,
          sm: size === 'md' ? 220 : 170,
        }

  const imgSx = {
    display: 'block',
    height: heightSx,
    width: 'auto',
    maxWidth: maxWidthSx,
    objectFit: 'contain' as const,
    // Center glyph in the asset canvas so it lines up with the wordmark when paired in a flex row
    objectPosition: 'center center' as const,
  }

  const img = (
    <Box component="img" src={RENTARA_LOGO_SRC} alt="Rentara" data-rentara-logo onError={onError} className={className} sx={imgSx} />
  )

  if (size !== 'lg') {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          flexShrink: 0,
          lineHeight: 0,
        }}
      >
        {img}
      </Box>
    )
  }

  return img
}
