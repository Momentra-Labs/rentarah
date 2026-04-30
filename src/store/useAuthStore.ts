import { persist, createJSONStorage } from 'zustand/middleware'
import { create } from 'zustand'

import { signOutFirebaseIfAny } from '../lib/firebaseGoogle'

import { DEMO_USER_ID } from '../data/mockUsers'
import type { AuthUser, StoredUser, AccountRole } from '../types'
import { isAuthProfileComplete } from '../lib/authProfile'

/** @deprecated Use {@link AccountRole} from `../types` */
export type RegisterAccountRole = AccountRole
export const MOCK_GOOGLE_USER_ID = 'user_google_mock'
const MOCK_GOOGLE_OAUTH_HASH = '__oauth_google_mock__'

/** Seeded helpers turn `StoredUser` into client profile shape during migration and login. */
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
    accountRole: u.accountRole,
    emailVerified: u.emailVerified,
    trustTermsAcceptedAt: u.trustTermsAcceptedAt,
    trustRenterGuidelinesAcceptedAt: u.trustRenterGuidelinesAcceptedAt,
    trustHostStandardsAcceptedAt: u.trustHostStandardsAcceptedAt,
    identityVerification: u.identityVerification,
  }
}

/** Grandfather seeded demo personas only — new `user_*` accounts must affirm trust onboarding. */
function migrateStoredUserTrust(u: StoredUser): StoredUser {
  if (!(u.id === DEMO_USER_ID || u.id === MOCK_GOOGLE_USER_ID)) return u
  let row = u
  if (!isAuthProfileComplete(stripPassword(row))) return row

  if (!row.trustTermsAcceptedAt) {
    const iso = row.createdAt
    const wantsHostStd = row.accountRole === 'host' || row.accountRole === 'both' || row.isHost
    row = {
      ...row,
      emailVerified: row.emailVerified ?? true,
      trustTermsAcceptedAt: iso,
      trustRenterGuidelinesAcceptedAt: iso,
      ...(wantsHostStd ? { trustHostStandardsAcceptedAt: iso } : {}),
    }
  }

  if (row.identityVerification?.status !== 'approved') {
    row = {
      ...row,
      identityVerification: {
        status: 'approved',
        submittedAt: row.identityVerification?.submittedAt ?? row.createdAt,
        fileName: row.identityVerification?.fileName ?? 'demo-seeded.jpg',
        mimeType: 'image/jpeg',
      },
    }
  }

  return row
}

/**
 * Seeded user — id matches mock catalog `hostId` for Carlo (`user_001`), so the host dashboard
 * lists the same mock inventory after login. Password unchanged for docs/demos.
 */
function demoSeedUser(): StoredUser {
  return {
    id: DEMO_USER_ID,
    email: 'demo@rentara.com',
    passwordHash: btoa('demo1234'),
    firstName: 'Carlo',
    lastName: 'Reyes',
    phone: '+639171234567',
    licenseNumber: 'N12345678',
    isHost: true,
    avatar: 'CR',
    createdAt: new Date().toISOString(),
    accountRole: 'both',
  }
}

function googleMockSeedUser(): StoredUser {
  return {
    id: MOCK_GOOGLE_USER_ID,
    email: 'google.demo@rentara.com',
    passwordHash: MOCK_GOOGLE_OAUTH_HASH,
    firstName: 'Alex',
    lastName: 'Santos',
    phone: '+639181112233',
    licenseNumber: 'MOCK000',
    isHost: false,
    avatar: 'AS',
    createdAt: new Date().toISOString(),
    accountRole: 'renter',
  }
}

/** Ensure persisted client state includes both seed users. */
function ensureSeedUsers(users: StoredUser[]): StoredUser[] {
  const byId = new Map(users.map((u) => [u.id, u]))
  if (!byId.has(DEMO_USER_ID)) byId.set(DEMO_USER_ID, demoSeedUser())
  if (!byId.has(MOCK_GOOGLE_USER_ID)) byId.set(MOCK_GOOGLE_USER_ID, googleMockSeedUser())
  return migrateUsers(Array.from(byId.values()))
}

function migrateUsers(users: StoredUser[]): StoredUser[] {
  const mapped = users.map((u) => migrateStoredUserTrust(u)).map((u) => {
    const email = u.email === 'demo@rentahub.com' ? 'demo@rentara.com' : u.email
    if (u.id === 'user_demo' && (u.email === 'demo@rentahub.com' || u.email === 'demo@rentara.com')) {
      return {
        ...u,
        email: 'demo@rentara.com',
        id: DEMO_USER_ID,
        firstName: 'Carlo',
        lastName: 'Reyes',
        isHost: true,
        avatar: 'CR',
        accountRole: 'both',
      } as StoredUser
    }
    return {
      ...u,
      email,
      accountRole: u.accountRole ?? (u.isHost ? 'host' : 'renter'),
    }
  })
  return Array.from(new Map(mapped.map((u) => [u.id, u])).values())
}

/** Drop in-memory ID image blob before compressing into `localStorage`. */
function stripIdentityDocumentBlob(user: AuthUser | null): AuthUser | null {
  if (!user?.identityVerification) return user
  return {
    ...user,
    identityVerification: { ...user.identityVerification, documentDataUrl: undefined },
  }
}

function persistableUsers(users: StoredUser[]): StoredUser[] {
  return users.map((row) => ({
    ...row,
    identityVerification: row.identityVerification
      ? { ...row.identityVerification, documentDataUrl: undefined }
      : undefined,
  }))
}

export interface RegisterInput {
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  licenseNumber: string
  /** Host + list vehicles; both = renter who may also host. */
  accountRole?: RegisterAccountRole
}

