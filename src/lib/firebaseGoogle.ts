import { GoogleAuthProvider, signInWithPopup, signOut, type User as FirebaseUser } from 'firebase/auth'

import type { AuthUser } from '../types'
import { getFirebaseAuth, isFirebaseConfigured } from './firebase'

/**
 * Signs in with Google (OAuth popup).
 * Throws if Firebase env is incomplete or popup is blocked/dismissed.
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Add VITE_FIREBASE_* to `.env.local`.')
  }
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const cred = await signInWithPopup(getFirebaseAuth(), provider)
  return cred.user
}

/** Maps Firebase `User` → app `AuthUser` (PostgreSQL-backed profile sync comes later via API). */
export function mapFirebaseUserToAuthUser(u: FirebaseUser): AuthUser {
  const metaTime = u.metadata.creationTime ?? new Date().toISOString()
  const display = u.displayName?.trim()
  const fromEmail = u.email?.split('@')[0] ?? 'Guest'
  const fallbackName = display || fromEmail
  const parts = fallbackName.trim().split(/\s+/)
  const firstName = parts[0] || 'Guest'
  const lastName = parts.slice(1).join(' ') || 'User'

  /** Two-letter initials; photo URLs are supported by Avatar in spots that check `startsWith http` elsewhere. */
  const avatarChars = `${parts[0]?.[0] ?? '?'}${parts[1]?.[0] ?? parts[0]?.[1] ?? '?'}`.toUpperCase()

  /** OAuth: `accountRole` and PH phone + license → `/complete-profile`. */
  return {
    id: u.uid,
    email: (u.email ?? '').toLowerCase(),
    firstName,
    lastName,
    phone: u.phoneNumber ?? '',
    licenseNumber: '',
    isHost: false,
    avatar: u.photoURL ?? avatarChars,
    createdAt: metaTime || new Date().toISOString(),
  }
}

/** Safe no-op if Firebase Auth has no session. */
export async function signOutFirebaseIfAny(): Promise<void> {
  try {
    if (!isFirebaseConfigured()) return
    const auth = getFirebaseAuth()
    if (auth.currentUser) await signOut(auth)
  } catch {
    /* ignore */
  }
}
