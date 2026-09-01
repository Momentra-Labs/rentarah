import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mockCars } from '@/data/mockCars'
import { useCarsStore } from '@/store/useCarsStore'
import { theme } from '@/theme'

import CarDetailPage from './CarDetailPage'

vi.mock('@/components/map/RentaraMap', () => ({
  default: () => <div data-testid="pickup-map" />,
}))

function renderDetail(id = 'car_001') {
  useCarsStore.setState({
    cars: mockCars.map((c) => ({ ...c })),
    vehiclesLoadStatus: 'success',
    hasFetchedVehicles: true,
    vehiclesLoadError: null,
  })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <MemoryRouter initialEntries={[`/cars/${id}`]}>
            <Routes>
              <Route path="/cars/:id" element={<CarDetailPage />} />
            </Routes>
          </MemoryRouter>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

describe('CarDetailPage', () => {
  beforeEach(() => {
    useCarsStore.setState({ savedCarIds: [] })
  })

  it('shows a scannable title, specs, and a sign-in reserve CTA', () => {
    renderDetail()
    expect(screen.getByRole('heading', { name: '2023 Toyota Fortuner' })).toBeInTheDocument()
    expect(screen.getByText(/SUV · 7 seats · Automatic · Diesel/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'About this car' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'What’s included' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Sign in to reserve' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'Share this listing' }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument()
  })

  it('shows two-wheeler facts for a motorcycle listing', () => {
    renderDetail('car_013')
    expect(screen.getByRole('heading', { name: /Yamaha MT-07/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'About this vehicle' })).toBeInTheDocument()
    expect(screen.getByText('Engine')).toBeInTheDocument()
  })
})
