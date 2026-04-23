import MapOutlined from '@mui/icons-material/MapOutlined'
import { Fab } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Link as RouterLink } from 'react-router-dom'

/**
 * Persistent thumb-friendly entry to the full map while on the home page.
 */
export default function LandingMapFab() {
  return (
    <Fab
      component={RouterLink}
      to="/map"
      color="primary"
      variant="extended"
      aria-label="Open rental map"
      sx={{
        position: 'fixed',
        right: { xs: 16, sm: 24 },
        bottom: { xs: `max(16px, env(safe-area-inset-bottom))`, sm: 24 },
        zIndex: (t) => t.zIndex.speedDial,
        px: 2,
        fontWeight: 700,
        textTransform: 'none',
        boxShadow: (t) => `0 8px 24px ${alpha(t.palette.primary.main, 0.35)}`,
      }}
    >
      <MapOutlined sx={{ mr: 1 }} />
      Map
    </Fab>
  )
}
