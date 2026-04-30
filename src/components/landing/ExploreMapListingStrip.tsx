import ChevronLeft from '@mui/icons-material/ChevronLeft'
import ChevronRight from '@mui/icons-material/ChevronRight'
import MapOutlined from '@mui/icons-material/MapOutlined'
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined'
import StarRounded from '@mui/icons-material/StarRounded'
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
import type { SxProps, Theme } from '@mui/material/styles'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import type { ExploreMapListing } from '../../utils/exploreMapListings'
import { formatPeso } from '../../utils/formatCurrency'
import VehicleHeroImage from '../media/VehicleHeroImage'
import { ExploreMapPopupCityPrevNextRow } from './exploreMapVehiclePopup'

const SCROLL_EDGE_EPS = 6

export type ExploreMapListingStripProps = {
  listings: ExploreMapListing[]
  selectedId: string | null
  onSelect: (id: string) => void
  onViewDetails: (listing: ExploreMapListing) => void
  /** Full map page: pan map to this pin and open its popup. */
  onViewOnMap?: (listing: ExploreMapListing) => void
  title?: string
  /**
   * When false, the carousel does not auto-scroll when `selectedId` changes (e.g. map marker click).
   * When true (default), selecting a card or changing selection from the strip scrolls the card into view.
   */
  autoScrollToSelected?: boolean
  /**
   * Increment (e.g. map “Show in listing below”) to scroll the current `selectedId` into view even if the id was already selected.
   */
  listingScrollRequest?: number
  /**
   * `panel` — bordered block aligned with map (default, for /map).
   * `minimal` — title + carousel only (e.g. tight layouts).
   */
  layout?: 'panel' | 'minimal'
  /** Horizontal strip (default) or scrollable column for sidebar / bottom sheet. */
  orientation?: 'horizontal' | 'vertical'
  /** Extra controls in the panel header row (e.g. “vehicles on map” on desktop /map). */
  headerExtra?: ReactNode
  /** Desktop /map: drive map marker hover emphasis from listing cards. */
  onListingHover?: (listingId: string | null) => void
  /** When set (e.g. from `onListingHover`), that card stacks above neighbours in horizontal/vertical strips. */
  hoveredListingId?: string | null
  /** Desktop /map sidebar: `'outer'` lets the **column** scroll (filters + listings); `'inner'` keeps listing cards in their own scrollbar. */
  listScrollMode?: 'inner' | 'outer'
  /**
   * Vertical layout only (`orientation="vertical"`). `'scroll'` = full scrolling list (default).
   * `'pager'` = one listing card + prev/next (e.g. mobile map bottom sheet).
   */
  verticalBrowseMode?: 'scroll' | 'pager'
  /** Tighter card chrome (image + copy + CTAs) — e.g. mobile map bottom sheet to keep map visible. */
  cardDensity?: 'default' | 'compact'
  /** When false, listing cards omit View details / On map (e.g. mobile map + open listings sheet — CTAs live on the pin popup). */
  showListingCardActions?: boolean
}

/**
 * Horizontal listing cards synced with map markers; previous/next step through (no visible scrollbar).
 */
