import { persist, createJSONStorage } from 'zustand/middleware'
import { create } from 'zustand'

import { mockCars } from '../data/mockCars'
import { getVehicles } from '../services/vehicleService'
import type { Car } from '../types'

export type VehiclesLoadStatus = 'idle' | 'loading' | 'success' | 'error'

export interface CarsStoreState {
  cars: Car[]
  savedCarIds: string[]
  /** Catalog fetch lifecycle — drives skeletons and error banners on the listing page */
  vehiclesLoadStatus: VehiclesLoadStatus
  vehiclesLoadError: string | null
  hasFetchedVehicles: boolean
  initCars: () => void
  /** Loads from `getVehicles()` (mock or API), merging API rows with any local-only listings. */
  fetchVehicles: (options?: { force?: boolean }) => Promise<void>
  addBookedDates: (carId: string, dates: string[]) => void
  removeBookedDates: (carId: string, dates: string[]) => void
  toggleSaved: (carId: string) => void
  addListing: (carData: Omit<Car, 'id' | 'rating' | 'reviewCount' | 'bookedDates'> & Partial<Pick<Car, 'bookedDates'>>) => Car
  updateListing: (id: string, data: Partial<Car>) => void
  removeListing: (id: string) => void
  getCarById: (id: string) => Car | undefined
}

export const useCarsStore = create<CarsStoreState>()(
  persist(
    (set, get) => ({
      cars: [],
      savedCarIds: [],
      vehiclesLoadStatus: 'idle',
      vehiclesLoadError: null,
      hasFetchedVehicles: false,

      initCars: () => {
        if (get().cars.length === 0) {
          set({ cars: mockCars.map((c) => ({ ...c })) })
        }
      },

      fetchVehicles: async (options) => {
        if (get().hasFetchedVehicles && !options?.force) {
          return
        }
        if (get().vehiclesLoadStatus === 'loading' && !options?.force) {
          return
        }
        set({ vehiclesLoadStatus: 'loading', vehiclesLoadError: null })
        try {
          const apiCars = await getVehicles()
          const existing = get().cars
          const apiIds = new Set(apiCars.map((c) => c.id))
          const localOnly = existing.filter((c) => !apiIds.has(c.id))
          set({
            cars: [...apiCars, ...localOnly],
            vehiclesLoadStatus: 'success',
            hasFetchedVehicles: true,
            vehiclesLoadError: null,
          })
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Failed to load vehicles'
          set({ vehiclesLoadStatus: 'error', vehiclesLoadError: message, hasFetchedVehicles: false })
          if (get().cars.length === 0) {
            get().initCars()
            set({ vehiclesLoadStatus: 'success', vehiclesLoadError: null, hasFetchedVehicles: true })
          }
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
          vehicleType: carData.vehicleType ?? 'car',
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

      removeListing: (id) =>
        set((state) => ({
          cars: state.cars.filter((c) => c.id !== id),
          savedCarIds: state.savedCarIds.filter((x) => x !== id),
        })),

      getCarById: (id) => get().cars.find((c) => c.id === id),
    }),
    {
      name: 'rentara-cars',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ cars: s.cars, savedCarIds: s.savedCarIds }),
    },
  ),
)
