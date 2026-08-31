import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@mui/material/styles'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mockCars } from '@/data/mockCars'
import { useAuthStore } from '@/store/useAuthStore'
import { useBookingStore } from '@/store/useBookingStore'
import { useCarsStore } from '@/store/useCarsStore'
import { theme } from '@/theme'
import type { AuthUser, Car } from '@/types'

import BookingPage from './BookingPage'

vi.mock('@/hooks/useVehicles', () => ({
  useVehicles: () => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: () => {},
  }),
}))

const TEST_USER: AuthUser = {
  id: 'user_test_booking',
  firstName: 'Carlo',
  lastName: 'Reyes',
  email: 'demo@rentara.com',
  phone: '+639171234567',
  licenseNumber: 'N12345678',
  isHost: false,
  avatar: 'CR',
  createdAt: '2026-01-01T00:00:00.000Z',
  accountRole: 'renter',
  emailVerified: true,
}

function listingWithConflict(): Car {
  const base = mockCars.find((c) => c.id === 'car_001')
  if (!base) throw new Error('missing car_001')
  return {
    ...base,
    bookedDates: [...base.bookedDates, '2026-09-10', '2026-09-11'],
  }
}

function renderBooking(step = 0) {
  const car = listingWithConflict()
  useCarsStore.setState({
    cars: [car, ...mockCars.filter((c) => c.id !== 'car_001').map((c) => ({ ...c }))],
    vehiclesLoadStatus: 'success',
    hasFetchedVehicles: true,
    vehiclesLoadError: null,
  })
  useAuthStore.setState({ user: TEST_USER, authProvider: 'firebase' })
  const pickup = dayjs('2026-09-05T10:00:00')
  const dropoff = dayjs('2026-09-08T10:00:00')
  useBookingStore.getState().initBooking(car, pickup, dropoff)
  if (step !== 0) useBookingStore.getState().setStep(step)

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <MemoryRouter initialEntries={['/booking/car_001']}>
            <Routes>
              <Route path="/booking/:carId" element={<BookingPage />} />
              <Route path="/cars/:id" element={<div>listing</div>} />
              <Route path="/search" element={<div>search</div>} />
              <Route path="/dashboard" element={<div>dashboard</div>} />
            </Routes>
          </MemoryRouter>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

describe('BookingPage', () => {
  beforeEach(() => {
    useBookingStore.getState().reset()
    useAuthStore.setState({ user: null })
  })

  it('shows an editable date picker and an enabled Continue on review', () => {
    renderBooking(0)
    expect(screen.getByLabelText('Pick-up')).toBeInTheDocument()
    expect(screen.getByLabelText('Return')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled()
  })

  it('disables Continue when the selected dates overlap a booked trip', () => {
    renderBooking(0)
    act(() => {
      useCarsStore.getState().addBookedDates('car_001', ['2026-09-10', '2026-09-11'])
      useBookingStore.getState().setTripDates(dayjs('2026-09-10T10:00:00'), dayjs('2026-09-12T10:00:00'))
    })
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
    expect(screen.getByText(/overlap a booked trip/i)).toBeInTheDocument()
  })

  it('shows a driver confirm card when the profile is complete', () => {
    renderBooking(1)
    expect(screen.getByRole('heading', { name: /driving/i })).toBeInTheDocument()
    expect(screen.getByText('Carlo Reyes')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.getByLabelText('License expiry')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /licensed driver/i })).toBeInTheDocument()
  })

  it('shows next-steps copy after mock pay', async () => {
    const user = userEvent.setup()
    renderBooking(2)
    await user.click(screen.getByRole('button', { name: 'Confirm without card' }))
    expect(screen.getByRole('heading', { name: /booked/i })).toBeInTheDocument()
    expect(screen.getByText('What happens next')).toBeInTheDocument()
  })
})
