import { mockCars } from '@/data/mockCars'
import { rangeConflictsBooked } from '@/utils/bookingCalendar'

import type { BookingRepository, CheckAvailabilityResult, CreateBookingPayload, CreateBookingResult } from './types'

const delay = (ms = 0) => new Promise((r) => setTimeout(r, ms))

export const mockBookingRepository: BookingRepository = {
  async checkAvailability(
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

    const { conflictingDates, availableForRange } = rangeConflictsBooked(v.bookedDates, startDate, endDate)
    return { available: availableForRange, unavailableDates: conflictingDates }
  },

  async createBooking(_payload: CreateBookingPayload): Promise<CreateBookingResult> {
    await delay(300)
    return {
      id: `bkg_${Date.now()}`,
      ref: `RH-${String(Math.random()).slice(2, 8).toUpperCase()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
  },
}
