import { useEffect } from 'react'

import { useGeolocationStore } from '../store/useGeolocationStore'

const KEY_LANDING = 'rentara:geo-auto-landing'
const KEY_CAR_DETAIL = 'rentara:geo-auto-car-detail'

/**
 * Opens the location opt-in dialog once per session for the given context (after a short delay),
 * only if the user has not already shared location. Does not call the browser geolocation API by itself.
 */
export function useOfferGeoPrompt(context: 'landing' | 'car-detail', enabled = true) {
  const status = useGeolocationStore((s) => s.status)
  const openGeoDialog = useGeolocationStore((s) => s.openGeoDialog)

  useEffect(() => {
    if (!enabled) return
    if (status === 'ready') return

    const key = context === 'landing' ? KEY_LANDING : KEY_CAR_DETAIL
    if (sessionStorage.getItem(key)) return

    const delayMs = context === 'landing' ? 600 : 900

    const t = window.setTimeout(() => {
      if (useGeolocationStore.getState().status === 'ready') return
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
      openGeoDialog()
    }, delayMs)

    return () => clearTimeout(t)
  }, [context, enabled, status, openGeoDialog])
}
