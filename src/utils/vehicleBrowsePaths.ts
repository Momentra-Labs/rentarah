import type { Car } from '../types'
import { getVehicleType } from './vehicleUtils'

/** Query-string path to compare the same make/model across hosts. */
export function vehicleModelSearchPath(car: Pick<Car, 'make' | 'model' | 'vehicleType'>): string {
  const vt = 'vehicleType' in car && car.vehicleType ? car.vehicleType : getVehicleType(car as Car)
  const q = new URLSearchParams({
    make: car.make,
    model: car.model,
    vt,
  })
  return `/search/model?${q.toString()}`
}
