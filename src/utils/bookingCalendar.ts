/**
 * Date-only (YYYY-MM-DD) range helpers for rental availability.
 * Uses noon UTC-offset-safe local dates for iteration.
 */

export function iterateDateRangeInclusive(startYmd: string, endYmd: string): string[] {
  const start = new Date(`${startYmd}T12:00:00`)
  const end = new Date(`${endYmd}T12:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return []
  }
  const out: string[] = []
  const cur = new Date(start)
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

export function rangeConflictsBooked(
  bookedDates: readonly string[],
  startYmd: string,
  endYmd: string,
): { conflictingDates: string[]; availableForRange: boolean } {
  const booked = new Set(bookedDates)
  const conflictingDates: string[] = []
  for (const d of iterateDateRangeInclusive(startYmd, endYmd)) {
    if (booked.has(d)) conflictingDates.push(d)
  }
  return {
    conflictingDates,
    availableForRange: conflictingDates.length === 0,
  }
}
