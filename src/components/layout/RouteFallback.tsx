import { Box, Skeleton, Stack, useMediaQuery, useTheme } from '@mui/material'

/** Lightweight route placeholder — skeleton on mobile/WebView reads more “native” than a spinner. */
export default function RouteFallback() {
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))

  if (isMdUp) {
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
        <Skeleton variant="rounded" sx={{ width: 'min(220px, 45vw)', height: 4, borderRadius: 999 }} animation="wave" />
      </Box>
    )
  }

  return (
    <Stack
      spacing={2}
      sx={{
        flex: 1,
        width: '100%',
        px: 2,
        py: 2.5,
        boxSizing: 'border-box',
      }}
      aria-busy="true"
      aria-label="Loading page"
    >
      <Skeleton variant="rounded" height={22} width="52%" sx={{ borderRadius: 1 }} animation="wave" />
      <Skeleton variant="rounded" height={140} sx={{ borderRadius: 3 }} animation="wave" />
      <Skeleton variant="rounded" height={140} sx={{ borderRadius: 3 }} animation="wave" />
      <Skeleton variant="rounded" height={96} sx={{ borderRadius: 3 }} animation="wave" />
    </Stack>
  )
}
