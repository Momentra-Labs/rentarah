import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

/** Default pick-up clock time when the user chooses a date-only value (search URLs, legacy params). */
export const RENTAL_DEFAULT_PICKUP_HOUR = 10
export const RENTAL_DEFAULT_PICKUP_MINUTE = 0
/** Default return hand-back time for the return calendar day. */
export const RENTAL_DEFAULT_DROPOFF_HOUR = 10
export const RENTAL_DEFAULT_DROPOFF_MINUTE = 0

export function withDefaultPickupTime(d: Dayjs): Dayjs {
  return d
    .hour(RENTAL_DEFAULT_PICKUP_HOUR)
    .minute(RENTAL_DEFAULT_PICKUP_MINUTE)
    .second(0)
    .millisecond(0)
}

export function withDefaultDropoffTime(d: Dayjs): Dayjs {
  return d
    .hour(RENTAL_DEFAULT_DROPOFF_HOUR)
    .minute(RENTAL_DEFAULT_DROPOFF_MINUTE)
    .second(0)
    .millisecond(0)
}

/** `YYYY-MM-DDTHH:mm` for URL query params (local, no timezone shift). */
export function formatSearchDateTimeParam(d: Dayjs): string {
  return d.format('YYYY-MM-DDTHH:mm')
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Parse `pickup` / `dropoff` query values: ISO or `YYYY-MM-DD` (applies default time for date-only).
 */
export function parseSearchDateTimeParam(raw: string | null, role: 'pickup' | 'dropoff'): Dayjs | null {
  if (raw == null || !raw.trim()) return null
  const trimmed = raw.trim()
  const parsed = dayjs(trimmed)
  if (!parsed.isValid()) return null
  if (DATE_ONLY_RE.test(trimmed)) {
    return role === 'pickup' ? withDefaultPickupTime(parsed) : withDefaultDropoffTime(parsed)
  }
  return parsed
}

/** Human-readable trip endpoint for chips and summaries. */
export function formatTripDateTime(d: Dayjs): string {
  return d.format('MMM D, YYYY · h:mm A')
}

/** Format a stored booking/search ISO or date string for dashboards. */
export function formatBookingStoredDate(raw: string): string {
  const d = dayjs(raw)
  if (!d.isValid()) return raw
  return formatTripDateTime(d)
}

/**
 * Each calendar day the car is on rent, matching `calcPricing` (billed days = calendar days between dates).
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
