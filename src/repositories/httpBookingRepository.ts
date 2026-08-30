import { getJson, postJson } from '@/services/apiClient'

import type { BookingRepository, CheckAvailabilityResult, CreateBookingPayload, CreateBookingResult } from './types'

export const httpBookingRepository: BookingRepository = {
  checkAvailability(
    vehicleId: string,
    startDate: string,
    endDate: string,
    signal?: AbortSignal,
  ): Promise<CheckAvailabilityResult> {
    const query = new URLSearchParams({ start: startDate, end: endDate })
    return getJson<CheckAvailabilityResult>(
      `/vehicles/${encodeURIComponent(vehicleId)}/availability?${query}`,
      signal,
    )
  },

  createBooking(payload: CreateBookingPayload, signal?: AbortSignal): Promise<CreateBookingResult> {
    return postJson<CreateBookingResult, CreateBookingPayload>('/bookings', payload, signal, {
      authenticate: true,
    })
  },
}
