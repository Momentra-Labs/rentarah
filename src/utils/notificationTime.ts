import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

/** e.g. "2 minutes ago" — dayjs default locale; short & readable on small screens. */
export function formatNotificationTime(iso: string): string {
  const t = dayjs(iso)
  if (!t.isValid()) return ''
  return t.fromNow()
}
