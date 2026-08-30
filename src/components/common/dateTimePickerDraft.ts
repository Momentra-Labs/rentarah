import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

import { applyMinutesFromMidnightToDay, withDefaultPickupTime } from '@/utils/dateUtils'

export const MINUTE_STEPS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as const

export function snapUpToFiveMinutes(d: Dayjs): Dayjs {
  const extra = d.second() > 0 || d.millisecond() > 0 ? 1 : 0
  const total = d.hour() * 60 + d.minute()
  if (extra === 0 && total % 5 === 0) return d.second(0).millisecond(0)
  const snapped = Math.ceil((total + extra) / 5) * 5
  if (snapped >= 24 * 60) return withDefaultPickupTime(d.add(1, 'day').startOf('day'))
  return applyMinutesFromMidnightToDay(d, snapped)
}

export function earliestAllowedInstant(minDate?: Dayjs | null, now = dayjs()): Dayjs {
  if (!minDate?.isValid()) return now
  return minDate.isAfter(now) ? minDate : now
}

export function createPickerDraft(
  value: Dayjs | null,
  minDate: Dayjs | null | undefined,
  showTime: boolean,
  now = dayjs(),
): Dayjs {
  const earliest = earliestAllowedInstant(minDate, now)
  if (value?.isValid()) {
    const kept = showTime ? value.second(0).millisecond(0) : value.startOf('day')
    if (showTime && kept.isBefore(earliest)) return snapUpToFiveMinutes(earliest)
    if (!showTime && kept.isBefore(earliest, 'day')) return earliest.startOf('day')
    return kept
  }
  const floor = minDate?.isValid() ? minDate.startOf('day') : now.startOf('day')
  const base = floor.isBefore(now, 'day') ? now.startOf('day') : floor
  if (!showTime) return base
  const withTime = withDefaultPickupTime(base)
  return withTime.isBefore(earliest) ? snapUpToFiveMinutes(earliest) : withTime
}

export function applyDateKeepTime(
  draft: Dayjs,
  nextDay: Dayjs,
  showTime: boolean,
  minDate?: Dayjs | null,
  now = dayjs(),
): Dayjs {
  const merged = showTime
    ? nextDay.hour(draft.hour()).minute(draft.minute()).second(0).millisecond(0)
    : nextDay.startOf('day')
  const earliest = earliestAllowedInstant(minDate, now)
  if (showTime && merged.isBefore(earliest)) return snapUpToFiveMinutes(earliest)
  if (!showTime && merged.isBefore(earliest, 'day')) return earliest.startOf('day')
  return merged
}

export function weekendStart(now = dayjs()): Dayjs {
  if (now.day() === 6) return now.startOf('day')
  return now.day(6).startOf('day')
}

export function nextWeekDay(now = dayjs()): Dayjs {
  return now.add(7, 'day').startOf('day')
}

export function hour12From24(h24: number): number {
  const h = h24 % 12
  return h === 0 ? 12 : h
}

export function toHour24(h12: number, isPm: boolean): number {
  if (h12 === 12) return isPm ? 12 : 0
  return isPm ? h12 + 12 : h12
}

export function isDayBeforeMin(day: Dayjs, minDate?: Dayjs | null): boolean {
  if (!minDate?.isValid()) return false
  return day.startOf('day').isBefore(minDate.startOf('day'))
}

export function minuteToFiveStep(minute: number): number {
  return Math.min(55, Math.round(minute / 5) * 5)
}
