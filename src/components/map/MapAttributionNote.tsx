import { Link, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

/**
 * Map providers require visible credit. Shown *below* the map so the canvas stays clean
 * (no floating OSM/CARTO chip on the tiles).
 */
export default function MapAttributionNote() {
  return (
    <Typography
      component="p"
      variant="caption"
      sx={(t) => ({
        flexShrink: 0,
        m: 0,
        py: 0.75,
        px: 1.5,
        fontSize: '0.65rem',
        lineHeight: 1.45,
        color: 'text.secondary',
        textAlign: { xs: 'center', sm: 'right' },
        bgcolor: alpha(t.palette.background.paper, 0.92),
        borderTop: 1,
        borderColor: 'divider',
        letterSpacing: '0.01em',
      })}
    >
      Map data ©{' '}
      <Link href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" color="primary" fontWeight={600} sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
        OpenStreetMap
      </Link>
      {', '}
      <Link href="https://carto.com/attributions/" target="_blank" rel="noreferrer" color="primary" fontWeight={600} sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
        CARTO
      </Link>
    </Typography>
  )
}
