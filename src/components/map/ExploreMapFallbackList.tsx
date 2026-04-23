import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Stack,
  Typography,
} from '@mui/material'

import type { ExploreMapListing } from '../../utils/exploreMapListings'
import { formatPeso } from '../../utils/formatCurrency'

export type ExploreMapFallbackListProps = {
  listings: ExploreMapListing[]
  onNavigate: (id: string) => void
  title?: string
  maxHeight?: number | string
}

/** Grid-style list when the interactive map is unavailable. */
export default function ExploreMapFallbackList({
  listings,
  onNavigate,
  title = 'Map could not be loaded. Browse locations below.',
  maxHeight = 440,
}: ExploreMapFallbackListProps) {
  return (
    <Box sx={{ p: 2, maxHeight, overflow: 'auto' }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Stack spacing={1.5}>
        {listings.map((l) => (
          <Card key={l.id} variant="outlined" sx={{ borderRadius: 2 }}>
            <CardActionArea
              onClick={() => onNavigate(l.id)}
              sx={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch' }}
            >
              <CardMedia
                component="img"
                sx={{ width: 100, minHeight: 80, objectFit: 'cover' }}
                image={l.vehicle.thumbnailUrl}
                alt=""
              />
              <CardContent sx={{ py: 1.5, flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {l.vehicle.displayName}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {l.vehicle.locationName}
                </Typography>
                <Typography variant="body2" color="primary" fontWeight={700} sx={{ mt: 0.5 }}>
                  {formatPeso(l.vehicle.pricePerDay)}/day
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
