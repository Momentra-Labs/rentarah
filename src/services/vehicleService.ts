import { getVehicleRepository } from '@/repositories'
import type { Car } from '@/types'

/**
 * Application service — catalog reads. Infrastructure lives in repositories.
 */
export async function getVehicles(signal?: AbortSignal): Promise<Car[]> {
  return getVehicleRepository().getVehicles(signal)
}

export async function getVehicleById(id: string, signal?: AbortSignal): Promise<Car> {
  return getVehicleRepository().getVehicleById(id, signal)
}
