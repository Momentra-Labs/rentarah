import { onAuthStateChanged } from 'firebase/auth'
import { useEffect } from 'react'

import { getFirebaseAuth, isFirebaseConfigured } from '../../lib/firebase'
import { mergeFirebaseUserIntoPartialAuthUser } from '../../lib/firebaseGoogle'
import { useAuthStore } from '../../store/useAuthStore'

/**
 * Keeps Zustand in sync with Firebase Auth (Google / email link / etc.):
 * - Restores session after refresh
 * - Clears app user when Firebase signs out (only for `authProvider === 'firebase'`)
 */
export function FirebaseAuthSync() {
  useEffect(() => {
    if (!isFirebaseConfigured()) return

    const auth = getFirebaseAuth()
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      const { authProvider, loginWithFirebaseUser } = useAuthStore.getState()
      if (!firebaseUser) {
        if (authProvider === 'firebase') {
          useAuthStore.setState({ user: null, authProvider: 'none' })
        }
        return
      }
      loginWithFirebaseUser(mergeFirebaseUserIntoPartialAuthUser(useAuthStore.getState().user, firebaseUser))
    })

    return () => unsub()
  }, [])

  return null
}
