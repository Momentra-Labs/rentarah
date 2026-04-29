/** Claims from Firebase `verifyIdToken` — usable before Postgres `users` exists. */
export interface FirebaseAuthDecoded {
  uid: string
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
}
