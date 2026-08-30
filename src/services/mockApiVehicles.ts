import { mockVehicleRepository } from '@/repositories/mockVehicleRepository'
import type { Car } from '@/types'

export async function mockGetVehicles(): Promise<Car[]> {
  return mockVehicleRepository.getVehicles()
}

export async function mockGetVehicleById(id: string): Promise<Car | null> {
  try {
    return await mockVehicleRepository.getVehicleById(id)
  } catch {
    return null
  }
}
