import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { theme } from '@/theme'

import AuthDialog from './AuthDialog'

function renderDialog(defaultTab: 'login' | 'register' = 'login') {
  sessionStorage.clear()
  localStorage.removeItem('rentara-remember-email')
  return render(
    <ThemeProvider theme={theme}>
      <AuthDialog open onClose={() => {}} defaultTab={defaultTab} />
    </ThemeProvider>,
  )
}

function signInSubmit() {
  const buttons = screen.getAllByRole('button', { name: 'Sign in' })
  const submit = buttons.find((el) => el.getAttribute('type') === 'submit')
  if (!submit) throw new Error('Sign in submit button not found')
  return submit
}

describe('AuthDialog login', () => {
  it('cues invalid email, enables Sign in when valid, and shows the error after a failed login', async () => {
    const user = userEvent.setup()
    renderDialog('login')

    const email = screen.getByLabelText('Email')
    const password = screen.getByLabelText('Password')
    expect(signInSubmit()).toBeDisabled()

    await user.type(email, 'not-an-email')
    await user.tab()
    expect(await screen.findByText(/doesn’t look like a valid email/)).toBeInTheDocument()
    expect(signInSubmit()).toBeDisabled()

    await user.clear(email)
    await user.type(email, 'demo@rentara.com')
    await user.type(password, 'wrong-password')
    await waitFor(() => expect(signInSubmit()).toBeEnabled())

    await user.click(signInSubmit())
    expect(
      await screen.findByText(/couldn’t sign you in/i, {}, { timeout: 2000 }),
    ).toBeInTheDocument()
  })
})

describe('AuthDialog register', () => {
  it('auto-advances after a role, only jumps back, and ticks password rules live', async () => {
    const user = userEvent.setup()
    renderDialog('register')

    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: /Host/ }))
    expect(await screen.findByText('Step 2 of 4', {}, { timeout: 1500 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go back to Your role' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Go back to Password' })).not.toBeInTheDocument()

    await user.type(await screen.findByLabelText('Email'), 'new.host@rentara.com')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByText('Step 3 of 4')).toBeInTheDocument()

    const password = await screen.findByLabelText('Password')
    await user.type(password, 'abcdefgh')
    const checklist = screen.getByText('8+ characters').closest('div')?.parentElement
    expect(checklist).toBeTruthy()
    expect(within(checklist as HTMLElement).getByText('8+ characters')).toBeInTheDocument()

    await user.clear(password)
    await user.type(password, 'Abcd123!')
    await user.type(screen.getByLabelText('Confirm password'), 'Abcd123!')
    expect(await screen.findByText('Passwords match')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByText('Step 4 of 4')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument()
  })
})
