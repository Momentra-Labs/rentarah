import type { Request, Response } from 'express'

/**
 * Verified session — Postgres `users` row will attach here later (`req.user`).
 * For now, returns JWT claims minted by Firebase Authentication.
 */
export function getAuthMe(req: Request, res: Response): void {
  const t = req.firebaseToken
  if (!t?.uid) {
    res.status(500).json({ error: 'missing token context' })
    return
  }
  res.json({
    firebaseUid: t.uid,
    email: t.email ?? null,
    emailVerified: Boolean(t.email_verified),
    name: typeof t.name === 'string' ? t.name : null,
    photoURL: typeof t.picture === 'string' ? t.picture : null,
  })
}
