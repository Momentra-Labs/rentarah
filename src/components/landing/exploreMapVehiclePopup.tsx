import ChevronRight from '@mui/icons-material/ChevronRight'
import ChevronLeft from '@mui/icons-material/ChevronLeft'
import { Box, Button, IconButton, Stack, Typography } from '@mui/material'
import { alpha, type SxProps, type Theme } from '@mui/material/styles'
import { motion } from 'framer-motion'
import type { ReactNode, SyntheticEvent } from 'react'

import { formatPeso } from '../../utils/formatCurrency'
import type { ExploreMapListing } from '../../utils/exploreMapListings'
import { popupCtaGestureBlockers } from '../../utils/exploreMapPopupGestures'

const SWIPE_DRAG_THRESHOLD = 64

/** Large prev/next arrows + bar — `/map` popup (compact + desktop stacked). */
function exploreMapPopupCityNavIconButtonSx(theme: Theme) {
  return {
    flexShrink: 0,
    width: 44,
    height: 44,
    p: 0,
    bgcolor: alpha(theme.palette.primary.main, 0.16),
    color: 'primary.dark',
    border: '2px solid',
    borderColor: alpha(theme.palette.primary.main, 0.45),
    boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.12)}`,
    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.26) },
    '&.Mui-disabled': {
      borderColor: theme.palette.action.disabledBackground,
      bgcolor: 'action.hover',
    },
  }
}

const cityPrevNextBarSx = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
  py: 1,
  px: 0.75,
  borderRadius: 2,
  bgcolor: (t: Theme) => alpha(t.palette.primary.main, 0.08),
  border: '1px solid',
  borderColor: (t: Theme) => alpha(t.palette.primary.main, 0.22),
}

const cityPrevNextCenterLabelSx = {
  flex: 1,
  textAlign: 'center',
  fontWeight: 700,
  fontSize: '0.8rem',
  lineHeight: 1.35,
  color: 'primary.dark',
  letterSpacing: '0.01em',
}

/**
 * Prev / next row shared by mobile (under swipe rail) and desktop stacked map popups — one visual language.
 */
export function ExploreMapPopupCityPrevNextRow({
  canPrev,
  canNext,
  positionLabel,
  onPrev,
  onNext,
  hintBelow,
  sx,
}: {
  canPrev: boolean
  canNext: boolean
  /** e.g. "2 / 5 · Same city" */
  positionLabel?: string
  onPrev: () => void
  onNext: () => void
  /** Secondary line — e.g. swipe hint on mobile only */
  hintBelow?: string
  /** Merged into root `Stack` (e.g. `mt` spacing under swipe rail vs desktop gap) */
  sx?: SxProps<Theme>
}) {
  if (!canPrev && !canNext) return null

  const labelFull = positionLabel ?? 'Same city'

  const stopBubble = (e: SyntheticEvent) => {
    e.stopPropagation()
  }

  return (
    <Stack
      direction="column"
      spacing={0.5}
      sx={[
        { width: '100%', mt: 0 },
        ...(sx != null ? (Array.isArray(sx) ? sx : [sx]) : []),
      ]}
    >
      <Box sx={cityPrevNextBarSx}>
        <IconButton
          size="large"
          aria-label={positionLabel ? `Previous (${positionLabel})` : 'Previous vehicle'}
          disabled={!canPrev}
          sx={exploreMapPopupCityNavIconButtonSx}
          onMouseDown={stopBubble}
          onTouchStart={stopBubble}
          onClick={(e) => {
            e.stopPropagation()
            if (canPrev) onPrev()
          }}
        >
          <ChevronLeft sx={{ fontSize: 28 }} />
        </IconButton>
        <Typography variant="caption" sx={cityPrevNextCenterLabelSx}>
          {labelFull}
        </Typography>
        <IconButton
          size="large"
          aria-label={positionLabel ? `Next (${positionLabel})` : 'Next vehicle'}
          disabled={!canNext}
          sx={exploreMapPopupCityNavIconButtonSx}
          onMouseDown={stopBubble}
          onTouchStart={stopBubble}
          onClick={(e) => {
            e.stopPropagation()
            if (canNext) onNext()
          }}
        >
          <ChevronRight sx={{ fontSize: 28 }} />
        </IconButton>
      </Box>
      {!hintBelow ? null : (
        <Typography
          variant="caption"
          sx={{
            fontSize: 10,
            display: 'block',
            textAlign: 'center',
            color: (t) => alpha(t.palette.text.secondary, 0.95),
            letterSpacing: '0.02em',
          }}
        >
          {hintBelow}
        </Typography>
      )}
    </Stack>
  )
}

/** Compact horizontal Leaflet popup: image left (square), copy + CTAs right. ~40% shorter than legacy stack popup. */
export function ExploreMapVehiclePopupCompactHorizontal({
  listing,
  listingPrimaryHex,
  onViewDetails,
  footerSlotAfterButtons,
}: {
  listing: ExploreMapListing
  listingPrimaryHex: string
  onViewDetails: () => void
  footerSlotAfterButtons?: ReactNode
}) {
  return (
    <Box sx={{ py: 0.25, pr: 0.25, pl: 0.15, boxSizing: 'border-box', width: '100%', maxWidth: 300 }}>
      <Stack direction="row" spacing={1} alignItems="stretch" sx={{ alignItems: 'center' }}>
        <Box
          component="img"
          src={listing.vehicle.thumbnailUrl}
          alt=""
          loading="lazy"
          decoding="async"
          sx={{
            width: 52,
            height: 52,
            minWidth: 52,
            borderRadius: 1.25,
            objectFit: 'cover',
            display: 'block',
            bgcolor: 'grey.100',
          }}
        />
        <Box sx={{ minWidth: 0, flex: 1, py: 0.125 }}>
          <Typography
            fontWeight={700}
            sx={{
              lineHeight: 1.28,
              fontSize: '0.8125rem',
              letterSpacing: '-0.01em',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {listing.vehicle.displayName}
          </Typography>
          <Typography
            sx={{ mt: 0.15, fontSize: '0.8125rem', fontWeight: 700, color: 'primary.main', lineHeight: 1.2 }}
          >
            {formatPeso(listing.vehicle.pricePerDay)}
            <Typography component="span" sx={{ fontSize: 10.5, color: 'text.secondary', fontWeight: 500 }}>
              {' '}
              / day
            </Typography>
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 0.1, lineHeight: 1.28, fontSize: 10.5 }}
          >
            {listing.vehicle.locationName}
          </Typography>
          <Stack direction="column" spacing={1.25} sx={{ mt: 0.5, width: '100%' }}>
            <Button
              fullWidth
              size="small"
              type="button"
              variant="contained"
              sx={{
                flex: 1,
                minHeight: 32,
                px: 0.75,
                bgcolor: listingPrimaryHex,
                '&:hover': { bgcolor: '#1647b8' },
                borderRadius: 1.25,
                textTransform: 'none',
                fontWeight: 600,
                py: 0.5,
                fontSize: 11.5,
                lineHeight: 1,
              }}
              {...popupCtaGestureBlockers()}
              onClick={(e) => {
                e.stopPropagation()
                onViewDetails()
              }}
            >
              Details
            </Button>
            {footerSlotAfterButtons ?? null}
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}

/**
 * Horizontal drag plus large tap buttons for prev/next — same callbacks as swipe end actions.
 */
export function ExploreMapPopupSwipeRail({
  canPrev,
  canNext,
  onSwipePrev,
  onSwipeNext,
  children,
  positionLabel,
}: {
  canPrev: boolean
  canNext: boolean
  children: ReactNode
  /** e.g. "2 / 5 · Same city" — optional but recommended for accessibility */
  positionLabel?: string
  onSwipePrev: () => void
  onSwipeNext: () => void
}) {
  const navigationAvailable = canPrev || canNext

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <motion.div
        drag={canPrev || canNext ? 'x' : false}
        dragElastic={0.06}
        dragConstraints={{
          left: canNext ? -180 : 0,
          right: canPrev ? 180 : 0,
        }}
        dragPropagation={false}
        onDragEnd={(_, info) => {
          const ox = info.offset.x
          if (ox <= -SWIPE_DRAG_THRESHOLD && canNext) {
            onSwipeNext()
          } else if (ox >= SWIPE_DRAG_THRESHOLD && canPrev) {
            onSwipePrev()
          }
        }}
        style={{ touchAction: 'pan-y', width: '100%' }}
      >
        {children}
      </motion.div>
      {!navigationAvailable ? null : (
        <ExploreMapPopupCityPrevNextRow
          canPrev={canPrev}
          canNext={canNext}
          positionLabel={positionLabel}
          onPrev={() => onSwipePrev()}
          onNext={() => onSwipeNext()}
          hintBelow="Or swipe the card sideways"
          sx={{ mt: 0.5 }}
        />
      )}
    </Box>
  )
}
