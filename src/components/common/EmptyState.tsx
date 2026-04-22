import DirectionsCar from '@mui/icons-material/DirectionsCar'
import { Button, Stack, Typography } from '@mui/material'

interface EmptyStateProps {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({
  title = 'Nothing here yet',
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Stack alignItems="center" spacing={2} py={8} px={2}>
      <DirectionsCar sx={{ fontSize: 56, color: 'grey.300' }} />
      <Typography variant="h6">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={360}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Stack>
  )
}
