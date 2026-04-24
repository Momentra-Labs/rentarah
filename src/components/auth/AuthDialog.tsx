import { zodResolver } from '@hookform/resolvers/zod'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import Facebook from '@mui/icons-material/Facebook'
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
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  IconButton,
  InputAdornment,
  LinearProgress,
  Link,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'

import type { RegisterAccountRole } from '../../store/useAuthStore'
import { useAuthStore } from '../../store/useAuthStore'
import { useSnackbarStore } from '../../store/useSnackbarStore'
import {
  loginSchema,
  type LoginFormValues,
  registerFullSchema,
  registerStep0Schema,
  registerStep1Schema,
  type RegisterFormValues,
} from './authSchemas'
import { getPasswordStrength, type PasswordStrengthLevel } from './passwordStrength'

const REMEMBER_EMAIL_KEY = 'rentara-remember-email'

const REGISTER_STEP_LABELS = ['Account', 'About you', 'How you’ll use Rentara'] as const

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

/** Keeps login & register outlined fields visually aligned (same hover/focus as MUI defaults, no extra InputProps on email). */
function authOutlinedFieldSx(theme: Theme) {
  return {
    '& .MuiOutlinedInput-root': {
      '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.45) },
    },
  } as const
}

function SocialLoginPlaceholder() {
  return (
    <Stack spacing={1} sx={{ mt: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', fontWeight: 600 }}>
        Or continue with
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          disabled
          startIcon={<Google />}
          sx={{
            borderColor: 'divider',
            color: 'text.secondary',
            py: 1.1,
            '&.Mui-disabled': { opacity: 0.85 },
          }}
        >
          Google
        </Button>
        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          disabled
          startIcon={<Facebook />}
          sx={{
            borderColor: 'divider',
            color: 'text.secondary',
            py: 1.1,
            '&.Mui-disabled': { opacity: 0.85 },
          }}
        >
          Facebook
        </Button>
      </Stack>
      <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'center', lineHeight: 1.4 }}>
        Social sign-in will be available soon — use email for now.
      </Typography>
    </Stack>
  )
}

function RoleCard({
  selected,
  icon,
  title,
  description,
  onSelect,
}: {
  selected: boolean
  icon: ReactNode
  title: string
  description: string
  onSelect: () => void
}) {
  const theme = useTheme()
  return (
    <Paper
      variant="outlined"
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      sx={{
        p: 2,
        cursor: 'pointer',
        borderRadius: 2,
        borderWidth: 2,
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? alpha(theme.palette.primary.main, 0.06) : 'background.paper',
        transition: 'border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease',
        outline: 'none',
        '&:hover': {
          borderColor: alpha(theme.palette.primary.main, 0.5),
          boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.08)}`,
        },
        '&:focus-visible': {
          boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.35)}`,
        },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box sx={{ color: selected ? 'primary.main' : 'text.secondary', pt: 0.25 }}>{icon}</Box>
        <Box>
          <Typography fontWeight={700}>{title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.45 }}>
            {description}
          </Typography>
        </Box>
        {selected ? (
          <CheckCircleRounded sx={{ ml: 'auto', color: 'primary.main', fontSize: 22 }} aria-hidden />
        ) : (
          <Box sx={{ ml: 'auto', width: 22, height: 22, borderRadius: '50%', border: '2px solid', borderColor: 'divider' }} aria-hidden />
        )}
      </Stack>
    </Paper>
  )
}

interface AuthDialogProps {
  open: boolean
  onClose: () => void
  /** Called after a successful sign-in or registration (before `onClose`). Use for return-to-flow (e.g. checkout). */
  onAuthenticated?: () => void
  defaultTab?: 'login' | 'register'
}

