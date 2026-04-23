import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useRef } from 'react'

import type { ExploreMapListing } from '../../utils/exploreMapListings'
import { formatPeso } from '../../utils/formatCurrency'

export type ExploreMapListingStripProps = {
  listings: ExploreMapListing[]
  selectedId: string | null
  onSelect: (id: string) => void
  onViewDetails: (listing: ExploreMapListing) => void
  title?: string
}

/**
 * Horizontal, scroll-snapped cards synced with map marker selection.
 */
export default function ExploreMapListingStrip({
  listings,
  selectedId,
  onSelect,
  onViewDetails,
  title = 'Browse along the map',
}: ExploreMapListingStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!selectedId || !scrollRef.current) return
    const el = scrollRef.current.querySelector(`[data-listing-id="${selectedId}"]`)
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [selectedId])

  if (!listings.length) return null

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      <Box
        ref={scrollRef}
        sx={{
          display: 'flex',
          gap: 1.5,
          overflowX: 'auto',
          pb: 1,
          mx: { xs: -2, sm: -3 },
          px: { xs: 2, sm: 3 },
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {listings.map((l) => (
          <Card
            key={l.id}
            data-listing-id={l.id}
            elevation={0}
            sx={{
              flex: '0 0 auto',
              width: 220,
              scrollSnapAlign: 'start',
              borderRadius: 2.5,
              border: '2px solid',
              borderColor: selectedId === l.id ? 'primary.main' : 'divider',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              boxShadow:
                selectedId === l.id
                  ? (t) => `0 4px 20px ${alpha(t.palette.primary.main, 0.22)}`
                  : 'none',
            }}
          >
            <CardActionArea onClick={() => onSelect(l.id)} sx={{ height: '100%' }}>
              <CardMedia
                component="img"
                height={100}
                image={l.vehicle.thumbnailUrl}
                alt=""
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ p: 1.5 }}>
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {l.vehicle.locationName}
                </Typography>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 0.25, lineHeight: 1.25 }} noWrap>
                  {l.vehicle.displayName}
                </Typography>
                <Typography variant="body2" color="primary" fontWeight={700} sx={{ mt: 0.5 }}>
                  {formatPeso(l.vehicle.pricePerDay)}/day
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewDetails(l)
                  }}
                  sx={{ mt: 0.5, textTransform: 'none', fontWeight: 600, p: 0, minWidth: 0 }}
                >
                  View details
                </Button>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  )
}
