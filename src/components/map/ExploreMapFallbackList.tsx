import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
} from '@mui/material'

import VehicleHeroImage from '../media/VehicleHeroImage'

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
              <Box
                sx={{
                  width: 100,
                  flexShrink: 0,
                  alignSelf: 'stretch',
                  minHeight: 80,
                  bgcolor: 'grey.100',
                  overflow: 'hidden',
                  borderRadius: '8px 0 0 8px',
                }}
              >
                <VehicleHeroImage
                  src={l.vehicle.thumbnailUrl}
                  vehicleType={l.vehicle.vehicleType}
                  bodySegment={l.vehicle.bodySegment}
                  sx={{ width: '100%', height: '100%', minHeight: 80, objectFit: 'cover', display: 'block' }}
                />
              </Box>
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
