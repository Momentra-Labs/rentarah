import dayjs, { type Dayjs } from 'dayjs'

import type { ChatMessage } from '@/types'

export type ChatDayKind = 'today' | 'yesterday' | 'date'

export type ChatDayGroup = {
  dayKey: string
  kind: ChatDayKind
  sampleIso: string
  messages: ChatMessage[]
}

export function chatDayKind(iso: string, now: Dayjs = dayjs()): ChatDayKind {
  const t = dayjs(iso)
  if (!t.isValid()) return 'date'
  if (t.isSame(now, 'day')) return 'today'
  if (t.isSame(now.subtract(1, 'day'), 'day')) return 'yesterday'
  return 'date'
}

export function groupMessagesByDay(messages: ChatMessage[], now: Dayjs = dayjs()): ChatDayGroup[] {
  const sorted = [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const groups: ChatDayGroup[] = []
  for (const m of sorted) {
    const parsed = dayjs(m.createdAt)
    const dayKey = parsed.isValid() ? parsed.format('YYYY-MM-DD') : 'unknown'
    const last = groups[groups.length - 1]
    if (last && last.dayKey === dayKey) {
      last.messages.push(m)
    } else {
      groups.push({
        dayKey,
        kind: chatDayKind(m.createdAt, now),
        sampleIso: m.createdAt,
        messages: [m],
      })
    }
  }
  return groups
}
