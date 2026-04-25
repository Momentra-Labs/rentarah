import { create } from 'zustand'

import type { LatLng } from '../utils/distance'
import { lsGet, lsRemove, lsSet } from '../utils/storageUtils'
import { useOnboardingUiStore } from './useOnboardingUiStore'

const GEO_WANT_KEY = 'geo-user-wants-sharing'

export type GeolocationShareStatus = 'off' | 'pending' | 'ready' | 'denied' | 'unsupported'

type GeolocationState = {
  userLocation: LatLng | null
  status: GeolocationShareStatus
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
  onErr: () => void,
  maximumAgeMs: number,
) {
  if (!navigator.geolocation) {
    onErr()
    return
  }
  navigator.geolocation.getCurrentPosition(
    (p) => onOk(p.coords.latitude, p.coords.longitude),
    onErr,
    {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: maximumAgeMs,
    },
  )
}

let restoreOnLoadInvoked = false

export const useGeolocationStore = create<GeolocationState>((set, get) => ({
  userLocation: null,
  status: 'off',
  geoDialogOpen: false,

  openGeoDialog: () => {
    if (useOnboardingUiStore.getState().suppressGeoDialog) return
    set({ geoDialogOpen: true })
  },
  closeGeoDialog: () => set({ geoDialogOpen: false }),

  requestLocation: () => {
    if (!navigator.geolocation) {
      set({ status: 'unsupported', userLocation: null })
      return
    }
    set({ status: 'pending' })
    readGeolocationOnce(
      (lat, lng) => {
        set({ userLocation: { lat, lng }, status: 'ready' })
        try {
          lsSet(GEO_WANT_KEY, true)
        } catch {
          /* ignore */
        }
      },
      () => {
        set({ userLocation: null, status: 'denied' })
        try {
          lsRemove(GEO_WANT_KEY)
        } catch {
          /* ignore */
        }
      },
      60_000,
    )
  },

  clearLocation: () => {
    try {
      lsRemove(GEO_WANT_KEY)
    } catch {
      /* ignore */
    }
    set({ userLocation: null, status: 'off' })
  },

  restoreIfPermittedOnLoad: () => {
    if (typeof window === 'undefined' || restoreOnLoadInvoked) return
    restoreOnLoadInvoked = true
    if (!navigator.geolocation) return

    const { status } = get()
    if (status === 'ready' || status === 'pending') return

    const runFetch = (maximumAge: number) => {
      set({ status: 'pending' })
      readGeolocationOnce(
        (lat, lng) => {
          set({ userLocation: { lat, lng }, status: 'ready' })
          try {
            lsSet(GEO_WANT_KEY, true)
          } catch {
            /* ignore */
          }
        },
        () => {
          set({ userLocation: null, status: 'denied' })
          try {
            lsRemove(GEO_WANT_KEY)
          } catch {
            /* ignore */
          }
        },
        maximumAge,
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
            runFetch(0)
            return
          }
          if (perm.state === 'denied') {
            set({ userLocation: null, status: 'denied' })
            lsRemove(GEO_WANT_KEY)
            return
          }
          if (hadWant) runFetch(0)
        })
        .catch(() => {
          if (hadWant) runFetch(0)
        })
    } else if (hadWant) {
      runFetch(0)
    }
  },
}))
