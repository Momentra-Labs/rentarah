import type { BookingRecord } from '../types'

import { getJson, postJson } from './apiClient'
import { USE_MOCK_API } from './config'
import { mockCheckAvailability, mockCreateBooking, type CreateBookingPayload, type CheckAvailabilityResult } from './mockApi'

export type { CheckAvailabilityResult, CreateBookingPayload } from './mockApi'

/**
 * `POST /bookings` (or `POST /vehicles/:id/bookings` depending on your API) — create a rental booking.
 * Server should re-check availability, lock dates, and return the persisted record.
 */
export async function createBooking(
  payload: CreateBookingPayload,
  signal?: AbortSignal,
): Promise<Pick<BookingRecord, 'id' | 'ref' | 'status' | 'createdAt'>> {
  if (USE_MOCK_API) {
    return mockCreateBooking(payload)
  }
  return postJson('/bookings', payload, signal)
}

/**
 * `GET /vehicles/:id/availability?start=&end=` — read-only check before payment.
 * Mock implementation reads `bookedDates` on the static vehicle; real API would query PostgreSQL.
 */
export async function checkAvailability(
  vehicleId: string,
  startDate: string,
  endDate: string,
  signal?: AbortSignal,
): Promise<CheckAvailabilityResult> {
  if (USE_MOCK_API) {
    return mockCheckAvailability(vehicleId, startDate, endDate)
  }
  const query = new URLSearchParams({ start: startDate, end: endDate })
  return getJson<CheckAvailabilityResult>(
    `/vehicles/${encodeURIComponent(vehicleId)}/availability?${query}`,
    signal,
  )
}
