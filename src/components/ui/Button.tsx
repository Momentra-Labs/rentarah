import MuiButton, { type ButtonProps as MuiButtonProps } from '@mui/material/Button'
import { forwardRef } from 'react'

import { primaryCtaShadow } from '@/theme/pageStyles'

export type ButtonProps = MuiButtonProps & {
  /** Apply elevated primary CTA shadow (contained primary only). */
  cta?: boolean
}

/** Thin MUI Button wrapper with optional marketplace CTA elevation. */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { cta = false, sx, variant = 'contained', color = 'primary', ...rest },
  ref,
) {
  const elevate = cta && variant === 'contained' && color === 'primary'
  return (
    <MuiButton
      ref={ref}
      variant={variant}
      color={color}
      sx={elevate ? [(theme) => primaryCtaShadow(theme), ...(Array.isArray(sx) ? sx : sx ? [sx] : [])] : sx}
      {...rest}
    />
  )
})

export default Button
