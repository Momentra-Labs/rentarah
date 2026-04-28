import { Box, type BoxProps } from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { VehicleType } from '../../types'
import { resolveVehicleImagePlaceholder } from '../../utils/vehicleImagePlaceholders'

type VehicleHeroImageProps = {
  src: string | null | undefined
  vehicleType: VehicleType
  /** Same as {@link Car.type} — body / segment label (e.g. SUV, Naked). */
  bodySegment?: string | null
  alt?: string
} & Omit<BoxProps<'img'>, 'component' | 'src' | 'alt'>

/**
 * Listing hero with load failure fallback to a category-appropriate stock image.
 */
export default function VehicleHeroImage({
  src,
  vehicleType,
  bodySegment,
  alt = '',
  onError,
  sx,
  ...rest
}: VehicleHeroImageProps) {
  const placeholder = useMemo(
    () => resolveVehicleImagePlaceholder(vehicleType, bodySegment),
    [vehicleType, bodySegment],
  )
  const [usePlaceholder, setUsePlaceholder] = useState(!src?.trim())

  useEffect(() => {
    setUsePlaceholder(!src?.trim())
  }, [src])

  const effectiveSrc = usePlaceholder ? placeholder : (src?.trim() || placeholder)

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setUsePlaceholder(true)
      onError?.(e)
    },
    [onError],
  )

  return (
    <Box
      component="img"
      src={effectiveSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={handleError}
      sx={{ display: 'block', ...sx }}
      {...rest}
    />
  )
}
