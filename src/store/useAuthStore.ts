import { persist, createJSONStorage } from 'zustand/middleware'
import { create } from 'zustand'

import type { AuthUser, StoredUser } from '../types'

function demoSeedUser(): StoredUser {
  return {
    id: 'user_demo',
    email: 'demo@rentahub.com',
    passwordHash: btoa('demo1234'),
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    phone: '+639171234567',
    licenseNumber: 'N12345678',
    isHost: true,
    avatar: 'JD',
    createdAt: new Date().toISOString(),
  }
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
        const users =
          p?.users && Array.isArray(p.users) && p.users.length > 0 ? p.users : current.users
        return {
          ...current,
          ...p,
          users,
          user: p?.user ?? current.user,
        }
      },
    },
  ),
)
