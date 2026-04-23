import type { Car } from '../types'

import { getJson } from './apiClient'
import { USE_MOCK_API } from './config'
import { mockGetVehicleById, mockGetVehicles } from './mockApi'

/**
 * `GET /vehicles` — returns the public catalog. Maps 1:1 to the `Car` domain type used in the UI.
 * When the backend uses different field names, map the DTO to `Car` here (single place).
 */
export async function getVehicles(signal?: AbortSignal): Promise<Car[]> {
  if (USE_MOCK_API) {
    return mockGetVehicles()
  }
  return getJson<Car[]>('/vehicles', signal)
}

/**
 * `GET /vehicles/:id` — single resource for the detail and booking flow.
 */
export async function getVehicleById(id: string, signal?: AbortSignal): Promise<Car> {
  if (USE_MOCK_API) {
    const v = await mockGetVehicleById(id)
    if (!v) {
      const err = new Error('Vehicle not found') as Error & { status?: number }
      err.status = 404
      throw err
    }
    return v
  }
  return getJson<Car>(`/vehicles/${encodeURIComponent(id)}`, signal)
}
