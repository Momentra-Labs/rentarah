import type { ChatThread } from '@/types'

export function otherPartyName(thread: ChatThread, me: string): string {
  return thread.hostId === me ? thread.renterName : thread.hostName
}

export function splitDisplayName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}
