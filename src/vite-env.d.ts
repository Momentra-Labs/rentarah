/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV?: 'development' | 'staging' | 'production'
  readonly VITE_API_URL?: string
  readonly VITE_USE_MOCK?: string
  readonly VITE_STRIPE_KEY?: string
  readonly VITE_BASE?: string
}