export default function ExploreMapListingStrip({
  listings,
  selectedId,
  onSelect,
  onViewDetails,
  onViewOnMap,
  title = 'Browse along the map',
  autoScrollToSelected = true,
  listingScrollRequest = 0,
  layout = 'panel',
  orientation = 'horizontal',
  headerExtra,
  onListingHover,
  hoveredListingId = null,
  listScrollMode = 'inner',
  verticalBrowseMode = 'scroll',
  cardDensity = 'default',
  showListingCardActions = true,
}: ExploreMapListingStripProps) {
  const theme = useTheme()
  const isCompact = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true })
  const scrollRef = useRef<HTMLDivElement>(null)
  const arrowsRaf = useRef(0)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const updateScrollArrows = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    if (orientation === 'vertical') {
      setCanPrev(false)
      setCanNext(false)
      return
    }
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanPrev(scrollLeft > SCROLL_EDGE_EPS)
    setCanNext(scrollLeft < scrollWidth - clientWidth - SCROLL_EDGE_EPS)
  }, [orientation])

  const scheduleScrollArrowsUpdate = useCallback(() => {
    if (arrowsRaf.current) return
    arrowsRaf.current = window.requestAnimationFrame(() => {
      arrowsRaf.current = 0
      updateScrollArrows()
    })
  }, [updateScrollArrows])

  const listingsScrollOuterParent =
    listScrollMode === 'outer' && orientation === 'vertical' && layout === 'panel'

  const useVerticalPager =
    orientation === 'vertical' && verticalBrowseMode === 'pager' && !listingsScrollOuterParent

  const compactCard = cardDensity === 'compact'

  const compactPagerChrome = useVerticalPager && layout === 'minimal'

  /** Phones / narrow viewports: drop the hero image so the map sheet stays text-first and shorter. */
  const showListingHeroImage = !isCompact

  /** Mobile map sheet: minimize vertical footprint so ₱ pins / markers stay visible. */
  const sheetExtraDense = compactPagerChrome && isCompact

  const pagerIdx = useMemo(() => {
    if (!listings.length) return 0
    if (!selectedId) return 0
    const i = listings.findIndex((l) => l.id === selectedId)
    return i >= 0 ? i : 0
  }, [listings, selectedId])

  useEffect(() => {
    if (!autoScrollToSelected || !selectedId || !scrollRef.current) return
    const el = scrollRef.current.querySelector(`[data-listing-id="${selectedId}"]`)
    el?.scrollIntoView({
      behavior: 'smooth',
      inline: orientation === 'vertical' ? 'nearest' : 'center',
      block: orientation === 'vertical' ? 'nearest' : 'nearest',
    })
  }, [selectedId, autoScrollToSelected, listingScrollRequest, orientation])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const raf = window.requestAnimationFrame(() => updateScrollArrows())
    el.addEventListener('scroll', scheduleScrollArrowsUpdate, { passive: true })
    const ro = new ResizeObserver(() => updateScrollArrows())
    ro.observe(el)
    return () => {
      window.cancelAnimationFrame(raf)
      if (arrowsRaf.current) cancelAnimationFrame(arrowsRaf.current)
      el.removeEventListener('scroll', scheduleScrollArrowsUpdate)
      ro.disconnect()
    }
  }, [listings, updateScrollArrows, scheduleScrollArrowsUpdate])

  const scrollByStep = (dir: -1 | 1) => {
    const el = scrollRef.current
    if (!el || orientation === 'vertical') return
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
    const stripHovered = hoveredListingId === l.id
    return (
      <Card
        key={l.id}
        data-listing-id={l.id}
        elevation={0}
        onClick={() => onSelect(l.id)}
        onMouseEnter={() => onListingHover?.(l.id)}
        onMouseLeave={() => onListingHover?.(null)}
        sx={{
          flex: '0 0 auto',
          position: 'relative',
          /** Stacked carousel / vertical list — hovered card overlaps siblings. */
          zIndex: stripHovered ? 5 : selected ? 2 : 1,
          width: orientation === 'vertical' ? '100%' : { xs: 'min(280px, 82vw)', sm: 248 },
          maxWidth: orientation === 'vertical' ? '100%' : undefined,
          scrollSnapAlign: orientation === 'vertical' ? ('start' as const) : 'start',
          borderRadius: sheetExtraDense ? 1.5 : compactCard ? 2 : 2.5,
          border: '1px solid',
          borderColor: selected ? 'primary.main' : 'divider',
          bgcolor: selected ? (t) => alpha(t.palette.primary.main, 0.06) : 'background.paper',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
          boxShadow: stripHovered
            ? (t) => `0 10px 32px ${alpha(t.palette.common.black, 0.14)}`
            : selected
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
        {showListingHeroImage ? (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: compactCard ? ('2.2 / 1' as const) : ('16 / 10' as const),
            maxHeight: compactCard ? { xs: 104, sm: 112 } : undefined,
            flexShrink: 0,
            bgcolor: 'grey.100',
            overflow: 'hidden',
            borderRadius: compactCard ? '6px' : '8px',
          }}
        >
          <VehicleHeroImage
            src={l.vehicle.thumbnailUrl}
            vehicleType={l.vehicle.vehicleType}
            bodySegment={l.vehicle.bodySegment}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: compactCard ? '6px' : '8px',
            }}
          />
        </Box>
        ) : null}
        <CardContent
          sx={{
            p: sheetExtraDense ? 0.625 : compactCard ? 1 : 1.5,
            pt:
              sheetExtraDense
                ? 0.7
                : isCompact
                  ? compactCard
                    ? 1
                    : 1.25
                  : compactCard
                    ? 0.875
                    : 1.25,
            /** In vertical pager mode the card sits in a flex shell; omit flex-grow so the card hugs content (no hollow band under CTAs). */
            ...(useVerticalPager
              ? { flex: 'none', flexGrow: 0, minHeight: 0 }
              : { flex: 1, minHeight: 0, flexGrow: 1 }),
            display: 'flex',
            flexDirection: 'column',
            gap: sheetExtraDense ? 0.28 : compactCard ? 0.4 : 0.75,
            boxSizing: 'border-box',
            '&:last-child': {
              pb: sheetExtraDense ? 0.65 : compactCard ? (useVerticalPager ? 0.875 : 1) : 1.5,
            },
          }}
        >
          <Stack
            direction="row"
            alignItems="flex-start"
            spacing={0.35}
            sx={{ minHeight: compactCard ? 0 : { xs: 0, sm: 40 } }}
          >
            <LocationOnOutlined sx={{ fontSize: sheetExtraDense ? 12 : compactCard ? 14 : 16, color: 'text.secondary', mt: 0.1, flexShrink: 0 }} />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontSize: sheetExtraDense ? '0.64rem' : compactCard ? '0.7rem' : undefined,
                lineHeight: sheetExtraDense ? 1.2 : 1.35,
                display: '-webkit-box',
                WebkitLineClamp: compactCard ? 1 : 2,
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
              fontSize: sheetExtraDense ? '0.75rem' : compactCard ? '0.8rem' : undefined,
              lineHeight: sheetExtraDense ? 1.2 : 1.3,
              display: '-webkit-box',
              WebkitLineClamp: sheetExtraDense ? 1 : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: compactCard ? 0 : { xs: 0, sm: 40 },
            }}
          >
            {l.vehicle.displayName}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.35} sx={{ flexWrap: 'wrap', my: sheetExtraDense ? -0.1 : 0 }}>
            <StarRounded sx={{ fontSize: sheetExtraDense ? 12 : compactCard ? 14 : 16, color: 'warning.main' }} />
            <Typography
              variant="caption"
              fontWeight={800}
              sx={{
                lineHeight: 1.15,
                fontSize: sheetExtraDense ? '0.625rem' : compactCard ? '0.7rem' : undefined,
              }}
            >
              {l.vehicle.rating.toFixed(1)}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                lineHeight: 1.15,
                fontSize: sheetExtraDense ? '0.625rem' : compactCard ? '0.7rem' : undefined,
              }}
            >
              ({l.vehicle.reviewCount} reviews)
            </Typography>
          </Stack>
          <Typography
            variant={compactCard ? 'subtitle1' : 'h6'}
            component="div"
            color="primary.main"
            fontWeight={800}
            sx={{
              letterSpacing: '-0.02em',
              lineHeight: sheetExtraDense ? 1.15 : 1.25,
              fontSize: sheetExtraDense ? '0.875rem' : compactCard ? '1rem' : '1.2rem',
              mt: sheetExtraDense ? 0 : undefined,
            }}
          >
            {formatPeso(l.vehicle.pricePerDay)}
            <Typography
              component="span"
              variant="body2"
              color="text.secondary"
              fontWeight={600}
              sx={{
                ml: 0.5,
                fontSize: sheetExtraDense ? '0.62rem' : compactCard ? '0.76rem' : '0.84rem',
                letterSpacing: '0',
              }}
            >
              / day
            </Typography>
          </Typography>
          {showListingCardActions ? (
          <Stack
            direction={compactCard && compactPagerChrome ? 'row' : 'column'}
            spacing={compactCard ? (compactPagerChrome ? (sheetExtraDense ? 0.65 : 1) : 0.65) : 1}
            sx={{
              mt: sheetExtraDense ? 0.38 : compactCard ? 0.65 : 1.25,
              width: '100%',
              alignItems: compactCard && compactPagerChrome ? 'stretch' : undefined,
            }}
          >
            <Button
              fullWidth={!(compactCard && compactPagerChrome)}
              size="small"
              variant="contained"
              color="primary"
              onClick={(e) => {
                e.stopPropagation()
                onViewDetails(l)
              }}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 1.35,
                py: sheetExtraDense ? 0.34 : compactCard ? 0.5 : 0.85,
                fontSize: sheetExtraDense ? '0.7rem' : compactCard ? '0.78rem' : undefined,
                minHeight: sheetExtraDense ? 27 : compactCard ? 32 : undefined,
                lineHeight: sheetExtraDense ? 1.1 : undefined,
                boxShadow: (t) => `0 1px 4px ${alpha(t.palette.primary.main, 0.35)}`,
                ...(compactCard && compactPagerChrome
                  ? { flex: '1 1 auto', minWidth: 0 }
                  : {}),
              }}
            >
              View details
            </Button>
            {onViewOnMap ? (
              <Button
                fullWidth={!(compactCard && compactPagerChrome)}
                size="small"
                variant="outlined"
                color="primary"
                aria-label="View on map"
                startIcon={sheetExtraDense ? undefined : <MapOutlined sx={{ fontSize: compactCard ? 15 : 18 }} />}
                onClick={(e) => {
                  e.stopPropagation()
                  onViewOnMap(l)
                }}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 1.35,
                  py: sheetExtraDense ? 0.34 : compactCard ? 0.45 : 0.5,
                  fontSize: sheetExtraDense ? '0.68rem' : compactCard ? '0.74rem' : undefined,
                  minHeight: sheetExtraDense ? 27 : compactCard ? 32 : undefined,
                  px: compactCard && compactPagerChrome ? (sheetExtraDense ? 0.65 : 0.75) : undefined,
                  whiteSpace: 'nowrap',
                  borderWidth: '1px',
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                  borderColor: (t) => alpha(t.palette.primary.main, 0.35),
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                    borderColor: 'primary.main',
                  },
                  ...(compactCard && compactPagerChrome
                    ? {
                        flex: sheetExtraDense ? '0 1 41%' : '0 1 42%',
                        minWidth: 0,
                      }
                    : {}),
                }}
              >
                {sheetExtraDense ? 'Map' : 'On map'}
              </Button>
            ) : null}
          </Stack>
          ) : null}
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

  const verticalScrollSx = {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    overflowY: 'auto',
    overflowX: 'hidden',
    py: 0.5,
    scrollSnapType: 'y mandatory' as const,
    WebkitOverflowScrolling: 'touch' as const,
    overscrollBehaviorY: 'contain' as const,
    scrollbarWidth: 'thin' as const,
    scrollbarGutter: 'stable',
  }

  const carousel =
    orientation === 'vertical' ? (
      useVerticalPager ? (
        <Stack
          spacing={sheetExtraDense ? 0.45 : compactCard ? 0.75 : 1.25}
          sx={{
            flex: compactPagerChrome ? '0 1 auto' : 1,
            minHeight: 0,
            width: '100%',
            justifyContent: 'flex-start',
          }}
        >
          <ExploreMapPopupCityPrevNextRow
            canPrev={pagerIdx > 0}
            canNext={pagerIdx < listings.length - 1}
            positionLabel={`${pagerIdx + 1} / ${listings.length}`}
            onPrev={() => onSelect(listings[pagerIdx - 1]!.id)}
            onNext={() => onSelect(listings[pagerIdx + 1]!.id)}
            sx={
              compactCard
                ? sheetExtraDense
                  ? {
                      '& > div:first-of-type': {
                        py: 0.16,
                        px: 0.25,
                        gap: 0.35,
                        borderRadius: 1.35,
                      },
                      '& .MuiIconButton-root': {
                        width: 30,
                        height: 30,
                        p: 0,
                        '& svg': { fontSize: 17 },
                      },
                      '& .MuiTypography-caption': {
                        fontSize: '0.64rem',
                        py: 0,
                        lineHeight: 1.2,
                      },
                      width: '100%',
                      mt: 0,
                    }
                  : {
                      '& > div:first-of-type': {
                        py: 0.35,
                        px: 0.35,
                        gap: 0.65,
                        borderRadius: 1.75,
                      },
                      '& .MuiIconButton-root': {
                        width: 38,
                        height: 38,
                        '& svg': { fontSize: 22 },
                      },
                      '& .MuiTypography-caption': { fontSize: '0.72rem', py: 0 },
                    }
                : undefined
            }
          />
          <Box
            sx={{
              flex: compactPagerChrome ? '0 0 auto' : 1,
              minHeight: 0,
              overflow: compactPagerChrome ? 'visible' : 'hidden',
              px: layout === 'panel' ? { xs: 1, sm: 1.5 } : 0,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
            }}
          >
            {cards[pagerIdx]}
          </Box>
        </Stack>
      ) : listingsScrollOuterParent ? (
        <Box
          ref={scrollRef}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            py: 0.5,
            px: layout === 'panel' ? { xs: 1, sm: 1.5 } : 0,
            pb: layout === 'panel' ? { xs: 1.5, sm: 2 } : 0.5,
            width: '100%',
          }}
        >
          {cards}
        </Box>
      ) : (
        <Box
          sx={{
            position: 'relative',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Box
            ref={scrollRef}
            sx={{
              ...verticalScrollSx,
              px: layout === 'panel' ? { xs: 1, sm: 1.5 } : 0,
              pb: layout === 'panel' ? { xs: 1.5, sm: 2 } : 0.5,
              pt: layout === 'panel' ? 0 : 0,
            }}
          >
            {cards}
          </Box>
          {layout === 'panel' ? (
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 48,
                pointerEvents: 'none',
                background: (t) =>
                  `linear-gradient(to top, ${t.palette.background.paper} 12%, ${alpha(t.palette.background.paper, 0)})`,
              }}
            />
          ) : null}
        </Box>
      )
    ) : isCompact ? (
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
      <Box
        sx={
          orientation === 'vertical'
            ? compactPagerChrome
              ? {
                  flex: '0 1 auto',
                  width: '100%',
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  alignSelf: 'flex-start',
                }
              : { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
            : undefined
        }
      >
        {title ? (
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, flexShrink: 0 }}>
            {title}
          </Typography>
        ) : null}
        {carousel}
      </Box>
    )
  }

  const panelPaperSx: SxProps<Theme> =
    orientation === 'vertical'
      ? listingsScrollOuterParent
        ? {
            borderRadius: 3,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            overflow: 'hidden',
            boxShadow: `0 2px 12px ${alpha('#000', 0.04)}`,
            flex: 'none',
            width: '100%',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }
        : {
            borderRadius: 3,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            overflow: 'hidden',
            boxShadow: `0 2px 12px ${alpha('#000', 0.04)}`,
            flex: '1 1 0%',
            minHeight: 0,
            height: '100%',
            width: '100%',
            alignSelf: 'stretch',
            display: 'flex',
            flexDirection: 'column',
          }
      : {
          borderRadius: 3,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          overflow: 'hidden',
          boxShadow: `0 2px 12px ${alpha('#000', 0.04)}`,
        }

  return (
    <Paper elevation={0} variant="outlined" sx={panelPaperSx}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        useFlexGap
        gap={1}
        sx={{
          px: { xs: 1.75, sm: 2 },
          pt: { xs: 1.75, sm: 2 },
          pb: { xs: 1, sm: 1 },
          flexShrink: 0,
        }}
      >
        <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
          {title}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" sx={{ justifyContent: 'flex-end', gap: 1 }}>
          {headerExtra}
          <Chip
            size="small"
            color="primary"
            variant="outlined"
            label={`${listings.length} ${listings.length === 1 ? 'listing' : 'listings'}`}
            sx={{ fontWeight: 700 }}
          />
        </Stack>
      </Stack>
      {orientation === 'vertical' ? (
        carousel
      ) : (
        <Box sx={{ px: { xs: 1, sm: 1.5 }, pb: { xs: 1.5, sm: 2 }, pt: 0, overflow: 'hidden' }}>{carousel}</Box>
      )}
    </Paper>
  )
}
