import { zodResolver } from '@hookform/resolvers/zod'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import Close from '@mui/icons-material/Close'
import DirectionsCarOutlined from '@mui/icons-material/DirectionsCarOutlined'
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded'
import Google from '@mui/icons-material/Google'
import PersonOutline from '@mui/icons-material/PersonOutline'
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  IconButton,
  InputAdornment,
  LinearProgress,
  Link,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'

import type { AccountRole } from '../../types'
import { isFirebaseConfigured } from '../../lib/firebase'
import { mergeFirebaseUserIntoPartialAuthUser, signInWithGoogle } from '../../lib/firebaseGoogle'
import type { RegisterAccountRole } from '../../store/useAuthStore'
import { useAuthStore } from '../../store/useAuthStore'
import { useSnackbarStore } from '../../store/useSnackbarStore'
import { RoleCard } from './RoleCard'
import PhilippineNationalMobileTextField from './PhilippineNationalMobileTextField'
import PhilippineDriversLicenseTextField from './PhilippineDriversLicenseTextField'
import { authOutlinedFieldSx } from './authFieldSx'
import {
  loginSchema,
  type LoginFormValues,
  registerFullSchema,
  registerStepEmailSchema,
  registerStepPasswordSchema,
  registerStepRoleSchema,
  type RegisterFormValues,
} from './authSchemas'
import { getPasswordStrength, type PasswordStrengthLevel } from './passwordStrength'

const REMEMBER_EMAIL_KEY = 'rentara-remember-email'

/** Persists role + email across tab changes / refresh while in the same browser session. Cleared on successful signup. */
const REGISTRATION_SESSION_KEY = 'rentara-registration-draft'

const REGISTER_STEP_LABELS = ['Your role', 'Email', 'Password', 'About you'] as const
const REGISTER_LAST_STEP_INDEX = REGISTER_STEP_LABELS.length - 1

const REGISTER_FORM_DEFAULTS: RegisterFormValues = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  phone: '',
  licenseNumber: '',
  accountRole: '',
}

const strengthColor = (level: PasswordStrengthLevel, theme: Theme) => {
  switch (level) {
    case 'weak':
      return theme.palette.error.main
    case 'fair':
      return theme.palette.warning.main
    case 'good':
      return theme.palette.info.main
    case 'strong':
      return theme.palette.success.main
    default:
      return theme.palette.divider
  }
}

const strengthBarValue = (level: PasswordStrengthLevel) => {
  switch (level) {
    case 'weak':
      return 25
    case 'fair':
      return 50
    case 'good':
      return 75
    case 'strong':
      return 100
    default:
      return 0
  }
}

