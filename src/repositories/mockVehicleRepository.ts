import { mockCars } from '@/data/mockCars'
import type { Car } from '@/types'

import type { VehicleRepository } from './types'

const MOCK_DELAY_MS = 0
const delay = (ms = MOCK_DELAY_MS) => new Promise((r) => setTimeout(r, ms))

export const mockVehicleRepository: VehicleRepository = {
  async getVehicles(): Promise<Car[]> {
    await delay()
    return mockCars.map((c) => ({ ...c }))
  },

  async getVehicleById(id: string): Promise<Car> {
    await delay()
    const v = mockCars.find((c) => c.id === id)
    if (!v) {
      const err = new Error('Vehicle not found') as Error & { status?: number }
      err.status = 404
      throw err
    }
    return { ...v }
  },
}
