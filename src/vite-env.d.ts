/// <reference types="vite/client" />

declare module 'react-leaflet-markercluster/styles'

interface ImportMetaEnv {
  readonly VITE_APP_ENV?: 'development' | 'staging' | 'production'
  readonly VITE_API_URL?: string
  readonly VITE_USE_MOCK?: string
  readonly VITE_STRIPE_KEY?: string
  readonly VITE_BASE?: string
  /** Firebase web config — see Firebase Console → Project settings → Web app */
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string
  readonly VITE_FIREBASE_APP_ID?: string
  /** Optional — Analytics */
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string
}
