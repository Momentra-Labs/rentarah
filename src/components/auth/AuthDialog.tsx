import { zodResolver } from '@hookform/resolvers/zod'
import Close from '@mui/icons-material/Close'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Stack,
  Tab,
  Tabs,
  TextField,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { useAuthStore } from '../../store/useAuthStore'
import { useSnackbarStore } from '../../store/useSnackbarStore'

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Required'),
})

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'Required'),
    lastName: z.string().min(2, 'Required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Min 8 characters'),
    confirmPassword: z.string(),
    phone: z.string().regex(/^(\+63|0)?[0-9]{10,11}$/, 'Invalid PH number'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  })

type LoginValues = z.infer<typeof loginSchema>
type RegisterValues = z.infer<typeof registerSchema>

interface AuthDialogProps {
  open: boolean
  onClose: () => void
  defaultTab?: 'login' | 'register'
}

export default function AuthDialog({ open, onClose, defaultTab = 'login' }: AuthDialogProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab)
  const login = useAuthStore((s) => s.login)
  const register = useAuthStore((s) => s.register)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  const lf = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const rf = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
    },
  })

  const onLogin = lf.handleSubmit((data) => {
    try {
      login(data.email, data.password)
      const u = useAuthStore.getState().user
      showSuccess(u ? `Welcome back, ${u.firstName}!` : 'Signed in')
      onClose()
    } catch {
      showError('Invalid credentials')
    }
  })

  const onRegister = rf.handleSubmit((data) => {
    try {
      register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone,
      })
      const u = useAuthStore.getState().user
      showSuccess(u ? `Welcome, ${u.firstName}!` : 'Account created')
      onClose()
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Registration failed')
    }
  })

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth fullScreen={fullScreen} scroll="body">
      <DialogTitle sx={{ pr: fullScreen ? 6 : 2 }}>
        {fullScreen && (
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ position: 'absolute', right: 8, top: 12 }}
          >
            <Close />
          </IconButton>
        )}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} centered variant="fullWidth">
          <Tab label="Sign In" value="login" />
          <Tab label="Register" value="register" />
        </Tabs>
      </DialogTitle>
      <DialogContent>
        {tab === 'login' ? (
          <Stack component="form" spacing={2} sx={{ pt: 1 }} onSubmit={onLogin}>
            <TextField
              label="Email"
              fullWidth
              {...lf.register('email')}
              error={!!lf.formState.errors.email}
              helperText={lf.formState.errors.email?.message}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              {...lf.register('password')}
              error={!!lf.formState.errors.password}
              helperText={lf.formState.errors.password?.message}
            />
            <DialogActions sx={{ px: 0 }}>
              <Button type="submit" variant="contained" fullWidth size="large">
                Sign In
              </Button>
            </DialogActions>
          </Stack>
        ) : (
          <Stack component="form" spacing={2} sx={{ pt: 1 }} onSubmit={onRegister}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                label="First name"
                fullWidth
                {...rf.register('firstName')}
                error={!!rf.formState.errors.firstName}
                helperText={rf.formState.errors.firstName?.message}
              />
              <TextField
                label="Last name"
                fullWidth
                {...rf.register('lastName')}
                error={!!rf.formState.errors.lastName}
                helperText={rf.formState.errors.lastName?.message}
              />
            </Stack>
            <TextField
              label="Email"
              fullWidth
              {...rf.register('email')}
              error={!!rf.formState.errors.email}
              helperText={rf.formState.errors.email?.message}
            />
            <TextField
              label="Phone"
              placeholder="+639xxxxxxxxx"
              fullWidth
              {...rf.register('phone')}
              error={!!rf.formState.errors.phone}
              helperText={rf.formState.errors.phone?.message}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              {...rf.register('password')}
              error={!!rf.formState.errors.password}
              helperText={rf.formState.errors.password?.message}
            />
            <TextField
              label="Confirm password"
              type="password"
              fullWidth
              {...rf.register('confirmPassword')}
              error={!!rf.formState.errors.confirmPassword}
              helperText={rf.formState.errors.confirmPassword?.message}
            />
            <DialogActions sx={{ px: 0 }}>
              <Button type="submit" variant="contained" fullWidth size="large">
                Create account
              </Button>
            </DialogActions>
          </Stack>
        )}
        <Stack alignItems="center" sx={{ mt: 1 }}>
          <Link
            component="button"
            type="button"
            variant="body2"
            onClick={() => setTab(tab === 'login' ? 'register' : 'login')}
          >
            {tab === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
          </Link>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
