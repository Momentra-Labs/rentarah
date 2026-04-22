import { Grid, Skeleton, Stack } from '@mui/material'

export interface CarGridSkeletonProps {
  count?: number
  layout?: 'grid' | 'list'
}

/** Placeholder grid while listings are bootstrapping from storage / seed. */
export default function CarGridSkeleton({ count = 6, layout = 'grid' }: CarGridSkeletonProps) {
  const xs = 12
  const sm = layout === 'grid' ? 6 : 12
  const md = layout === 'grid' ? 4 : 12

  return (
    <Grid container spacing={2}>
      {Array.from({ length: count }).map((_, i) => (
        <Grid item xs={xs} sm={sm} md={md} key={i}>
          {layout === 'grid' ? (
            <Stack spacing={1}>
              <Skeleton variant="rectangular" height={220} sx={{ borderRadius: '16px 16px 0 0' }} />
              <Skeleton variant="text" width="70%" />
              <Skeleton variant="text" width="45%" />
              <Stack direction="row" spacing={1}>
                <Skeleton variant="rounded" height={28} width={72} />
                <Skeleton variant="rounded" height={28} width={72} />
              </Stack>
            </Stack>
          ) : (
            <Stack direction="row" spacing={2}>
              <Skeleton variant="rectangular" width={200} height={140} sx={{ borderRadius: 2, flexShrink: 0 }} />
              <Stack flex={1} spacing={1}>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="80%" />
              </Stack>
            </Stack>
          )}
        </Grid>
      ))}
    </Grid>
  )
}
