import { getJson } from '@/services/apiClient'
import type { Car } from '@/types'

import type { VehicleRepository } from './types'

export const httpVehicleRepository: VehicleRepository = {
  getVehicles(signal?: AbortSignal): Promise<Car[]> {
    return getJson<Car[]>('/vehicles', signal)
  },

  getVehicleById(id: string, signal?: AbortSignal): Promise<Car> {
    return getJson<Car>(`/vehicles/${encodeURIComponent(id)}`, signal)
  },
}
