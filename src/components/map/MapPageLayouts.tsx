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
 * Desktop /map: fixed-width sidebar + flexible map column (`flex: 1 1 0` + `minHeight: 0`) so
 * Leaflet always gets a non-zero sized box after layout.
 */
export function DesktopMapLayout({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        alignSelf: 'stretch',
        bgcolor: 'grey.50',
      }}
    >
      <MapLayoutResizePulse />
      {sidebar}
      <Box
        sx={{
          flex: '1 1 0px',
          minWidth: { md: 'min(520px, 56vw)' },
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
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
