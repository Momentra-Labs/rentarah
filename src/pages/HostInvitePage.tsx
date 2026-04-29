import ArrowForward from '@mui/icons-material/ArrowForward'
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import GroupsOutlined from '@mui/icons-material/GroupsOutlined'
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined'
import MonetizationOnOutlined from '@mui/icons-material/MonetizationOnOutlined'
import ShieldOutlined from '@mui/icons-material/ShieldOutlined'
import SpeedOutlined from '@mui/icons-material/SpeedOutlined'
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Link,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'

import PageHeader from '../components/layout/PageHeader'
import { useAuthStore } from '../store/useAuthStore'
import type { AuthLocationState } from '../types/authFlow'
import { listRowSurface, primaryCtaShadow, softShadow } from '../theme/pageStyles'

const STEPS = [
  {
    title: 'Create your account',
    body: 'Sign up and tell us you want to host. It takes a few minutes.',
  },
  {
    title: 'Add your vehicle',
    body: 'Photos, pricing, pickup address in your city — we keep the form simple.',
  },
  {
    title: 'Accept bookings',
    body: 'Travelers near you discover your listing; you confirm trips from the host dashboard.',
  },
] as const

export default function HostInvitePage() {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)

  const openAuth = (tab: AuthLocationState['authTab'], opts?: { defaultAccountRole?: AuthLocationState['defaultAccountRole'] }) => {
    navigate(`${location.pathname}${location.search}`, {
      state: {
        auth: true,
        authTab: tab ?? 'register',
        ...(opts?.defaultAccountRole !== undefined ? { defaultAccountRole: opts.defaultAccountRole } : {}),
      } satisfies AuthLocationState,
    })
  }

  const primaryLabel = !user ? 'Sign up to host' : user.isHost ? 'Open host dashboard' : 'Continue to host setup'
  const handlePrimary = () => {
    if (!user) {
      openAuth('register', { defaultAccountRole: 'host' })
      return
    }
    navigate('/host')
  }

  return (
    <Box
      component="main"
      sx={{
        bgcolor: 'background.default',
        pb: { xs: 6, md: 10 },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(165deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${theme.palette.background.default} 55%, ${alpha(theme.palette.grey[50], 1)} 100%)`,
          pt: { xs: 4, md: 6 },
          pb: { xs: 6, md: 8 },
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, position: 'relative' }}>
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip
                label="Hosts welcome"
                color="primary"
                size="small"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  borderRadius: '999px',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.dark',
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                }}
              />
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '2.75rem' },
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.12,
                  mb: 2,
                }}
              >
                List your vehicle. Earn in your area.
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: { md: '1.0625rem' }, lineHeight: 1.65, maxWidth: 520 }}>
                Rentara connects you with drivers and riders looking for cars and two-wheelers where you live — from Metro Manila to Cebu,
                Davao, and beyond. You set the price and pickup details; we keep the experience clear for everyone.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handlePrimary}
                  endIcon={<ArrowForward />}
                  sx={{
                    py: 1.35,
                    px: 2.5,
                    borderRadius: 2,
                    fontSize: '1rem',
                    ...primaryCtaShadow(theme),
                  }}
                >
                  {primaryLabel}
                </Button>
                {!user ? (
                  <Button variant="outlined" size="large" onClick={() => openAuth('login')} sx={{ py: 1.35, px: 2.5, borderRadius: 2, borderWidth: 2 }}>
                    Log in
                  </Button>
                ) : null}
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 3 },
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: alpha(theme.palette.background.paper, 0.9),
                  boxShadow: softShadow,
                }}
              >
                <Typography variant="subtitle2" color="primary" fontWeight={800} letterSpacing="0.06em" sx={{ mb: 2 }}>
                  Why host with us
                </Typography>
                <Stack spacing={2}>
                  {[
                    { icon: LocationOnOutlined, t: 'Your neighborhood', d: 'Travelers search by city and dates — your listing shows up when it fits.' },
                    { icon: MonetizationOnOutlined, t: 'You control earnings', d: 'Set a daily rate that works for you; adjust anytime from the dashboard.' },
                    { icon: GroupsOutlined, t: 'Built for trust', d: 'Profiles, reviews, and booking flows designed for both hosts and renters.' },
                  ].map(({ icon: Icon, t, d }) => (
                    <Stack key={t} direction="row" spacing={1.5} alignItems="flex-start">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                          flexShrink: 0,
                        }}
                      >
                        <Icon fontSize="small" />
                      </Box>
                      <Box>
                        <Typography fontWeight={700}>{t}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                          {d}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 6, md: 8 } }}>
        <PageHeader
          overline="Hosting"
          title="Everything you need to get started"
          subtitle="Whether you have a spare sedan or a scooter for weekend rentals, the same tools help you run your mini fleet."
          dense
          align="center"
        />
        <Grid container spacing={3} sx={{ mt: 0 }}>
          {[
            { icon: SpeedOutlined, title: 'Lightweight listing', body: 'Add specs, photos, and availability without a long onboarding.' },
            { icon: CalendarMonthOutlined, title: 'Booking calendar', body: 'See requested dates at a glance and avoid double-bookings.' },
            { icon: ShieldOutlined, title: 'Demo-ready safeguards', body: 'This build uses mock coverage — a production app would spell out insurance and support.' },
          ].map(({ icon: Icon, title, body }) => (
            <Grid item xs={12} md={4} key={title}>
              <Paper elevation={0} sx={{ p: 3, height: '100%', ...listRowSurface(theme) }}>
                <Icon sx={{ fontSize: 40, color: 'primary.main', mb: 1.5 }} />
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {body}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 7, md: 9 } }}>
        <PageHeader
          overline="Simple steps"
          title="From signup to your first booking"
          subtitle="We designed the path so you can go live quickly in your own city."
          dense
          align="center"
        />
        <Stack spacing={2.5} sx={{ maxWidth: 560, mx: 'auto' }}>
          {STEPS.map((s, i) => (
            <Paper
              key={s.title}
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                gap: 2,
                alignItems: 'flex-start',
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </Box>
              <Box>
                <Typography fontWeight={700}>{s.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                  {s.body}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Stack>

        <Paper
          elevation={0}
          sx={{
            mt: { xs: 5, md: 6 },
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            textAlign: 'center',
            border: '1px solid',
            borderColor: alpha(theme.palette.primary.main, 0.15),
            bgcolor: alpha(theme.palette.primary.main, 0.04),
          }}
        >
          <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
            Ready to host in your area?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 480, mx: 'auto', lineHeight: 1.65 }}>
            Join Rentara as a host, list your vehicle, and start earning when travelers book trips near you.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center" alignItems="center">
            <Button variant="contained" size="large" onClick={handlePrimary} endIcon={<ArrowForward />} sx={{ borderRadius: 2, ...primaryCtaShadow(theme) }}>
              {primaryLabel}
            </Button>
            <Typography component={RouterLink} to="/search" variant="body2" fontWeight={600} color="primary" sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
              Browse rentals first
            </Typography>
          </Stack>
        </Paper>

        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 4 }}>
          Questions?{' '}
          <Link href="mailto:hello@rentara.com" fontWeight={600}>
            hello@rentara.com
          </Link>
        </Typography>
      </Container>
    </Box>
  )
}
