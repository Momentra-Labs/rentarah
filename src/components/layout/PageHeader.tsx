import { Stack, Typography } from '@mui/material'

export type PageHeaderProps = {
  overline?: string
  title: string
  subtitle?: string
  /** Bottom margin scale */
  dense?: boolean
  /** Center text (e.g. marketing / onboarding) */
  align?: 'left' | 'center'
}

/** Shared page title stack (overline + h4 + subtitle) across app surfaces */
export default function PageHeader({ overline, title, subtitle, dense, align = 'left' }: PageHeaderProps) {
  return (
    <Stack
      spacing={1}
      sx={{
        mb: dense ? { xs: 2, md: 2.5 } : { xs: 3, md: 4 },
        maxWidth: subtitle ? 640 : undefined,
        mx: align === 'center' ? 'auto' : undefined,
        textAlign: align,
      }}
    >
      {overline ? (
        <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: '0.08em' }}>
          {overline}
        </Typography>
      ) : null}
      <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
          {subtitle}
        </Typography>
      ) : null}
    </Stack>
  )
}
