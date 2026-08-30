import { Box, Container, Grid, Paper, Skeleton, Stack, useMediaQuery, useTheme } from '@mui/material'

import { SEARCH_PAGE_SIZE } from '@/config/searchFilters'
import { containerGutters, softInteractiveSurface, stickyToolbarPaper } from '@/theme/pageStyles'

import CarGridSkeleton from './CarGridSkeleton'

/** Full browse page chrome while the `/search` chunk or catalog is loading. */
export default function BrowsePageSkeleton() {
  const theme = useTheme()
  const isMd = useMediaQuery(theme.breakpoints.down('md'))
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

      <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 3 }, pb: { xs: 10, md: 6 }, ...containerGutters }}>
        <Grid container spacing={{ xs: 2.5, md: 3 }}>
          {!isMd && (
            <Grid item xs={12} md={3}>
              <Paper
                elevation={0}
                sx={{ p: { xs: 2, md: 2.25 }, ...softInteractiveSurface(theme, false) }}
              >
                <Skeleton variant="text" animation="wave" width={72} height={28} sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  <Skeleton variant="rounded" animation="wave" height={36} sx={{ borderRadius: 999 }} />
                  <Skeleton variant="rounded" animation="wave" height={36} sx={{ borderRadius: 999 }} />
                  <Skeleton variant="rounded" animation="wave" height={28} />
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {[0, 1, 2, 3].map((i) => (
                      <Skeleton
                        key={i}
                        variant="rounded"
                        animation="wave"
                        width={72}
                        height={36}
                        sx={{ borderRadius: 999 }}
                      />
                    ))}
                  </Stack>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {[0, 1, 2].map((i) => (
                      <Skeleton
                        key={i}
                        variant="rounded"
                        animation="wave"
                        width={64}
                        height={36}
                        sx={{ borderRadius: 999 }}
                      />
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          )}
          <Grid item xs={12} md={isMd ? 12 : 9}>
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
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
