import { Stack, Typography } from '@mui/material'

export type PageHeaderProps = {
  overline?: string
  title: string
  subtitle?: string
  /** Bottom margin scale */
  dense?: boolean
  /** Center text (e.g. marketing / onboarding) */
  align?: 'left' | 'center'
  /**
   * `/map` desktop sidebar: tighter vertical rhythm, eyebrow `mb` + title offset so the block
   * reads clearly without extra branding above it.
   */
  variant?: 'default' | 'mapSidebar'
}

/** Shared page title stack (overline + h4 + subtitle) across app surfaces */
export default function PageHeader({
  overline,
  title,
  subtitle,
  dense,
  align = 'left',
  variant = 'default',
}: PageHeaderProps) {
  const mapSidebar = variant === 'mapSidebar'

  return (
    <Stack
      spacing={mapSidebar ? 0 : 1}
      sx={{
        mb: dense ? { xs: 2, md: 2.5 } : { xs: 3, md: 4 },
        maxWidth: subtitle ? 640 : undefined,
        mx: align === 'center' ? 'auto' : undefined,
        textAlign: align,
      }}
    >
      {overline ? (
        <Typography
          variant="overline"
          color="primary"
          sx={{
            fontWeight: 700,
            letterSpacing: mapSidebar ? '0.1em' : '0.08em',
            ...(mapSidebar ? { mb: 2, display: 'block' } : {}),
          }}
        >
          {overline}
        </Typography>
      ) : null}
      <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ lineHeight: 1.65, ...(mapSidebar ? { mt: 1 } : {}) }}
        >
          {subtitle}
        </Typography>
      ) : null}
    </Stack>
  )
}
