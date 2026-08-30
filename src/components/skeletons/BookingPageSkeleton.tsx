import { Box, Container, Grid, Paper, Skeleton, Stack, useTheme } from '@mui/material'

import { containerGutters, listRowSurface } from '@/theme/pageStyles'

import { PageHeaderSkeleton } from './skeletonPieces'

/** Checkout chrome while the booking chunk or vehicle catalog is loading. */
export default function BookingPageSkeleton() {
  const theme = useTheme()

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        minHeight: '100vh',
        py: { xs: 2, sm: 4 },
        pb: { xs: 'max(24px, env(safe-area-inset-bottom))', sm: 4 },
      }}
      aria-busy="true"
      aria-label="Loading booking"
    >
      <Container maxWidth="lg" sx={containerGutters}>
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, mb: { xs: 3, md: 4 }, ...listRowSurface(theme) }}>
          <Stack direction="row" justifyContent="space-around" alignItems="center" sx={{ py: 1 }}>
            {[0, 1, 2, 3].map((i) => (
              <Stack key={i} alignItems="center" spacing={0.75} sx={{ flex: 1 }}>
                <Skeleton variant="circular" animation="wave" width={28} height={28} />
                <Skeleton variant="text" animation="wave" width={64} height={16} />
              </Stack>
            ))}
          </Stack>
        </Paper>

        <Grid container spacing={{ xs: 2, md: 3 }} alignItems="flex-start">
          <Grid item xs={12} md={8}>
            <PageHeaderSkeleton />
            <Stack spacing={2}>
              <Skeleton variant="rounded" animation="wave" height={56} sx={{ borderRadius: 2 }} />
              <Skeleton variant="rounded" animation="wave" height={56} sx={{ borderRadius: 2 }} />
              <Skeleton variant="rounded" animation="wave" height={56} sx={{ borderRadius: 2 }} />
              <Skeleton variant="rounded" animation="wave" width={160} height={44} sx={{ borderRadius: 2 }} />
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{ p: 2.5, ...listRowSurface(theme), position: { md: 'sticky' }, top: { md: 96 } }}
            >
              <Skeleton variant="rounded" animation="wave" height={140} sx={{ borderRadius: 2, mb: 2 }} />
              <Skeleton variant="text" animation="wave" width="70%" height={24} />
              <Skeleton variant="text" animation="wave" width="88%" height={18} />
              <Skeleton variant="text" animation="wave" width="54%" height={18} />
              <Skeleton variant="text" animation="wave" width="40%" height={28} sx={{ mt: 2 }} />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
