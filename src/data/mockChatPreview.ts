import type { ChatMessage, ChatThread } from '../types'

import { DEMO_USER_ID, MOCK_GUEST_RENTER_ID, MOCK_HOST_IDS } from './mockUsers'

/**
 * Client-only “UI preview” thread so Messages always has a sample (no real booking required).
 * Same stable id is reused; re-seeded when a different user logs in and no prior messages exist.
 */
export const MOCK_CHAT_THREAD_ID = 'booking_ui_preview' as const

const PREVIEW_CAR_ID = 'car_001'
const PREVIEW_CAR_NAME = '2023 Toyota Fortuner'
const PREVIEW_HOST_NAME = 'Carlo Reyes'
const GUEST_RENTER_NAME = 'Alex Mendoza'

type PreviewVariant = { hostId: string; renterId: string; hostName: string; renterName: string }

function getPreviewVariant(currentUserId: string, currentRenterName: string): PreviewVariant {
  if (currentUserId === DEMO_USER_ID) {
    return {
      hostId: DEMO_USER_ID,
      renterId: MOCK_GUEST_RENTER_ID,
      hostName: PREVIEW_HOST_NAME,
      renterName: GUEST_RENTER_NAME,
    }
  }
  return {
    hostId: MOCK_HOST_IDS.carlo,
    renterId: currentUserId,
    hostName: PREVIEW_HOST_NAME,
    renterName: currentRenterName || 'Guest',
  }
}

/**
 * @param currentRenterName — display name for the signed-in user when they play the renter in the thread
 */
export function buildMockChatPreview(
  currentUserId: string,
  currentRenterName: string,
): { thread: ChatThread; messages: ChatMessage[] } {
  const v = getPreviewVariant(currentUserId, currentRenterName)
  const base = Date.now() - 2 * 3_600_000

  const messages: ChatMessage[] =
    v.renterId === MOCK_GUEST_RENTER_ID
      ? [
          {
            id: `${MOCK_CHAT_THREAD_ID}_m0`,
            threadId: MOCK_CHAT_THREAD_ID,
            senderId: v.renterId,
            body: "Hi Carlo! I'll pick up the Fortuner Saturday at 2 PM. Is guest parking free at your building?",
            createdAt: new Date(base + 2 * 60_000).toISOString(),
          },
          {
            id: `${MOCK_CHAT_THREAD_ID}_m1`,
            threadId: MOCK_CHAT_THREAD_ID,
            senderId: v.hostId,
            body: "Yes — use visitor slot B2. I'll text you the gate pass before pickup.",
            createdAt: new Date(base + 8 * 60_000).toISOString(),
          },
          {
            id: `${MOCK_CHAT_THREAD_ID}_m2`,
            threadId: MOCK_CHAT_THREAD_ID,
            senderId: v.renterId,
            body: "Perfect, see you at 2 PM. Thanks!",
            createdAt: new Date(base + 12 * 60_000).toISOString(),
          },
        ]
      : [
          {
            id: `${MOCK_CHAT_THREAD_ID}_m0`,
            threadId: MOCK_CHAT_THREAD_ID,
            senderId: v.hostId,
            body: "Thanks for your booking! Pickup is in the building lobby, 2 PM. Text me if you need a different time.",
            createdAt: new Date(base + 1 * 60_000).toISOString(),
          },
          {
            id: `${MOCK_CHAT_THREAD_ID}_m1`,
            threadId: MOCK_CHAT_THREAD_ID,
            senderId: v.renterId,
            body: "Sounds good — I'll be there. Is parking free for visitors?",
            createdAt: new Date(base + 5 * 60_000).toISOString(),
          },
          {
            id: `${MOCK_CHAT_THREAD_ID}_m2`,
            threadId: MOCK_CHAT_THREAD_ID,
            senderId: v.hostId,
            body: 'Yes, use B2. See you at pickup!',
            createdAt: new Date(base + 9 * 60_000).toISOString(),
          },
        ]

  const last = messages[messages.length - 1]!
  const thread: ChatThread = {
    id: MOCK_CHAT_THREAD_ID,
    bookingId: MOCK_CHAT_THREAD_ID,
    carId: PREVIEW_CAR_ID,
    hostId: v.hostId,
    renterId: v.renterId,
    carName: PREVIEW_CAR_NAME,
    hostName: v.hostName,
    renterName: v.renterName,
    lastMessageAt: last.createdAt,
    lastPreview: last.body,
  }

  return { thread, messages }
}
