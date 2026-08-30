import { zodResolver } from '@hookform/resolvers/zod'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import Close from '@mui/icons-material/Close'
import DirectionsCarOutlined from '@mui/icons-material/DirectionsCarOutlined'
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded'
import Google from '@mui/icons-material/Google'
import PersonOutline from '@mui/icons-material/PersonOutline'
import RadioButtonUnchecked from '@mui/icons-material/RadioButtonUnchecked'
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
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
  Slide,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { AnimatePresence, motion, useAnimation } from 'framer-motion'
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'

import type { SlideProps } from '@mui/material/Slide'
import type { AccountRole } from '@/types'
import { MOBILE_APP_MAX_WIDTH_PX } from '@/constants/mobileShell'
import {
  firebaseAuthAvailable,
  loginWithCredentials,
  registerWithCredentials,
  signInWithGoogleMockViaStore,
  signInWithGoogleViaService,
} from '@/features/auth/services/authService'
import { registerHardwareBackHandler } from '@/webview/nativeBridge'
import type { RegisterAccountRole } from '@/store/useAuthStore'
import { useT } from '@/hooks/useT'
import { useAuthStore } from '@/store/useAuthStore'
import { useSnackbarStore } from '@/store/useSnackbarStore'
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
import { getPasswordStrength, PASSWORD_RULES } from './passwordStrength'

const REMEMBER_EMAIL_KEY = 'rentara-remember-email'

/** Persists role + email across tab changes / refresh while in the same browser session. Cleared on successful signup. */
const REGISTRATION_SESSION_KEY = 'rentara-registration-draft'

const REGISTER_STEP_LABELS = ['Your role', 'Email', 'Password', 'About you'] as const
const REGISTER_LAST_STEP_INDEX = REGISTER_STEP_LABELS.length - 1

