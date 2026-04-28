import type { SyntheticEvent } from 'react'

/**
 * Prevents map popup CTAs from (1) starting Framer horizontal drag on the swipe rail and
 * (2) bubbling to Leaflet / the map (which can close the popup before React runs navigation).
 */
export function popupCtaGestureBlockers() {
  return {
    onPointerDown: (e: SyntheticEvent) => {
      e.stopPropagation()
    },
    onTouchStart: (e: SyntheticEvent) => {
      e.stopPropagation()
    },
  }
}
