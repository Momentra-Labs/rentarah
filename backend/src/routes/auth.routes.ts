import { Router } from 'express'

import { getAuthMe } from '../controllers/auth.controller.js'
import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js'

export const authRouter = Router()

authRouter.get('/me', requireFirebaseAuth, getAuthMe)
