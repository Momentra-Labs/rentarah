import { Box, LinearProgress } from '@mui/material'

/** Lightweight placeholder during lazy route hydration — avoids flashing full splash. */
export default function RouteFallback() {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: { xs: 180, md: 240 },
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
      aria-busy="true"
      aria-label="Loading page"
    >
      <LinearProgress sx={{ width: 'min(200px, 45vw)', borderRadius: 99, opacity: 0.85 }} />
    </Box>
  )
}
