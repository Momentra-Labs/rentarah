import type { Dayjs } from 'dayjs'

/** Short area label — first segment before comma, or trimmed string */
export function shortLocationLabel(location: string): string {
  const t = location.trim()
  if (!t) return 'Pick area'
  return t.split(',')[0]?.trim() ?? t
}

/** Date span only — compact bar copy (matches “Apr 30 – May 3”) */
export function formatTripDatesShortRange(pickup: Dayjs | null, dropoff: Dayjs | null): string {
  if (!pickup?.isValid()) return 'Add dates'
  if (!dropoff?.isValid()) return pickup.format('MMM D')
  return `${pickup.format('MMM D')} – ${dropoff.format('MMM D')}`
}

/** Single-line search summary bar: area | date span */
export function formatSearchSummaryLine(location: string, pickup: Dayjs | null, dropoff: Dayjs | null): string {
  const area = shortLocationLabel(location)
  const dates = formatTripDatesShortRange(pickup, dropoff)
  return `${area} | ${dates}`
}
