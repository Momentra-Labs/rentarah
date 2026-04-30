import AccountBalanceWallet from '@mui/icons-material/AccountBalanceWallet'
import CalendarMonth from '@mui/icons-material/CalendarMonth'
import DirectionsCar from '@mui/icons-material/DirectionsCar'
import StarRounded from '@mui/icons-material/StarRounded'
import {
  alpha,
  Box,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material'
import type { Theme } from '@mui/material/styles'
import type { ReactNode } from 'react'

import { softInteractiveSurface } from '../../theme/pageStyles'
import { formatPeso } from '../../utils/formatCurrency'

export interface HostEarningsSectionProps {
  totalEarned: number
  monthEarned: number
  activeBookings: number
  avgRatingLabel?: string
}

const CHART_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const
const CHART_VALUES = [48, 72, 56, 88, 64, 92, 76] as const

function metricAccent(theme: Theme, key: 'primary' | 'info' | 'neutral' | 'warning') {
  switch (key) {
    case 'info':
      return {
        fg: theme.palette.info.main,
        bg: alpha(theme.palette.info.main, theme.palette.mode === 'dark' ? 0.2 : 0.12),
        border: alpha(theme.palette.info.main, 0.35),
      }
    case 'neutral':
      return {
        fg: theme.palette.text.secondary,
        bg: alpha(theme.palette.grey[500], theme.palette.mode === 'dark' ? 0.12 : 0.08),
        border: alpha(theme.palette.divider, 1),
      }
    case 'warning':
      return {
        fg: theme.palette.warning.main,
        bg: alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.22 : 0.14),
        border: alpha(theme.palette.warning.main, 0.38),
      }
    default:
      return {
        fg: theme.palette.primary.main,
        bg: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1),
        border: alpha(theme.palette.primary.main, 0.32),
      }
  }
}

function MiniMetric({
  label,
  primary,
  secondary,
  accent,
}: {
  label: string
  primary: string
  secondary?: string
  accent: 'primary' | 'info' | 'neutral' | 'warning'
}) {
  const theme = useTheme()
  const palette = metricAccent(theme, accent)
  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 2.75,
        p: { xs: 1.85, sm: 2 },
        border: 1,
        borderColor: palette.border,
        bgcolor: palette.bg,
        boxShadow: 'none',
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.04em', color: 'text.secondary', display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="subtitle1" fontWeight={800} sx={{ mt: 0.75, letterSpacing: '-0.02em', color: palette.fg }}>
        {primary}
      </Typography>
      {secondary ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.35, display: 'block', lineHeight: 1.45 }}>
          {secondary}
        </Typography>
      ) : null}
    </Paper>
  )
}

function EarningsTrendChart() {
  const theme = useTheme()
  const max = Math.max(...CHART_VALUES)
  return (
    <Box sx={{ pt: 0.5 }}>
      <Box
        sx={{
          position: 'relative',
          height: { xs: 200, sm: 220 },
          borderRadius: 2,
          px: { xs: 0.75, sm: 1 },
          pt: { xs: 2, sm: 2.5 },
          pb: { xs: 3.75, sm: 4 },
          bgcolor:
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.common.white, 0.03)
              : alpha(theme.palette.primary.main, 0.035),
          border: 1,
          borderColor: alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.5 : 0.9),
        }}
      >
        {[0.25, 0.55, 0.85].map((pct) => (
          <Box
            key={pct}
            sx={{
              position: 'absolute',
              left: 12,
              right: 12,
              top: `calc(${pct * 100}% * 0.65 + 24px)`,
              borderBottom: '1px dashed',
              borderColor: alpha(theme.palette.divider, 0.85),
              pointerEvents: 'none',
            }}
          />
        ))}
        <Stack direction="row" alignItems="flex-end" justifyContent="space-between" sx={{ height: '100%', gap: { xs: 0.65, sm: 1 }, px: 0.35 }}>
          {CHART_VALUES.map((v, i) => (
            <Box
              key={i}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%',
                maxWidth: 56,
                mx: 'auto',
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  maxWidth: 44,
                  height: `${Math.max((v / max) * 100, 14)}%`,
                  minHeight: 18,
                  borderRadius: '10px 10px 4px 4px',
                  background: `linear-gradient(180deg, ${alpha(theme.palette.primary.light, 0.92)} 0%, ${theme.palette.primary.main} 100%)`,
                  boxShadow:
                    theme.palette.mode === 'dark'
                      ? `0 0 0 1px ${alpha(theme.palette.common.black, 0.2)}, 0 6px 16px ${alpha(theme.palette.primary.main, 0.35)}`
                      : `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.25)}, 0 8px 18px ${alpha(theme.palette.primary.main, 0.28)}`,
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  mt: 1,
                  fontWeight: 700,
                  color: 'text.secondary',
                  fontVariantNumeric: 'tabular-nums',
                  textAlign: 'center',
                  lineHeight: 1,
                  display: 'block',
                }}
              >
                {CHART_LABELS[i]}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  )
}

