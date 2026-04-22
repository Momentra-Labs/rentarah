import { Box, Container, Grid, Skeleton, Stack } from '@mui/material'

/** Layout chrome while the vehicles store is still hydrating / seeding. */
export default function CarDetailSkeleton() {
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 8 }}>
      <Container maxWidth="lg" sx={{ pt: 3 }}>
        <Skeleton variant="text" width={280} sx={{ mb: 3 }} />
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={520} sx={{ borderRadius: '16px' }} />
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="rectangular" width={96} height={64} sx={{ borderRadius: 2 }} />
              ))}
            </Stack>
            <Skeleton variant="text" width="55%" sx={{ mt: 3 }} height={48} />
            <Skeleton variant="text" width="35%" />
            <Skeleton variant="text" width="90%" sx={{ mt: 2 }} />
            <Skeleton variant="text" width="85%" />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={420} sx={{ borderRadius: '20px' }} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
