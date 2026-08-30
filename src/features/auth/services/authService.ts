import { isFirebaseConfigured } from '@/lib/firebase'
import {
  mergeFirebaseUserIntoPartialAuthUser,
  signInWithGoogle,
  signOutFirebaseIfAny,
} from '@/lib/firebaseGoogle'
import { useAuthStore } from '@/store/useAuthStore'
import type { AuthUser } from '@/types'

/** Env gate for reversible local credential auth (dev/demo only). */
export function isLocalAuthAllowed(): boolean {
  const flag = String(import.meta.env.VITE_ALLOW_LOCAL_AUTH ?? '').toLowerCase()
  if (flag === 'true') return true
  if (flag === 'false') return false
  // Default: allow in Vite development mode only
  return import.meta.env.DEV === true
}

export function firebaseAuthAvailable(): boolean {
  return isFirebaseConfigured()
}

export async function signInWithGoogleViaService(): Promise<AuthUser> {
  const fu = await signInWithGoogle()
  return mergeFirebaseUserIntoPartialAuthUser(useAuthStore.getState().user, fu)
}

export function signInWithGoogleMockViaStore(): void {
  if (!isLocalAuthAllowed()) {
    throw new Error('Local mock Google sign-in is disabled. Configure Firebase Auth.')
  }
  useAuthStore.getState().loginWithGoogleMock()
}

export function loginWithCredentials(email: string, password: string): void {
  if (!isLocalAuthAllowed()) {
    throw new Error('Local credential login is disabled. Use Google sign-in or enable VITE_ALLOW_LOCAL_AUTH.')
  }
  useAuthStore.getState().login(email, password)
}

export function registerWithCredentials(
  data: Parameters<ReturnType<typeof useAuthStore.getState>['register']>[0],
): void {
  if (!isLocalAuthAllowed()) {
    throw new Error('Local registration is disabled. Use Google sign-in or enable VITE_ALLOW_LOCAL_AUTH.')
  }
  useAuthStore.getState().register(data)
}

export async function logoutAuth(): Promise<void> {
  await signOutFirebaseIfAny()
  useAuthStore.getState().logout()
}