export default function HostEarningsSection({
  totalEarned,
  monthEarned,
  activeBookings,
  avgRatingLabel = '4.9 ★',
}: HostEarningsSectionProps) {
  const theme = useTheme()
  const hasBookings = totalEarned > 0 || activeBookings > 0

  return (
    <Stack spacing={{ xs: 2.5, md: 3 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: { xs: 3, md: 3.5 },
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          backgroundImage: `linear-gradient(155deg,
            ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.09)} 0%,
            ${alpha(theme.palette.background.paper, 1)} 42%,
            ${alpha(theme.palette.background.paper, 1)} 100%)`,
        }}
      >
        <Grid container>
          <Grid item xs={12} lg={7} sx={{ p: { xs: 2.5, sm: 3, md: 3.25 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              <AccountBalanceWallet sx={{ fontSize: 22, color: 'primary.main', opacity: 0.9 }} />
              <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.12em', color: 'text.secondary', lineHeight: 1 }}>
                HOST EARNINGS
              </Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.03em', mt: 2, fontSize: { xs: '1.65rem', sm: '2rem' } }}>
              Lifetime total
            </Typography>
            <Typography
              component="p"
              variant="h3"
              sx={{
                mt: 1,
                mb: 0,
                fontWeight: 900,
                letterSpacing: '-0.04em',
                lineHeight: 1.06,
                fontSize: { xs: '2.125rem', sm: '2.75rem' },
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatPeso(totalEarned)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.75, lineHeight: 1.65, maxWidth: 440 }}>
              {hasBookings
                ? 'Gross amounts from bookings in this demo catalog. Taxes, platform fees, and payout timing would mirror your live provider.'
                : 'When renters book your vehicles, running totals accumulate here — try accepting a reservation to populate this dashboard.'}
            </Typography>
          </Grid>
          <Grid
            item
            xs={12}
            lg={5}
            sx={{
              bgcolor: alpha(theme.palette.common.black, theme.palette.mode === 'dark' ? 0.06 : 0.02),
              borderTop: { xs: 1, lg: 0 },
              borderLeft: { lg: 1 },
              borderColor: 'divider',
              p: { xs: 2, sm: 2.5, md: 3 },
            }}
          >
            <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: '0.08em', color: 'text.secondary', display: 'block', mb: 1.5 }}>
              At a glance
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <MiniMetric label="THIS MONTH · MOCK" primary={formatPeso(monthEarned)} secondary="Illustrative cut of lifetime" accent="info" />
              </Grid>
              <Grid item xs={6}>
                <MiniMetric
                  label="ACTIVE TRIPS"
                  primary={activeBookings === 0 ? '—' : String(activeBookings)}
                  secondary="Non-cancelled bookings"
                  accent="neutral"
                />
              </Grid>
              <Grid item xs={12}>
                <MiniMetric label="RENTER SENTIMENT" primary={avgRatingLabel} secondary="Across your listings · demo aggregate" accent="warning" />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: { xs: 2.25, sm: 3 }, borderRadius: 3, ...softInteractiveSurface(theme, false) }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 0 }} justifyContent="space-between" alignItems={{ sm: 'flex-start' }}>
          <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
            <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.02em', fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
              Estimated weekly payout cadence
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6, maxWidth: 560 }}>
              Illustrative pattern only — heights are not tied to PHP amounts. Production would chart net payouts vs. bookings.
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0, color: 'text.secondary', py: { sm: 0.25 } }}>
            <CalendarMonth sx={{ fontSize: 22, opacity: 0.8 }} aria-hidden />
            <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.04em' }}>
              Last 7 days
            </Typography>
          </Stack>
        </Stack>
        <EarningsTrendChart />
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: 3,
          border: 1,
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.05 : 0.03),
        }}
      >
        <Stack spacing={1.5}>
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <DirectionsCar sx={{ fontSize: 22, color: 'primary.main' }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ letterSpacing: '-0.01em' }}>
                Coming next: payouts & statements
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.55 }}>
                Wire your payments rail to expose scheduled payouts, downloadable CSV summaries, and per-trip fee breakdown.
              </Typography>
            </Box>
          </Stack>
          <Divider sx={{ opacity: 0.6 }} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: -0.5 }}>
            <InsightRow
              icon={<StarRounded sx={{ fontSize: 18, color: 'warning.main' }} />}
              text="Trip ratings accumulate here — future host tiers could reward consistent five-star hospitality."
            />
            <InsightRow
              icon={<AccountBalanceWallet sx={{ fontSize: 18, color: 'primary.main' }} />}
              text="Connect bank transfer or e-wallet rails so net payouts can run on a fixed weekly rhythm."
            />
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  )
}

function InsightRow({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ flex: '1 1 auto', minWidth: 0 }}>
      <Box sx={{ pt: 0.15 }}>{icon}</Box>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, flex: '1 1 auto' }}>
        {text}
      </Typography>
    </Stack>
  )
}
