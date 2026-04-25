/** Seed host personas — referenced by mock car `hostId` and the demo account */
export const MOCK_HOST_IDS = {
  carlo: 'user_001',
  maria: 'user_002',
} as const

/**
 * The built-in `demo@rentara.com` account uses this id so the host dashboard shows mock listings
 * whose `hostId` is {@link MOCK_HOST_IDS.carlo}.
 */
export const DEMO_USER_ID = MOCK_HOST_IDS.carlo

/** Fictional renter in {@link buildMockChatPreview} when the demo user is the host. */
export const MOCK_GUEST_RENTER_ID = 'user_003'

export interface SeedHostInfo {
  id: string
  displayName: string
  avatar: string
}

export const seedHosts: SeedHostInfo[] = [
  { id: MOCK_HOST_IDS.carlo, displayName: 'Carlo Reyes', avatar: 'CR' },
  { id: MOCK_HOST_IDS.maria, displayName: 'Maria Santos', avatar: 'MS' },
]
