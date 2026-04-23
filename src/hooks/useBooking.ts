import { useCallback, useState } from 'react'

import { checkAvailability, createBooking, type CheckAvailabilityResult, type CreateBookingPayload } from '../services/bookingService'

type CreateBookingResponse = Awaited<ReturnType<typeof createBooking>>

export interface UseBookingState {
  createBooking: (payload: CreateBookingPayload) => Promise<CreateBookingResponse>
  checkAvailability: (
    vehicleId: string,
    startDate: string,
    endDate: string,
  ) => Promise<CheckAvailabilityResult | null>
  isSubmitting: boolean
  isChecking: boolean
  error: string | null
  clearError: () => void
}

/**
 * Encapsulates booking and availability service calls. Wire `createBooking` to your checkout flow;
 * the mock returns a generated id/ref without persisting to PostgreSQL.
 */
export function useBooking(): UseBookingState {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  const doCreate = useCallback(async (payload: CreateBookingPayload) => {
    setIsSubmitting(true)
    setError(null)
    try {
      return await createBooking(payload)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Booking failed'
      setError(msg)
      throw e
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const doCheck = useCallback(async (vehicleId: string, startDate: string, endDate: string) => {
    setIsChecking(true)
    setError(null)
    try {
      return await checkAvailability(vehicleId, startDate, endDate)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Availability check failed'
      setError(msg)
      return null
    } finally {
      setIsChecking(false)
    }
  }, [])

  return {
    createBooking: doCreate,
    checkAvailability: doCheck,
    isSubmitting,
    isChecking,
    error,
    clearError,
  }
}
