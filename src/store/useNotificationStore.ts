import { persist, createJSONStorage } from 'zustand/middleware'
import { create } from 'zustand'

import { createInitialNotifications } from '../data/mockNotifications'
import type { AppNotification } from '../types'

export type NotificationState = {
  notifications: AppNotification[]
  markAsRead: (id: string) => void
  markAllAsRead: () => void
}

const bookingTypes = new Set<AppNotification['type']>([
  'booking_confirmed',
  'booking_cancelled',
  'upcoming_rental_reminder',
])
const paymentTypes = new Set<AppNotification['type']>(['payment_success', 'payment_failed'])

export function filterNotifications(
  list: AppNotification[],
  filter: 'all' | 'unread' | 'bookings' | 'payments',
): AppNotification[] {
  switch (filter) {
    case 'unread':
      return list.filter((n) => !n.read)
    case 'bookings':
      return list.filter((n) => bookingTypes.has(n.type))
    case 'payments':
      return list.filter((n) => paymentTypes.has(n.type))
    default:
      return list
  }
}

export function getUnreadCount(list: AppNotification[]): number {
  return list.filter((n) => !n.read).length
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: createInitialNotifications(),

      markAsRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllAsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
    }),
    {
      name: 'rentara-notifications',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ notifications: s.notifications }),
    },
  ),
)

export function useUnreadNotificationCount() {
  return useNotificationStore((s) => getUnreadCount(s.notifications))
}
