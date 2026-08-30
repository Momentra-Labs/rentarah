import { USE_MOCK_API } from '@/services/config'

import { httpBookingRepository } from './httpBookingRepository'
import { httpVehicleRepository } from './httpVehicleRepository'
import { mockBookingRepository } from './mockBookingRepository'
import { mockVehicleRepository } from './mockVehicleRepository'
import type { BookingRepository, VehicleRepository } from './types'

export type {
  BookingRepository,
  CheckAvailabilityResult,
  CreateBookingPayload,
  CreateBookingResult,
  VehicleRepository,
} from './types'

export function getVehicleRepository(): VehicleRepository {
  return USE_MOCK_API ? mockVehicleRepository : httpVehicleRepository
}

export function getBookingRepository(): BookingRepository {
  return USE_MOCK_API ? mockBookingRepository : httpBookingRepository
}
