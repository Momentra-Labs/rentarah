import {
  getBookingRepository,
  type CheckAvailabilityResult,
  type CreateBookingPayload,
} from '@/repositories'
import type { BookingRecord } from '@/types'

export type { CheckAvailabilityResult, CreateBookingPayload } from '@/repositories'

/**
 * Application service — bookings. HTTP adapter attaches Firebase Bearer when not mocking.
 */
export async function createBooking(
  payload: CreateBookingPayload,
  signal?: AbortSignal,
): Promise<Pick<BookingRecord, 'id' | 'ref' | 'status' | 'createdAt'>> {
  return getBookingRepository().createBooking(payload, signal)
}

export async function checkAvailability(
  vehicleId: string,
  startDate: string,
  endDate: string,
  signal?: AbortSignal,
): Promise<CheckAvailabilityResult> {
  return getBookingRepository().checkAvailability(vehicleId, startDate, endDate, signal)
}
