import type { Dayjs } from 'dayjs'

import type { Car } from '../types'
import { formatPeso } from '../utils/formatCurrency'
import { calcPricing } from '../utils/priceCalc'

export function usePricing(car: Car | null, pickup: Dayjs | null, dropoff: Dayjs | null) {
  const raw = car ? calcPricing(car.pricePerDay, pickup, dropoff) : null
  if (!raw || !car) {
    return {
      pricing: null,
      formattedTotal: null,
      pricePerDay: car?.pricePerDay ?? null,
    }
  }
  return {
    pricing: raw,
    formattedTotal: formatPeso(raw.total),
    pricePerDay: car.pricePerDay,
    ...raw,
  }
}
