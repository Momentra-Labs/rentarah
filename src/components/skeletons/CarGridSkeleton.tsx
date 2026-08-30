import { Box, Card, CardActions, CardContent, Grid, Skeleton, Stack } from '@mui/material'

export interface CarGridSkeletonProps {
  count?: number
  layout?: 'grid' | 'list'
}

function CardSkeleton({ layout }: { layout: 'grid' | 'list' }) {
  const mediaHeights =
    layout === 'grid' ? { xs: 196, sm: 228 } : { xs: 156, sm: 192 }

  const media = (
    <Skeleton
      variant="rectangular"
      animation="wave"
      sx={{
        display: 'block',
        width: layout === 'list' ? { xs: '100%', sm: 200 } : '100%',
        height: mediaHeights,
        minHeight: mediaHeights,
        maxHeight: mediaHeights,
        flexShrink: 0,
        borderRadius:
          layout === 'list' ? { xs: '16px 16px 0 0', sm: '16px 0 0 16px' } : '16px 16px 0 0',
      }}
    />
  )

  const body = (
    <CardContent
      sx={{
        pt: { xs: 1.5, sm: 2 },
        px: { xs: 1.5, sm: 2 },
        flex: 1,
        minHeight: 0,
        pb: 0,
        '&:last-child': { pb: 0 },
      }}
    >
      <Stack spacing={1}>
        <Skeleton variant="text" animation="wave" width="42%" height={28} />
        <Skeleton variant="text" animation="wave" width="78%" height={22} />
        <Skeleton variant="text" animation="wave" width="56%" height={18} />
        <Skeleton variant="text" animation="wave" width="64%" height={16} />
      </Stack>
    </CardContent>
  )

  const actions = (
    <CardActions sx={{ px: { xs: 1.5, sm: 2 }, pb: { xs: 1.5, sm: 2 }, pt: { xs: 1, sm: 1.25 } }}>
      <Skeleton variant="rounded" animation="wave" height={44} sx={{ width: '100%', borderRadius: 999 }} />
    </CardActions>
  )

  if (layout === 'list') {
    return (
      <Card variant="outlined" sx={{ height: '100%', borderRadius: 3, overflow: 'hidden' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: 'stretch' }}>
          {media}
          <Stack flex={1} minWidth={0}>
            {body}
            {actions}
          </Stack>
        </Stack>
      </Card>
    )
  }

  return (
    <Card variant="outlined" sx={{ height: '100%', borderRadius: 3, overflow: 'hidden' }}>
      <Stack>
        {media}
        {body}
        {actions}
      </Stack>
    </Card>
  )
}

/** Listing cards that match {@link CarCard} while the catalog or search is loading. */
export default function CarGridSkeleton({ count = 6, layout = 'grid' }: CarGridSkeletonProps) {
  return (
    <Grid
      container
      spacing={{ xs: 2.5, md: 3 }}
      aria-busy="true"
      aria-label="Loading vehicles"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Grid
          item
          xs={12}
          sm={layout === 'grid' ? 6 : 12}
          md={layout === 'grid' ? 4 : 12}
          key={i}
        >
          <Box sx={{ height: '100%' }}>
            <CardSkeleton layout={layout} />
          </Box>
        </Grid>
      ))}
    </Grid>
  )
}
