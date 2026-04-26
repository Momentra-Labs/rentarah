import 'dotenv/config'

/** Config loaded after dotenv (import this module first in `server.ts`). */
export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL,
  /** Comma-separated allowed origins; if unset, CORS reflects the request origin (fine for local dev). */
  corsOrigin: process.env.CORS_ORIGIN,
} as const
