import { zodResolver } from '@hookform/resolvers/zod'
import DirectionsCarOutlined from '@mui/icons-material/DirectionsCarOutlined'
import PersonOutline from '@mui/icons-material/PersonOutline'
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined'
import {
  Box,
  Button,
  Container,
  FormControl,
  FormHelperText,
  FormLabel,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { RoleCard } from '../components/auth/RoleCard'
import { authOutlinedFieldSx } from '../components/auth/authFieldSx'
import PhilippineNationalMobileTextField from '../components/auth/PhilippineNationalMobileTextField'
import PhilippineDriversLicenseTextField from '../components/auth/PhilippineDriversLicenseTextField'
import {
  completeProfileSchema,
  type CompleteProfileFormValues,
  type CompleteProfileSubmitValues,
} from '../components/auth/authSchemas'
import { isAuthProfileComplete } from '../lib/authProfile'
import { e164ToNationalMobileDigits, formatPhilippineDriversLicenseInput } from '../lib/philippineContact'
import {
  isHostTrustComplete,
  isIdentityVerificationApproved,
  isLegalAndSafetyOnboardingComplete,
  wantsHostTrust,
} from '../lib/trustOnboarding'
import { useAuthStore } from '../store/useAuthStore'
import { useBookingStore } from '../store/useBookingStore'
import { useCarsStore } from '../store/useCarsStore'
import { useSearchStore } from '../store/useSearchStore'
import { useSnackbarStore } from '../store/useSnackbarStore'
import type { CompleteProfileLocationState } from '../types/authFlow'

const COMPLETE_PROFILE_STEP_LABELS = ['Your role', 'Your details'] as const
const COMPLETE_PROFILE_LAST_STEP_INDEX = COMPLETE_PROFILE_STEP_LABELS.length - 1

function fieldSx(theme: Theme) {
  return authOutlinedFieldSx(theme, true)
}

export default function CompleteProfilePage() {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)

  const st = location.state as CompleteProfileLocationState | undefined
  const compactSx = useMemo(() => fieldSx(theme), [theme])

  const [submitting, setSubmitting] = useState(false)
  const [wizardStep, setWizardStep] = useState(0)

  const defaults = useMemo((): CompleteProfileFormValues => {
    if (!user) {
      return {
        firstName: '',
        lastName: '',
        phone: '',
        licenseNumber: '',
        accountRole: 'renter',
      }
    }
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: e164ToNationalMobileDigits(user.phone ?? ''),
      licenseNumber: formatPhilippineDriversLicenseInput(user.licenseNumber ?? ''),
      accountRole: user.accountRole ?? 'renter',
    }
  }, [user])

  const {
    register,
    control,
    handleSubmit,
    reset,
    trigger,
    formState: { errors },
  } = useForm<CompleteProfileFormValues, unknown, CompleteProfileSubmitValues>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: defaults,
    mode: 'onChange',
  })

  useEffect(() => {
    reset(defaults)
  }, [defaults, reset])

  const goWizardNext = useCallback(async () => {
    const ok = await trigger('accountRole')
    if (ok) setWizardStep(1)
  }, [trigger])

  const goWizardBack = useCallback(() => {
    setWizardStep(0)
  }, [])

  const onSubmit = useCallback(
    async (data: CompleteProfileSubmitValues) => {
      const role = data.accountRole
      const isHost = role === 'host' || role === 'both'
      setSubmitting(true)
      try {
        updateProfile({
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          phone: data.phone,
          licenseNumber: data.licenseNumber,
          accountRole: role,
          isHost,
        })
        const uNext = useAuthStore.getState().user
        if (uNext && !isLegalAndSafetyOnboardingComplete(uNext)) {
          navigate('/trust-onboarding', {
            replace: true,
            state: {
              from:
                st?.from && st.from !== '/complete-profile'
                  ? st.from
                  : '/dashboard',
              pendingBookCarId: st?.pendingBookCarId ?? undefined,
              intent: wantsHostTrust(uNext) && !isHostTrustComplete(uNext) ? 'host' : 'booking',
            },
          })
          showSuccess('Profile saved — finish safeguards next.')
          return
        }

        if (uNext && !isIdentityVerificationApproved(uNext)) {
          navigate('/verify-identity', {
            replace: true,
            state: {
              from:
                st?.from && st.from !== '/complete-profile'
                  ? st.from
                  : '/dashboard',
              pendingBookCarId: st?.pendingBookCarId ?? undefined,
              intent: wantsHostTrust(uNext) ? 'host' : 'booking',
            },
          })
          showSuccess('Profile saved — upload your government ID next.')
          return
        }

        showSuccess('Profile complete — you’re ready to book.')

        const pending = st?.pendingBookCarId
        if (pending) {
          const car = useCarsStore.getState().cars.find((c) => c.id === pending)
          const pickup = useSearchStore.getState().pickup
          const dropoff = useSearchStore.getState().dropoff
          if (car && pickup?.isValid() && dropoff?.isValid()) {
            useBookingStore.getState().initBooking(car, pickup, dropoff)
            navigate(`/booking/${pending}`, { replace: true })
            return
          }
        }
        const fallback = st?.from && st.from !== '/complete-profile' ? st.from : '/dashboard'
        navigate(fallback, { replace: true })
      } finally {
        setSubmitting(false)
      }
    },
    [navigate, showSuccess, st?.from, st?.pendingBookCarId, updateProfile],
  )

  if (!user) return <Navigate to="/" replace />

  if (isAuthProfileComplete(user)) {
    if (!isLegalAndSafetyOnboardingComplete(user)) {
      return (
        <Navigate
          to="/trust-onboarding"
          replace
          state={{
            from: st?.from && st.from !== '/complete-profile' ? st.from : '/dashboard',
            pendingBookCarId: st?.pendingBookCarId,
            intent: wantsHostTrust(user) && !isHostTrustComplete(user) ? 'host' : 'booking',
          }}
        />
      )
    }

    if (!isIdentityVerificationApproved(user)) {
      return (
        <Navigate
          to="/verify-identity"
          replace
          state={{
            from: st?.from && st.from !== '/complete-profile' ? st.from : '/dashboard',
            pendingBookCarId: st?.pendingBookCarId,
            intent: wantsHostTrust(user) ? 'host' : 'booking',
          }}
        />
      )
    }

    const to = st?.from && st.from !== '/complete-profile' ? st.from : '/dashboard'
    return <Navigate to={to} replace />
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3 } }}>
      <Stack spacing={2.5} component="form" onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate>
        <Stack spacing={0.75}>
          <Typography variant="h5" component="h1" fontWeight={800} sx={{ letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            Complete your Rentara profile
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
            Two quick steps — same flow as email registration. Choose how you’ll use Rentara, then add your PH mobile number
            and driver&apos;s license.
          </Typography>
        </Stack>

        <Box sx={{ mb: 0.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="caption" color="primary" fontWeight={800} letterSpacing="0.06em" textTransform="uppercase">
              Step {wizardStep + 1} of {COMPLETE_PROFILE_STEP_LABELS.length}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              {COMPLETE_PROFILE_STEP_LABELS[wizardStep]}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={((wizardStep + 1) / COMPLETE_PROFILE_STEP_LABELS.length) * 100}
            sx={{
              height: 6,
              borderRadius: 999,
              bgcolor: alpha(theme.palette.grey[400], theme.palette.mode === 'light' ? 0.2 : 0.25),
              boxShadow: `inset 0 1px 1px ${alpha(theme.palette.common.black, 0.05)}`,
              '& .MuiLinearProgress-bar': {
                borderRadius: 999,
                bgcolor: 'primary.main',
                boxShadow: `0 1px 4px ${alpha(theme.palette.primary.main, 0.35)}`,
              },
            }}
          />
          <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center" sx={{ mt: 1 }}>
            {COMPLETE_PROFILE_STEP_LABELS.map((label, i) => (
              <Box
                key={label}
                sx={{
                  width: i === wizardStep ? 16 : 5,
                  height: 6,
                  borderRadius: 999,
                  bgcolor:
                    i <= wizardStep
                      ? 'primary.main'
                      : alpha(theme.palette.grey[600], theme.palette.mode === 'light' ? 0.2 : 0.35),
                  transition: 'width 0.25s ease, background-color 0.2s ease',
                }}
                aria-hidden
              />
            ))}
          </Stack>
        </Box>

        {wizardStep === 0 && (
          <Controller
            name="accountRole"
            control={control}
            render={({ field }) => (
              <FormControl component="fieldset" variant="standard" error={!!errors.accountRole} sx={{ width: '100%' }}>
                <FormLabel id="complete-profile-role-label" component="legend" sx={{ fontWeight: 700, color: 'text.primary', mb: { xs: 1, sm: 1.25 }, fontSize: '0.875rem' }}>
                  Choose your role
                </FormLabel>
                <Stack role="radiogroup" aria-labelledby="complete-profile-role-label" spacing={{ xs: 1, sm: 1.5 }}>
                  <RoleCard
                    radioName={field.name}
                    radioValue="host"
                    selected={field.value === 'host'}
                    icon={<StorefrontOutlined sx={{ fontSize: 26 }} />}
                    title="Host"
                    description="List vehicles you own, manage bookings, and earn when others rent your fleet."
                    onCommitted={() => {
                      field.onChange('host')
                    }}
                    onBlurInput={field.onBlur}
                  />
                  <RoleCard
                    radioName={field.name}
                    radioValue="renter"
                    selected={field.value === 'renter'}
                    icon={<PersonOutline sx={{ fontSize: 26 }} />}
                    title="Renter"
                    description="Browse and book vehicles for your trips."
                    onCommitted={() => {
                      field.onChange('renter')
                    }}
                    onBlurInput={field.onBlur}
                  />
                  <RoleCard
                    radioName={field.name}
                    radioValue="both"
                    selected={field.value === 'both'}
                    icon={<DirectionsCarOutlined sx={{ fontSize: 26 }} />}
                    title="Both"
                    description="Rent when you travel and host when you’re not using your vehicles."
                    onCommitted={() => {
                      field.onChange('both')
                    }}
                    onBlurInput={field.onBlur}
                  />
                </Stack>
                {errors.accountRole && (
                  <FormHelperText error sx={{ mx: 0, mt: 1.25 }}>
                    {errors.accountRole.message}
                  </FormHelperText>
                )}
              </FormControl>
            )}
          />
        )}

        {wizardStep === 1 && (
          <Stack spacing={2}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Your details
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                size="small"
                label="First name"
                autoComplete="given-name"
                fullWidth
                {...register('firstName')}
                error={!!errors.firstName}
                helperText={errors.firstName?.message ?? 'As on your ID or license.'}
                sx={compactSx}
              />
              <TextField
                size="small"
                label="Last name"
                autoComplete="family-name"
                fullWidth
                {...register('lastName')}
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
                sx={compactSx}
              />
            </Stack>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhilippineNationalMobileTextField
                  size="small"
                  label="Mobile number"
                  fullWidth
                  value={field.value}
                  onChange={(digits) => field.onChange(digits)}
                  onBlur={field.onBlur}
                  name={field.name}
                  inputRef={field.ref}
                  error={!!errors.phone}
                  helperText={
                    errors.phone?.message ?? '10 digits after +63, starting with 9 (you can paste 09…).'
                  }
                  sx={compactSx}
                />
              )}
            />
            <Controller
              name="licenseNumber"
              control={control}
              render={({ field }) => (
                <PhilippineDriversLicenseTextField
                  size="small"
                  label="Driver’s license number"
                  fullWidth
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  inputRef={field.ref}
                  error={!!errors.licenseNumber}
                  helperText={
                    errors.licenseNumber?.message ??
                    'Letters, digits, hyphen — long numbers format as L##-##-###### (compact N12345678 also OK).'
                  }
                  sx={compactSx}
                />
              )}
            />
          </Stack>
        )}

        <Stack direction="row" spacing={1} sx={{ width: '100%', pt: 0.5 }}>
          {wizardStep > 0 && (
            <Button
              type="button"
              variant="outlined"
              color="inherit"
              onClick={goWizardBack}
              disabled={submitting}
              sx={{ flex: 1, py: 1.2, fontWeight: 700, borderRadius: 2 }}
            >
              Back
            </Button>
          )}
          {wizardStep < COMPLETE_PROFILE_LAST_STEP_INDEX ? (
            <Button
              type="button"
              variant="contained"
              onClick={() => void goWizardNext()}
              fullWidth={wizardStep === 0}
              className="min-h-touch rounded-2xl font-bold"
              sx={{
                flex: wizardStep > 0 ? 2 : 1,
                py: 1.2,
                fontWeight: 700,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: `0 10px 24px ${alpha(theme.palette.primary.main, 0.32)}`,
              }}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              className="min-h-touch flex-[2] rounded-2xl font-bold"
              sx={{
                flex: 2,
                py: 1.35,
                fontWeight: 700,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: `0 10px 24px ${alpha(theme.palette.primary.main, 0.32)}`,
              }}
            >
              {submitting ? 'Saving…' : 'Save and continue'}
            </Button>
          )}
        </Stack>
      </Stack>
    </Container>
  )
}
