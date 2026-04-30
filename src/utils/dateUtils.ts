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

export function snapToNearestHalfHourFromMidnight(totalMins: number): number {
  const rounded = Math.round(totalMins / 30) * 30
  return Math.min(23 * 60 + 30, Math.max(0, rounded))
}

/** Minutes from midnight for `d` snapped to nearest 30 minutes. */
export function minutesFromMidnightSnappedHalfHour(d: Dayjs): number {
  return snapToNearestHalfHourFromMidnight(d.hour() * 60 + d.minute())
}

/** Labels for all 48 half-hour slots in a day (12-hour clock). */
export function formatMinutesFromMidnightLabel(totalMins: number): string {
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  return dayjs().startOf('day').hour(h).minute(m).format('h:mm A')
}

/** Enumerate `[0, 30, …, 23×60+30]` for select menus. */
export function halfHourMinutesFromMidnightOptions(): readonly number[] {
  const out: number[] = []
  for (let mins = 0; mins <= 23 * 60 + 30; mins += 30) {
    out.push(mins)
  }
  return out
}

/** Apply minutes-from-midnight to the calendar day of `base` (hour/minute only). */
export function applyMinutesFromMidnightToDay(base: Dayjs, totalMins: number): Dayjs {
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  return base.hour(h).minute(m).second(0).millisecond(0)
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

/**
 * Conversation-friendly scheduling line: uses Today / Tomorrow / Yesterday when applicable,
 * otherwise `Wed, Apr 28, 2026 · 3:30 PM`-style wording.
 */
export function formatTripDateTimeHuman(d: Dayjs, now: Dayjs = dayjs()): string {
  if (!d?.isValid()) return ''
  const clock = d.format('h:mm A')
  const dayStart = d.startOf('day')
  const todayStart = now.startOf('day')
  const diffDays = dayStart.diff(todayStart, 'day')
  let dayLabel: string
  if (diffDays === 0) dayLabel = 'Today'
  else if (diffDays === 1) dayLabel = 'Tomorrow'
  else if (diffDays === -1) dayLabel = 'Yesterday'
  else dayLabel = d.format('ddd, MMM D, YYYY')
  return `${dayLabel} · ${clock}`
}

/**
 * Clock-time span between pickup and dropoff (distinct from billed calendar-night count — see pricing copy).
 * Uses minute-level diff from the picker; total hours rounded to one decimal where needed.
 */
export function formatPickupReturnRentSpanHuman(pickup: Dayjs, dropoff: Dayjs): string | null {
  if (!pickup?.isValid() || !dropoff?.isValid() || !dropoff.isAfter(pickup)) return null
  const totalMins = dropoff.diff(pickup, 'minute')
  if (totalMins <= 0) return null

  const totalHoursRounded = Math.round((totalMins / 60) * 10) / 10
  const hrsFloor = Math.floor(totalMins / 60)
  const mins = totalMins % 60
  const days = Math.floor(hrsFloor / 24)
  const hrs = hrsFloor % 24

  const segments: string[] = []
  if (days > 0) segments.push(`${days} day${days !== 1 ? 's' : ''}`)
  if (hrs > 0) segments.push(`${hrs} hr${hrs !== 1 ? 's' : ''}`)
  if (mins > 0) segments.push(`${mins} min`)

  const breakdown = segments.join(' · ')
  const hoursLabel =
    totalHoursRounded % 1 === 0
      ? `${totalHoursRounded} total hour${totalHoursRounded !== 1 ? 's' : ''}`
      : `${totalHoursRounded.toFixed(1)} total hours`

  return `~${hoursLabel} on the clock${breakdown ? ` (${breakdown})` : ''}`
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
