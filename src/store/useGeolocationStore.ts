import { create } from 'zustand'

import type { LatLng } from '../utils/distance'
import { lsGet, lsRemove, lsSet } from '../utils/storageUtils'
import { useOnboardingUiStore } from './useOnboardingUiStore'

const GEO_WANT_KEY = 'geo-user-wants-sharing'

/** 1 = PERMISSION_DENIED — only this should show “blocked in site settings”. */
function isPermissionDeniedError(e: GeolocationPositionError | undefined): boolean {
  return e != null && e.code === 1
}

export type GeolocationShareStatus = 'off' | 'pending' | 'ready' | 'denied' | 'unsupported'

/** Why the last getCurrentPosition failed (for UI). Not used for permission success. */
export type GeolocationFetchFailure = null | 'permission' | 'no_fix'

type GeolocationState = {
  userLocation: LatLng | null
  status: GeolocationShareStatus
  /** Last failure: `permission` = really blocked; `no_fix` = timeout / no signal (location may still be allowed). */
  lastFetchFailure: GeolocationFetchFailure
  /** Location opt-in dialog (navbar + auto-offer on home / vehicle page). */
  geoDialogOpen: boolean
  openGeoDialog: () => void
  closeGeoDialog: () => void
  requestLocation: () => void
  clearLocation: () => void
  /**
   * After a full reload, in-memory state is empty even when the user already allowed
   * location for this site. Re-fetch if the Permissions API says `granted` or we
   * previously stored a successful opt-in ({@link GEO_WANT_KEY}).
   */
  restoreIfPermittedOnLoad: () => void
}

function readGeolocationOnce(
  onOk: (lat: number, lng: number) => void,
  onErr: (err: GeolocationPositionError) => void,
  options: { maximumAgeMs: number; enableHighAccuracy: boolean; timeoutMs: number },
) {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(
    (p) => onOk(p.coords.latitude, p.coords.longitude),
    onErr,
    {
      enableHighAccuracy: options.enableHighAccuracy,
      timeout: options.timeoutMs,
      maximumAge: options.maximumAgeMs,
    },
  )
}

/**
 * “Site allowed” in Chrome ≠ an instant new coordinate. On many desktops a cold
 * fix times out; a second read with `maximumAge: Infinity` can return any cached
 * position the browser still has from earlier sessions.
 */
function withStaleCacheRetry(
  onOk: (lat: number, lng: number) => void,
  onFinalErr: (err: GeolocationPositionError) => void,
  first: { maximumAgeMs: number; enableHighAccuracy: boolean; timeoutMs: number },
) {
  readGeolocationOnce(
    onOk,
    (err) => {
      if (isPermissionDeniedError(err)) {
        onFinalErr(err)
        return
      }
      readGeolocationOnce(
        onOk,
        onFinalErr,
        {
          maximumAgeMs: Number.POSITIVE_INFINITY,
          enableHighAccuracy: false,
          timeoutMs: 15_000,
        },
      )
    },
    first,
  )
}

let restoreOnLoadInvoked = false

export const useGeolocationStore = create<GeolocationState>((set, get) => ({
  userLocation: null,
  status: 'off',
  lastFetchFailure: null,
  geoDialogOpen: false,

  openGeoDialog: () => {
    if (useOnboardingUiStore.getState().suppressGeoDialog) return
    set({ geoDialogOpen: true })
  },
  closeGeoDialog: () => set({ geoDialogOpen: false }),

  requestLocation: () => {
    if (!navigator.geolocation) {
      set({ status: 'unsupported', userLocation: null, lastFetchFailure: null })
      return
    }
    const hadReady = get().status === 'ready' && get().userLocation != null
    set({ status: 'pending', lastFetchFailure: null })
    withStaleCacheRetry(
      (lat, lng) => {
        set({ userLocation: { lat, lng }, status: 'ready', lastFetchFailure: null })
        try {
          lsSet(GEO_WANT_KEY, true)
        } catch {
          /* ignore */
        }
      },
      (err) => {
        if (isPermissionDeniedError(err)) {
          set({ userLocation: null, status: 'denied', lastFetchFailure: 'permission' })
          try {
            lsRemove(GEO_WANT_KEY)
          } catch {
            /* ignore */
          }
          return
        }
        if (hadReady) {
          set({ status: 'ready', lastFetchFailure: 'no_fix' })
        } else {
          set({ userLocation: null, status: 'off', lastFetchFailure: 'no_fix' })
        }
      },
      { maximumAgeMs: 600_000, enableHighAccuracy: false, timeoutMs: 25_000 },
    )
  },

  clearLocation: () => {
    try {
      lsRemove(GEO_WANT_KEY)
    } catch {
      /* ignore */
    }
    set({ userLocation: null, status: 'off', lastFetchFailure: null })
  },

  restoreIfPermittedOnLoad: () => {
    if (typeof window === 'undefined' || restoreOnLoadInvoked) return
    restoreOnLoadInvoked = true
    if (!navigator.geolocation) return

    const { status } = get()
    if (status === 'ready' || status === 'pending') return

    const runFetch = (maximumAge: number) => {
      set({ status: 'pending', lastFetchFailure: null })
      withStaleCacheRetry(
        (lat, lng) => {
          set({ userLocation: { lat, lng }, status: 'ready', lastFetchFailure: null })
          try {
            lsSet(GEO_WANT_KEY, true)
          } catch {
            /* ignore */
          }
        },
        (err) => {
          if (isPermissionDeniedError(err)) {
            set({ userLocation: null, status: 'denied', lastFetchFailure: 'permission' })
            try {
              lsRemove(GEO_WANT_KEY)
            } catch {
              /* ignore */
            }
            return
          }
          set({ userLocation: null, status: 'off', lastFetchFailure: 'no_fix' })
        },
        { maximumAgeMs: maximumAge, enableHighAccuracy: false, timeoutMs: 30_000 },
      )
    }

    const hadWant = lsGet<boolean>(GEO_WANT_KEY, false)

    const perms = (navigator as Navigator & { permissions?: { query: (d: { name: PermissionName }) => Promise<PermissionStatus> } })
      .permissions
    if (perms?.query) {
      perms
        .query({ name: 'geolocation' as PermissionName })
        .then((perm) => {
          if (perm.state === 'granted') {
            // Prefer a recent cached fix on reload; avoids slow cold GPS and false “denied” from timeouts
            runFetch(600_000)
            return
          }
          if (perm.state === 'denied') {
            set({ userLocation: null, status: 'denied', lastFetchFailure: 'permission' })
            try {
              lsRemove(GEO_WANT_KEY)
            } catch {
              /* ignore */
            }
            return
          }
          if (hadWant) runFetch(600_000)
        })
        .catch(() => {
          if (hadWant) runFetch(600_000)
        })
    } else if (hadWant) {
      runFetch(600_000)
    }
  },
}))
