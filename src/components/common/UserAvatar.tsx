import { Avatar, type AvatarProps } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'
import type { SyntheticEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { initialsFromStoredAvatarField, isProfilePhotoAvatar } from '../../lib/userAvatarUtils'

export type UserAvatarProps = Omit<AvatarProps, 'children'> & {
  /** Stored user avatar: photo URL/data URL or short initials token. */
  avatar: string | undefined | null
  firstName?: string
  lastName?: string
  /** Sets width / height / font-size when omitted from `sx` */
  size?: number
}

function themedPlaceholderSx(theme: Theme): NonNullable<AvatarProps['sx']> {
  return {
    color: theme.palette.primary.contrastText,
    background: `linear-gradient(145deg,
      ${theme.palette.primary.main} 0%,
      ${alpha(theme.palette.primary.dark, theme.palette.mode === 'dark' ? 0.95 : 1)} 55%,
      ${alpha(theme.palette.primary.light, theme.palette.mode === 'dark' ? 0.45 : 0.65)} 100%)`,
    fontWeight: 700,
    textShadow: `0 1px 0 ${alpha(theme.palette.common.black, 0.12)}`,
  }
}

export default function UserAvatar({
  avatar,
  firstName = '',
  lastName = '',
  alt: altProp,
  size,
  sx,
  imgProps,
  ...rest
}: UserAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => setImgFailed(false), [avatar])

  const initials = useMemo(
    () => initialsFromStoredAvatarField(avatar, firstName, lastName),
    [avatar, firstName, lastName],
  )

  const hasPhoto = isProfilePhotoAvatar(avatar) && !imgFailed

  const onImgError = useCallback(() => setImgFailed(true), [])

  const mergedImgProps = useMemo(
    () => ({
      loading: 'lazy' as const,
      ...imgProps,
      onError: (e: SyntheticEvent<HTMLImageElement>) => {
        imgProps?.onError?.(e)
        onImgError()
      },
    }),
    [imgProps, onImgError],
  )

  const alt = altProp ?? (`${firstName} ${lastName}`.trim() || 'Profile')

  const dims =
    size != null
      ? ({
          width: size,
          height: size,
          fontSize: Math.round(size * 0.39),
        } as const)
      : null

  return (
    <Avatar
      src={hasPhoto ? (avatar ?? undefined) : undefined}
      alt={alt}
      imgProps={mergedImgProps}
      sx={[hasPhoto ? {} : themedPlaceholderSx, ...(dims ? [dims] : []), ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      {...rest}
    >
      {initials}
    </Avatar>
  )
}
