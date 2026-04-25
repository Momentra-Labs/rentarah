import { persist, createJSONStorage } from 'zustand/middleware'
import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

import type { BookingRecord, ChatMessage, ChatThread } from '../types'
import { useAuthStore } from './useAuthStore'
import { useCarsStore } from './useCarsStore'

function readKey(userId: string, threadId: string) {
  return `${userId}::${threadId}`
}

export interface ChatStoreState {
  threadById: Record<string, ChatThread>
  messagesByThread: Record<string, ChatMessage[]>
  /** Last time user “opened” a thread; used to compute unread */
  lastReadAt: Record<string, string>
  /** Ensures a thread + seed messages for every booking the user is part of */
  syncThreadsFromBookings: (bookings: BookingRecord[]) => void
  sendMessage: (threadId: string, body: string) => void
  markThreadRead: (threadId: string) => void
  getThreadsForUser: (userId: string) => ChatThread[]
  getUnreadForUser: (userId: string) => number
}

function seedWelcomeMessages(thread: ChatThread): ChatMessage[] {
  const t0 = new Date(thread.lastMessageAt).getTime() - 86_400_000
  return [
    {
      id: `${thread.id}_m0`,
      threadId: thread.id,
      senderId: thread.hostId,
      body: `Hi! Thanks for booking the ${thread.carName.split(' ').slice(0, 3).join(' ')}. Feel free to ask about pickup or vehicle details.`,
      createdAt: new Date(t0 + 2 * 60_000).toISOString(),
    },
    {
      id: `${thread.id}_m1`,
      threadId: thread.id,
      senderId: thread.renterId,
      body: 'Great, looking forward to the trip. What time works best for handover?',
      createdAt: new Date(t0 + 12 * 60_000).toISOString(),
    },
  ]
}

export const useChatStore = create<ChatStoreState>()(
  persist(
    (set, get) => ({
      threadById: {},
      messagesByThread: {},
      lastReadAt: {},

      syncThreadsFromBookings: (bookings) => {
        if (bookings.length === 0) return
        const cars = useCarsStore.getState().getCarById
        set((s) => {
          const nextThreads = { ...s.threadById }
          const nextMsgs = { ...s.messagesByThread }
          for (const b of bookings) {
            if (nextThreads[b.id]) continue
            const car = cars(b.carId)
            const carName = b.carName ?? (car ? `${car.year} ${car.make} ${car.model}` : 'Your rental')
            const hostName = car?.hostName ?? 'Host'
            const now = b.createdAt
            const thread: ChatThread = {
              id: b.id,
              bookingId: b.id,
              carId: b.carId,
              hostId: b.hostId,
              renterId: b.userId,
              carName,
              hostName,
              renterName: b.renterName ?? 'Guest',
              lastMessageAt: now,
              lastPreview: b.status === 'cancelled' ? 'Booking cancelled' : 'Say hello to your host or guest',
            }
            nextThreads[b.id] = thread
            if (!nextMsgs[b.id] || nextMsgs[b.id].length === 0) {
              if (b.status !== 'cancelled') {
                const seeded = seedWelcomeMessages({ ...thread, lastMessageAt: b.createdAt })
                nextMsgs[b.id] = seeded
                const last = seeded[seeded.length - 1]!
                nextThreads[b.id] = {
                  ...thread,
                  lastMessageAt: last.createdAt,
                  lastPreview: last.body,
                }
              } else {
                const cancelMsg: ChatMessage = {
                  id: `${b.id}_xc`,
                  threadId: b.id,
                  senderId: b.hostId,
                  body: 'This booking was cancelled. You can still read the history above.',
                  createdAt: b.createdAt,
                }
                nextMsgs[b.id] = [cancelMsg]
                nextThreads[b.id] = {
                  ...thread,
                  lastMessageAt: cancelMsg.createdAt,
                  lastPreview: cancelMsg.body,
                }
              }
            }
          }
          return { threadById: nextThreads, messagesByThread: nextMsgs }
        })
      },

      sendMessage: (threadId, body) => {
        const text = body.trim()
        if (!text) return
        const user = useAuthStore.getState().user
        if (!user) return
        const t = get().threadById[threadId]
        if (!t) return
        if (user.id !== t.hostId && user.id !== t.renterId) return
        const msg: ChatMessage = {
          id: uuidv4(),
          threadId,
          senderId: user.id,
          body: text,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({
          messagesByThread: {
            ...s.messagesByThread,
            [threadId]: [...(s.messagesByThread[threadId] ?? []), msg],
          },
          threadById: {
            ...s.threadById,
            [threadId]: {
              ...t,
              lastMessageAt: msg.createdAt,
              lastPreview: text,
            },
          },
        }))
        get().markThreadRead(threadId)
      },

      markThreadRead: (threadId) => {
        const user = useAuthStore.getState().user
        if (!user) return
        const now = new Date().toISOString()
        set((s) => ({
          lastReadAt: { ...s.lastReadAt, [readKey(user.id, threadId)]: now },
        }))
      },

      getThreadsForUser: (userId) => {
        const t = get().threadById
        return Object.values(t)
          .filter((x) => x.hostId === userId || x.renterId === userId)
          .sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1))
      },

      getUnreadForUser: (userId) => {
        const { threadById, messagesByThread, lastReadAt } = get()
        let n = 0
        for (const th of Object.values(threadById)) {
          if (th.hostId !== userId && th.renterId !== userId) continue
          const read = lastReadAt[readKey(userId, th.id)]
          const msgs = messagesByThread[th.id] ?? []
          for (const m of msgs) {
            if (m.senderId === userId) continue
            if (!read || m.createdAt > read) n += 1
          }
        }
        return n
      },
    }),
    {
      name: 'rentara-chat',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        threadById: s.threadById,
        messagesByThread: s.messagesByThread,
        lastReadAt: s.lastReadAt,
      }),
    },
  ),
)

export function useChatUnreadForCurrentUser() {
  const user = useAuthStore((s) => s.user)
  const threadById = useChatStore((s) => s.threadById)
  const messagesByThread = useChatStore((s) => s.messagesByThread)
  const lastReadAt = useChatStore((s) => s.lastReadAt)
  if (!user) return 0
  let n = 0
  for (const th of Object.values(threadById)) {
    if (th.hostId !== user.id && th.renterId !== user.id) continue
    const read = lastReadAt[readKey(user.id, th.id)]
    const msgs = messagesByThread[th.id] ?? []
    for (const m of msgs) {
      if (m.senderId === user.id) continue
      if (!read || m.createdAt > read) n += 1
    }
  }
  return n
}
