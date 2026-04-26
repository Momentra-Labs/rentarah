import { config } from 'dotenv'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const backendRoot = resolve(__dirname, '..', '..')

function loadEnv(relative: string, override: boolean) {
  const path = resolve(backendRoot, relative)
  if (existsSync(path)) {
    config({ path, override })
  }
}

/** Base secrets (optional), then optional local overrides — same pattern as Vite. */
loadEnv('.env', false)
loadEnv('.env.local', true)

const allowedAppEnv = ['development', 'staging', 'production'] as const
export type AppEnv = (typeof allowedAppEnv)[number]

function normalizeAppEnv(value: string | undefined): AppEnv {
  const v = value ?? 'development'
  if ((allowedAppEnv as readonly string[]).includes(v)) {
    return v as AppEnv
  }
  console.warn(`[config] Invalid APP_ENV="${value}", using development`)
  return 'development'
}

export const appEnv = normalizeAppEnv(process.env.APP_ENV)

/** Env-specific file (e.g. `.env.staging`) overrides keys from `.env`. */
loadEnv(`.env.${appEnv}`, true)

/** Config — read only after all dotenv files are loaded. */
export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  appEnv,
  databaseUrl: process.env.DATABASE_URL,
  /** Comma-separated allowed origins; if unset, CORS reflects the request origin (fine for local dev). */
  corsOrigin: process.env.CORS_ORIGIN,
} as const