/** How {@link AuthUser} was authenticated — persisted so Firebase-linked sessions survive reload. */
export type AuthSessionProvider = 'none' | 'credentials' | 'firebase'

interface AuthStoreState {
  authProvider: AuthSessionProvider
  user: AuthUser | null
  users: StoredUser[]
  login: (email: string, password: string) => void
  /** Pretend Google SSO — loads the mock Google-linked renter profile (no Firebase). */
  loginWithGoogleMock: () => void
  /** Real Firebase Google SSO — persists via Firebase SDK + mirrors into {@link user}. */
  loginWithFirebaseUser: (profile: AuthUser) => void
  register: (data: RegisterInput) => void
  logout: () => void
  updateProfile: (
    data: Partial<
      Pick<
        AuthUser,
        | 'firstName'
        | 'lastName'
        | 'phone'
        | 'licenseNumber'
        | 'avatar'
        | 'isHost'
        | 'accountRole'
        | 'emailVerified'
        | 'trustTermsAcceptedAt'
        | 'trustRenterGuidelinesAcceptedAt'
        | 'trustHostStandardsAcceptedAt'
        | 'identityVerification'
      >
    >,
  ) => void
  becomeHost: () => void
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set, get) => ({
      authProvider: 'none',
      user: null,
      users: ensureSeedUsers([demoSeedUser()]),

      login: (email, password) => {
        const hash = btoa(password)
        const normalized =
          email.toLowerCase() === 'demo@rentahub.com' ? 'demo@rentara.com' : email.toLowerCase()
        const found = get().users.find((u) => u.email.toLowerCase() === normalized)
        if (!found || found.passwordHash !== hash) {
          throw new Error('Invalid credentials')
        }
        set({ user: stripPassword(found), authProvider: 'credentials' })
      },

      loginWithGoogleMock: () => {
        const google = get().users.find((u) => u.id === MOCK_GOOGLE_USER_ID)
        if (!google) {
          set((s) => ({
            users: ensureSeedUsers(s.users),
          }))
          const again = get().users.find((u) => u.id === MOCK_GOOGLE_USER_ID)
          if (!again) throw new Error('Mock Google account missing')
          set({ user: stripPassword(again), authProvider: 'credentials' })
          return
        }
        set({ user: stripPassword(google), authProvider: 'credentials' })
      },

      loginWithFirebaseUser: (profile) => {
        set({ user: profile, authProvider: 'firebase' })
      },

      register: (data) => {
        const exists = get().users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())
        if (exists) throw new Error('This email is already registered. Try signing in instead.')
        const role = data.accountRole ?? 'renter'
        const isHost = role === 'host' || role === 'both'
        const newUser: StoredUser = {
          id: `user_${crypto.randomUUID().slice(0, 8)}`,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email.toLowerCase(),
          passwordHash: btoa(data.password),
          phone: data.phone,
          licenseNumber: data.licenseNumber,
          isHost,
          avatar: `${data.firstName[0] ?? '?'}${data.lastName[0] ?? '?'}`.toUpperCase(),
          createdAt: new Date().toISOString(),
          accountRole: role,
          emailVerified: true,
        }
        set((s) => ({
          users: [...s.users, newUser],
          user: stripPassword(newUser),
          authProvider: 'credentials',
        }))
      },

      logout: () => {
        void signOutFirebaseIfAny()
        set({ user: null, authProvider: 'none' })
      },

      updateProfile: (data) => {
        const cur = get().user
        if (!cur) return
        const merged: AuthUser = { ...cur, ...data }
        if (get().authProvider === 'firebase') {
          set({ user: merged })
          return
        }
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
        if (get().authProvider === 'firebase') {
          set({ user: { ...cur, isHost: true } })
          return
        }
        set((s) => ({
          user: { ...cur, isHost: true },
          users: s.users.map((u) => (u.id === cur.id ? { ...u, isHost: true } : u)),
        }))
      },
    }),
    {
      name: 'rentara-auth',
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const p = persisted as Partial<AuthStoreState> | undefined
        const raw = p?.users && Array.isArray(p.users) && p.users.length > 0 ? p.users : current.users
        const users = ensureSeedUsers(migrateUsers(raw))
        let user: AuthUser | null = (p?.user as AuthUser | null | undefined) ?? current.user

        let authProvider: AuthSessionProvider =
          p?.authProvider === 'credentials' || p?.authProvider === 'firebase' || p?.authProvider === 'none'
            ? (p.authProvider as AuthSessionProvider)
            : 'none'

        if (user?.id === 'user_demo') {
          const full = users.find((u) => u.id === DEMO_USER_ID) ?? users[0]
          user = full ? stripPassword(full) : null
          if (user) authProvider = 'credentials'
        }

        if (!user) {
          authProvider = 'none'
        } else {
          const hydratedUser = user
          if (!p?.authProvider || authProvider === 'none') {
            authProvider = users.some((u) => u.id === hydratedUser.id) ? 'credentials' : 'firebase'
          }
        }

        if (user !== null && user.accountRole == null && authProvider !== 'firebase') {
          user = {
            ...user,
            accountRole: user.isHost ? 'host' : 'renter',
          }
        }

        if (user !== null) {
          if (authProvider === 'firebase') {
            // Trusted — firebase_uid not in seeded `users`.
          } else if (!users.some((u) => u.id === user!.id)) {
            user = null
            authProvider = 'none'
          } else {
            const row = users.find((u) => u.id === user!.id)
            if (row) user = stripPassword(row)
          }
        }

        return {
          ...current,
          ...p,
          authProvider,
          users,
          user,
        }
      },
      partialize: (state) => ({
        user: stripIdentityDocumentBlob(state.user),
        users: persistableUsers(state.users),
        authProvider: state.authProvider,
      }),
    },
  ),
)
