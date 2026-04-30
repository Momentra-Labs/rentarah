import MapOutlined from '@mui/icons-material/MapOutlined'
import ViewListRounded from '@mui/icons-material/ViewListRounded'
import {
  alpha,
  Box,
  IconButton,
  Link,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  type SvgIconProps,
} from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { ComponentType, PropsWithChildren, ReactElement, ReactNode } from 'react'
import { Children, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'

type LandingListingCarouselProps = {
  children: ReactNode
  trackSx?: SxProps<Theme>
  showNavigation?: boolean
}

const SCROLL_EDGE_EPSILON = 2

const ICON_SIZE = 22
const ICON_STROKE = 2.35

/** Glass circular — floated on carousel sides (xs+; hover-reveal only on md+ fine pointer). */
function carouselFloaterSx(theme: Theme, placement: 'left' | 'right'): SxProps<Theme> {
  const isLight = theme.palette.mode === 'light'

  const glassBg = isLight ? alpha(theme.palette.common.white, 0.58) : alpha(theme.palette.grey[100], 0.12)

  const glassBorder = isLight ? alpha(theme.palette.common.white, 0.82) : alpha(theme.palette.common.white, 0.12)

  const ink = isLight ? alpha(theme.palette.grey[900], 0.88) : alpha(theme.palette.common.white, 0.92)

  return {
    pointerEvents: 'auto',
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: theme.zIndex.fab + 2,
    ...(placement === 'left'
      ? {
          left: {
            xs: theme.spacing(0.25),
            sm: theme.spacing(0.5),
            md: theme.spacing(-1),
            lg: theme.spacing(-1.25),
          },
        }
      : {
          right: {
            xs: theme.spacing(0.25),
            sm: theme.spacing(0.5),
            md: theme.spacing(-1),
            lg: theme.spacing(-1.25),
          },
        }),
    top: '50%',
    transform: 'translateY(-50%)',
    width: 48,
    height: 48,
    padding: 0,
    borderRadius: '50%',
    color: ink,
    bgcolor: glassBg,
    border: `1px solid ${glassBorder}`,
    backdropFilter: 'blur(18px) saturate(170%)',
    WebkitBackdropFilter: 'blur(18px) saturate(170%)',
    boxShadow: isLight
      ? `${`0 2px 4px ${alpha(theme.palette.common.black, 0.06)}`}, ${`0 14px 40px ${alpha(theme.palette.common.black, 0.16)}`}`
      : `${`0 2px 8px ${alpha(theme.palette.common.black, 0.45)}`}, ${`0 12px 32px ${alpha(theme.palette.common.black, 0.35)}`}`,
    transition: 'opacity 0.22s ease, transform 0.22s cubic-bezier(0.33, 1, 0.68, 1), box-shadow 0.22s ease, background-color 0.2s ease',
    '&:hover:not(:disabled)': {
      transform: 'translateY(-50%) scale(1.08)',
      boxShadow: isLight
        ? `${`0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`}, ${`0 20px 48px ${alpha(theme.palette.common.black, 0.2)}`}`
        : `${`0 6px 20px ${alpha(theme.palette.common.black, 0.55)}`}, ${`0 16px 44px ${alpha(theme.palette.common.black, 0.45)}`}`,
      bgcolor: isLight ? alpha(theme.palette.common.white, 0.9) : alpha(theme.palette.grey[100], 0.22),
    },
    '&:active:not(:disabled)': {
      transform: 'translateY(-50%) scale(1.02)',
    },
    '&.Mui-disabled': {
      opacity: 0.32,
      borderColor: alpha(theme.palette.divider, 0.45),
      color: alpha(theme.palette.text.disabled, isLight ? 0.95 : 0.85),
      bgcolor: isLight ? alpha(theme.palette.common.white, 0.45) : alpha(theme.palette.grey[900], 0.35),
    },
    '&:focus-visible': {
      outline: `2px solid ${alpha(theme.palette.primary.main, 0.75)}`,
      outlineOffset: 3,
    },
  }
}

export function LandingListingCarousel({
  children,
  trackSx,
  showNavigation = true,
}: LandingListingCarouselProps) {
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))
  const trackRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const [needsScroll, setNeedsScroll] = useState(false)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const overflow = scrollWidth - clientWidth
    const needs = overflow > SCROLL_EDGE_EPSILON
    setNeedsScroll(needs)
    if (!needs) {
      setAtStart(true)
      setAtEnd(true)
      return
    }
    setAtStart(scrollLeft <= SCROLL_EDGE_EPSILON)
    setAtEnd(scrollLeft + clientWidth >= scrollWidth - SCROLL_EDGE_EPSILON)
  }, [])

  useLayoutEffect(() => {
    updateScrollState()
  }, [children, updateScrollState])

  useEffect(() => {
    const el = trackRef.current
    if (!el || typeof ResizeObserver === 'undefined') return

    let frame = 0
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => updateScrollState())
    })
    ro.observe(el)
    for (const c of Array.from(el.querySelectorAll<HTMLElement>('[data-rentara-carousel-slide]'))) {
      ro.observe(c)
    }
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
    }
  }, [children, updateScrollState])

  const scrollBySlides = useCallback((direction: 1 | -1) => {
    const container = trackRef.current
    if (!container) return
    const firstItem = container.querySelector<HTMLElement>('[data-rentara-carousel-slide]')
    const gapParsed = Number.parseFloat(getComputedStyle(container).columnGap || '0')
    const rowGapParsed = Number.parseFloat(getComputedStyle(container).gap || '0')
    const gap = Number.isFinite(gapParsed) && gapParsed > 0 ? gapParsed : Number.isFinite(rowGapParsed) ? rowGapParsed : 16

    const stepApprox = Math.max(
      Math.round(container.clientWidth * (isMdUp ? 0.72 : 0.92)),
      (firstItem?.getBoundingClientRect().width ?? 280) + gap,
    )
    container.scrollBy({ left: direction * stepApprox, behavior: 'smooth' })
    window.setTimeout(updateScrollState, 320)
  }, [isMdUp, updateScrollState])

  const handleKeyDownTrack = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        scrollBySlides(-1)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        scrollBySlides(1)
      }
    },
    [scrollBySlides],
  )

  const carouselRowSxBase: SxProps<Theme> = {
    display: 'flex',
    flexDirection: 'row',
    gap: { xs: 1.75, md: 2 },
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollSnapType: 'x mandatory',
    WebkitOverflowScrolling: 'touch',
    scrollBehavior: 'smooth',
    /** Scrollbar hidden globally — drag, arrows, and keyboard remain. */
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    py: { xs: 0.25, md: 0.5 },
    px: { xs: 0, md: 3 },
    outline: 'none',
    '&:focus-visible': {
      outline: `2px solid ${alpha(theme.palette.primary.main, 0.65)}`,
      outlineOffset: 2,
    },
    '&::-webkit-scrollbar': {
      display: 'none',
      width: 0,
      height: 0,
    },
  }

  const sectionShellSx: SxProps<Theme> = useMemo(() => {
    const floaterTransitions = '.22s ease'
    const baseFloaterOpacity = () => ({
      '& .rentara-carousel-floater': {
        transition: `opacity ${floaterTransitions}, transform 0.22s cubic-bezier(0.33, 1, 0.68, 1), box-shadow ${floaterTransitions}`,
      },
    })

    /** md+ fine pointer: hide floaters until hover/focus-within; touch/small screens keep them visible */
    const finePointerReveal = needsScroll && showNavigation && isMdUp

    return {
      position: 'relative',
      width: '100%',
      minWidth: 0,
      overflow: 'visible',
      mx: { xs: 0, md: -3 },
      ...(baseFloaterOpacity() as object),

      ...(finePointerReveal
        ? {
            '@media (hover: hover) and (pointer: fine)': {
              '& .rentara-carousel-floater': {
                opacity: 0,
                pointerEvents: 'none',
              },
              '&:hover .rentara-carousel-floater, &:focus-within .rentara-carousel-floater': {
                opacity: 1,
                pointerEvents: 'auto',
              },
            },
          }
        : {}),
    }
  }, [needsScroll, showNavigation, isMdUp])

  const childCount = Children.count(children)

  const sxLeft = carouselFloaterSx(theme, 'left')
  const sxRight = carouselFloaterSx(theme, 'right')

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <Box sx={sectionShellSx}>
        <Box
          id={listId}
          ref={trackRef}
          role="region"
          aria-label={
            isMdUp
              ? 'Listing carousel · hover edges for arrows or use keyboard'
              : 'Listing carousel · use side arrows or swipe for more listings'
          }
          tabIndex={0}
          onScroll={updateScrollState}
          onKeyDown={handleKeyDownTrack}
          sx={[carouselRowSxBase, ...(trackSx ? (Array.isArray(trackSx) ? trackSx : [trackSx]) : [])]}
        >
          {children}
        </Box>

        {showNavigation && needsScroll ? (
          <>
            <Tooltip title="Previous listings" arrow enterTouchDelay={isMdUp ? 400 : 200}>
              <span>
                <IconButton
                  type="button"
                  className="rentara-carousel-floater"
                  aria-controls={listId}
                  aria-label="Show previous listings"
                  disabled={atStart}
                  onClick={() => scrollBySlides(-1)}
                  sx={sxLeft}
                >
                  <ChevronLeft
                    aria-hidden
                    size={ICON_SIZE}
                    strokeWidth={ICON_STROKE}
                    style={{ pointerEvents: 'none' }}
                  />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Next listings" arrow enterTouchDelay={isMdUp ? 400 : 200}>
              <span>
                <IconButton
                  type="button"
                  className="rentara-carousel-floater"
                  aria-controls={listId}
                  aria-label="Show more listings"
                  disabled={atEnd}
                  onClick={() => scrollBySlides(1)}
                  sx={sxRight}
                >
                  <ChevronRight
                    aria-hidden
                    size={ICON_SIZE}
                    strokeWidth={ICON_STROKE}
                    style={{ pointerEvents: 'none' }}
                  />
                </IconButton>
              </span>
            </Tooltip>
          </>
        ) : null}
      </Box>

      {showNavigation && needsScroll ? (
        <Box
          sx={{
            mx: { xs: 0, md: -3 },
            px: { xs: 0, md: 3 },
            mt: { xs: 1.25, md: 1.75 },
            pb: { xs: 0, md: 0 },
          }}
        >
          <Typography
            component="span"
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              px: { xs: 0, md: 0 },
              py: { xs: 0, md: 0 },
              mb: { xs: 0.25, md: 0.35 },
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontSize: { xs: '0.625rem', sm: '0.6875rem' },
              color: 'text.secondary',
              userSelect: 'none',
            }}
          >
            {childCount > 1
              ? `${childCount} listings · swipe or use side arrows`
              : 'Swipe or use side arrows'}
          </Typography>
          {isMdUp ? (
            <Typography
              component="span"
              variant="caption"
              sx={{
                mt: 0,
                display: 'block',
                textAlign: 'center',
                fontWeight: 500,
                letterSpacing: '0.055em',
                fontSize: { xs: '0.583rem', sm: '0.61rem' },
                color: 'text.secondary',
                opacity: 0.85,
                userSelect: 'none',
              }}
            >
              Hover this row to show arrow buttons
            </Typography>
          ) : null}
        </Box>
      ) : showNavigation ? (
        <Box sx={{ mx: { xs: 0, md: -3 }, px: { xs: 0, md: 3 }, mt: { xs: 1.25, md: 1 }, pb: { xs: 0, md: 0 }, pt: 0 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontSize: '0.6875rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontWeight: 600,
              textAlign: 'center',
              display: 'block',
            }}
          >
            All {childCount} listing{childCount === 1 ? '' : 's'} visible in this view
          </Typography>
        </Box>
      ) : null}
    </Box>
  )
}

