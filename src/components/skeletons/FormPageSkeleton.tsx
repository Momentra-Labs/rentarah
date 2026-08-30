import { Box, Container, Skeleton, Stack } from '@mui/material'

import { containerGutters } from '@/theme/pageStyles'

import { PageHeaderSkeleton } from './skeletonPieces'

/** Centered form / legal chrome while onboarding, host invite, or legal chunks load. */
export default function FormPageSkeleton({ label = 'Loading page' }: { label?: string }) {
  return (
    <Box
      sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 6, md: 8 } }}
      aria-busy="true"
      aria-label={label}
    >
      <Container maxWidth="sm" sx={containerGutters}>
        <PageHeaderSkeleton align="center" />
        <Stack spacing={2} sx={{ maxWidth: 480, mx: 'auto' }}>
          <Skeleton variant="rounded" animation="wave" height={56} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" animation="wave" height={56} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" animation="wave" height={56} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" animation="wave" height={48} sx={{ borderRadius: 2, mt: 1, width: 200, mx: 'auto' }} />
        </Stack>
      </Container>
    </Box>
  )
}
