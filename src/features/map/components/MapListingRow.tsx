import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined'
import PlaceOutlined from '@mui/icons-material/PlaceOutlined'
import StarRounded from '@mui/icons-material/StarRounded'
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { memo } from 'react'

import VehicleHeroImage from '@/components/media/VehicleHeroImage'
import { useT } from '@/hooks/useT'
import { rhRadius } from '@/theme/tokens'
import type { ExploreMapListing } from '@/utils/exploreMapListings'
import { formatPeso } from '@/utils/formatCurrency'

export type MapListingRowProps = {
  listing: ExploreMapListing
  selected: boolean
  hovered: boolean
  /** Row click: open the listing. */
  onViewDetails: (listing: ExploreMapListing) => void
  /** Pin button: fly the map to this listing and open its popup. */
  onShowOnMap: (listing: ExploreMapListing) => void
  onHover?: (id: string | null) => void
}

/**
 * Desktop /map sidebar row: thumbnail + key facts in ~100px so several listings fit on screen.
 * Click opens the listing (like any listing card); hover highlights its pin; the pin button flies the map to it.
 */
function MapListingRow({ listing, selected, hovered, onViewDetails, onShowOnMap, onHover }: MapListingRowProps) {
  const t = useT()
  const v = listing.vehicle
  return (
    <Box
      data-listing-id={listing.id}
      role="link"
      tabIndex={0}
      aria-current={selected || undefined}
      aria-label={`${v.displayName}, ${v.locationName}, ${formatPeso(v.pricePerDay)} ${t('common.perDay')}`}
      onClick={() => onViewDetails(listing)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onViewDetails(listing)
        }
      }}
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
      sx={(th) => ({
        position: 'relative',
        display: 'flex',
        gap: 1.5,
        p: 1,
        borderRadius: `${rhRadius.md}px`,
        border: '1px solid',
        borderColor: selected ? th.palette.primary.main : 'transparent',
        bgcolor: selected
          ? alpha(th.palette.primary.main, th.palette.mode === 'dark' ? 0.16 : 0.06)
          : hovered
            ? alpha(th.palette.text.primary, 0.04)
            : 'transparent',
        cursor: 'pointer',
        transition: 'background-color 0.16s ease, border-color 0.16s ease',
        '&:hover': {
          bgcolor: selected
            ? alpha(th.palette.primary.main, th.palette.mode === 'dark' ? 0.2 : 0.08)
            : alpha(th.palette.text.primary, 0.04),
        },
        '&:hover .map-row-thumb img': { transform: 'scale(1.04)' },
        '&:focus-visible': { outline: 'none', boxShadow: `0 0 0 3px ${alpha(th.palette.primary.main, 0.32)}` },
      })}
    >
      <Box
        className="map-row-thumb"
        sx={{
          width: 112,
          height: 84,
          flexShrink: 0,
          borderRadius: `${rhRadius.sm}px`,
          overflow: 'hidden',
          bgcolor: 'grey.100',
        }}
      >
        <VehicleHeroImage
          src={v.thumbnailUrl}
          vehicleType={v.vehicleType}
          bodySegment={v.bodySegment}
          loading="lazy"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.3s ease',
          }}
        />
      </Box>

      <Stack sx={{ minWidth: 0, flex: 1, py: 0.25 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '0.9rem',
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {v.displayName}
        </Typography>
        <Stack direction="row" alignItems="center" sx={{ mt: 0.375, minWidth: 0, color: 'text.secondary' }}>
          <StarRounded sx={{ fontSize: 15, color: 'warning.main', flexShrink: 0 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.3, color: 'text.primary', ml: 0.25 }}>
            {v.rating.toFixed(1)}
          </Typography>
          <Typography variant="caption" sx={{ lineHeight: 1.3, ml: 0.25, flexShrink: 0 }}>
            ({v.reviewCount})
          </Typography>
          <Box component="span" sx={{ mx: 0.75, opacity: 0.5, fontSize: 10 }} aria-hidden>
            •
          </Box>
          <LocationOnOutlined sx={{ fontSize: 14, flexShrink: 0 }} />
          <Typography
            variant="caption"
            sx={{ lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {v.locationName}
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 'auto', pt: 0.25 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {formatPeso(v.pricePerDay)}
            <Typography component="span" variant="caption" color="text.secondary" sx={{ fontWeight: 600, ml: 0.25 }}>
              {t('common.perDay')}
            </Typography>
          </Typography>
          <Tooltip title={t('map.showOnMap')} placement="left">
            <IconButton
              size="small"
              aria-label={t('map.showOnMap')}
              onClick={(e) => {
                e.stopPropagation()
                onShowOnMap(listing)
              }}
              sx={(th) => ({
                width: 30,
                height: 30,
                mr: -0.5,
                borderRadius: `${rhRadius.sm}px`,
                color: selected ? 'primary.main' : 'text.secondary',
                bgcolor: selected ? alpha(th.palette.primary.main, 0.12) : 'transparent',
                '&:hover': { color: 'primary.main', bgcolor: alpha(th.palette.primary.main, 0.1) },
              })}
            >
              <PlaceOutlined sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Box>
  )
}

export default memo(MapListingRow)
