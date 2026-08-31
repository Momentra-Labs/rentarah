import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export type NotificationDayGroup = 'today' | 'yesterday' | 'earlier'

/** e.g. "2 minutes ago" — dayjs default locale; short & readable on small screens. */
export function formatNotificationTime(iso: string): string {
  const t = dayjs(iso)
  if (!t.isValid()) return ''
  return t.fromNow()
}

export function notificationDayGroup(iso: string, now: Dayjs = dayjs()): NotificationDayGroup {
  const t = dayjs(iso)
  if (!t.isValid()) return 'earlier'
  if (t.isSame(now, 'day')) return 'today'
  if (t.isSame(now.subtract(1, 'day'), 'day')) return 'yesterday'
  return 'earlier'
}

export function groupNotificationsByDay<T extends { createdAt: string }>(
  items: T[],
  now: Dayjs = dayjs(),
): { group: NotificationDayGroup; items: T[] }[] {
  const buckets: Record<NotificationDayGroup, T[]> = { today: [], yesterday: [], earlier: [] }
  for (const item of items) {
    buckets[notificationDayGroup(item.createdAt, now)].push(item)
  }
  return (['today', 'yesterday', 'earlier'] as const)
    .filter((g) => buckets[g].length > 0)
    .map((g) => ({ group: g, items: buckets[g] }))
}
