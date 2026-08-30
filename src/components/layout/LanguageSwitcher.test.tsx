import { ThemeProvider } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useT } from '@/hooks/useT'
import { theme } from '@/theme'

import LanguageSwitcher from './LanguageSwitcher'

function Probe() {
  const t = useT()
  return <p>{t('nav.signIn')}</p>
}

describe('LanguageSwitcher', () => {
  it('switches chrome copy between English and Filipino from the dropdown', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider theme={theme}>
        <LanguageSwitcher />
        <Probe />
      </ThemeProvider>,
    )

    expect(screen.getByText('Sign In')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Language: English/i }))
    await user.click(screen.getByRole('option', { name: 'Filipino' }))
    expect(screen.getByText('Mag-sign in')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Wika: Filipino/i }))
    await user.click(screen.getByRole('option', { name: 'English' }))
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })
})
