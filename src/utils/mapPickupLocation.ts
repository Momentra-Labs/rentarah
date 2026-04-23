import { resolveCityHallCoords } from '../data/ncrCityHalls'
import type { Car } from '../types'

/** Pickup coordinates for map: explicit GPS, else city hall for {@link Car.location}. */
export function getCarPickupLatLng(car: Car): { lat: number; lng: number } {
  if (typeof car.pickupLat === 'number' && typeof car.pickupLng === 'number') {
    return { lat: car.pickupLat, lng: car.pickupLng }
  }
  return resolveCityHallCoords(car.location)
}
