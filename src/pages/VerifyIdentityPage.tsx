import CloudUploadRounded from '@mui/icons-material/CloudUploadRounded'
import {
  Alert,
  Box,
  Button,
  Container,
  Stack,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import type { ChangeEvent } from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import PageHeader from '../components/layout/PageHeader'
import { compressImageFileToJpegDataUrl } from '../lib/compressIdentityImage'
import { shouldInstantApproveIdVerification } from '../lib/idVerificationPolicy'
import { isAuthProfileComplete } from '../lib/authProfile'
import {
  canProceedToBookingCheckout,
  isLegalAndSafetyOnboardingComplete,
} from '../lib/trustOnboarding'
import { useAuthStore } from '../store/useAuthStore'
import { useBookingStore } from '../store/useBookingStore'
import { useCarsStore } from '../store/useCarsStore'
import { useSearchStore } from '../store/useSearchStore'
import { useSnackbarStore } from '../store/useSnackbarStore'
import { containerGutters, primaryCtaShadow } from '../theme/pageStyles'
import type { IdentityVerificationStatus } from '../types'
import type { VerifyIdentityLocationState } from '../types/authFlow'

export default function VerifyIdentityPage() {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const st = location.state as VerifyIdentityLocationState | undefined

  const inputRef = useRef<HTMLInputElement | null>(null)
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  const instantApprove = shouldInstantApproveIdVerification()
  const verification = user?.identityVerification
  const [previewUrl, setPreviewUrl] = useState<string | null>(() => verification?.documentDataUrl ?? null)
  const [fileLabel, setFileLabel] = useState<string | null>(() => verification?.fileName ?? null)
  const [submitting, setSubmitting] = useState(false)

  const fallbackPath = useMemo(() => {
    const from = st?.from?.trim()
    if (from && from !== '/verify-identity') return from
    return '/dashboard'
  }, [st?.from])

  const onboardingResumeState = useMemo(
    (): VerifyIdentityLocationState => ({
      from: st?.from ?? '/dashboard',
      pendingBookCarId: st?.pendingBookCarId,
      intent: st?.intent,
    }),
    [st?.from, st?.pendingBookCarId, st?.intent],
  )

  const navigateAfterApproved = useCallback(() => {
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
  }, [navigate, fallbackPath, st?.pendingBookCarId])

  const onPickFile = useCallback(() => inputRef.current?.click(), [])

  const onFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file) return
      setSubmitting(true)
      try {
        const jpeg = await compressImageFileToJpegDataUrl(file)
        setPreviewUrl(jpeg)
        setFileLabel(file.name)

        const status: IdentityVerificationStatus = instantApprove ? 'approved' : 'pending_review'
        const now = new Date().toISOString()
        updateProfile({
          identityVerification: {
            status,
            submittedAt: now,
            fileName: file.name,
            mimeType: 'image/jpeg',
            documentDataUrl: jpeg,
            rejectionReason: undefined,
          },
        })

        showSuccess(
          instantApprove ? 'Government ID uploaded and verified on this demo build.' : 'ID submitted — bookings unlock after our team confirms it.',
        )

        const uNow = useAuthStore.getState().user
        if (canProceedToBookingCheckout(uNow)) {
          navigateAfterApproved()
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed.'
        showError(msg)
      } finally {
        setSubmitting(false)
      }
    },
    [instantApprove, navigateAfterApproved, showError, showSuccess, updateProfile],
  )

  if (!user) return <Navigate to="/" replace />

  if (!isAuthProfileComplete(user)) {
    return (
      <Navigate
        to="/complete-profile"
        replace
        state={{ from: `${location.pathname}${location.search}`, pendingBookCarId: st?.pendingBookCarId ?? null }}
      />
    )
  }

  if (!isLegalAndSafetyOnboardingComplete(user)) {
    return <Navigate to="/trust-onboarding" replace state={onboardingResumeState} />
  }

  if (canProceedToBookingCheckout(user)) {
    return <Navigate to={fallbackPath} replace />
  }

  const rejected = verification?.status === 'rejected'

  /** Reload dropped the data URL from storage but status may still be pending. */
  const awaitingManualReviewOffline =
    !instantApprove && verification?.status === 'pending_review' && !verification.documentDataUrl

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2, md: 4 }, pb: { xs: 10, md: 6 }, ...containerGutters }}>
      <PageHeader
        overline={st?.intent === 'host' ? 'Host verification' : 'Identity verification'}
        title="Upload a photo of your ID"
        subtitle="Passport, national ID, UMID or driver&apos;s license (front readable). Helps deter fraud and protect hosts and renters in disputes."
      />

      <Stack spacing={2.25}>
        {instantApprove ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Demo builds auto-approve right after upload. Set{' '}
            <Box component="code" sx={{ px: 0.5 }}>
              VITE_ID_VERIFICATION_INSTANT_APPROVE=false
            </Box>{' '}
            plus a reviewer API before production traffic.
          </Alert>
        ) : (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            Submissions queue for manual approval — bookings and host dashboards stay blocked until IDs are approved server-side.
          </Alert>
        )}

        {rejected ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {verification?.rejectionReason?.trim()
              ? verification.rejectionReason
              : 'We could not approve that document — upload a sharper, evenly lit photo.'}
          </Alert>
        ) : null}

        {!instantApprove && verification?.status === 'pending_review' && !previewUrl ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Submission logged{verification.fileName ? ` (${verification.fileName}).` : '.'}{' '}
            {awaitingManualReviewOffline
              ? 'Preview not stored offline — reviewers use your backend inbox in prod.'
              : 'We notify you once review completes.'}
          </Alert>
        ) : null}

        <Box
          sx={{
            p: { xs: 2, sm: 2.25 },
            borderRadius: 2,
            border: 2,
            borderStyle: previewUrl ? 'solid' : 'dashed',
            borderColor: previewUrl ? 'primary.main' : 'divider',
            bgcolor: previewUrl ? alpha(theme.palette.primary.main, 0.06) : 'action.hover',
            textAlign: 'center',
          }}
        >
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(ev) => void onFileChange(ev)} />

          {previewUrl ? (
            <>
              <Box
                component="img"
                src={previewUrl}
                alt={fileLabel ?? 'Government ID preview'}
                sx={{
                  maxWidth: '100%',
                  maxHeight: { xs: 220, sm: 280 },
                  objectFit: 'contain',
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                }}
              />
              <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
                {fileLabel ?? 'Selected image'} — JPEG previews stay in-session; binary blobs strip before persistence.
              </Typography>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ py: { xs: 2, sm: 3 }, px: 1 }}>
              JPG or PNG, well-lit edges, avoid glare hiding the MRZ or ID numbers.
            </Typography>
          )}

          <Button
            type="button"
            variant={previewUrl ? 'outlined' : 'contained'}
            startIcon={<CloudUploadRounded />}
            disabled={submitting || (!instantApprove && verification?.status === 'pending_review' && !rejected)}
            onClick={() => onPickFile()}
            sx={{
              mt: 1,
              ...(previewUrl ? {} : { ...primaryCtaShadow(theme) }),
              fontWeight: 800,
              textTransform: 'none',
            }}
          >
            {submitting ? 'Processing…' : previewUrl || rejected ? 'Replace upload' : 'Choose photo'}
          </Button>
        </Box>
      </Stack>
    </Container>
  )
}
