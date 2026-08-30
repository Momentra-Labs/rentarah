import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'

import {
  applyDateKeepTime,
  createPickerDraft,
  hour12From24,
  snapUpToFiveMinutes,
  toHour24,
  weekendStart,
} from './dateTimePickerDraft'

describe('dateTimePickerDraft', () => {
  it('keeps a valid future value as the draft', () => {
    const now = dayjs('2026-04-20T10:00:00')
    const value = dayjs('2026-04-28T14:30:00')
    expect(createPickerDraft(value, null, true, now).isSame(value, 'minute')).toBe(true)
    expect(createPickerDraft(value, null, false, now).format('YYYY-MM-DD')).toBe('2026-04-28')
  })

  it('snaps a stale past value up to the next allowed slot', () => {
    const now = dayjs('2026-08-30T11:10:00')
    const draft = createPickerDraft(dayjs('2026-04-28T09:00:00'), now, true, now)
    expect(draft.format('YYYY-MM-DD HH:mm')).toBe('2026-08-30 11:10')
  })

  it('defaults an empty draft to 10:00 AM on the earliest allowed day', () => {
    const now = dayjs('2026-04-28T15:00:00')
    const draft = createPickerDraft(null, now, true, now)
    expect(draft.format('YYYY-MM-DD HH:mm')).toBe('2026-04-28 15:00')
  })

  it('snaps a past time on the same day up to the next five minutes', () => {
    const now = dayjs('2026-04-28T10:12:00')
    const draft = dayjs('2026-04-28T09:00:00')
    const next = applyDateKeepTime(draft, now, true, now, now)
    expect(next.format('YYYY-MM-DD HH:mm')).toBe('2026-04-28 10:15')
  })

  it('snaps partial minutes up to the next five-minute slot', () => {
    expect(snapUpToFiveMinutes(dayjs('2026-04-28T10:01:00')).format('HH:mm')).toBe('10:05')
    expect(snapUpToFiveMinutes(dayjs('2026-04-28T10:00:00')).format('HH:mm')).toBe('10:00')
    expect(snapUpToFiveMinutes(dayjs('2026-04-28T11:10:00')).format('HH:mm')).toBe('11:10')
  })

  it('converts 12-hour clock values', () => {
    expect(hour12From24(0)).toBe(12)
    expect(hour12From24(13)).toBe(1)
    expect(toHour24(12, false)).toBe(0)
    expect(toHour24(12, true)).toBe(12)
    expect(toHour24(2, true)).toBe(14)
  })

  it('uses Saturday as this weekend', () => {
    expect(weekendStart(dayjs('2026-04-29')).format('YYYY-MM-DD')).toBe('2026-05-02')
    expect(weekendStart(dayjs('2026-05-02')).format('YYYY-MM-DD')).toBe('2026-05-02')
  })
})
