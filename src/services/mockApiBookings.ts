import { mockBookingRepository } from '@/repositories/mockBookingRepository'
import type {
  CheckAvailabilityResult,
  CreateBookingPayload,
  CreateBookingResult,
} from '@/repositories/types'

export type { CheckAvailabilityResult, CreateBookingPayload, CreateBookingResult }

export async function mockCheckAvailability(
  vehicleId: string,
  startDate: string,
  endDate: string,
): Promise<CheckAvailabilityResult> {
  return mockBookingRepository.checkAvailability(vehicleId, startDate, endDate)
}

export async function mockCreateBooking(payload: CreateBookingPayload): Promise<CreateBookingResult> {
  return mockBookingRepository.createBooking(payload)
}
