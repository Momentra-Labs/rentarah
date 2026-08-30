import DirectionsCar from '@mui/icons-material/DirectionsCar'
import { Button, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

import { useT } from '@/hooks/useT'

export interface EmptyStateProps {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  icon?: ReactNode
}

/** Shared empty-state composition for browse, notifications, and feature pages. */
export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  icon,
}: EmptyStateProps) {
  const t = useT()
  const resolvedTitle = title ?? t('empty.nothing')
  return (
    <Stack alignItems="center" spacing={2} py={8} px={2} role="status" aria-live="polite">
      {icon ?? <DirectionsCar sx={{ fontSize: 56, color: 'grey.300' }} aria-hidden />}
      <Typography variant="h6" component="p" fontWeight={700}>
        {resolvedTitle}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={360}>
          {description}
        </Typography>
      )}
      {(actionLabel && onAction) || (secondaryActionLabel && onSecondaryAction) ? (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
          {actionLabel && onAction && (
            <Button variant="contained" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outlined" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </Stack>
      ) : null}
    </Stack>
  )
}
