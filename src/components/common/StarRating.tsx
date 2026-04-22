import { Rating, Stack, Typography } from '@mui/material'
import type { RatingProps } from '@mui/material/Rating'

export interface StarRatingProps extends Omit<RatingProps, 'value'> {
  value?: number | string
  reviews?: number
}

export default function StarRating({
  value = 0,
  reviews,
  size = 'small',
  ...ratingProps
}: StarRatingProps) {
  const v = Math.min(5, Math.max(0, Number(value)))
  return (
    <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap">
      <Rating value={v} precision={0.1} readOnly size={size} {...ratingProps} />
      {reviews != null && (
        <Typography variant="caption" color="text.secondary">
          ({reviews})
        </Typography>
      )}
    </Stack>
  )
}
