import MapOutlined from '@mui/icons-material/MapOutlined'
import { Fab, useMediaQuery, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Link as RouterLink } from 'react-router-dom'

/**
 * Desktop / tablet: floating map entry on the home page.
 * Hidden below `md` — the mobile tab bar + map preview + hero “Browse” keep map discovery clear without a second FAB.
 */
export default function LandingMapFab() {
  const theme = useTheme()
  const isLgForFab = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true })
  if (!isLgForFab) return null

  return (
    <Fab
      component={RouterLink}
      to="/map"
      color="primary"
      variant="extended"
      aria-label="Open rental map"
      sx={{
        position: 'fixed',
        right: 24,
        bottom: 24,
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
