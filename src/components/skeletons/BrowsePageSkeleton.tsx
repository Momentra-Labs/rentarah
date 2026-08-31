import { Box, Container, Paper, Skeleton, Stack, useMediaQuery, useTheme } from '@mui/material'

import { SEARCH_PAGE_SIZE } from '@/config/searchFilters'
import { MOBILE_BOTTOM_NAV_SX_PB } from '@/components/layout/MobileBottomNav'
import { containerGutters, stickyToolbarPaper } from '@/theme/pageStyles'

import CarGridSkeleton from './CarGridSkeleton'

/** Full browse page chrome while the `/search` chunk or catalog is loading. */
export default function BrowsePageSkeleton() {
  const theme = useTheme()
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'))
  const layout = isSmDown ? 'list' : 'grid'

  return (
    <Box
      sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: { xs: 8, md: 6 } }}
      aria-busy="true"
      aria-label="Loading search results"
    >
      <Paper elevation={0} sx={stickyToolbarPaper(theme)}>
        <Container maxWidth="lg" sx={{ py: { xs: 1, md: 2 }, ...containerGutters }}>
          <Skeleton
            variant="rounded"
            animation="wave"
            sx={{ width: '100%', height: { xs: 48, md: 56 }, borderRadius: 999 }}
          />
        </Container>
      </Paper>

      <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 3 }, pb: { xs: MOBILE_BOTTOM_NAV_SX_PB, md: 6 }, ...containerGutters }}>
        <Skeleton
          variant="rounded"
          animation="wave"
          width={260}
          height={52}
          sx={{ borderRadius: 2, mb: 2 }}
        />
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{ mb: 2 }}
          spacing={1}
        >
          <Skeleton variant="text" animation="wave" width={180} height={22} />
          <Skeleton variant="rounded" animation="wave" width={200} height={40} />
        </Stack>
        <CarGridSkeleton count={SEARCH_PAGE_SIZE} layout={layout} />
      </Container>
    </Box>
  )
}
