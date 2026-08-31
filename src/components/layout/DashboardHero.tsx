import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import type { ReactNode } from 'react'

import UserAvatar from '@/components/common/UserAvatar'
import { rhElev, rhRadius } from '@/theme/tokens'

export type DashboardHeroChip = {
  key: string
  label: string
  color?: 'default' | 'primary' | 'success' | 'warning'
  onClick?: () => void
}

export type DashboardHeroStat = {
  key: string
  label: string
  value: string
  hint?: string
}

export type DashboardHeroProps = {
  avatar?: string | null
  firstName?: string
  lastName?: string
  overline: string
  title: string
  subtitle?: string
  chips?: DashboardHeroChip[]
  stats?: DashboardHeroStat[]
  extra?: ReactNode
}

export default function DashboardHero({
  avatar,
  firstName,
  lastName,
  overline,
  title,
  subtitle,
  chips = [],
  stats = [],
  extra,
}: DashboardHeroProps) {
  const theme = useTheme()

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2.5,
        overflow: 'hidden',
        borderRadius: `${rhRadius.lg}px`,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: rhElev.elev1,
        backgroundImage: `linear-gradient(155deg,
          ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.16 : 0.08)} 0%,
          ${theme.palette.background.paper} 48%,
          ${theme.palette.background.paper} 100%)`,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 2, sm: 2.5 }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        sx={{ p: { xs: 2, sm: 2.5 } }}
      >
        <UserAvatar
          avatar={avatar}
          firstName={firstName}
          lastName={lastName}
          size={72}
          sx={{
            flexShrink: 0,
            boxShadow: `0 0 0 3px ${theme.palette.background.paper}, 0 0 0 5px ${alpha(theme.palette.primary.main, 0.28)}`,
          }}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="overline"
            color="primary"
            sx={{ fontWeight: 700, letterSpacing: '0.08em', display: 'block' }}
          >
            {overline}
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.03em',
              fontSize: { xs: '1.35rem', sm: '1.75rem' },
              lineHeight: 1.2,
              mt: 0.25,
            }}
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
              {subtitle}
            </Typography>
          ) : null}
          {chips.length > 0 ? (
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
              {chips.map((chip) => (
                <Chip
                  key={chip.key}
                  size="small"
                  label={chip.label}
                  color={chip.color ?? 'default'}
                  variant={chip.color === 'default' || !chip.color ? 'outlined' : 'filled'}
                  onClick={chip.onClick}
                  sx={{ fontWeight: 700, borderRadius: 999 }}
                />
              ))}
            </Stack>
          ) : null}
        </Box>
      </Stack>
      {stats.length > 0 ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: stats.length === 3 ? 'repeat(3, minmax(0, 1fr))' : `repeat(${Math.min(stats.length, 2)}, minmax(0, 1fr))`,
              sm: `repeat(${Math.min(stats.length, 4)}, minmax(0, 1fr))`,
            },
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          {stats.map((stat, i) => {
            const last = i === stats.length - 1
            const xsTwoCol = stats.length !== 3
            return (
              <Box
                key={stat.key}
                sx={{
                  px: { xs: 1.5, sm: 2.25 },
                  py: 1.5,
                  borderRight: {
                    xs: xsTwoCol ? ((i + 1) % 2 !== 0 ? '1px solid' : 0) : last ? 0 : '1px solid',
                    sm: last ? 0 : '1px solid',
                  },
                  borderBottom: {
                    xs: xsTwoCol && i < stats.length - 2 ? '1px solid' : 0,
                    sm: 0,
                  },
                  borderColor: 'divider',
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.03em', lineHeight: 1.25, display: 'block' }}>
                  {stat.label}
                </Typography>
                <Typography fontWeight={800} sx={{ mt: 0.35, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                  {stat.value}
                </Typography>
                {stat.hint ? (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.15, lineHeight: 1.3 }}>
                    {stat.hint}
                  </Typography>
                ) : null}
              </Box>
            )
          })}
        </Box>
      ) : null}
      {extra}
    </Paper>
  )
}
