import type { Dayjs } from 'dayjs'

/**
 * Each calendar day the car is on rent, matching `calcPricing` (billed days = dropoff.diff(pickup, 'day')).
 * Pickup is included; return (dropoff) is the hand-back day and is not part of the highlighted/rental block.
 * Half-open in calendar days: [pickup, dropoff).
 */
export function generateRentalOccupancyDates(pickup: Dayjs, dropoff: Dayjs): string[] {
  const out: string[] = []
  let cur = pickup.startOf('day')
  const endExclusive = dropoff.startOf('day')
  while (cur.isBefore(endExclusive, 'day')) {
    out.push(cur.format('YYYY-MM-DD'))
    cur = cur.add(1, 'day')
  }
  return out
}