function SocialGoogleLogin({
  useFirebase,
  onSignedIn,
}: {
  /** When true, Firebase Google OAuth is wired; footer copy differs from demo. */
  useFirebase: boolean
  /**
   * Caller shows snackbar + closes dialog (mirrors email sign-in success).
   */
  onSignedIn: () => Promise<void> | void
}) {
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  /** Google brand palette — cohesive button without heavy rainbow chrome. */
  const gBlue = '#4285F4'
  const gBlueSoft = alpha(gBlue, theme.palette.mode === 'light' ? 0.12 : 0.22)
  const gGradient = `linear-gradient(135deg,
    ${alpha('#4285F4', theme.palette.mode === 'light' ? 0.2 : 0.35)} 0%,
    ${alpha('#34A853', theme.palette.mode === 'light' ? 0.12 : 0.2)} 34%,
    ${alpha('#FBBC04', theme.palette.mode === 'light' ? 0.14 : 0.18)} 67%,
    ${alpha('#EA4335', theme.palette.mode === 'light' ? 0.12 : 0.22)} 100%)`

  return (
    <Box
      className="mt-3 rounded-xl px-3 py-2.5 sm:mt-4 sm:rounded-2xl sm:p-4 border"
      sx={{
        borderColor: alpha(gBlue, theme.palette.mode === 'light' ? 0.22 : 0.35),
        borderStyle: 'solid',
        bgcolor: gBlueSoft,
        backgroundImage: gGradient,
        boxShadow:
          theme.palette.mode === 'light'
            ? `0 1px 0 ${alpha(theme.palette.common.black, 0.04)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.6)}`
            : `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.06)}`,
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="center" spacing={1.5} justifyContent="center">
          <Divider sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Or continue with
          </Typography>
          <Divider sx={{ flex: 1 }} />
        </Stack>
        <Button
          type="button"
          fullWidth
          variant="contained"
          disabled={loading}
          className="min-h-touch rounded-2xl"
          startIcon={loading ? undefined : <Google sx={{ color: '#fff', fontSize: 22 }} />}
          sx={{
            py: 1.25,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 800,
            fontSize: '0.9975rem',
            letterSpacing: '-0.01em',
            backgroundColor: gBlue,
            backgroundImage: `linear-gradient(180deg,
              ${alpha('#ffffff', theme.palette.mode === 'light' ? 0.22 : 0.08)} 0%,
              ${alpha('#000000', theme.palette.mode === 'light' ? 0 : 0.08)} 100%)`,
            border: `1px solid ${alpha(gBlue, theme.palette.mode === 'light' ? 0.55 : 0.65)}`,
            boxShadow:
              theme.palette.mode === 'light'
                ? `0 4px 14px ${alpha(gBlue, 0.42)}, inset 0 1px 0 ${alpha('#fff', 0.35)}`
                : `0 4px 16px ${alpha(gBlue, 0.55)}, inset 0 1px 0 ${alpha('#fff', 0.08)}`,
            transition: 'transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease',
            '&:hover': {
              backgroundColor: '#5a94f5',
              backgroundImage: `linear-gradient(180deg,
                ${alpha('#ffffff', theme.palette.mode === 'light' ? 0.28 : 0.12)} 0%,
                ${alpha('#000000', theme.palette.mode === 'light' ? 0 : 0.06)} 100%)`,
              filter: 'none',
              boxShadow: `0 6px 20px ${alpha(gBlue, 0.52)}`,
              borderColor: alpha(gBlue, 0.95),
            },
            '&:active': {
              transform: 'scale(0.99)',
            },
            '&.Mui-disabled': {
              color: alpha('#fff', 0.76),
              background: alpha(theme.palette.grey[500], theme.palette.mode === 'light' ? 0.18 : 0.42),
              borderColor: alpha(theme.palette.divider, 0.5),
              boxShadow: 'none',
            },
          }}
          onClick={() => {
            void (async () => {
              setLoading(true)
              try {
                await onSignedIn()
              } finally {
                setLoading(false)
              }
            })()
          }}
        >
            {loading ? (
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <CircularProgress size={22} sx={{ color: alpha('#ffffff', 0.95) }} thickness={5} />
              <span>Connecting…</span>
            </Stack>
          ) : (
            'Google'
          )}
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', lineHeight: 1.45, px: 0.5 }}>
          {useFirebase ? (
            <>
              Sign in with your Google account. Your session stays in sync with Firebase; the API can verify ID tokens when
              you call authenticated routes.
            </>
          ) : (
            <>
              Demo: simulates Google sign-in (local profile <strong>google.demo@rentara.com</strong>) — add{' '}
              <code>VITE_FIREBASE_*</code> for real OAuth.
            </>
          )}
        </Typography>
      </Stack>
    </Box>
  )
}

interface AuthDialogProps {
  open: boolean
  onClose: () => void
  /** Called after a successful sign-in or registration (before `onClose`). Use for return-to-flow (e.g. checkout). */
  onAuthenticated?: () => void
  defaultTab?: 'login' | 'register'
  /** When opening Register from host CTAs, preselect this role; user can still change. Session draft wins if it already has a role. */
  registerAccountRolePreset?: AccountRole
}

export default function AuthDialog({
  open,
  onClose,
  onAuthenticated,
  defaultTab = 'login',
  registerAccountRolePreset,
}: AuthDialogProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  /** `scroll="body"` scrolls the window when the dialog opens — sticky nav appears to jump to the top. */
  const backdropScrollYRef = useRef(0)

  const restoreBackdropScroll = useCallback(() => {
    const y = backdropScrollYRef.current
    const go = () => window.scrollTo({ top: y, behavior: 'auto' })
    go()
    requestAnimationFrame(() => {
      go()
      requestAnimationFrame(go)
    })
  }, [])
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab)
  const [registerStep, setRegisterStep] = useState(0)
  const registerWizardStepRef = useRef(0)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showRegConfirm, setShowRegConfirm] = useState(false)

  const loginAction = useAuthStore((s) => s.login)
  const loginWithFirebaseUser = useAuthStore((s) => s.loginWithFirebaseUser)
  const loginWithGoogleMockAction = useAuthStore((s) => s.loginWithGoogleMock)
  const registerAction = useAuthStore((s) => s.register)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)
  const showInfo = useSnackbarStore((s) => s.showInfo)

  const lf = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: true },
    mode: 'onChange',
  })
  const { reset: resetLoginForm } = lf

  const rf = useForm<RegisterFormValues>({
    defaultValues: { ...REGISTER_FORM_DEFAULTS },
    mode: 'onChange',
  })
  const { reset: resetRegisterForm } = rf

  /** Track dialog sessions so `reset*` identity cannot re-trigger a mid-flow wizard reset. */
  const authDialogWasOpenRef = useRef(false)
  const prevDefaultTabForWizardRef = useRef(defaultTab)

  const regPassword = useWatch({ control: rf.control, name: 'password' })
  const strength = getPasswordStrength(regPassword ?? '')
  const regDraft = useWatch({ control: rf.control })

  useEffect(() => {
    registerWizardStepRef.current = registerStep
  }, [registerStep])

  const persistRegRole = useWatch({ control: rf.control, name: 'accountRole' })
  const persistRegEmail = useWatch({ control: rf.control, name: 'email' })
  useEffect(() => {
    if (!open || tab !== 'register') return
    try {
      sessionStorage.setItem(
        REGISTRATION_SESSION_KEY,
        JSON.stringify({ accountRole: persistRegRole ?? '', email: persistRegEmail ?? '' }),
      )
    } catch {
      /* ignore quota / private mode */
    }
  }, [open, tab, persistRegRole, persistRegEmail])

  useEffect(() => {
    if (!open) {
      authDialogWasOpenRef.current = false
      return
    }

    const isOpeningIntoSession = !authDialogWasOpenRef.current
    authDialogWasOpenRef.current = true

    const defaultTabUpdatedFromOutside = prevDefaultTabForWizardRef.current !== defaultTab
    prevDefaultTabForWizardRef.current = defaultTab

    if (!isOpeningIntoSession && !defaultTabUpdatedFromOutside) return

    setTab(defaultTab)
    setRegisterStep(0)
    const remembered = localStorage.getItem(REMEMBER_EMAIL_KEY)
    resetLoginForm({
      email: remembered ?? '',
      password: '',
      rememberMe: Boolean(remembered),
    })
    let registrationMerged: RegisterFormValues = { ...REGISTER_FORM_DEFAULTS }
    try {
      const draftRaw = sessionStorage.getItem(REGISTRATION_SESSION_KEY)
      if (draftRaw) {
        const draft = JSON.parse(draftRaw) as Partial<Pick<RegisterFormValues, 'accountRole' | 'email'>>
        const role = draft.accountRole
        if (role === 'renter' || role === 'host' || role === 'both' || role === '') {
          registrationMerged = { ...registrationMerged, accountRole: role === '' ? '' : role }
        }
        if (typeof draft.email === 'string') {
          registrationMerged = { ...registrationMerged, email: draft.email }
        }
      }
    } catch {
      registrationMerged = { ...REGISTER_FORM_DEFAULTS }
    }
    if (
      registerAccountRolePreset &&
      (registrationMerged.accountRole === '' || !registrationMerged.accountRole)
    ) {
      registrationMerged = { ...registrationMerged, accountRole: registerAccountRolePreset }
    }
    resetRegisterForm(registrationMerged)
    /** Only [open] + prop defaultTab trigger a session/tab reset — not unstable RHF reset() identities mid-dialog. */
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resetLoginForm/resetRegisterForm intentionally omitted from deps (see guard above).
  }, [open, defaultTab, registerAccountRolePreset])

  const applyZodIssues = useCallback(
    (issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>) => {
      issues.forEach((issue) => {
        const key = issue.path[0]
        if (typeof key === 'string') {
          rf.setError(key as keyof RegisterFormValues, { type: 'manual', message: issue.message })
        }
      })
    },
    [rf],
  )

  const goRegisterNext = async () => {
    rf.clearErrors()
    if (registerStep === 0) {
      const v = rf.getValues()
      const parsed = registerStepRoleSchema.safeParse({ accountRole: v.accountRole })
      if (!parsed.success) {
        applyZodIssues(parsed.error.issues)
        return
      }
      setRegisterStep(1)
      return
    }
    if (registerStep === 1) {
      const v = rf.getValues()
      const parsed = registerStepEmailSchema.safeParse({ email: v.email.trim() })
      if (!parsed.success) {
        applyZodIssues(parsed.error.issues)
        return
      }
      setRegisterStep(2)
      return
    }
    if (registerStep === 2) {
      const v = rf.getValues()
      const parsed = registerStepPasswordSchema.safeParse({
        password: v.password,
        confirmPassword: v.confirmPassword,
      })
      if (!parsed.success) {
        applyZodIssues(parsed.error.issues)
        return
      }
      setRegisterStep(3)
    }
  }

  const canProceedCurrentStep = useMemo(() => {
    if (!regDraft) return false
    switch (registerStep) {
      case 0:
        return registerStepRoleSchema.safeParse({ accountRole: regDraft.accountRole ?? '' }).success
      case 1:
        return registerStepEmailSchema.safeParse({ email: (regDraft.email ?? '').trim() }).success
      case 2:
        return registerStepPasswordSchema
          .safeParse({ password: regDraft.password, confirmPassword: regDraft.confirmPassword })
          .success
      default:
        return false
    }
  }, [registerStep, regDraft])

  const canSubmitRegistration = useMemo(() => registerFullSchema.safeParse(regDraft).success, [regDraft])

  const goRegisterBack = () => {
    rf.clearErrors()
    setRegisterStep((s) => Math.max(0, s - 1))
  }

  const onLogin = lf.handleSubmit(async (data) => {
    lf.clearErrors('root')
    await new Promise((r) => setTimeout(r, 380))
    try {
      loginAction(data.email, data.password)
      if (data.rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, data.email.trim())
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY)
      }
      const u = useAuthStore.getState().user
      showSuccess(u ? `Welcome back, ${u.firstName}!` : 'Signed in')
      onAuthenticated?.()
      onClose()
    } catch {
      lf.setError('root', {
        type: 'manual',
        message: 'We couldn’t sign you in. Check your email and password, or create an account below.',
      })
      showError('Sign-in didn’t work — please check your details.')
    }
  })

  const firebaseGoogleEnabled = useMemo(() => isFirebaseConfigured(), [])
  const handleGoogleSignIn = useCallback(async () => {
    lf.clearErrors('root')
    if (firebaseGoogleEnabled) {
      try {
        const fu = await signInWithGoogle()
        loginWithFirebaseUser(mergeFirebaseUserIntoPartialAuthUser(useAuthStore.getState().user, fu))
        const u = useAuthStore.getState().user
        showSuccess(u ? `Signed in with Google — hello, ${u.firstName}!` : 'Signed in')
        onAuthenticated?.()
        onClose()
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Google sign-in failed.'
        showError(msg)
        lf.setError('root', { type: 'manual', message: msg })
      }
      return
    }
    await new Promise((r) => setTimeout(r, 420))
    try {
      loginWithGoogleMockAction()
      const u = useAuthStore.getState().user
      showSuccess(u ? `Signed in with Google (demo) — hello, ${u.firstName}!` : 'Signed in')
      onAuthenticated?.()
      onClose()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong. Try again.'
      showError(msg)
      lf.setError('root', { type: 'manual', message: msg })
    }
  }, [
    lf,
    firebaseGoogleEnabled,
    loginWithFirebaseUser,
    loginWithGoogleMockAction,
    showError,
    showSuccess,
    onAuthenticated,
    onClose,
  ])

  const finalizeRegisterSubmit = rf.handleSubmit(async (data) => {
    const parsed = registerFullSchema.safeParse(data)
    if (!parsed.success) {
      applyZodIssues(parsed.error.issues)
      return
    }
    await new Promise((r) => setTimeout(r, 400))
    try {
      registerAction({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.trim().toLowerCase(),
        password: data.password,
        phone: data.phone,
        licenseNumber: data.licenseNumber,
        accountRole: data.accountRole as RegisterAccountRole,
      })
      try {
        sessionStorage.removeItem(REGISTRATION_SESSION_KEY)
      } catch {
        /* noop */
      }
      const u = useAuthStore.getState().user
      showSuccess(u ? `Welcome, ${u.firstName}!` : 'Account created')
      onAuthenticated?.()
      onClose()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong. Please try again.'
      rf.setError('root', { type: 'manual', message: msg })
      showError(msg)
    }
  })

  const loginSubmitting = lf.formState.isSubmitting
  const registerSubmitting = rf.formState.isSubmitting

  const mqShortViewport = useMediaQuery('(max-height:700px)')
  const mqNarrowWidth = useMediaQuery('(max-width:420px)')
  const compactAuthFields = fullScreen || mqShortViewport || mqNarrowWidth
  const compactFieldSx = useMemo(() => authOutlinedFieldSx(theme, compactAuthFields), [theme, compactAuthFields])

  const slideSx = { width: '100%' }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
      scroll="paper"
      disableRestoreFocus
      aria-labelledby="auth-dialog-title"
      /** Sit above AppBar (1100) + mobile bottom nav so the page never shows through as “ghost” UI. */
      sx={{ zIndex: (t) => t.zIndex.modal + 20 }}
      BackdropProps={{
        sx: {
          backgroundColor: alpha(theme.palette.common.black, 0.58),
          backdropFilter: 'blur(6px)',
        },
      }}
      TransitionProps={{
        onEnter: () => {
          backdropScrollYRef.current = window.scrollY
        },
        onEntered: restoreBackdropScroll,
        onExited: restoreBackdropScroll,
      }}
      PaperProps={{
        className:
          'flex max-h-[min(100dvh,100vh)] flex-col overflow-hidden sm:max-h-none ' +
          (fullScreen ? 'min-h-[100dvh] w-full max-w-full rounded-none border-0 shadow-none' : 'rounded-3xl'),
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          overflow: 'hidden',
          border: fullScreen ? 'none' : '1px solid',
          borderColor: 'divider',
          boxShadow: fullScreen ? 'none' : `0 24px 48px -12px ${alpha(theme.palette.common.black, 0.2)}`,
          /** Fully opaque surface — gradients with transparent stops let the page show through on some mobile GPUs. */
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          ...(fullScreen
            ? {
                minHeight: '100dvh',
                maxHeight: '100dvh',
                width: '100%',
                maxWidth: '100%',
                m: 0,
              }
            : {}),
          position: 'relative',
        },
      }}
    >
      <DialogTitle
        id="auth-dialog-title"
        className="relative shrink-0 overflow-x-hidden px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-8 sm:pb-3 sm:pt-6"
        sx={{
          position: 'relative',
          overflowX: 'hidden',
        }}
      >
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: { xs: 1.5, sm: 2 } }}
        >
          <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
            <Typography
              variant="h6"
              className={`font-extrabold tracking-tight ${tab === 'register' ? 'text-base leading-snug sm:text-fluid-heading' : 'text-fluid-heading'}`}
            >
              {tab === 'login' ? 'Welcome back' : 'Create your account'}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, display: 'block', mt: 0.2 }}
              className={`${tab === 'register' ? 'text-[0.65rem] sm:text-[0.75rem]' : 'text-[0.7rem] sm:text-[0.75rem]'}`}
            >
              Rentara — Philippines rentals
            </Typography>
          </Box>
          <IconButton
            aria-label="Close dialog"
            onClick={onClose}
            size="small"
            className="min-h-touch min-w-touch -mt-0.5 shrink-0 sm:mt-0"
            sx={{
              color: 'text.secondary',
              borderRadius: 2,
              '&:hover': {
                bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === 'light' ? 0.06 : 0.12),
              },
            }}
          >
            <Close />
          </IconButton>
        </Stack>
        <Typography
          variant="body2"
          color="text.secondary"
          className="mb-2.5 hidden text-fluid leading-snug sm:mb-5 sm:block"
          sx={{ lineHeight: 1.55 }}
        >
          {tab === 'login'
            ? 'Sign in to book vehicles, manage trips, and message hosts — all in one place.'
            : 'Four guided steps: choose your role, verify your email, set a password, then add your profile.'}
        </Typography>
        <ToggleButtonGroup
          exclusive
          value={tab}
          className="[&_.MuiToggleButton-root]:min-h-touch"
          onChange={(_, v) => {
            if (v != null) {
              setTab(v)
              setRegisterStep(0)
            }
          }}
          fullWidth
          sx={{
            p: 0.5,
            gap: 0,
            display: 'flex',
            width: '100%',
            borderRadius: 2.5,
            border: 'none',
            bgcolor: (t) => alpha(t.palette.primary.main, t.palette.mode === 'light' ? 0.08 : 0.15),
            /** Equal halves — default ToggleButton minWidth leaves a dead zone on the right. */
            '& .MuiToggleButtonGroup-grouped': {
              border: 0,
              borderRadius: '10px !important',
              mx: 0,
              flex: '1 1 0',
              minWidth: 0,
              maxWidth: '50%',
              justifyContent: 'center',
              py: compactAuthFields ? 0.85 : 1.15,
              textTransform: 'none',
              fontWeight: 800,
              fontSize: '0.9375rem',
              color: 'text.secondary',
              '&.Mui-selected': {
                bgcolor: 'background.paper',
                color: 'primary.main',
                boxShadow: `0 1px 4px ${alpha(theme.palette.common.black, 0.08)}`,
                '&:hover': { bgcolor: 'background.paper' },
              },
            },
          }}
        >
          <ToggleButton value="login">Sign in</ToggleButton>
          <ToggleButton value="register">Register</ToggleButton>
        </ToggleButtonGroup>
      </DialogTitle>

      <DialogContent
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-8 sm:pb-6 sm:pt-3"
        sx={{
          WebkitOverflowScrolling: 'touch',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {tab === 'login' ? (
          <Stack
            component="form"
            spacing={compactAuthFields ? 1.25 : 2}
            onSubmit={onLogin}
            noValidate
            sx={{
              width: '100%',
              /** Sign-in has no wizard header unlike Register — shrink labels sit above the input; reserve space so they aren't clipped by DialogContent overflow (registration fields sit lower naturally). */
              pt: { xs: 2.75, sm: 2 },
            }}
          >
            {lf.formState.errors.root && (
              <Alert severity="error" icon={<ErrorOutlineRounded />} sx={{ borderRadius: 2 }}>
                {lf.formState.errors.root.message}
              </Alert>
            )}
            <TextField
              size="small"
              label="Email"
              type="email"
              autoComplete="email"
              fullWidth
              margin="none"
              {...lf.register('email')}
              error={!!lf.formState.errors.email}
              helperText={lf.formState.errors.email?.message ?? 'Used for bookings and receipts.'}
              sx={compactFieldSx}
            />
            <TextField
              size="small"
              label="Password"
              type={showLoginPassword ? 'text' : 'password'}
              autoComplete="current-password"
              fullWidth
              margin="none"
              {...lf.register('password')}
              error={!!lf.formState.errors.password}
              helperText={lf.formState.errors.password?.message}
              sx={compactFieldSx}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowLoginPassword((p) => !p)}
                      edge="end"
                      size="small"
                      className="min-h-touch min-w-touch rounded-lg"
                    >
                      {showLoginPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -0.5 }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => showInfo('Password reset will be available when the live API is connected.')}
                sx={{ fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Forgot password?
              </Link>
            </Box>
            <Controller
              name="rememberMe"
              control={lf.control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox checked={Boolean(field.value)} onChange={(_, c) => field.onChange(c)} color="primary" />}
                  label={<Typography variant="body2">Remember me on this device</Typography>}
                />
              )}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loginSubmitting}
              className="min-h-touch w-full rounded-2xl !font-semibold"
              sx={{
                py: compactAuthFields ? 1.05 : 1.35,
                fontWeight: 700,
                borderRadius: 2,
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.35)}`,
                transition: 'transform 0.15s ease, box-shadow 0.2s ease',
                '@media (hover: hover)': {
                  '&:hover:not(:disabled)': {
                    transform: 'translateY(-1px)',
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.42)}`,
                  },
                },
              }}
            >
              {loginSubmitting ? (
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                  <CircularProgress size={22} color="inherit" thickness={5} />
                  <span>Signing you in…</span>
                </Stack>
              ) : (
                'Sign in'
              )}
            </Button>
          </Stack>
        ) : (
          <Stack
            component="form"
            aria-label="Registration form"
            onSubmit={(e) => {
              if (registerWizardStepRef.current !== REGISTER_LAST_STEP_INDEX) {
                e.preventDefault()
                return
              }
              void finalizeRegisterSubmit(e)
            }}
            noValidate
            spacing={compactAuthFields ? 1.25 : 2}
            sx={{ width: '100%' }}
          >
            <Box sx={{ mb: 0.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="caption" color="primary" fontWeight={800} letterSpacing="0.06em" textTransform="uppercase">
                  Step {registerStep + 1} of {REGISTER_STEP_LABELS.length}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  {REGISTER_STEP_LABELS[registerStep]}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={((registerStep + 1) / REGISTER_STEP_LABELS.length) * 100}
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
                {REGISTER_STEP_LABELS.map((label, i) => (
                  <Box
                    key={label}
                    sx={{
                      width: i === registerStep ? 16 : 5,
                      height: 6,
                      borderRadius: 999,
                      bgcolor: i <= registerStep ? 'primary.main' : alpha(theme.palette.grey[600], theme.palette.mode === 'light' ? 0.2 : 0.35),
                      transition: 'width 0.25s ease, background-color 0.2s ease',
                    }}
                    aria-hidden
                  />
                ))}
              </Stack>
            </Box>

            {rf.formState.errors.root && (
              <Alert severity="error" icon={<ErrorOutlineRounded />} sx={{ borderRadius: 2 }}>
                {rf.formState.errors.root.message}
              </Alert>
            )}

            <Box
              className={
                registerStep === 0
                  ? 'relative min-h-0 py-1 sm:min-h-[260px]'
                  : 'relative min-h-[min(38dvh,220px)] sm:min-h-[260px]'
              }
              sx={{ position: 'relative' }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {registerStep === 0 && (
                  <motion.div
                    key="reg-role"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    style={slideSx}
                  >
                    <Controller
                      name="accountRole"
                      control={rf.control}
                      rules={{
                        validate: (value) => {
                          const raw = typeof value === 'string' ? value : ''
                          const r = registerStepRoleSchema.safeParse({
                            accountRole: raw as RegisterFormValues['accountRole'],
                          })
                          return r.success ? true : r.error.issues[0]?.message ?? 'Please select your role to continue.'
                        },
                      }}
                      render={({ field }) => (
                        <FormControl component="fieldset" variant="standard" error={!!rf.formState.errors.accountRole} sx={{ width: '100%' }}>
                          <FormLabel id="account-role-label" component="legend" sx={{ fontWeight: 700, color: 'text.primary', mb: { xs: 1, sm: 1.25 }, fontSize: '0.875rem' }}>
                            Choose your role
                          </FormLabel>
                          <Stack role="radiogroup" aria-labelledby="account-role-label" spacing={{ xs: 1, sm: 1.5 }}>
                            <RoleCard
                              radioName={field.name}
                              radioValue="host"
                              selected={field.value === 'host'}
                              icon={<StorefrontOutlined sx={{ fontSize: 26 }} />}
                              title="Host"
                              description="List vehicles you own, manage bookings, and earn when others rent your fleet."
                              onCommitted={() => {
                                field.onChange('host')
                                rf.clearErrors('accountRole')
                              }}
                              onBlurInput={field.onBlur}
                            />
                            <RoleCard
                              radioName={field.name}
                              radioValue="renter"
                              selected={field.value === 'renter'}
                              icon={<PersonOutline sx={{ fontSize: 26 }} />}
                              title="Renter"
                              description="Browse cars and motorcycles, book trips, and message hosts—all in one place."
                              onCommitted={() => {
                                field.onChange('renter')
                                rf.clearErrors('accountRole')
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
                                rf.clearErrors('accountRole')
                              }}
                              onBlurInput={field.onBlur}
                            />
                          </Stack>
                          {rf.formState.errors.accountRole && (
                            <FormHelperText error sx={{ mx: 0, mt: 1.25 }}>
                              {rf.formState.errors.accountRole.message}
                            </FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />
                  </motion.div>
                )}

                {registerStep === 1 && (
                  <motion.div
                    key="reg-email"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    style={slideSx}
                  >
                    <Stack spacing={1}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        Verified email
                      </Typography>
                      <TextField
                        size="small"
                        label="Email"
                        type="email"
                        autoComplete="email"
                        fullWidth
                        margin="none"
                        {...rf.register('email', {
                          validate: (value) => {
                            const r = registerStepEmailSchema.safeParse({ email: String(value ?? '').trim() })
                            return r.success ? true : r.error.issues[0]?.message ?? 'Use a valid email address'
                          },
                          onChange: () => rf.clearErrors('email'),
                        })}
                        error={!!rf.formState.errors.email}
                        helperText={
                          rf.formState.errors.email?.message ?? 'We’ll send booking updates and receipts to this address.'
                        }
                        sx={compactFieldSx}
                      />
                    </Stack>
                  </motion.div>
                )}

                {registerStep === 2 && (
                  <motion.div
                    key="reg-password"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    style={slideSx}
                  >
                    <Stack spacing={2}>
                      <TextField
                        size="small"
                        label="Password"
                        type={showRegPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        fullWidth
                        margin="none"
                        {...rf.register('password', {
                          onChange: () => {
                            rf.clearErrors('password')
                            rf.clearErrors('confirmPassword')
                          },
                        })}
                        error={!!rf.formState.errors.password}
                        helperText={rf.formState.errors.password?.message ?? 'At least 8 characters.'}
                        sx={compactFieldSx}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                                onClick={() => setShowRegPassword((p) => !p)}
                                edge="end"
                                size="small"
                                className="min-h-touch min-w-touch rounded-lg"
                              >
                                {showRegPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                      {regPassword ? (
                        <Stack spacing={0.75}>
                          <LinearProgress
                            variant="determinate"
                            value={strengthBarValue(strength.level)}
                            sx={{
                              height: 5,
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.divider, 0.35),
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 2,
                                bgcolor: strengthColor(strength.level, theme),
                              },
                            }}
                          />
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            {strength.level !== 'empty' && strength.level !== 'weak' && (
                              <CheckCircleRounded sx={{ fontSize: 16, color: 'success.main' }} />
                            )}
                            {strength.level === 'weak' && <WarningAmberRounded sx={{ fontSize: 16, color: 'warning.main' }} />}
                            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.35 }}>
                              {strength.label}
                            </Typography>
                          </Stack>
                        </Stack>
                      ) : null}
                      <TextField
                        size="small"
                        label="Confirm password"
                        type={showRegConfirm ? 'text' : 'password'}
                        autoComplete="new-password"
                        fullWidth
                        margin="none"
                        {...rf.register('confirmPassword', {
                          onChange: () => rf.clearErrors('confirmPassword'),
                        })}
                        error={!!rf.formState.errors.confirmPassword}
                        helperText={rf.formState.errors.confirmPassword?.message}
                        sx={compactFieldSx}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label={showRegConfirm ? 'Hide password' : 'Show password'}
                                onClick={() => setShowRegConfirm((p) => !p)}
                                edge="end"
                                size="small"
                                className="min-h-touch min-w-touch rounded-lg"
                              >
                                {showRegConfirm ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Stack>
                  </motion.div>
                )}

                {registerStep === 3 && (
                  <motion.div
                    key="reg-profile"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    style={slideSx}
                  >
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
                          margin="none"
                          {...rf.register('firstName', { onChange: () => rf.clearErrors('firstName') })}
                          error={!!rf.formState.errors.firstName}
                          helperText={rf.formState.errors.firstName?.message ?? 'As on your ID or license.'}
                          sx={compactFieldSx}
                        />
                        <TextField
                          size="small"
                          label="Last name"
                          autoComplete="family-name"
                          fullWidth
                          margin="none"
                          {...rf.register('lastName', { onChange: () => rf.clearErrors('lastName') })}
                          error={!!rf.formState.errors.lastName}
                          helperText={rf.formState.errors.lastName?.message}
                          sx={compactFieldSx}
                        />
                      </Stack>
                      <Controller
                        name="phone"
                        control={rf.control}
                        render={({ field }) => (
                          <PhilippineNationalMobileTextField
                            size="small"
                            label="Mobile number"
                            fullWidth
                            margin="none"
                            value={field.value}
                            onChange={(digits) => {
                              field.onChange(digits)
                              rf.clearErrors('phone')
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            inputRef={field.ref}
                            error={!!rf.formState.errors.phone}
                            helperText={
                              rf.formState.errors.phone?.message ??
                              '10 digits after +63 starting with 9 (you can paste 09…).'
                            }
                            sx={compactFieldSx}
                          />
                        )}
                      />
                      <Controller
                        name="licenseNumber"
                        control={rf.control}
                        render={({ field }) => (
                          <PhilippineDriversLicenseTextField
                            size="small"
                            label="Driver’s license number"
                            fullWidth
                            margin="none"
                            value={field.value}
                            onChange={(v) => {
                              field.onChange(v)
                              rf.clearErrors('licenseNumber')
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            inputRef={field.ref}
                            error={!!rf.formState.errors.licenseNumber}
                            helperText={
                              rf.formState.errors.licenseNumber?.message ??
                              'LTO number formats as you type for long IDs (hyphens).'
                            }
                            sx={compactFieldSx}
                          />
                        )}
                      />
                    </Stack>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>

            <DialogActions sx={{ px: 0, pt: 0, flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
              <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                {registerStep > 0 && (
                  <Button type="button" variant="outlined" color="inherit" onClick={goRegisterBack} sx={{ flex: 1, py: 1.2, fontWeight: 700 }}>
                    Back
                  </Button>
                )}
                {registerStep < REGISTER_LAST_STEP_INDEX ? (
                  <Button
                    type="button"
                    variant={canProceedCurrentStep ? 'contained' : 'outlined'}
                    color={canProceedCurrentStep ? 'primary' : 'inherit'}
                    disabled={!canProceedCurrentStep || registerSubmitting}
                    onClick={() => void goRegisterNext()}
                    className="min-h-touch flex-[2] rounded-2xl font-bold"
                    sx={{
                      flex: 2,
                      py: 1.2,
                      fontWeight: 700,
                      borderRadius: 2,
                      textTransform: 'none',
                      transition: 'background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, transform 0.15s ease',
                      ...(canProceedCurrentStep
                        ? {
                            boxShadow: `0 10px 24px ${alpha(theme.palette.primary.main, 0.32)}`,
                            '&:hover': { boxShadow: `0 14px 30px ${alpha(theme.palette.primary.main, 0.38)}` },
                          }
                        : {
                            borderColor: alpha(theme.palette.divider, 0.85),
                            color: alpha(theme.palette.text.secondary, 0.65),
                            bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'light' ? 0.65 : 0.4),
                            backdropFilter: 'blur(8px)',
                            '&.Mui-disabled': {
                              opacity: 1,
                              borderColor: alpha(theme.palette.divider, 0.75),
                              color: alpha(theme.palette.text.disabled, 0.75),
                              bgcolor: alpha(theme.palette.grey[500], theme.palette.mode === 'light' ? 0.09 : 0.12),
                              boxShadow: 'none',
                            },
                          }),
                    }}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!canSubmitRegistration || registerSubmitting}
                    sx={{
                      flex: 1,
                      py: 1.2,
                      fontWeight: 700,
                      borderRadius: 2,
                      boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.35)}`,
                    }}
                  >
                    {registerSubmitting ? (
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                        <CircularProgress size={22} color="inherit" thickness={5} />
                        <span>Creating your account…</span>
                      </Stack>
                    ) : (
                      'Create account'
                    )}
                  </Button>
                )}
              </Stack>
            </DialogActions>
          </Stack>
        )}

        {tab === 'login' ? (
          <SocialGoogleLogin useFirebase={firebaseGoogleEnabled} onSignedIn={handleGoogleSignIn} />
        ) : null}

        <Box
          sx={{
            mt: 2.5,
            pt: 2,
            borderTop: 1,
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary" component="span" sx={{ mr: 0.75 }}>
            {tab === 'login' ? 'New to Rentara?' : 'Already registered?'}
          </Typography>
          <Link
            component="button"
            type="button"
            variant="body2"
            onClick={() => {
              setTab(tab === 'login' ? 'register' : 'login')
              setRegisterStep(0)
            }}
            sx={{ fontWeight: 800, textDecoration: 'none', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
          >
            {tab === 'login' ? 'Create an account' : 'Sign in instead'}
          </Link>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