export default function AuthDialog({ open, onClose, onAuthenticated, defaultTab = 'login' }: AuthDialogProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab)
  const [registerStep, setRegisterStep] = useState(0)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showRegConfirm, setShowRegConfirm] = useState(false)

  const loginAction = useAuthStore((s) => s.login)
  const registerAction = useAuthStore((s) => s.register)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  const lf = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: true },
    mode: 'onChange',
  })

  const rf = useForm<RegisterFormValues>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
      accountRole: 'renter',
    },
    mode: 'onChange',
  })

  const regPassword = useWatch({ control: rf.control, name: 'password' })
  const strength = getPasswordStrength(regPassword ?? '')

  useEffect(() => {
    if (!open) return
    setTab(defaultTab)
    setRegisterStep(0)
    const remembered = localStorage.getItem(REMEMBER_EMAIL_KEY)
    lf.reset({
      email: remembered ?? '',
      password: '',
      rememberMe: Boolean(remembered),
    })
    rf.reset({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
      accountRole: 'renter',
    })
  }, [open, defaultTab, lf, rf])

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
      const parsed = registerStep0Schema.safeParse({
        email: v.email,
        password: v.password,
        confirmPassword: v.confirmPassword,
      })
      if (!parsed.success) {
        applyZodIssues(parsed.error.issues)
        return
      }
      setRegisterStep(1)
      return
    }
    if (registerStep === 1) {
      const v = rf.getValues()
      const parsed = registerStep1Schema.safeParse({
        firstName: v.firstName,
        lastName: v.lastName,
        phone: v.phone,
      })
      if (!parsed.success) {
        applyZodIssues(parsed.error.issues)
        return
      }
      setRegisterStep(2)
    }
  }

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

  const onRegister = rf.handleSubmit(async (data) => {
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
        email: data.email,
        password: data.password,
        phone: data.phone,
        accountRole: data.accountRole as RegisterAccountRole,
      })
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

  const slideSx = { width: '100%' }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
      scroll="body"
      aria-labelledby="auth-dialog-title"
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          // Don’t clip — `overflow: hidden` cuts off outlined TextField floating labels at the notch.
          overflow: 'visible',
        },
      }}
    >
      <DialogTitle
        id="auth-dialog-title"
        sx={{
          px: { xs: 2, sm: 3 },
          pr: fullScreen ? { xs: 7, sm: 8 } : { xs: 2, sm: 3 },
          pt: 2,
          pb: 1,
        }}
      >
        {fullScreen && (
          <IconButton aria-label="Close sign in" onClick={onClose} sx={{ position: 'absolute', right: 8, top: 12 }}>
            <Close />
          </IconButton>
        )}
        <Typography variant="h6" component="span" sx={{ fontWeight: 800, letterSpacing: '-0.02em', display: 'block', mb: 1 }}>
          {tab === 'login' ? 'Welcome back' : 'Create your account'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.5 }}>
          {tab === 'login'
            ? 'Sign in to book vehicles, manage trips, or host your fleet.'
            : 'A quick guided setup — you’ll be browsing in under a minute.'}
        </Typography>
        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v)
            setRegisterStep(0)
          }}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', minHeight: 48 },
          }}
        >
          <Tab label="Sign in" value="login" />
          <Tab label="Register" value="register" />
        </Tabs>
      </DialogTitle>

      <DialogContent
        sx={{
          px: { xs: 2, sm: 3 },
          pb: 2,
          pt: 1,
          overflow: 'visible',
        }}
      >
        {tab === 'login' ? (
          <Stack component="form" spacing={2} onSubmit={onLogin} noValidate sx={{ width: '100%' }}>
            {lf.formState.errors.root && (
              <Alert severity="error" icon={<ErrorOutlineRounded />} sx={{ borderRadius: 2 }}>
                {lf.formState.errors.root.message}
              </Alert>
            )}
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              fullWidth
              margin="none"
              {...lf.register('email')}
              error={!!lf.formState.errors.email}
              helperText={lf.formState.errors.email?.message ?? 'Used for bookings and receipts.'}
              sx={authOutlinedFieldSx(theme)}
            />
            <TextField
              label="Password"
              type={showLoginPassword ? 'text' : 'password'}
              autoComplete="current-password"
              fullWidth
              margin="none"
              {...lf.register('password')}
              error={!!lf.formState.errors.password}
              helperText={lf.formState.errors.password?.message}
              sx={authOutlinedFieldSx(theme)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowLoginPassword((p) => !p)}
                      edge="end"
                      size="small"
                    >
                      {showLoginPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
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
              sx={{
                py: 1.35,
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
            <SocialLoginPlaceholder />
          </Stack>
        ) : (
          <Stack component="form" onSubmit={onRegister} noValidate spacing={2} sx={{ width: '100%' }}>
            <Box sx={{ mb: 0.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                <Typography variant="caption" color="primary" fontWeight={800} letterSpacing="0.06em" textTransform="uppercase">
                  Step {registerStep + 1} of {REGISTER_STEP_LABELS.length}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {REGISTER_STEP_LABELS[registerStep]}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={((registerStep + 1) / REGISTER_STEP_LABELS.length) * 100}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  '& .MuiLinearProgress-bar': { borderRadius: 3 },
                }}
              />
            </Box>

            {rf.formState.errors.root && (
              <Alert severity="error" icon={<ErrorOutlineRounded />} sx={{ borderRadius: 2 }}>
                {rf.formState.errors.root.message}
              </Alert>
            )}

            <Box sx={{ position: 'relative', minHeight: fullScreen ? 280 : 260 }}>
              <AnimatePresence mode="wait" initial={false}>
                {registerStep === 0 && (
                  <motion.div
                    key="reg0"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    style={slideSx}
                  >
                    <Stack spacing={2}>
                      <TextField
                        label="Email"
                        type="email"
                        autoComplete="email"
                        fullWidth
                        margin="none"
                        {...rf.register('email', {
                          onChange: () => rf.clearErrors('email'),
                        })}
                        error={!!rf.formState.errors.email}
                        helperText={rf.formState.errors.email?.message ?? 'Used for bookings and receipts.'}
                        sx={authOutlinedFieldSx(theme)}
                      />
                      <Box>
                        <TextField
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
                          sx={authOutlinedFieldSx(theme)}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                                  onClick={() => setShowRegPassword((p) => !p)}
                                  edge="end"
                                  size="small"
                                >
                                  {showRegPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                        {regPassword && (
                          <Stack spacing={0.75} sx={{ mt: 1 }}>
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
                        )}
                      </Box>
                      <TextField
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
                        sx={authOutlinedFieldSx(theme)}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label={showRegConfirm ? 'Hide password' : 'Show password'}
                                onClick={() => setShowRegConfirm((p) => !p)}
                                edge="end"
                                size="small"
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

                {registerStep === 1 && (
                  <motion.div
                    key="reg1"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    style={slideSx}
                  >
                    <Stack spacing={2}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <TextField
                          label="First name"
                          autoComplete="given-name"
                          fullWidth
                          margin="none"
                          {...rf.register('firstName', { onChange: () => rf.clearErrors('firstName') })}
                          error={!!rf.formState.errors.firstName}
                          helperText={rf.formState.errors.firstName?.message ?? 'As on your ID or license.'}
                          sx={authOutlinedFieldSx(theme)}
                        />
                        <TextField
                          label="Last name"
                          autoComplete="family-name"
                          fullWidth
                          margin="none"
                          {...rf.register('lastName', { onChange: () => rf.clearErrors('lastName') })}
                          error={!!rf.formState.errors.lastName}
                          helperText={rf.formState.errors.lastName?.message}
                          sx={authOutlinedFieldSx(theme)}
                        />
                      </Stack>
                      <TextField
                        label="Mobile number"
                        placeholder="+63 9xx xxx xxxx"
                        autoComplete="tel"
                        fullWidth
                        margin="none"
                        {...rf.register('phone', { onChange: () => rf.clearErrors('phone') })}
                        error={!!rf.formState.errors.phone}
                        helperText={
                          rf.formState.errors.phone?.message ?? 'Philippine numbers: +63 or 0 prefix, then 10 digits.'
                        }
                        sx={authOutlinedFieldSx(theme)}
                      />
                    </Stack>
                  </motion.div>
                )}

                {registerStep === 2 && (
                  <motion.div
                    key="reg2"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    style={slideSx}
                  >
                    <Controller
                      name="accountRole"
                      control={rf.control}
                      render={({ field }) => (
                        <FormControl component="fieldset" variant="standard" error={!!rf.formState.errors.accountRole} sx={{ width: '100%' }}>
                          <FormLabel id="account-role-label" component="legend" sx={{ fontWeight: 700, color: 'text.primary', mb: 1, fontSize: '0.875rem' }}>
                            How do you want to use Rentara?
                          </FormLabel>
                          <Stack
                            role="radiogroup"
                            aria-labelledby="account-role-label"
                            spacing={1.5}
                          >
                            <RoleCard
                              selected={field.value === 'renter'}
                              icon={<PersonOutline />}
                              title="I’m renting"
                              description="Find cars and two-wheelers for trips. You can become a host anytime from your profile."
                              onSelect={() => {
                                field.onChange('renter')
                                rf.clearErrors('accountRole')
                              }}
                            />
                            <RoleCard
                              selected={field.value === 'host'}
                              icon={<StorefrontOutlined />}
                              title="I’m hosting"
                              description="List vehicles you own and manage bookings. Perfect if you’re focused on earning from your fleet."
                              onSelect={() => {
                                field.onChange('host')
                                rf.clearErrors('accountRole')
                              }}
                            />
                            <RoleCard
                              selected={field.value === 'both'}
                              icon={<DirectionsCarOutlined />}
                              title="Both rent & host"
                              description="Book when you travel and list vehicles when you’re not using them."
                              onSelect={() => {
                                field.onChange('both')
                                rf.clearErrors('accountRole')
                              }}
                            />
                          </Stack>
                          {rf.formState.errors.accountRole && (
                            <FormHelperText error sx={{ mx: 0 }}>
                              {rf.formState.errors.accountRole.message}
                            </FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />
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
                {registerStep < 2 ? (
                  <Button
                    type="button"
                    variant="contained"
                    onClick={goRegisterNext}
                    sx={{
                      flex: 2,
                      py: 1.2,
                      fontWeight: 700,
                      borderRadius: 2,
                      transition: 'transform 0.15s ease',
                      '@media (hover: hover)': { '&:hover': { transform: 'translateY(-1px)' } },
                    }}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={registerSubmitting}
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

            <SocialLoginPlaceholder />
          </Stack>
        )}

        <Stack alignItems="center" sx={{ mt: 2 }}>
          <Link
            component="button"
            type="button"
            variant="body2"
            onClick={() => {
              setTab(tab === 'login' ? 'register' : 'login')
              setRegisterStep(0)
            }}
            sx={{ fontWeight: 600 }}
          >
            {tab === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
          </Link>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
