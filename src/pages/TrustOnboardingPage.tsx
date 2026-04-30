import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  FormHelperText,
  Link as MUILink,
  Stack,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useCallback, useMemo, useState } from 'react'
import { Link as RouterLink, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { reloadFirebaseCurrentUserVerified, sendFirebaseEmailVerification } from '../lib/firebaseGoogle'
import { isAuthProfileComplete } from '../lib/authProfile'
import {
  canProceedToBookingCheckout,
  isEmailVerificationReady,
  isIdentityVerificationApproved,
  isLegalAndSafetyOnboardingComplete,
  wantsHostTrust,
} from '../lib/trustOnboarding'
import { useAuthStore } from '../store/useAuthStore'
import { useBookingStore } from '../store/useBookingStore'
import { useCarsStore } from '../store/useCarsStore'
import { useSearchStore } from '../store/useSearchStore'
import { useSnackbarStore } from '../store/useSnackbarStore'
import type { TrustOnboardingLocationState } from '../types/authFlow'
import PageHeader from '../components/layout/PageHeader'
import { containerGutters, primaryCtaShadow } from '../theme/pageStyles'

export default function TrustOnboardingPage() {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const st = location.state as TrustOnboardingLocationState | undefined

  const user = useAuthStore((s) => s.user)
  const authProvider = useAuthStore((s) => s.authProvider)
  const updateProfile = useAuthStore((s) => s.updateProfile)

  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  const wantsHost = useMemo(() => wantsHostTrust(user), [user])

  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptRenter, setAcceptRenter] = useState(false)
  const [acceptHost, setAcceptHost] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sendBusy, setSendBusy] = useState(false)
  const [verifyBusy, setVerifyBusy] = useState(false)

  const emailReady = useMemo(() => isEmailVerificationReady(user), [user])

  const fallbackPath = useMemo(() => {
    const from = st?.from?.trim()
    if (from && from !== '/trust-onboarding') return from
    return '/dashboard'
  }, [st?.from])

  const onboardingResumeState = useMemo(
    (): TrustOnboardingLocationState => ({
      from: st?.from ?? '/dashboard',
      pendingBookCarId: st?.pendingBookCarId,
      intent: st?.intent,
    }),
    [st?.from, st?.pendingBookCarId, st?.intent],
  )

  const navigateAfterTrust = useCallback(() => {
    const uAfter = useAuthStore.getState().user
    if (!isIdentityVerificationApproved(uAfter)) {
      navigate('/verify-identity', { replace: true, state: onboardingResumeState })
      return
    }
    const pendingId = st?.pendingBookCarId
    const u = useAuthStore.getState().user
    if (pendingId && canProceedToBookingCheckout(u)) {
      const car = useCarsStore.getState().cars.find((c) => c.id === pendingId)
      const pickup = useSearchStore.getState().pickup
      const dropoff = useSearchStore.getState().dropoff
      if (car && pickup?.isValid() && dropoff?.isValid()) {
        useBookingStore.getState().initBooking(car, pickup, dropoff)
        navigate(`/booking/${pendingId}`, { replace: true })
        return
      }
    }
    navigate(fallbackPath, { replace: true })
  }, [navigate, fallbackPath, onboardingResumeState, st?.pendingBookCarId])

  const onSubmitTrust = useCallback(async () => {
    if (!user) return
    if (!acceptTerms || !acceptRenter || (wantsHost && !acceptHost)) return
    if (!emailReady) {
      showError('Please verify your email before continuing — renters and hosts need a confirmed inbox.')
      return
    }
    const now = new Date().toISOString()
    setSubmitting(true)
    try {
      updateProfile({
        trustTermsAcceptedAt: now,
        trustRenterGuidelinesAcceptedAt: now,
        ...(wantsHost ? { trustHostStandardsAcceptedAt: now } : {}),
      })
      showSuccess(wantsHost ? 'Thanks — renters and hosts are protected together.' : 'Thanks — you can book securely.')
      navigateAfterTrust()
    } finally {
      setSubmitting(false)
    }
  }, [
    acceptHost,
    acceptRenter,
    acceptTerms,
    emailReady,
    navigateAfterTrust,
    showError,
    showSuccess,
    updateProfile,
    user,
    wantsHost,
  ])

  if (!user) return <Navigate to="/" replace />

  if (!isAuthProfileComplete(user)) {
    return <Navigate to="/complete-profile" replace state={{ from: `${location.pathname}${location.search}`, pendingBookCarId: st?.pendingBookCarId ?? null }} />
  }

  if (canProceedToBookingCheckout(user)) {
    return <Navigate to={fallbackPath} replace />
  }

  if (isLegalAndSafetyOnboardingComplete(user) && !isIdentityVerificationApproved(user)) {
    return (
      <Navigate
        to="/verify-identity"
        replace
        state={{
          from: fallbackPath,
          pendingBookCarId: st?.pendingBookCarId,
          intent: st?.intent,
        }}
      />
    )
  }

  const needsFirebaseEmail = authProvider === 'firebase' && !emailReady

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2, md: 4 }, pb: { xs: 10, md: 6 }, ...containerGutters }}>
      <PageHeader
        overline={st?.intent === 'host' ? 'Host onboarding' : 'Safety & accountability'}
        title="RentaraH safeguards"
        subtitle="Legal acceptance and straightforward rules — we protect renters, hosts, and the vehicles between you."
      />

      <Stack spacing={2.75}>
        {needsFirebaseEmail ? (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom component="span" display="block">
              Confirm your email
            </Typography>
            <Typography variant="caption" component="span" display="block" sx={{ mb: 1.5, lineHeight: 1.5 }}>
              We send trip updates and payouts to{' '}
              <Box component="span" sx={{ fontWeight: 700 }}>
                {user.email || 'your inbox'}
              </Box>
              . Open the Firebase verification link Google sent — then tap “I've verified”.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                size="small"
                variant="outlined"
                disabled={sendBusy}
                onClick={async () => {
                  setSendBusy(true)
                  try {
                    const sent = await sendFirebaseEmailVerification()
                    if (!sent) showError('Could not queue email — configure Firebase Authentication email templates.')
                    else showSuccess('Verification message sent.')
                  } catch {
                    showError('Send failed — try again in a minute.')
                  } finally {
                    setSendBusy(false)
                  }
                }}
              >
                {sendBusy ? 'Sending…' : 'Resend link'}
              </Button>
              <Button
                size="small"
                variant="contained"
                disabled={verifyBusy}
                onClick={async () => {
                  setVerifyBusy(true)
                  try {
                    const ok = await reloadFirebaseCurrentUserVerified()
                    if (ok) {
                      updateProfile({ emailVerified: true })
                      showSuccess('Email verified — continue below.')
                    } else showError('Not verified yet — check spam or resend the link.')
                  } finally {
                    setVerifyBusy(false)
                  }
                }}
              >
                {verifyBusy ? 'Checking…' : "I've verified"}
              </Button>
            </Stack>
          </Alert>
        ) : null}

        <Box
          sx={{
            p: { xs: 2, sm: 2.25 },
            borderRadius: 2,
            border: 1,
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.04 : 0.08),
          }}
        >
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.25 }}>
            Accept to continue
          </Typography>
          <Stack spacing={1.25}>
            <FormControlLabel
              control={<Checkbox checked={acceptTerms} onChange={(_, v) => setAcceptTerms(v)} color="primary" />}
              label={
                <Typography variant="body2" sx={{ lineHeight: 1.45 }}>
                  I have read and agree to the{' '}
                  <MUILink component={RouterLink} to="/legal/terms" fontWeight={700} underline="hover">
                    Terms of Service
                  </MUILink>{' '}
                  and{' '}
                  <MUILink component={RouterLink} to="/legal/privacy" fontWeight={700} underline="hover">
                    Privacy Policy
                  </MUILink>
                  .
                </Typography>
              }
            />
            <FormControlLabel
              control={<Checkbox checked={acceptRenter} onChange={(_, v) => setAcceptRenter(v)} color="primary" />}
              label={
                <Typography variant="body2" sx={{ lineHeight: 1.45 }}>
                  As a renter I will show my valid license at pickup, return the vehicle in the same condition (except normal wear), pay on time, and report damage or issues immediately.
                </Typography>
              }
            />
            {wantsHost ? (
              <FormControlLabel
                control={<Checkbox checked={acceptHost} onChange={(_, v) => setAcceptHost(v)} color="primary" />}
                label={
                  <Typography variant="body2" sx={{ lineHeight: 1.45 }}>
                    As a host I list only vehicles I may legally rent, keep insurance and registration accurate, honor confirmed bookings, and communicate honestly with guests.
                  </Typography>
                }
              />
            ) : null}
          </Stack>
          <FormHelperText sx={{ mx: 0, mt: 1.5 }}>These checks give both sides predictable rules while we grow real payouts and roadside support.</FormHelperText>
        </Box>

        <Button
          variant="contained"
          size="large"
          disabled={submitting || !acceptTerms || !acceptRenter || (wantsHost && !acceptHost) || needsFirebaseEmail}
          onClick={() => void onSubmitTrust()}
          sx={{
            py: 1.35,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 800,
            ...primaryCtaShadow(theme),
          }}
        >
          {submitting ? 'Saving…' : 'Accept & continue'}
        </Button>
      </Stack>
    </Container>
  )
}
