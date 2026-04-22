import type { Car, SearchFilters, VehicleType } from '../types'

export const VEHICLE_TYPE_VALUES: VehicleType[] = ['car', 'motorcycle', 'scooter', 'bigbike']

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  car: 'Car',
  motorcycle: 'Motorcycle',
  scooter: 'Scooter',
  bigbike: 'Big bike',
}

export function getVehicleType(
  car: Pick<Car, 'vehicleType'> | { vehicleType?: Car['vehicleType'] } | null | undefined,
): VehicleType {
  return car?.vehicleType ?? 'car'
}

export function isValidVehicleType(v: string): v is VehicleType {
  return (VEHICLE_TYPE_VALUES as readonly string[]).includes(v)
}

export function isTwoWheeler(car: Pick<Car, 'vehicleType'> | null | undefined): boolean {
  return getVehicleType(car) !== 'car'
}

export function matchesVehicleTypeFilter(
  car: Pick<Car, 'vehicleType'> | { vehicleType?: Car['vehicleType'] } | null | undefined,
  filter: SearchFilters['vehicleType'],
): boolean {
  if (filter === 'all') return true
  return getVehicleType(car) === filter
}
