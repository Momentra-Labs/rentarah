import { getFirebaseAuth, isFirebaseConfigured } from './firebase'

/**
 * Fresh ID token for `Authorization: Bearer <token>` (Firebase rotates before expiry).
 * Returns `null` if Firebase isn’t configured or nobody is signed in.
 */
export async function getFirebaseIdToken(): Promise<string | null> {
  if (!isFirebaseConfigured()) return null
  try {
    const u = getFirebaseAuth().currentUser
    if (!u) return null
    return await u.getIdToken()
  } catch {
    return null
  }
}
