import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

/**
 * Populate `.env.local` from your Firebase Console → Project settings → Your apps → Web config.
 * The web `apiKey` is not a secret — it’s restricted via Firebase/App Check + Authorized domains.
 */
/** Trims dotenv values (avoids stray spaces / copy-paste noise). */
function envStr(v: unknown): string {
  if (v == null || typeof v !== 'string') return ''
  return v.trim()
}

function readFirebaseConfig() {
  const apiKey = envStr(import.meta.env.VITE_FIREBASE_API_KEY)
  if (!apiKey) return null
  const projectId = envStr(import.meta.env.VITE_FIREBASE_PROJECT_ID)
  return {
    apiKey,
    authDomain:
      envStr(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) || `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket:
      envStr(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || `${projectId}.appspot.com`,
    messagingSenderId: envStr(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
    appId: envStr(import.meta.env.VITE_FIREBASE_APP_ID),
    measurementId: envStr(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) || undefined,
  }
}

let app: FirebaseApp | null = null

/** True when all required `VITE_FIREBASE_*` keys are present. */
export function isFirebaseConfigured(): boolean {
  const c = readFirebaseConfig()
  return Boolean(c?.projectId?.length && c.appId?.length && c.messagingSenderId?.length)
}

/** Lazily initialized web app — throws if env is incomplete. Call `isFirebaseConfigured()` first. */
export function getFirebaseApp(): FirebaseApp {
  const config = readFirebaseConfig()
  if (!config?.projectId) {
    throw new Error(
      'Firebase is not configured. Add VITE_FIREBASE_* variables to `.env.local` (see `.env.example`).',
    )
  }
  app ??= initializeApp(config)
  return app
}

/** Firebase Auth instance — use with {@link getFirebaseIdToken} in `firebaseAuth.ts`. */
export function getFirebaseAuth() {
  return getAuth(getFirebaseApp())
}
