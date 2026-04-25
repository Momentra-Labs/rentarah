import ChevronLeft from '@mui/icons-material/ChevronLeft'
import ChevronRight from '@mui/icons-material/ChevronRight'
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { ExploreMapListing } from '../../utils/exploreMapListings'
import { formatPeso } from '../../utils/formatCurrency'

const SCROLL_EDGE_EPS = 6

export type ExploreMapListingStripProps = {
  listings: ExploreMapListing[]
  selectedId: string | null
  onSelect: (id: string) => void
  onViewDetails: (listing: ExploreMapListing) => void
  title?: string
  /**
   * `panel` — bordered block aligned with map (default, for /map).
   * `minimal` — title + carousel only (e.g. tight layouts).
   */
  layout?: 'panel' | 'minimal'
}

/**
 * Horizontal listing cards synced with map markers; previous/next step through (no visible scrollbar).
 */
export default function ExploreMapListingStrip({
  listings,
  selectedId,
  onSelect,
  onViewDetails,
  title = 'Browse along the map',
  layout = 'panel',
}: ExploreMapListingStripProps) {
  const theme = useTheme()
  const isCompact = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true })
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const updateScrollArrows = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanPrev(scrollLeft > SCROLL_EDGE_EPS)
    setCanNext(scrollLeft < scrollWidth - clientWidth - SCROLL_EDGE_EPS)
  }, [])

  useEffect(() => {
    if (!selectedId || !scrollRef.current) return
    const el = scrollRef.current.querySelector(`[data-listing-id="${selectedId}"]`)
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [selectedId])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const raf = window.requestAnimationFrame(() => updateScrollArrows())
    el.addEventListener('scroll', updateScrollArrows, { passive: true })
    const ro = new ResizeObserver(() => updateScrollArrows())
    ro.observe(el)
    return () => {
      window.cancelAnimationFrame(raf)
      el.removeEventListener('scroll', updateScrollArrows)
      ro.disconnect()
    }
  }, [listings, updateScrollArrows])

  const scrollByStep = (dir: -1 | 1) => {
    const el = scrollRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-listing-id]')
    if (!card) return
    const styles = getComputedStyle(el)
    const gap = parseFloat(styles.columnGap || styles.gap || '16') || 16
    const step = card.getBoundingClientRect().width + gap
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  if (!listings.length) return null

  const navButtonSx = {
    flexShrink: 0,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.paper',
    width: 40,
    height: 40,
    '&:hover': { bgcolor: 'action.hover' },
    '&.Mui-disabled': { opacity: 0.4 },
  } as const

  const navOverlaySx = {
    position: 'absolute' as const,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 2,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: alpha(theme.palette.background.paper, 0.97),
    boxShadow: `0 2px 10px ${alpha('#000', 0.1)}`,
    width: 36,
    height: 36,
    '&:hover': { bgcolor: 'background.paper' },
    '&.Mui-disabled': { opacity: 0.3, pointerEvents: 'none' as const },
  }

  const cards = listings.map((l) => {
    const selected = selectedId === l.id
    return (
      <Card
        key={l.id}
        data-listing-id={l.id}
        elevation={0}
        onClick={() => onSelect(l.id)}
        sx={{
          flex: '0 0 auto',
          width: { xs: 'min(280px, 82vw)', sm: 248 },
          scrollSnapAlign: 'start',
          borderRadius: 2.5,
          border: '1px solid',
          borderColor: selected ? 'primary.main' : 'divider',
          bgcolor: selected ? (t) => alpha(t.palette.primary.main, 0.06) : 'background.paper',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
          boxShadow: selected
            ? (t) => `0 4px 18px ${alpha(t.palette.primary.main, 0.18)}`
            : `0 1px 4px ${alpha('#000', 0.06)}`,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
          },
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect(l.id)
          }
        }}
        aria-pressed={selected}
        aria-label={`${l.vehicle.displayName}, ${l.vehicle.locationName}`}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 10',
            flexShrink: 0,
            bgcolor: 'grey.100',
            overflow: 'hidden',
          }}
        >
          <Box
            component="img"
            src={l.vehicle.thumbnailUrl}
            alt=""
            loading="lazy"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </Box>
        <CardContent
          sx={{
            p: 1.5,
            pt: 1.25,
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.75,
            flexGrow: 1,
            boxSizing: 'border-box',
            '&:last-child': { pb: 1.5 },
          }}
        >
          <Stack
            direction="row"
            alignItems="flex-start"
            spacing={0.5}
            sx={{ minHeight: { xs: 0, sm: 40 } }}
          >
            <LocationOnOutlined sx={{ fontSize: 16, color: 'text.secondary', mt: 0.15, flexShrink: 0 }} />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                lineHeight: 1.35,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {l.vehicle.locationName}
            </Typography>
          </Stack>
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: { xs: 0, sm: 40 },
            }}
          >
            {l.vehicle.displayName}
          </Typography>
          <Typography variant="body2" color="primary" fontWeight={800} sx={{ letterSpacing: '-0.01em' }}>
            {formatPeso(l.vehicle.pricePerDay)}
            <Typography component="span" variant="caption" color="text.secondary" fontWeight={600} sx={{ ml: 0.5 }}>
              / day
            </Typography>
          </Typography>
          <Button
            fullWidth
            size="small"
            variant={isCompact ? 'contained' : 'outlined'}
            color="primary"
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails(l)
            }}
            sx={{
              mt: 1.25,
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 1.5,
              py: 0.85,
              boxShadow: 'none',
            }}
          >
            View details
          </Button>
        </CardContent>
      </Card>
    )
  })

  const scrollBoxSx = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    gap: 2,
    overflowX: 'auto',
    overflowY: 'hidden',
    py: 0.5,
    scrollSnapType: 'x mandatory' as const,
    WebkitOverflowScrolling: 'touch' as const,
    overscrollBehaviorX: 'contain' as const,
    scrollbarWidth: 'none' as const,
    msOverflowStyle: 'none' as const,
    '&::-webkit-scrollbar': { display: 'none' },
  }

  const carousel = isCompact ? (
    <Box sx={{ position: 'relative', mx: 0, px: 0, pb: 0.5 }}>
      <IconButton
        aria-label="Previous listings"
        onClick={() => scrollByStep(-1)}
        disabled={!canPrev}
        size="small"
        sx={{ ...navOverlaySx, left: 4 }}
      >
        <ChevronLeft fontSize="small" />
      </IconButton>
      <Box
        ref={scrollRef}
        sx={{
          ...scrollBoxSx,
          pl: 0.5,
          pr: 0.5,
          // Keep tap targets from overlapping the first/last card edges
          scrollPaddingLeft: 8,
          scrollPaddingRight: 8,
        }}
      >
        {cards}
      </Box>
      <IconButton
        aria-label="Next listings"
        onClick={() => scrollByStep(1)}
        disabled={!canNext}
        size="small"
        sx={{ ...navOverlaySx, right: 4 }}
      >
        <ChevronRight fontSize="small" />
      </IconButton>
    </Box>
  ) : (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.5 }}>
      <IconButton
        aria-label="Previous listings"
        onClick={() => scrollByStep(-1)}
        disabled={!canPrev}
        size="small"
        sx={navButtonSx}
      >
        <ChevronLeft />
      </IconButton>
      <Box ref={scrollRef} sx={scrollBoxSx}>
        {cards}
      </Box>
      <IconButton
        aria-label="Next listings"
        onClick={() => scrollByStep(1)}
        disabled={!canNext}
        size="small"
        sx={navButtonSx}
      >
        <ChevronRight />
      </IconButton>
    </Stack>
  )

  if (layout === 'minimal') {
    return (
      <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
          {title}
        </Typography>
        {carousel}
      </Box>
    )
  }

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        borderRadius: 3,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
        boxShadow: `0 2px 12px ${alpha('#000', 0.04)}`,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        useFlexGap
        gap={1}
        sx={{ px: { xs: 1.75, sm: 2 }, pt: { xs: 1.75, sm: 2 }, pb: { xs: 1, sm: 1 } }}
      >
        <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
          {title}
        </Typography>
        <Chip
          size="small"
          color="primary"
          variant="outlined"
          label={`${listings.length} ${listings.length === 1 ? 'listing' : 'listings'}`}
          sx={{ fontWeight: 700 }}
        />
      </Stack>
      <Box sx={{ px: { xs: 1, sm: 1.5 }, pb: { xs: 1.5, sm: 2 }, pt: 0, overflow: 'hidden' }}>{carousel}</Box>
    </Paper>
  )
}
