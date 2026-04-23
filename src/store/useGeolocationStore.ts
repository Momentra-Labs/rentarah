import { create } from 'zustand'

import type { LatLng } from '../utils/distance'

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
}

export const useGeolocationStore = create<GeolocationState>((set) => ({
  userLocation: null,
  status: 'off',
  geoDialogOpen: false,

  openGeoDialog: () => set({ geoDialogOpen: true }),
  closeGeoDialog: () => set({ geoDialogOpen: false }),

  requestLocation: () => {
    if (!navigator.geolocation) {
      set({ status: 'unsupported', userLocation: null })
      return
    }
    set({ status: 'pending' })
    navigator.geolocation.getCurrentPosition(
      (p) =>
        set({
          userLocation: { lat: p.coords.latitude, lng: p.coords.longitude },
          status: 'ready',
        }),
      () => set({ userLocation: null, status: 'denied' }),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    )
  },

  clearLocation: () => set({ userLocation: null, status: 'off' }),
}))