export function LandingCarouselSlide({ children }: PropsWithChildren<object>) {
  return (
    <Box
      data-rentara-carousel-slide
      sx={{
        flex: {
          xs: '0 0 min(292px, 88%)',
          sm: '0 0 min(304px, 46%)',
          md: '0 0 clamp(296px, 30vw, 360px)',
        },
        minWidth: 0,
        scrollSnapAlign: 'start',
      }}
    >
      {children}
    </Box>
  )
}

export type LandingExploreListingHintProps = {
  listHref: string
  variant?: 'default' | 'motorcycles'
}

const exploreHintLinkSx: SxProps<Theme> = {
  whiteSpace: 'nowrap',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.35,
  fontWeight: 600,
}

function ExploreHintIcon({ Icon }: { Icon: ComponentType<SvgIconProps> }): ReactElement {
  return <Icon sx={{ fontSize: { xs: 16, md: 17 }, opacity: 0.92 }} aria-hidden />
}

export function LandingExploreListingHint({ listHref, variant = 'default' }: LandingExploreListingHintProps): ReactElement {
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))

  /** Shared map + listing links embedded in prose */
  const mapExploreLink = (
    <Link component={RouterLink} to="/map" underline="hover" sx={exploreHintLinkSx}>
      <ExploreHintIcon Icon={MapOutlined} />
      map
    </Link>
  )
  const searchLinkDefault = (
    <Link component={RouterLink} to={listHref} underline="hover" sx={exploreHintLinkSx}>
      <ExploreHintIcon Icon={ViewListRounded} />
      search
    </Link>
  )
  const listLinkMoto = (
    <Link component={RouterLink} to={listHref} underline="hover" sx={exploreHintLinkSx}>
      <ExploreHintIcon Icon={ViewListRounded} />
      motorcycle list
    </Link>
  )

  const bodyTypographySx = {
    fontSize: { xs: '0.8125rem', sm: '0.875rem', md: '0.9375rem' },
    lineHeight: 1.68,
    color: 'text.secondary',
    maxWidth: { xs: 340, sm: 480, md: 720 },
    mx: 'auto',
  }

  const unifiedMobileSentence = (
    <>
      Beyond these highlights, browse rentals on the {mapExploreLink} — nearby pickups at a glance — or open{' '}
      {searchLinkDefault} for the full marketplace.
    </>
  )

  if (variant === 'motorcycles') {
    const motorcycleSearchLink = (
      <Link component={RouterLink} to={listHref} underline="hover" sx={exploreHintLinkSx}>
        <ExploreHintIcon Icon={ViewListRounded} />
        search
      </Link>
    )
    const unifiedMobileSentenceMoto = (
      <>
        Beyond these highlights, browse rentals on the {mapExploreLink} — nearby pickups at a glance — or open{' '}
        {motorcycleSearchLink} for the full marketplace.
      </>
    )

    const desktop = (
      <>
        Beyond this row — compare live motorcycles on the {mapExploreLink}, or open the filtered {listLinkMoto}.
      </>
    )

    return (
      <Box component="aside" sx={{ mt: { xs: 1.125, sm: 1.35, md: 2 }, px: 0 }}>
        {isMdUp ? (
          <Typography variant="body2" sx={{ ...bodyTypographySx, textAlign: 'center', letterSpacing: { md: '0.01em' } }}>
            {desktop}
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ ...bodyTypographySx, textAlign: 'center', letterSpacing: '0.01em' }}>
            {unifiedMobileSentenceMoto}
          </Typography>
        )}
      </Box>
    )
  }

  const defaultDesktop = (
    <>
      Beyond these highlights, browse rentals on the {mapExploreLink} — nearby pickups at a glance — or open{' '}
      {searchLinkDefault} for the full marketplace.
    </>
  )

  return (
    <Box component="aside" sx={{ mt: { xs: 1.125, sm: 1.35, md: 2 }, px: 0 }}>
      {isMdUp ? (
        <Typography variant="body2" sx={{ ...bodyTypographySx, textAlign: 'center', letterSpacing: { md: '0.008em' } }}>
          {defaultDesktop}
        </Typography>
      ) : (
        <Typography variant="body2" sx={{ ...bodyTypographySx, textAlign: 'center', letterSpacing: '0.01em' }}>
          {unifiedMobileSentence}
        </Typography>
      )}
    </Box>
  )
}
