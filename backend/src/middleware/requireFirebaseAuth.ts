import type { NextFunction, Request, Response } from 'express'

import { getFirebaseAdmin } from '../lib/firebaseAdmin.js'
import type { FirebaseAuthDecoded } from '../types/firebaseAuthDecoded.js'

/**
 * Requires `Authorization: Bearer <Firebase ID token>`.
 * Attaches {@link Express.Request.firebaseUid} and {@link Express.Request.firebaseToken}.
 */
export async function requireFirebaseAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization Bearer token' })
    return
  }

  try {
    const token = header.slice('Bearer '.length).trim()
    const decoded = (await getFirebaseAdmin().auth().verifyIdToken(token)) as FirebaseAuthDecoded
    req.firebaseUid = decoded.uid
    req.firebaseToken = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired Firebase token' })
  }
}
