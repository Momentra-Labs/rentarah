import { Box, Typography } from '@mui/material'
import { useCallback, useState } from 'react'

import { RENTARA_LOGO_NAV_SRC, RENTARA_LOGO_SRC } from './rentaraLogoAsset'

export type RentaraLogoMarkSize = 'sm' | 'md' | 'lg'

const HEIGHT_PX: Record<RentaraLogoMarkSize, number> = {
  /** Mobile toolbar lockup — pairs with ~1.3125rem wordmark (~reference proportions) */
  sm: 46,
  /** Desktop sidebar — icon slightly taller than cap-R vs wordmark (reference lockup) */
  md: 50,
  /** Loading screen — `md`+ breakpoint (see responsive `heightSx` for xs/sm) */
  lg: 172,
}

export type RentaraLogoMarkProps = {
  size?: RentaraLogoMarkSize
  /**
   * `mark` — compact toolbar lockup. `navLockup` — full horizontal wordmark for app bars.
   */
  variant?: 'mark' | 'navLockup'
  /** When true, shows the wordmark text if the image errors (default: true). */
  showTextFallback?: boolean
  className?: string
}

/**
 * Brand mark — vector lockup with graceful degradation to the “RentaraH” wordmark.
 */
export default function RentaraLogoMark({
  size = 'md',
  variant = 'mark',
  showTextFallback = true,
  className,
}: RentaraLogoMarkProps) {
  const [imgFailed, setImgFailed] = useState(false)

  const onError = useCallback(() => {
    setImgFailed(true)
  }, [])

  const h = HEIGHT_PX[size]
  const isNavLockup = variant === 'navLockup'
  const src = isNavLockup ? RENTARA_LOGO_NAV_SRC : RENTARA_LOGO_SRC

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
          fontFamily: '"Urbanist", "Inter", sans-serif',
          fontWeight: 700,
          letterSpacing: '-0.04em',
          fontSize: size === 'sm' ? '1.3125rem' : size === 'md' ? '1.5rem' : '3rem',
          lineHeight: 1,
          color: 'text.primary',
        }}
      >
        RentaraH
      </Typography>
    )
  }

  const heightSx = isNavLockup
    ? size === 'sm'
      ? { xs: 38, sm: 40 }
      : { xs: 40, sm: 44, md: 48 }
    : size === 'lg'
      ? {
          xs: 118,
          sm: 146,
          md: HEIGHT_PX.lg,
        }
      : h

  const maxWidthSx = isNavLockup
    ? size === 'sm'
      ? { xs: 'min(88vw, 280px)', sm: 300 }
      : { xs: 'min(90vw, 320px)', sm: 340, md: 360 }
    : size === 'lg'
      ? {
          xs: 'min(92vw, 400px)',
          sm: 448,
          md: 520,
        }
      : {
          xs: size === 'md' ? 'min(92vw, 280px)' : 'min(92vw, 200px)',
          sm: size === 'md' ? 320 : 240,
        }

  const imgSx = {
    display: 'block',
    height: heightSx,
    width: 'auto',
    maxWidth: maxWidthSx,
    objectFit: 'contain' as const,
    objectPosition: 'center center' as const,
  }

  const img = (
    <Box component="img" src={src} alt="RentaraH" data-rentara-logo onError={onError} className={className} sx={imgSx} />
  )

  if (!isNavLockup && size !== 'lg') {
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
