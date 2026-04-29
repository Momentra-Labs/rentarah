import admin from 'firebase-admin'

import { env } from '../config/env.js'

let initialized = false

/**
 * Verifies Firebase **ID tokens** from the SPA (`Authorization: Bearer …`).
 *
 * Locally: download a **service account** JSON from Firebase Console → Project settings → Service accounts →
 * Generate new private key, then either:
 *
 * - `export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/rentarah-xxxxx.json`, or
 * - Put the same env in `backend/.env.local`
 */
export function initFirebaseAdmin(): void {
  if (initialized) return
  initialized = true
  try {
    if (admin.apps.length > 0) return
    admin.initializeApp({
      ...(env.firebaseProjectId ? { projectId: env.firebaseProjectId } : {}),
    })
  } catch (e) {
    console.error('[firebase-admin] Failed to initialize:', e)
    throw e
  }
}

/** Always call before `verifyIdToken`. Throws if Firebase Admin env is invalid. */
export function getFirebaseAdmin(): typeof admin {
  initFirebaseAdmin()
  return admin
}
