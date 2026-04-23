import { Box, Typography } from '@mui/material'
import { useCallback, useState } from 'react'

import { RENTARA_LOGO_SRC } from './rentaraLogoAsset'

export type RentaraLogoMarkSize = 'sm' | 'md' | 'lg'

const HEIGHT_PX: Record<RentaraLogoMarkSize, number> = {
  /** Mobile bar: tall enough to balance the h6 wordmark (~20px) without feeling tiny */
  sm: 42,
  /** Desktop sidebar header */
  md: 48,
  lg: 64,
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
          fontSize: size === 'sm' ? '1.1rem' : size === 'md' ? '1.25rem' : '1.75rem',
          lineHeight: 1,
          color: 'text.primary',
        }}
      >
        Rentara
      </Typography>
    )
  }

  return (
    <Box
      component="img"
      src={RENTARA_LOGO_SRC}
      alt="Rentara"
      data-rentara-logo
      onError={onError}
      className={className}
      sx={{
        display: 'block',
        height: h,
        width: 'auto',
        maxWidth: { xs: size === 'lg' ? 220 : 120, sm: size === 'lg' ? 260 : 140 },
        objectFit: 'contain',
        objectPosition: 'left center',
      }}
    />
  )
}
