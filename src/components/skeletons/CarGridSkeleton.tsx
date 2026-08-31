import { Box, Grid, Skeleton, Stack } from '@mui/material'

import { rhRadius } from '@/theme/tokens'

export interface CarGridSkeletonProps {
  count?: number
  layout?: 'grid' | 'list'
}

const GRID_PHOTO_H = { xs: 220, sm: 240 }
const LIST_PHOTO_H_XS = 200
const LIST_PHOTO_W_SM = 268

function CardSkeleton({ layout }: { layout: 'grid' | 'list' }) {
  const isList = layout === 'list'

  const media = (
    <Skeleton
      variant="rounded"
      animation="wave"
      sx={{
        display: 'block',
        flexShrink: 0,
        width: isList ? { xs: '100%', sm: LIST_PHOTO_W_SM } : '100%',
        height: isList ? { xs: LIST_PHOTO_H_XS, sm: 200 } : GRID_PHOTO_H,
        minHeight: isList ? { xs: LIST_PHOTO_H_XS, sm: 200 } : GRID_PHOTO_H,
        borderRadius: `${rhRadius.lg}px`,
      }}
    />
  )

  const body = (
    <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0, pt: isList ? { xs: 0, sm: 0.25 } : 1.25 }}>
      <Skeleton variant="text" animation="wave" width="72%" height={22} />
      <Skeleton variant="text" animation="wave" width="48%" height={18} />
      <Skeleton variant="text" animation="wave" width="64%" height={16} />
      <Skeleton variant="text" animation="wave" width="36%" height={20} sx={{ mt: 0.5 }} />
    </Stack>
  )

  if (isList) {
    return (
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.25, sm: 2.5 }} alignItems="stretch">
        {media}
        {body}
      </Stack>
    )
  }

  return (
    <Box>
      {media}
      {body}
    </Box>
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
          <CardSkeleton layout={layout} />
        </Grid>
      ))}
    </Grid>
  )
}
