import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'

import { formatClockHoursLabel, formatPickupReturnRentSpanHuman, getPickupReturnRentSpan } from './dateUtils'

describe('getPickupReturnRentSpan', () => {
  it('returns 3 days and 72 hours for a 72-hour window', () => {
    const pickup = dayjs('2026-09-01T10:00:00')
    const dropoff = dayjs('2026-09-04T10:00:00')
    expect(getPickupReturnRentSpan(pickup, dropoff)).toEqual({
      totalMins: 72 * 60,
      totalHoursRounded: 72,
      days: 3,
      hours: 0,
      minutes: 0,
    })
    expect(formatPickupReturnRentSpanHuman(pickup, dropoff)).toBe('~72 total hours on the clock (3 days)')
  })

  it('keeps leftover hours and minutes', () => {
    const pickup = dayjs('2026-09-01T10:00:00')
    const dropoff = dayjs('2026-09-01T18:30:00')
    expect(getPickupReturnRentSpan(pickup, dropoff)).toEqual({
      totalMins: 8 * 60 + 30,
      totalHoursRounded: 8.5,
      days: 0,
      hours: 8,
      minutes: 30,
    })
    expect(formatClockHoursLabel(8.5)).toBe('8.5')
    expect(formatClockHoursLabel(72)).toBe('72')
  })

  it('returns null when return is not after pick-up', () => {
    const t = dayjs('2026-09-01T10:00:00')
    expect(getPickupReturnRentSpan(t, t)).toBeNull()
  })
})
