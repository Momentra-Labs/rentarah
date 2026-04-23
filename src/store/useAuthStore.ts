import { persist, createJSONStorage } from 'zustand/middleware'
import { create } from 'zustand'

import { DEMO_USER_ID } from '../data/mockUsers'
import type { AuthUser, StoredUser } from '../types'

/**
 * Seeded user — id matches mock catalog `hostId` for Carlo (`user_001`), so the host dashboard
 * lists the same mock inventory after login. Password unchanged for docs/demos.
 */
function demoSeedUser(): StoredUser {
  return {
    id: DEMO_USER_ID,
    email: 'demo@rentahub.com',
    passwordHash: btoa('demo1234'),
    firstName: 'Carlo',
    lastName: 'Reyes',
    phone: '+639171234567',
    licenseNumber: 'N12345678',
    isHost: true,
    avatar: 'CR',
    createdAt: new Date().toISOString(),
  }
}

function migrateUsers(users: StoredUser[]): StoredUser[] {
  const mapped = users.map((u) => {
    if (u.id === 'user_demo' && u.email === 'demo@rentahub.com') {
      return { ...u, id: DEMO_USER_ID, firstName: 'Carlo', lastName: 'Reyes', isHost: true, avatar: 'CR' } as StoredUser
    }
    return u
  })
  return Array.from(new Map(mapped.map((u) => [u.id, u])).values())
}

export interface RegisterInput {
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
}

function stripPassword(u: StoredUser): AuthUser {
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone,
    licenseNumber: u.licenseNumber,
    isHost: u.isHost,
    avatar: u.avatar,
    createdAt: u.createdAt,
  }
}

interface AuthStoreState {
  user: AuthUser | null
  users: StoredUser[]
  login: (email: string, password: string) => void
  register: (data: RegisterInput) => void
  logout: () => void
  updateProfile: (data: Partial<Pick<AuthUser, 'firstName' | 'lastName' | 'phone' | 'licenseNumber' | 'avatar'>>) => void
  becomeHost: () => void
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set, get) => ({
      user: null,
      users: [demoSeedUser()],

      login: (email, password) => {
        const hash = btoa(password)
        const found = get().users.find((u) => u.email.toLowerCase() === email.toLowerCase())
        if (!found || found.passwordHash !== hash) {
          throw new Error('Invalid credentials')
        }
        set({ user: stripPassword(found) })
      },

      register: (data) => {
        const exists = get().users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())
        if (exists) throw new Error('Email already registered')
        const newUser: StoredUser = {
          id: `user_${crypto.randomUUID().slice(0, 8)}`,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email.toLowerCase(),
          passwordHash: btoa(data.password),
          phone: data.phone,
          licenseNumber: '',
          isHost: false,
          avatar: `${data.firstName[0] ?? '?'}${data.lastName[0] ?? '?'}`.toUpperCase(),
          createdAt: new Date().toISOString(),
        }
        set((s) => ({
          users: [...s.users, newUser],
          user: stripPassword(newUser),
        }))
      },

      logout: () => set({ user: null }),

      updateProfile: (data) => {
        const cur = get().user
        if (!cur) return
        const merged: AuthUser = { ...cur, ...data }
        const full: StoredUser | undefined = get().users.find((u) => u.id === cur.id)
        if (!full) return
        const updatedStored: StoredUser = {
          ...full,
          ...data,
        }
        set((s) => ({
          user: merged,
          users: s.users.map((u) => (u.id === cur.id ? updatedStored : u)),
        }))
      },

      becomeHost: () => {
        const cur = get().user
        if (!cur) return
        set((s) => ({
          user: { ...cur, isHost: true },
          users: s.users.map((u) => (u.id === cur.id ? { ...u, isHost: true } : u)),
        }))
      },
    }),
    {
      name: 'rentahub-auth',
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const p = persisted as Partial<AuthStoreState> | undefined
        const raw = p?.users && Array.isArray(p.users) && p.users.length > 0 ? p.users : current.users
        const users = migrateUsers(raw)
        let user: AuthUser | null = (p?.user as AuthUser | null | undefined) ?? current.user
        if (user?.id === 'user_demo') {
          const full = users.find((u) => u.id === DEMO_USER_ID) ?? users[0]
          user = full ? stripPassword(full) : null
        } else if (user !== null) {
          const id = user.id
          if (!users.some((u) => u.id === id)) {
            user = null
          }
        }
        return {
          ...current,
          ...p,
          users,
          user,
        }
      },
    },
  ),
)
