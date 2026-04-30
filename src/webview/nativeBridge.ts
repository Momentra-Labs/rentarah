/**
 * Integration points for in-app WebViews (iOS WKWebView, Android WebView, Capacitor, React Native WebView).
 * Assign handlers from the native layer before or after load; safe no-ops when missing.
 */

declare global {
  interface Window {
    /** Generic host bridge (optional). */
    RentaraNative?: RentaraNativeHost
    ReactNativeWebView?: { postMessage(message: string): void }
    rentaraHardwareBack?: () => boolean
    rentaraPickFiles?: () => Promise<File[] | null>
  }
}

export type RentaraNativeHost = {
  postMessage?: (message: string) => void
  /** Host calls this when a push payload arrives; app code can subscribe via {@link onNativePush}. */
  dispatchPush?: (detail: unknown) => void
}

export type Unsubscribe = () => void

const PUSH_EVENT = 'rentara-native-push'

export function getNativeHost(): RentaraNativeHost | undefined {
  if (typeof window === 'undefined') return undefined
  return window.RentaraNative ?? window.ReactNativeWebView
}

/** Tell the host the SPA is interactive (optional analytics / splash hide). */
export function notifyAppReady(): void {
  try {
    const msg = JSON.stringify({ type: 'APP_READY', path: window.location.pathname })
    getNativeHost()?.postMessage?.(msg)
  } catch {
    /* ignore */
  }
}

/** Subscribe to push notification payloads delivered by the host (CustomEvent + optional bridge). */
export function onNativePush(handler: (detail: unknown) => void): Unsubscribe {
  const listener = (e: Event) => {
    const ce = e as CustomEvent<unknown>
    handler(ce.detail)
  }
  window.addEventListener(PUSH_EVENT, listener as EventListener)
  return () => window.removeEventListener(PUSH_EVENT, listener as EventListener)
}

/** Host can call: `window.dispatchEvent(new CustomEvent('rentara-native-push', { detail: payload }))` */

/**
 * Prefer same-tab navigation inside WebViews so the user never leaves the embedded browser.
 * Use for external deep links the host opened in this WebView.
 */
export function openInSameTab(url: string): void {
  window.location.assign(url)
}

/**
 * Camera / file: host provides `window.rentaraPickFiles` that resolves to `File[]` or base64 — wire when native is ready.
 */
export async function pickFilesViaNative(_options: { accept?: string; capture?: 'user' | 'environment' }): Promise<
  File[] | null
> {
  if (typeof window === 'undefined' || typeof window.rentaraPickFiles !== 'function') return null
  try {
    return await window.rentaraPickFiles()
  } catch {
    return null
  }
}

export type HardwareBackHandler = () => boolean

const backHandlers: HardwareBackHandler[] = []

/** Register LIFO handlers; return `true` if the event was consumed (stops `history.back()` chain). */
export function registerHardwareBackHandler(handler: HardwareBackHandler): Unsubscribe {
  backHandlers.push(handler)
  return () => {
    const i = backHandlers.lastIndexOf(handler)
    if (i >= 0) backHandlers.splice(i, 1)
  }
}

/**
 * Call from the host (e.g. Android `onBackPressed`) after injecting a small script, or from a wrapper that listens to `popstate`.
 * Example: `window.rentaraHardwareBack?.()` — returns whether the app handled back.
 */
export function dispatchHardwareBack(): boolean {
  for (let i = backHandlers.length - 1; i >= 0; i--) {
    try {
      if (backHandlers[i]()) return true
    } catch {
      /* continue */
    }
  }
  return false
}

if (typeof window !== 'undefined') {
  window.rentaraHardwareBack = dispatchHardwareBack
}
