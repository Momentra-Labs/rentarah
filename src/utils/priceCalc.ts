import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

import type { PricingBreakdown } from '../types'

/** Flat insurance add-on in PHP (per product spec). */
export const INSURANCE_FLAT_PHP = 450

export function calcPricing(
  pricePerDay: number | null | undefined,
  pickupDate: Dayjs | null | undefined,
  dropoffDate: Dayjs | null | undefined,
): PricingBreakdown | null {
  if (
    pricePerDay == null ||
    !pickupDate ||
    !dropoffDate ||
    !dayjs.isDayjs(pickupDate) ||
    !dayjs.isDayjs(dropoffDate) ||
    !pickupDate.isValid() ||
    !dropoffDate.isValid()
  ) {
    return null
  }

  /** Rental days = calendar days between pickup and return date (checkout). */
  const days = Math.max(1, dropoffDate.diff(pickupDate, 'day'))

  const subtotal = pricePerDay * days
  const serviceFee = Math.round(subtotal * 0.1)
  const insurance = INSURANCE_FLAT_PHP
  const total = subtotal + serviceFee + insurance

  return { days, subtotal, serviceFee, insurance, total }
}
