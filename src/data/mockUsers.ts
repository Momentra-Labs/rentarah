/** Seed host personas — referenced by mock car hostIds */
export const MOCK_HOST_IDS = {
  carlo: 'user_001',
  maria: 'user_002',
} as const

export interface SeedHostInfo {
  id: string
  displayName: string
  avatar: string
}

export const seedHosts: SeedHostInfo[] = [
  { id: MOCK_HOST_IDS.carlo, displayName: 'Carlo Reyes', avatar: 'CR' },
  { id: MOCK_HOST_IDS.maria, displayName: 'Maria Santos', avatar: 'MS' },
]
