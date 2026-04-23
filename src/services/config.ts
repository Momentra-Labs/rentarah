/**
 * Central configuration for the API layer. Vite injects `import.meta.env.VITE_*` at build time.
 * Copy values from `.env.example` into your local `.env`.
 */
const rawBase = import.meta.env.VITE_API_URL as string | undefined

/** Base URL for the real backend, e.g. `https://api.example.com` (no trailing slash). */
export const API_BASE_URL = (rawBase ?? '').replace(/\/$/, '')

/**
 * When `true`, all service modules call {@link /src/services/mockApi} instead of the network.
 * Set `VITE_USE_MOCK=false` in `.env` to exercise the real `fetch` path (backend must be running).
 * @default true in development
 */
export const USE_MOCK_API: boolean = import.meta.env.VITE_USE_MOCK !== 'false'
