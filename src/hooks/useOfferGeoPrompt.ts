import { useEffect } from 'react'

import { useGeolocationStore } from '../store/useGeolocationStore'
import { useOnboardingUiStore } from '../store/useOnboardingUiStore'

const KEY_LANDING = 'rentara:geo-auto-landing'
const KEY_CAR_DETAIL = 'rentara:geo-auto-car-detail'

/**
 * If the user has not shared location in app state yet:
 * - When the **browser** already has `geolocation` = granted for this origin, we
 *   call `requestLocation()` (no extra marketing dialog — permission was already chosen in Chrome).
 * - Otherwise, after a short delay, opens the opt-in dialog once per session.
 */
export function useOfferGeoPrompt(context: 'landing' | 'car-detail', enabled = true) {
  const status = useGeolocationStore((s) => s.status)
  const openGeoDialog = useGeolocationStore((s) => s.openGeoDialog)
  const requestLocation = useGeolocationStore((s) => s.requestLocation)
  const suppressGeoDialog = useOnboardingUiStore((s) => s.suppressGeoDialog)

  useEffect(() => {
    if (!enabled) return
    if (status === 'ready') return
    if (suppressGeoDialog) return

    const key = context === 'landing' ? KEY_LANDING : KEY_CAR_DETAIL
    if (sessionStorage.getItem(key)) return

    const delayMs = context === 'landing' ? 600 : 900

    const t = window.setTimeout(() => {
      if (useGeolocationStore.getState().status === 'ready') return
      if (sessionStorage.getItem(key)) return
      if (useOnboardingUiStore.getState().suppressGeoDialog) return

      const finishWithDialog = () => {
        if (useGeolocationStore.getState().status === 'ready') return
        if (sessionStorage.getItem(key)) return
        sessionStorage.setItem(key, '1')
        openGeoDialog()
      }

      const perms = (navigator as Navigator & { permissions?: { query: (d: { name: PermissionName }) => Promise<PermissionStatus> } })
        .permissions
      if (perms?.query) {
        perms
          .query({ name: 'geolocation' as PermissionName })
          .then((result) => {
            if (useGeolocationStore.getState().status === 'ready') return
            if (sessionStorage.getItem(key)) return
            if (result.state === 'denied') {
              sessionStorage.setItem(key, '1')
              return
            }
            if (result.state === 'granted') {
              sessionStorage.setItem(key, '1')
              requestLocation()
              return
            }
            finishWithDialog()
          })
          .catch(finishWithDialog)
      } else {
        finishWithDialog()
      }
    }, delayMs)

    return () => clearTimeout(t)
  }, [context, enabled, status, openGeoDialog, requestLocation, suppressGeoDialog])
}
