import { Box } from '@mui/material'
import { useEffect, type ReactNode } from 'react'

/**
 * Window resize: Leaflet’s internal ResizeObserver on the map container usually fires, but wide
 * flex + MUI breakpoints occasionally need an extra frame after the shell reflows.
 */
function MapLayoutResizePulse() {
  useEffect(() => {
    const onResize = () => {
      requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('rentara-map-shell-resize'))
      })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return null
}

/** Mobile /map: single column filling main — map column below nav, same flex chain as before. */
export function MobileMapLayout({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignSelf: 'stretch',
        bgcolor: 'background.default',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <MapLayoutResizePulse />
      {children}
    </Box>
  )
}

/**
 * Desktop /map: row split — **sidebar shell** (filters/listings width comes from sidebar content)
 * vs **map shell** (`flex: 1 1 0` + `minHeight: 0`) so Leaflet always gets a non-zero box.
 */
export function DesktopMapLayout({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        height: '100%',
        /** Match `main` vertical padding: Navbar 64px + bottom safe-area only (no extra 12px on /map). */
        maxHeight: 'min(100%, calc(100dvh - 64px - env(safe-area-inset-bottom, 0px)))',
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        alignSelf: 'stretch',
        overflow: 'hidden',
        bgcolor: 'grey.50',
      }}
    >
      <MapLayoutResizePulse />
      {/* Sidebar column: filters + listing strip — does not shrink in the flex row */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          minHeight: 0,
          alignSelf: 'stretch',
          overflow: 'hidden',
          position: 'relative',
          zIndex: (t) => t.zIndex.appBar - 5,
        }}
      >
        {sidebar}
      </Box>
      {/* Map column — takes all remaining horizontal space */}
      <Box
        sx={{
          flex: '1 1 0px',
          minWidth: { md: 'min(360px, 40vw)' },
          minHeight: 0,
          /**
           * Fill the split row; cap to dynamic viewport minus Navbar (~64px) and bottom safe-area only
           * (aligned with `MainLayout` `main` padding on `/map`).
           */
          alignSelf: 'stretch',
          height: '100%',
          maxHeight: 'calc(100dvh - 64px - env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          zIndex: (t) => t.zIndex.appBar - 10,
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

/** Picks mobile vs desktop shell so map + sidebar configs never share one flex row. */
export function MapPageResponsiveSplit({
  isMobile,
  sidebar,
  children,
}: {
  isMobile: boolean
  sidebar: ReactNode
  children: ReactNode
}) {
  if (isMobile) {
    return <MobileMapLayout>{children}</MobileMapLayout>
  }
  return <DesktopMapLayout sidebar={sidebar}>{children}</DesktopMapLayout>
}
