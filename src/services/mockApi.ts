import { mockCars } from '../data/mockCars'
import type { BookingStatus, Car } from '../types'

import { USE_MOCK_API } from './config'

/**
 * Project-wide switch for static mock data (simulated latency + in-memory data).
 * Prefer toggling with `VITE_USE_MOCK` in `.env` via {@link import('./config') USE_MOCK_API},
 * or set this to `false` to force the real client when your API is available.
 * @see USE_MOCK_API in `config.ts` — that flag is what services actually read at runtime.
 */
export const USE_MOCK = true

/** Network latency simulation in milliseconds; keeps loading states visible in dev. */
const MOCK_DELAY_MS = 200

const delay = (ms = MOCK_DELAY_MS) => new Promise((r) => setTimeout(r, ms))

// --- vehicles ---

export async function mockGetVehicles(): Promise<Car[]> {
  await delay()
  return mockCars.map((c) => ({ ...c }))
}

export async function mockGetVehicleById(id: string): Promise<Car | null> {
  await delay()
  const v = mockCars.find((c) => c.id === id)
  return v ? { ...v } : null
}

// --- availability (future: `GET /vehicles/:id/availability?from=&to=`) ---

export interface CheckAvailabilityResult {
  /** True when the vehicle has no conflict with existing bookings in the range */
  available: boolean
  /** Date-only ISO strings (YYYY-MM-DD) that are already taken */
  unavailableDates: string[]
}

/**
 * Simulates the backend collision check against a vehicle’s `bookedDates` and requested range.
 * Does not create a booking.
 */
export async function mockCheckAvailability(
  vehicleId: string,
  startDate: string,
  endDate: string,
): Promise<CheckAvailabilityResult> {
  await delay(120)
  const v = mockCars.find((c) => c.id === vehicleId)
  if (!v) {
    return { available: false, unavailableDates: [] }
  }

  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return { available: false, unavailableDates: v.bookedDates }
  }

  const conflicts: string[] = []
  const cur = new Date(start)
  while (cur <= end) {
    const iso = cur.toISOString().slice(0, 10)
    if (v.bookedDates.includes(iso)) conflicts.push(iso)
    cur.setDate(cur.getDate() + 1)
  }

  return { available: conflicts.length === 0, unavailableDates: conflicts }
}

// --- bookings (future: `POST /bookings`) ---

export interface CreateBookingPayload {
  vehicleId: string
  userId: string
  startDate: string
  endDate: string
  totalPrice: number
}

export interface CreateBookingResult {
  id: string
  ref: string
  status: BookingStatus
  createdAt: string
}

export async function mockCreateBooking(_payload: CreateBookingPayload): Promise<CreateBookingResult> {
  await delay(300)
  return {
    id: `bkg_${Date.now()}`,
    ref: `RH-${String(Math.random()).slice(2, 8).toUpperCase()}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
}

/** Debug: shows which data source the build will use. */
export function isMockBuild(): boolean {
  return USE_MOCK_API
}
