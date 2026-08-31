import { ThemeProvider } from '@mui/material/styles'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { describe, expect, it, vi } from 'vitest'

import { theme } from '@/theme'

import DateTimePickerDialog from './DateTimePickerDialog'

function renderDialog(
  onAccept = vi.fn(),
  onClose = vi.fn(),
  extra?: { minDate?: dayjs.Dayjs },
) {
  const value = dayjs().add(1, 'day').hour(10).minute(0).second(0).millisecond(0)
  const view = render(
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateTimePickerDialog
          open
          onClose={onClose}
          value={value}
          onAccept={onAccept}
          minDate={extra?.minDate ?? dayjs()}
          title="Pick-up date & time"
          showTime
        />
      </LocalizationProvider>
    </ThemeProvider>,
  )
  return { onAccept, onClose, value, ...view }
}

async function waitForFooterSettle() {
  await waitFor(() => {
    expect(screen.queryByTestId('picker-settle-capture')).not.toBeInTheDocument()
  })
}

describe('DateTimePickerDialog', () => {
  it('starts on the date step and hides time until Next', async () => {
    const user = userEvent.setup()
    renderDialog()

    expect(screen.getByTestId('date-time-picker-dialog')).toBeInTheDocument()
    expect(screen.getByText('Choose a date')).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Minute 15' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'AM' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByText('Choose a time')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Minute 15' })).toBeInTheDocument()
  })

  it('lets the user pick a 5-minute time and confirm', async () => {
    const user = userEvent.setup()
    const { onAccept, onClose, value } = renderDialog()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByText('Choose a time')).toBeInTheDocument()
    await waitForFooterSettle()
    await user.click(screen.getByRole('option', { name: 'Minute 15' }))
    expect(screen.getByText(new RegExp(`${value.format('ddd, MMM D')} · 10:15 AM`))).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(onAccept).toHaveBeenCalledTimes(1)
    expect(onAccept.mock.calls[0][0].format('YYYY-MM-DD HH:mm')).toBe(
      value.minute(15).format('YYYY-MM-DD HH:mm'),
    )
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('returns to the calendar from Back', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByText('Choose a time')).toBeInTheDocument()
    await waitForFooterSettle()
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByText('Choose a date')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Minute 15' })).not.toBeInTheDocument()
  })

  it('does not commit when cancelled', async () => {
    const user = userEvent.setup()
    const { onAccept, onClose } = renderDialog()

    await user.click(screen.getByRole('button', { name: 'Tomorrow' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onAccept).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('stays on the time step when minDate is a new object each render', async () => {
    const user = userEvent.setup()
    const { rerender, onClose, onAccept, value } = renderDialog()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByText('Choose a time')).toBeInTheDocument()

    rerender(
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateTimePickerDialog
            open
            onClose={onClose}
            value={value}
            onAccept={onAccept}
            minDate={dayjs()}
            title="Pick-up date & time"
            showTime
          />
        </LocalizationProvider>
      </ThemeProvider>,
    )

    expect(screen.getByText('Choose a time')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Minute 15' })).toBeInTheDocument()
  })
})
