import { Stack, Typography, Box, type TypographyProps } from '@mui/material'
import type { ReactNode } from 'react'

export type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: ReactNode
  actions?: ReactNode
  titleVariant?: TypographyProps['variant']
}

export default function PageHeader({ eyebrow, title, description, actions, titleVariant = 'h4' }: PageHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', lg: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'stretch', lg: 'flex-start' }}
      spacing={2}
    >
      <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
        {eyebrow ? (
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'primary.main',
              fontSize: '0.65rem',
            }}
          >
            {eyebrow}
          </Typography>
        ) : null}
        <Typography
          variant={titleVariant}
          sx={{
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#0f172a',
            lineHeight: 1.18,
          }}
        >
          {title}
        </Typography>
        {description ? (
          <Box sx={{ typography: 'body2', color: 'text.secondary', maxWidth: 640, lineHeight: 1.65 }}>{description}</Box>
        ) : null}
      </Stack>
      {actions ? (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ flexShrink: 0, alignItems: 'flex-start' }}>
          {actions}
        </Stack>
      ) : null}
    </Stack>
  )
}
