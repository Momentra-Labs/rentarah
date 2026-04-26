import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFoundHandler } from './middleware/notFound.js'
import { apiRouter } from './routes/index.js'

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: env.corsOrigin ? env.corsOrigin.split(',').map((o) => o.trim()) : true,
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))

app.use('/api', apiRouter)

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(env.port, () => {
  console.log(
    `Rentara API [app=${env.appEnv} node=${env.nodeEnv}] http://localhost:${env.port}`,
  )
  console.log(`Health check: http://localhost:${env.port}/api/health`)
})