const AuthBottomSheetSlide = forwardRef(function AuthBottomSheetSlide(props: SlideProps, ref: SlideProps['ref']) {
  return <Slide direction="up" ref={ref} {...props} />
})

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
  const t = useT()
  const [loading, setLoading] = useState(false)
  const gBlue = '#4285F4'

  return (
    <Box sx={{ mt: 2 }}>
      <Stack spacing={1.25}>
        <Stack direction="row" alignItems="center" spacing={1.5} justifyContent="center">
          <Divider sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {t('auth.orContinueWith')}
          </Typography>
          <Divider sx={{ flex: 1 }} />
        </Stack>
        <Button
          type="button"
          fullWidth
          variant="outlined"
          disabled={loading}
          startIcon={loading ? undefined : <Google sx={{ color: gBlue, fontSize: 22 }} />}
          sx={{
            py: 1.2,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
            borderColor: 'divider',
            color: 'text.primary',
            bgcolor: 'background.paper',
            '&:hover': {
              borderColor: alpha(gBlue, 0.45),
              bgcolor: alpha(gBlue, 0.04),
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
              <CircularProgress size={22} thickness={5} />
              <span>{t('auth.connecting')}</span>
            </Stack>
          ) : (
            t('auth.continueGoogle')
          )}
        </Button>
        {import.meta.env.DEV && (
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', lineHeight: 1.45, px: 0.5 }}>
            {useFirebase
              ? 'Dev: Firebase Google OAuth is configured.'
              : 'Dev: demo Google profile (set VITE_FIREBASE_* for real OAuth).'}
          </Typography>
        )}
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
  const t = useT()
  const theme = useTheme()
  const isBottomSheet = useMediaQuery(theme.breakpoints.down('md'))
  const isCompactPhone = useMediaQuery(theme.breakpoints.down('sm'))
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
  const roleAdvanceTimerRef = useRef<number | null>(null)
  const loginShake = useAnimation()
  const [loginEmailTouched, setLoginEmailTouched] = useState(false)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showRegConfirm, setShowRegConfirm] = useState(false)

  const loginWithFirebaseUser = useAuthStore((s) => s.loginWithFirebaseUser)
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
  const regConfirmPassword = useWatch({ control: rf.control, name: 'confirmPassword' })
  const strength = getPasswordStrength(regPassword ?? '')
  const regDraft = useWatch({ control: rf.control })
  const loginEmail = useWatch({ control: lf.control, name: 'email' })
  const loginPassword = useWatch({ control: lf.control, name: 'password' })
  const loginRememberMe = useWatch({ control: lf.control, name: 'rememberMe' })
  const loginEmailValid = loginSchema.pick({ email: true }).safeParse({ email: loginEmail ?? '' }).success
  const loginFormValid = loginSchema.safeParse({
    email: loginEmail ?? '',
    password: loginPassword ?? '',
    rememberMe: Boolean(loginRememberMe),
  }).success

  useEffect(() => {
    registerWizardStepRef.current = registerStep
  }, [registerStep])

  useEffect(() => {
    return () => {
      if (roleAdvanceTimerRef.current) window.clearTimeout(roleAdvanceTimerRef.current)
    }
  }, [])

  const scheduleRoleAdvance = useCallback(() => {
    if (roleAdvanceTimerRef.current) window.clearTimeout(roleAdvanceTimerRef.current)
    roleAdvanceTimerRef.current = window.setTimeout(() => {
      setRegisterStep(1)
      roleAdvanceTimerRef.current = null
    }, 250)
  }, [])

  useEffect(() => {
    if (!open) return
    return registerHardwareBackHandler(() => {
      onClose()
      return true
    })
  }, [open, onClose])

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
    setLoginEmailTouched(false)
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

  const goRegisterToStep = (index: number) => {
    if (index >= registerStep || index < 0) return
    if (roleAdvanceTimerRef.current) {
      window.clearTimeout(roleAdvanceTimerRef.current)
      roleAdvanceTimerRef.current = null
    }
    rf.clearErrors()
    setRegisterStep(index)
  }

  const onLogin = lf.handleSubmit(async (data) => {
    lf.clearErrors('root')
    await new Promise((r) => setTimeout(r, 380))
    try {
      loginWithCredentials(data.email, data.password)
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
      void loginShake.start({
        x: [0, -10, 10, -6, 6, 0],
        transition: { duration: 0.42 },
      })
    }
  })

  const firebaseGoogleEnabled = useMemo(() => firebaseAuthAvailable(), [])
  const handleGoogleSignIn = useCallback(async () => {
    lf.clearErrors('root')
    if (firebaseGoogleEnabled) {
      try {
        const profile = await signInWithGoogleViaService()
        loginWithFirebaseUser(profile)
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
      signInWithGoogleMockViaStore()
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
      registerWithCredentials({
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
  const mqMediumHeight = useMediaQuery('(max-height:920px)')
  const mqNarrowWidth = useMediaQuery('(max-width:420px)')
  const compactAuthFields = isCompactPhone || mqShortViewport || mqNarrowWidth
  /** Shared density for login + register so chrome does not jump when switching tabs. */
  const compactChrome = compactAuthFields || mqMediumHeight
  const formGap = compactChrome ? 1.5 : 2
  const authCtaPy = compactChrome ? 1.15 : 1.25
  const compactFieldSx = useMemo(() => authOutlinedFieldSx(theme, compactAuthFields), [theme, compactAuthFields])
  const dialogMaxHeight = isBottomSheet
    ? 'min(92dvh, calc(100vh - 8px))'
    : 'min(calc(100dvh - 32px), calc(100vh - 32px))'

  const slideSx = { width: '100%' }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={isBottomSheet ? false : 'sm'}
      fullWidth={!isBottomSheet}
      fullScreen={false}
      scroll="paper"
      disableRestoreFocus
      aria-labelledby="auth-dialog-title"
      /** Sit above AppBar (1100) + mobile bottom nav so the page never shows through as “ghost” UI. */
      sx={{
        zIndex: (t) => t.zIndex.modal + 20,
        ...(isBottomSheet
          ? {
              '& .MuiDialog-container': {
                alignItems: 'flex-end',
              },
              '& .MuiDialog-paper': {
                marginBottom: 'env(safe-area-inset-bottom, 0px)',
              },
            }
          : {}),
      }}
      TransitionComponent={isBottomSheet ? AuthBottomSheetSlide : undefined}
      BackdropProps={{
        sx: {
          /** Solid-ish dim without `backdrop-filter` on sheets — blur over scrolling content is expensive on WebViews. */
          backgroundColor: alpha(theme.palette.common.black, isBottomSheet ? 0.5 : 0.58),
          backdropFilter: isBottomSheet ? 'none' : 'blur(6px)',
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
          'flex flex-col overflow-hidden ' +
          (isBottomSheet ? 'w-full rounded-none sm:rounded-none' : 'rounded-3xl'),
        sx: {
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          /** Fully opaque surface — gradients with transparent stops let the page show through on some mobile GPUs. */
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          position: 'relative',
          maxHeight: dialogMaxHeight,
          ...(isBottomSheet
            ? {
                m: 0,
                mx: 'auto',
                width: '100%',
                maxWidth: MOBILE_APP_MAX_WIDTH_PX,
                border: `1px solid ${theme.palette.divider}`,
                borderBottom: 'none',
                boxShadow: `0 -12px 48px ${alpha(theme.palette.common.black, 0.14)}`,
              }
            : {
                borderRadius: 3,
                m: 2,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: `0 24px 48px -12px ${alpha(theme.palette.common.black, 0.2)}`,
              }),
        },
      }}
    >
      <DialogTitle
        id="auth-dialog-title"
        className="relative shrink-0 overflow-x-hidden px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-8 sm:pb-2.5 sm:pt-5"
        sx={{
          position: 'relative',
          overflowX: 'hidden',
          flexShrink: 0,
        }}
      >
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: { xs: 1.25, sm: 1.5 } }}
        >
          <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
            <Typography
              variant="h6"
              className="text-fluid-heading font-extrabold tracking-tight leading-snug"
            >
              {tab === 'login' ? 'Welcome back' : 'Create your account'}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, display: 'block', mt: 0.25 }}
              className="text-[0.7rem] sm:text-[0.75rem]"
            >
              RentaraH — Philippines rentals
            </Typography>
          </Box>
          <IconButton
            aria-label={t('auth.close')}
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
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            p: 0.5,
            borderRadius: 2.5,
            bgcolor: (t) => alpha(t.palette.primary.main, t.palette.mode === 'light' ? 0.08 : 0.15),
          }}
        >
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              top: 4,
              bottom: 4,
              left: tab === 'login' ? 4 : 'calc(4px + (100% - 8px) / 2)',
              width: 'calc((100% - 8px) / 2)',
              borderRadius: 2,
              bgcolor: 'background.paper',
              boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.1)}`,
              transition: 'left 0.22s ease',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
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
              position: 'relative',
              zIndex: 1,
              p: 0,
              gap: 0,
              display: 'flex',
              width: '100%',
              border: 'none',
              bgcolor: 'transparent',
              boxShadow: 'none',
              /** Equal halves — default ToggleButton minWidth leaves a dead zone on the right. */
              '& .MuiToggleButtonGroup-grouped': {
                border: '0 !important',
                margin: '0 !important',
                borderRadius: '16px !important',
                flex: '1 1 0',
                minWidth: 0,
                maxWidth: '50%',
                justifyContent: 'center',
                py: compactAuthFields ? 0.85 : 1.15,
                textTransform: 'none',
                fontWeight: 800,
                fontSize: '0.9375rem',
                color: 'text.secondary',
                bgcolor: 'transparent',
                boxShadow: 'none',
                '&.Mui-selected': {
                  bgcolor: 'transparent',
                  color: 'primary.main',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: 'transparent' },
                },
                '&:hover': { bgcolor: alpha(theme.palette.common.black, 0.02) },
              },
            }}
          >
            <ToggleButton value="login">{t('auth.signIn')}</ToggleButton>
            <ToggleButton value="register">{t('auth.register')}</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </DialogTitle>

      <DialogContent
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 pb-0 pt-2 sm:px-8 sm:pt-2.5"
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          pb: 0,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
        {tab === 'login' ? (
          <motion.div
            key="auth-login"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{ width: '100%' }}
          >
          <motion.div animate={loginShake}>
          <Stack
            component="form"
            spacing={formGap}
            onSubmit={onLogin}
            noValidate
            sx={{
              width: '100%',
              pt: 0.75,
            }}
          >
            {lf.formState.errors.root && (
              <Alert severity="error" icon={<ErrorOutlineRounded />} sx={{ borderRadius: 2 }}>
                {lf.formState.errors.root.message}
              </Alert>
            )}
            <TextField
              size="small"
              label={t('auth.email')}
              type="email"
              autoComplete="email"
              fullWidth
              margin="none"
              {...lf.register('email', {
                onBlur: () => setLoginEmailTouched(true),
              })}
              error={!!lf.formState.errors.email || (loginEmailTouched && Boolean(loginEmail) && !loginEmailValid)}
              helperText={
                lf.formState.errors.email?.message
                  ?? (loginEmailTouched && loginEmail && !loginEmailValid
                    ? 'That doesn’t look like a valid email'
                    : loginEmailTouched && loginEmailValid
                      ? 'Looks good'
                      : 'Used for bookings and receipts.')
              }
              sx={{
                ...compactFieldSx,
                ...(loginEmailTouched && loginEmailValid && !lf.formState.errors.email
                  ? { '& .MuiFormHelperText-root': { color: 'success.main' } }
                  : {}),
              }}
              InputProps={{
                endAdornment:
                  loginEmailTouched && loginEmail ? (
                    <InputAdornment position="end">
                      {loginEmailValid ? (
                        <CheckCircleRounded sx={{ color: 'success.main', fontSize: 20 }} aria-hidden />
                      ) : (
                        <ErrorOutlineRounded sx={{ color: 'error.main', fontSize: 20 }} aria-hidden />
                      )}
                    </InputAdornment>
                  ) : undefined,
              }}
            />
            <TextField
              size="small"
              label={t('auth.password')}
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
                      aria-label={showLoginPassword ? t('auth.hidePassword') : t('auth.showPassword')}
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
                  label={<Typography variant="body2">{t('auth.rememberMe')}</Typography>}
                />
              )}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={!loginFormValid || loginSubmitting}
              className="min-h-touch w-full rounded-2xl !font-semibold"
              sx={{
                py: authCtaPy,
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
                  <span>{t('auth.signingIn')}</span>
                </Stack>
              ) : (
                t('auth.signIn')
              )}
            </Button>
          </Stack>
          </motion.div>
          <SocialGoogleLogin useFirebase={firebaseGoogleEnabled} onSignedIn={handleGoogleSignIn} />
          </motion.div>
        ) : (
          <motion.div
            key="auth-register"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{ width: '100%' }}
          >
          <Stack
            component="form"
            aria-label={t('auth.registrationForm')}
            onSubmit={(e) => {
              if (registerWizardStepRef.current !== REGISTER_LAST_STEP_INDEX) {
                e.preventDefault()
                return
              }
              void finalizeRegisterSubmit(e)
            }}
            noValidate
            spacing={formGap}
            sx={{ width: '100%', pt: 0.75 }}
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
              <Stack direction="row" spacing={0.25} justifyContent="center" alignItems="center" sx={{ mt: 0.5 }}>
                {REGISTER_STEP_LABELS.map((label, i) => {
                  const canJumpBack = i < registerStep
                  const filled = i <= registerStep
                  return (
                    <Box
                      key={label}
                      component={canJumpBack ? 'button' : 'span'}
                      type={canJumpBack ? 'button' : undefined}
                      aria-label={canJumpBack ? `Go back to ${label}` : undefined}
                      aria-current={i === registerStep ? 'step' : undefined}
                      onClick={canJumpBack ? () => goRegisterToStep(i) : undefined}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 32,
                        minHeight: 32,
                        p: 0,
                        border: 'none',
                        bgcolor: 'transparent',
                        cursor: canJumpBack ? 'pointer' : 'default',
                        '&:active': canJumpBack ? { transform: 'scale(0.92)' } : undefined,
                      }}
                    >
                      <Box
                        sx={{
                          width: i === registerStep ? 18 : 8,
                          height: 8,
                          borderRadius: 999,
                          bgcolor: filled
                            ? 'primary.main'
                            : alpha(theme.palette.grey[600], theme.palette.mode === 'light' ? 0.2 : 0.35),
                          transition: 'width 0.25s ease, background-color 0.2s ease',
                        }}
                      />
                    </Box>
                  )
                })}
              </Stack>
            </Box>

            {rf.formState.errors.root && (
              <Alert severity="error" icon={<ErrorOutlineRounded />} sx={{ borderRadius: 2 }}>
                {rf.formState.errors.root.message}
              </Alert>
            )}

            <Box sx={{ position: 'relative' }}>
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
                          <FormLabel id="account-role-label" component="legend" sx={{ fontWeight: 700, color: 'text.primary', mb: compactChrome ? 0.75 : 1.25, fontSize: '0.875rem' }}>
                            {t('auth.chooseRole')}
                          </FormLabel>
                          <Stack role="radiogroup" aria-labelledby="account-role-label" spacing={compactChrome ? 1 : 1.25}>
                            <RoleCard
                              compact={compactChrome}
                              radioName={field.name}
                              radioValue="host"
                              selected={field.value === 'host'}
                              icon={<StorefrontOutlined sx={{ fontSize: compactChrome ? 22 : 26 }} />}
                              title={t('auth.host')}
                              description={t('auth.hostDesc')}
                              onCommitted={() => {
                                field.onChange('host')
                                rf.clearErrors('accountRole')
                                scheduleRoleAdvance()
                              }}
                              onBlurInput={field.onBlur}
                            />
                            <RoleCard
                              compact={compactChrome}
                              radioName={field.name}
                              radioValue="renter"
                              selected={field.value === 'renter'}
                              icon={<PersonOutline sx={{ fontSize: compactChrome ? 22 : 26 }} />}
                              title={t('auth.renter')}
                              description={t('auth.renterDesc')}
                              onCommitted={() => {
                                field.onChange('renter')
                                rf.clearErrors('accountRole')
                                scheduleRoleAdvance()
                              }}
                              onBlurInput={field.onBlur}
                            />
                            <RoleCard
                              compact={compactChrome}
                              radioName={field.name}
                              radioValue="both"
                              selected={field.value === 'both'}
                              icon={<DirectionsCarOutlined sx={{ fontSize: compactChrome ? 22 : 26 }} />}
                              title={t('auth.both')}
                              description={t('auth.bothDesc')}
                              onCommitted={() => {
                                field.onChange('both')
                                rf.clearErrors('accountRole')
                                scheduleRoleAdvance()
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
                    <Stack spacing={formGap}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        Verified email
                      </Typography>
                      <TextField
                        size="small"
                        label={t('auth.email')}
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
                    <Stack spacing={formGap}>
                      <TextField
                        size="small"
                        label={t('auth.password')}
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
                                aria-label={showRegPassword ? t('auth.hidePassword') : t('auth.showPassword')}
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
                          {PASSWORD_RULES.map((rule) => {
                            const met = strength.rules[rule.key]
                            return (
                              <Stack key={rule.key} direction="row" spacing={0.75} alignItems="center">
                                {met ? (
                                  <CheckCircleRounded sx={{ fontSize: 16, color: 'success.main' }} />
                                ) : (
                                  <RadioButtonUnchecked sx={{ fontSize: 16, color: 'action.disabled' }} />
                                )}
                                <Typography
                                  variant="caption"
                                  sx={{
                                    lineHeight: 1.35,
                                    fontWeight: met ? 700 : 500,
                                    color: met ? 'success.dark' : 'text.secondary',
                                  }}
                                >
                                  {rule.label}
                                </Typography>
                              </Stack>
                            )
                          })}
                          {strength.label ? (
                            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.35, pt: 0.25 }}>
                              {strength.label}
                            </Typography>
                          ) : null}
                        </Stack>
                      ) : null}
                      <TextField
                        size="small"
                        label={t('auth.confirmPassword')}
                        type={showRegConfirm ? 'text' : 'password'}
                        autoComplete="new-password"
                        fullWidth
                        margin="none"
                        {...rf.register('confirmPassword', {
                          onChange: () => rf.clearErrors('confirmPassword'),
                        })}
                        error={
                          !!rf.formState.errors.confirmPassword ||
                          Boolean(regConfirmPassword && regPassword && regConfirmPassword !== regPassword)
                        }
                        helperText={
                          rf.formState.errors.confirmPassword?.message
                            ?? (regConfirmPassword
                              ? regConfirmPassword === (regPassword ?? '')
                                ? 'Passwords match'
                                : 'Passwords need to match'
                              : undefined)
                        }
                        sx={{
                          ...compactFieldSx,
                          ...(regConfirmPassword &&
                          regConfirmPassword === (regPassword ?? '') &&
                          !rf.formState.errors.confirmPassword
                            ? { '& .MuiFormHelperText-root': { color: 'success.main' } }
                            : {}),
                        }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label={showRegConfirm ? t('auth.hidePassword') : t('auth.showPassword')}
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
                    <Stack spacing={formGap}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        Your details
                      </Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <TextField
                          size="small"
                          label={t('auth.firstName')}
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
                          label={t('auth.lastName')}
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
                            label={t('auth.mobile')}
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
                            label={t('auth.license')}
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

            <DialogActions sx={{ px: 0, pt: 0, pb: 0, flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
              <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                {registerStep > 0 && (
                  <Button type="button" variant="outlined" color="inherit" onClick={goRegisterBack} sx={{ flex: 1, py: authCtaPy, fontWeight: 700 }}>
                    {t('auth.back')}
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
                      py: authCtaPy,
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
                    {t('auth.continue')}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!canSubmitRegistration || registerSubmitting}
                    sx={{
                      flex: 1,
                      py: authCtaPy,
                      fontWeight: 700,
                      borderRadius: 2,
                      boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.35)}`,
                    }}
                  >
                    {registerSubmitting ? (
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                        <CircularProgress size={22} color="inherit" thickness={5} />
                        <span>{t('auth.creating')}</span>
                      </Stack>
                    ) : (
                      t('auth.createAccount')
                    )}
                  </Button>
                )}
              </Stack>
            </DialogActions>
          </Stack>
          </motion.div>
        )}
        </AnimatePresence>

        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            zIndex: 1,
            mt: 2,
            pt: 1.5,
            pb: 'max(1rem, env(safe-area-inset-bottom))',
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary" component="span" sx={{ mr: 0.75 }}>
            {tab === 'login' ? 'New to RentaraH?' : 'Already registered?'}
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
            {tab === 'login' ? t('auth.createAnAccount') : t('auth.signInInstead')}
          </Link>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
