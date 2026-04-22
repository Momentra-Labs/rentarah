import type { Dayjs } from 'dayjs'

/** Inclusive pickup through dropoff (checkout day excluded from rental nights per product rules — align with booking range check). */
export function generateDateRangeInclusive(pickup: Dayjs, dropoff: Dayjs): string[] {
  const out: string[] = []
  let cur = pickup.startOf('day')
  const end = dropoff.startOf('day')
  while (cur.isBefore(end, 'day') || cur.isSame(end, 'day')) {
    out.push(cur.format('YYYY-MM-DD'))
    cur = cur.add(1, 'day')
  }
  return out
}
