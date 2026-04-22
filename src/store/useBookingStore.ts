import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { persist, createJSONStorage } from 'zustand/middleware'
import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

import { generateDateRangeInclusive } from '../utils/dateUtils'
import { calcPricing } from '../utils/priceCalc'
import type { BookingRecord, BookingStatus, Car } from '../types'
import { useAuthStore } from './useAuthStore'
import { useCarsStore } from './useCarsStore'

export type BookingUserDetails = Record<string, string>

export interface BookingStoreState {
  selectedCar: Car | null
  pickup: Dayjs | null
  dropoff: Dayjs | null
  step: number
  userDetails: BookingUserDetails
  paymentMethod: string | null
  bookingRef: string | null
  bookings: BookingRecord[]
  initBooking: (car: Car, pickup: Dayjs, dropoff: Dayjs) => void
  setStep: (step: number) => void
  setUserDetails: (
    partialOrUpdater:
      | Partial<BookingUserDetails>
      | ((prev: BookingUserDetails) => BookingUserDetails),
  ) => void
  setPaymentMethod: (pm: string | null) => void
  confirmBooking: () => string
  cancelBooking: (bookingId: string) => void
  reset: () => void
}

export const useBookingStore = create<BookingStoreState>()(
  persist(
    (set, get) => ({
      selectedCar: null,
      pickup: null,
      dropoff: null,
      step: 0,
      userDetails: {},
      paymentMethod: null,
      bookingRef: null,
      bookings: [],

      initBooking: (car, pickup, dropoff) =>
        set({
          selectedCar: car,
          pickup,
          dropoff,
          step: 0,
          userDetails: {},
          paymentMethod: null,
          bookingRef: null,
        }),

      setStep: (step) => set({ step }),

      setUserDetails: (partialOrUpdater) =>
        set((state) => {
          const userDetails = (
            typeof partialOrUpdater === 'function'
              ? partialOrUpdater(state.userDetails)
              : { ...state.userDetails, ...partialOrUpdater }
          ) as BookingUserDetails
          return { userDetails }
        }),

      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),

      confirmBooking: () => {
        const state = get()
        const car = state.selectedCar
        const pickup = state.pickup
        const dropoff = state.dropoff
        const user = useAuthStore.getState().user
        if (!car || !pickup || !dropoff || !user) throw new Error('Missing booking data')

        const pricing = calcPricing(car.pricePerDay, pickup, dropoff)
        if (!pricing) throw new Error('Invalid dates')

        const dates = generateDateRangeInclusive(pickup, dropoff)
        useCarsStore.getState().addBookedDates(car.id, dates)

        const ref = `RH-${uuidv4().slice(0, 8).toUpperCase()}`
        const booking: BookingRecord = {
          id: uuidv4(),
          carId: car.id,
          userId: user.id,
          hostId: car.hostId,
          pickup: pickup.format('YYYY-MM-DD'),
          dropoff: dropoff.format('YYYY-MM-DD'),
          ref,
          total: pricing.total,
          status: 'confirmed' as BookingStatus,
          createdAt: new Date().toISOString(),
          carName: `${car.make} ${car.model}`,
          carImage: car.images[0],
          location: car.location,
          renterName: `${user.firstName} ${user.lastName}`,
        }

        set((s) => ({
          bookings: [...s.bookings, booking],
          bookingRef: ref,
          step: 3,
        }))

        return ref
      },

      cancelBooking: (bookingId) => {
        const b = get().bookings.find((x) => x.id === bookingId)
        if (!b || b.status === 'cancelled') return
        const dates = generateDateRangeInclusive(dayjs(b.pickup), dayjs(b.dropoff))
        useCarsStore.getState().removeBookedDates(b.carId, dates)

        set((s) => ({
          bookings: s.bookings.map((bk) =>
            bk.id === bookingId ? { ...bk, status: 'cancelled' as const } : bk,
          ),
        }))
      },

      reset: () =>
        set({
          selectedCar: null,
          pickup: null,
          dropoff: null,
          step: 0,
          userDetails: {},
          paymentMethod: null,
          bookingRef: null,
        }),
    }),
    {
      name: 'rentahub-booking',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        bookings: s.bookings,
      }),
    },
  ),
)
