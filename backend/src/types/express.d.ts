import type { FirebaseAuthDecoded } from './firebaseAuthDecoded.js'

declare module 'express-serve-static-core' {
  interface Request {
    firebaseUid?: string
    firebaseToken?: FirebaseAuthDecoded
  }
}

export {}
