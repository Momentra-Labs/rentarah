import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'

import { groupNotificationsByDay, notificationDayGroup } from './notificationTime'

const now = dayjs('2026-08-31T19:00:00')

describe('notificationDayGroup', () => {
  it('classifies today, yesterday, and earlier', () => {
    expect(notificationDayGroup(now.subtract(2, 'hour').toISOString(), now)).toBe('today')
    expect(notificationDayGroup(now.subtract(1, 'day').toISOString(), now)).toBe('yesterday')
    expect(notificationDayGroup(now.subtract(3, 'day').toISOString(), now)).toBe('earlier')
  })

  it('treats invalid timestamps as earlier', () => {
    expect(notificationDayGroup('not-a-date', now)).toBe('earlier')
  })
})

describe('groupNotificationsByDay', () => {
  it('keeps encounter order inside each group and omits empty groups', () => {
    const items = [
      { id: 'a', createdAt: now.subtract(10, 'minute').toISOString() },
      { id: 'b', createdAt: now.subtract(2, 'day').toISOString() },
      { id: 'c', createdAt: now.subtract(5, 'minute').toISOString() },
      { id: 'd', createdAt: now.subtract(1, 'day').hour(8).toISOString() },
    ]
    const grouped = groupNotificationsByDay(items, now)
    expect(grouped.map((g) => g.group)).toEqual(['today', 'yesterday', 'earlier'])
    expect(grouped[0].items.map((i) => i.id)).toEqual(['a', 'c'])
    expect(grouped[1].items.map((i) => i.id)).toEqual(['d'])
    expect(grouped[2].items.map((i) => i.id)).toEqual(['b'])
  })
})
