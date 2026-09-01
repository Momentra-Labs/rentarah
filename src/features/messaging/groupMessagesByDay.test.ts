import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'

import type { ChatMessage } from '@/types'

import { splitDisplayName } from './chatDisplay'
import { chatDayKind, groupMessagesByDay } from './groupMessagesByDay'

function msg(id: string, createdAt: string): ChatMessage {
  return { id, threadId: 't1', senderId: 'u1', body: id, createdAt }
}

describe('groupMessagesByDay', () => {
  const now = dayjs('2026-09-01T12:00:00')

  it('buckets consecutive messages by calendar day', () => {
    const groups = groupMessagesByDay(
      [
        msg('c', '2026-09-01T11:00:00'),
        msg('a', '2026-08-30T09:00:00'),
        msg('b', '2026-08-31T18:00:00'),
        msg('d', '2026-09-01T11:30:00'),
      ],
      now,
    )
    expect(groups.map((g) => g.kind)).toEqual(['date', 'yesterday', 'today'])
    expect(groups[0].messages.map((m) => m.id)).toEqual(['a'])
    expect(groups[1].messages.map((m) => m.id)).toEqual(['b'])
    expect(groups[2].messages.map((m) => m.id)).toEqual(['c', 'd'])
  })

  it('classifies today and yesterday', () => {
    expect(chatDayKind('2026-09-01T01:00:00', now)).toBe('today')
    expect(chatDayKind('2026-08-31T23:00:00', now)).toBe('yesterday')
    expect(chatDayKind('2026-08-20T12:00:00', now)).toBe('date')
  })
})

describe('splitDisplayName', () => {
  it('splits first and remaining parts', () => {
    expect(splitDisplayName('Carlo Reyes')).toEqual({ firstName: 'Carlo', lastName: 'Reyes' })
    expect(splitDisplayName('Alex')).toEqual({ firstName: 'Alex', lastName: '' })
    expect(splitDisplayName('  Ana Marie Cruz  ')).toEqual({ firstName: 'Ana', lastName: 'Marie Cruz' })
  })
})
