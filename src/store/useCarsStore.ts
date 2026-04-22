import { persist, createJSONStorage } from 'zustand/middleware'
import { create } from 'zustand'

import { mockCars } from '../data/mockCars'
import type { Car } from '../types'

export interface CarsStoreState {
  cars: Car[]
  savedCarIds: string[]
  initCars: () => void
  addBookedDates: (carId: string, dates: string[]) => void
  removeBookedDates: (carId: string, dates: string[]) => void
  toggleSaved: (carId: string) => void
  addListing: (carData: Omit<Car, 'id' | 'rating' | 'reviewCount' | 'bookedDates'> & Partial<Pick<Car, 'bookedDates'>>) => Car
  updateListing: (id: string, data: Partial<Car>) => void
  getCarById: (id: string) => Car | undefined
}

export const useCarsStore = create<CarsStoreState>()(
  persist(
    (set, get) => ({
      cars: [],
      savedCarIds: [],

      initCars: () => {
        if (get().cars.length === 0) {
          set({ cars: mockCars.map((c) => ({ ...c })) })
        }
      },

      addBookedDates: (carId, dates) =>
        set((state) => ({
          cars: state.cars.map((c) =>
            c.id === carId
              ? {
                  ...c,
                  bookedDates: [...new Set([...c.bookedDates, ...dates])].sort(),
                }
              : c,
          ),
        })),

      removeBookedDates: (carId, dates) =>
        set((state) => ({
          cars: state.cars.map((c) =>
            c.id === carId
              ? {
                  ...c,
                  bookedDates: c.bookedDates.filter((d) => !dates.includes(d)),
                }
              : c,
          ),
        })),

      toggleSaved: (carId) =>
        set((state) => {
          const exists = state.savedCarIds.includes(carId)
          return {
            savedCarIds: exists
              ? state.savedCarIds.filter((id) => id !== carId)
              : [...state.savedCarIds, carId],
          }
        }),

      addListing: (carData) => {
        const nums = get()
          .cars.map((c) => {
            const m = /^car_(\d+)$/.exec(c.id)
            return m ? parseInt(m[1], 10) : 0
          })
          .filter((n) => n > 0)
        const next = (nums.length ? Math.max(...nums) : 0) + 1
        const id = `car_${String(next).padStart(3, '0')}`
        const car: Car = {
          ...carData,
          id,
          rating: 0,
          reviewCount: 0,
          bookedDates: carData.bookedDates ?? [],
          images: carData.images?.length ? carData.images : ['/vite.svg'],
          features: carData.features ?? [],
          tags: carData.tags ?? [],
          available: carData.available ?? true,
        }
        set((s) => ({ cars: [...s.cars, car] }))
        return car
      },

      updateListing: (id, data) =>
        set((state) => ({
          cars: state.cars.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),

      getCarById: (id) => get().cars.find((c) => c.id === id),
    }),
    {
      name: 'rentahub-cars',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ cars: s.cars, savedCarIds: s.savedCarIds }),
    },
  ),
)
