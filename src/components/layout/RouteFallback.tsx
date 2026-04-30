import { Box, Skeleton } from '@mui/material'

/**
 * Minimal `Suspense` fallback — avoids large skeleton layouts that flash during quick prefetched navigations.
 * Heavier pages still mount their own loaders once the chunk runs.
 */
export default function RouteFallback() {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 100,
        width: '100%',
        pt: 2.5,
        px: 2,
        boxSizing: 'border-box',
      }}
      aria-busy="true"
      aria-label="Loading page"
    >
      <Skeleton variant="rounded" height={4} sx={{ maxWidth: 280, mx: 'auto', borderRadius: 999 }} animation="pulse" />
    </Box>
  )
}
