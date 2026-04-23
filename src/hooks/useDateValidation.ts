import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

import type { Car } from '../types'
import { generateRentalOccupancyDates } from '../utils/dateUtils'

export function useDateValidation(car: Car | null) {
  const shouldDisableDate = (date: Dayjs) => {
    if (!car) return true
    const d = date.format('YYYY-MM-DD')
    return (
      date.isBefore(dayjs(), 'day') ||
      car.bookedDates.includes(d)
    )
  }

  const isRangeAvailable = (pickup: Dayjs | null, dropoff: Dayjs | null) => {
    if (!car || !pickup?.isValid() || !dropoff?.isValid()) return false
    if (!dropoff.isAfter(pickup, 'day')) return false
    const range = generateRentalOccupancyDates(pickup, dropoff)
    return !range.some((x) => car.bookedDates.includes(x))
  }

  return { shouldDisableDate, isRangeAvailable }
}
