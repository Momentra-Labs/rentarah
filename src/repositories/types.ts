import type { BookingRecord, Car } from '@/types'

/** Shared booking DTOs used by mock + REST adapters. */
export interface CheckAvailabilityResult {
  available: boolean
  unavailableDates: string[]
}

export interface CreateBookingPayload {
  vehicleId: string
  userId: string
  startDate: string
  endDate: string
  totalPrice: number
}

export type CreateBookingResult = Pick<BookingRecord, 'id' | 'ref' | 'status' | 'createdAt'>

export interface VehicleRepository {
  getVehicles(signal?: AbortSignal): Promise<Car[]>
  getVehicleById(id: string, signal?: AbortSignal): Promise<Car>
}

export interface BookingRepository {
  createBooking(payload: CreateBookingPayload, signal?: AbortSignal): Promise<CreateBookingResult>
  checkAvailability(
    vehicleId: string,
    startDate: string,
    endDate: string,
    signal?: AbortSignal,
  ): Promise<CheckAvailabilityResult>
}
