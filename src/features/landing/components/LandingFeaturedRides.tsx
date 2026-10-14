import ArrowForward from '@mui/icons-material/ArrowForward'
import ChevronLeft from '@mui/icons-material/ChevronLeft'
import ChevronRight from '@mui/icons-material/ChevronRight'
import { Box, Button, Chip, Container, IconButton, Skeleton, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

import CarCard from '@/components/common/CarCard'
import { useT } from '@/hooks/useT'
import { useVehicles } from '@/hooks/useVehicles'
import { rhRadius } from '@/theme/tokens'
import type { Car, VehicleType } from '@/types'

const MAX_PICKS = 8
const EDGE_EPSILON = 4

type RideFilter = 'all' | 'car' | 'motorcycle' | 'scooter'

const FILTERS: { key: RideFilter; labelKey: 'landing.featuredAll' | 'landing.featuredCars' | 'landing.featuredMotorcycles' | 'landing.featuredScooters'; types: VehicleType[] | null }[] = [
  { key: 'all', labelKey: 'landing.featuredAll', types: null },
  { key: 'car', labelKey: 'landing.featuredCars', types: ['car'] },
  { key: 'motorcycle', labelKey: 'landing.featuredMotorcycles', types: ['motorcycle', 'bigbike'] },
  { key: 'scooter', labelKey: 'landing.featuredScooters', types: ['scooter'] },
]

/** Search URL for “See all” — keeps the chosen category so the user lands on matching results. */
function seeAllHref(filter: RideFilter): string {
  return filter === 'all' || filter === 'motorcycle' ? '/search' : `/search?vt=${filter}`
}

const byRating = (a: Car, b: Car) => b.rating - a.rating || b.reviewCount - a.reviewCount

/** “All” interleaves four- and two-wheelers so both audiences see themselves in the first row. */
function pickFeatured(cars: Car[], filter: RideFilter): Car[] {
  const available = cars.filter((c) => c.available)
  const pool = available.length >= 3 ? available : cars
  const types = FILTERS.find((f) => f.key === filter)?.types
  if (types) return pool.filter((c) => types.includes(c.vehicleType)).sort(byRating).slice(0, MAX_PICKS)

  const fourWheel = pool.filter((c) => c.vehicleType === 'car').sort(byRating)
  const twoWheel = pool.filter((c) => c.vehicleType !== 'car').sort(byRating)
  const out: Car[] = []
  for (let i = 0; out.length < MAX_PICKS && (i < fourWheel.length || i < twoWheel.length); i++) {
    if (fourWheel[i]) out.push(fourWheel[i])
    if (twoWheel[i] && out.length < MAX_PICKS) out.push(twoWheel[i])
  }
  return out
}

export type LandingFeaturedRidesProps = {
  sectionPy: { xs: number; sm: number; md: number }
  headingMb: { xs: number; md: number }
  gutters: { xs: number; sm: number }
}

/** Homepage rail of real listings — lets visitors see inventory and prices before committing to a search. */
export default function LandingFeaturedRides({ sectionPy, headingMb, gutters }: LandingFeaturedRidesProps) {
  const t = useT()
  const navigate = useNavigate()
  const { data: cars, isLoading, isError } = useVehicles()
  const [filter, setFilter] = useState<RideFilter>('all')
  const trackRef = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ atStart: true, atEnd: true })

  const counts = useMemo(() => {
    const out = {} as Record<RideFilter, number>
    for (const f of FILTERS) out[f.key] = f.types ? cars.filter((c) => f.types!.includes(c.vehicleType)).length : cars.length
    return out
  }, [cars])
  const visibleFilters = FILTERS.filter((f) => f.key === 'all' || counts[f.key] > 0)
  const featured = useMemo(() => pickFeatured(cars, filter), [cars, filter])

  const updateEdges = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const atStart = el.scrollLeft <= EDGE_EPSILON
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - EDGE_EPSILON
    setEdges((prev) => (prev.atStart === atStart && prev.atEnd === atEnd ? prev : { atStart, atEnd }))
  }, [])

  // A new category starts from its first card.
  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0 })
  }, [filter])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    updateEdges()
    const ro = new ResizeObserver(updateEdges)
    ro.observe(el)
    return () => ro.disconnect()
  }, [featured.length, updateEdges])

  const scrollByPage = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const slide = el.querySelector<HTMLElement>('[data-ride-slide]')
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0
    const step = slide ? slide.offsetWidth + gap : el.clientWidth
    // Advance by whole cards so the next row lands snapped, never half-cut (+gap: the last card has none after it).
    const perPage = Math.max(1, Math.floor((el.clientWidth + gap + 1) / step))
    el.scrollBy({ left: dir * step * perPage, behavior: 'smooth' })
  }

  if (isError || (!isLoading && cars.length === 0)) return null

  const openListing = (car: Car) => navigate(`/cars/${car.id}`)
  const showSkeleton = isLoading && featured.length === 0
  const canScroll = !(edges.atStart && edges.atEnd)

  const fadeMask = (() => {
    if (!canScroll) return 'none'
    const left = edges.atStart ? 'black 0' : 'transparent 0, black 40px'
    const right = edges.atEnd ? 'black 100%' : 'black calc(100% - 56px), transparent 100%'
    return `linear-gradient(to right, ${left}, ${right})`
  })()

  const arrowSx = {
    width: 40,
    height: 40,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.paper',
    color: 'text.primary',
    transition: 'background-color 160ms ease, border-color 160ms ease',
    '&:hover': { bgcolor: (th: import('@mui/material').Theme) => alpha(th.palette.primary.main, 0.06), borderColor: 'primary.main' },
    '&.Mui-disabled': { opacity: 0.4 },
  } as const

  return (
    <Box component="section" aria-labelledby="landing-featured-heading" sx={{ py: sectionPy }}>
      <Container maxWidth="lg" sx={{ px: gutters }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'flex-end' }}
          justifyContent="space-between"
          spacing={{ xs: 1.5, md: 3 }}
          sx={{ mb: { xs: 2, md: 2.5 } }}
        >
          <Stack spacing={0.75} sx={{ minWidth: 0 }}>
            <Typography
              variant="overline"
              sx={{ fontWeight: 800, letterSpacing: '0.14em', fontSize: '0.6875rem', color: 'primary.main', lineHeight: 1.2 }}
            >
              {t('landing.featuredEyebrow')}
            </Typography>
            <Typography
              id="landing-featured-heading"
              component="h2"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.035em',
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' },
                lineHeight: 1.12,
                color: 'text.primary',
                textWrap: 'balance',
              }}
            >
              {t('landing.featuredTitle')}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontWeight: 500, lineHeight: 1.55, fontSize: { xs: '0.9375rem', sm: '1rem' }, maxWidth: '40em' }}
            >
              {t('landing.featuredSub')}
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent={{ sm: 'flex-end' }}
            sx={{ display: { xs: 'none', sm: 'flex' }, flexShrink: 0 }}
          >
            <Button
              component={RouterLink}
              to={seeAllHref(filter)}
              endIcon={<ArrowForward />}
              sx={{ fontWeight: 700, borderRadius: `${rhRadius.md}px`, whiteSpace: 'nowrap', mr: 0.5 }}
            >
              {t('landing.seeAll')}
            </Button>
            <IconButton aria-label={t('landing.prevRides')} onClick={() => scrollByPage(-1)} disabled={edges.atStart} sx={arrowSx}>
              <ChevronLeft />
            </IconButton>
            <IconButton aria-label={t('landing.nextRides')} onClick={() => scrollByPage(1)} disabled={edges.atEnd} sx={arrowSx}>
              <ChevronRight />
            </IconButton>
          </Stack>
        </Stack>

        {visibleFilters.length > 2 ? (
          <Stack
            direction="row"
            spacing={1}
            role="group"
            aria-label={t('landing.featuredFilterAria')}
            sx={{
              mb: headingMb,
              overflowX: 'auto',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
              mx: { xs: -2, sm: 0 },
              px: { xs: 2, sm: 0 },
            }}
          >
            {visibleFilters.map((f) => {
              const selected = filter === f.key
              return (
                <Chip
                  key={f.key}
                  clickable
                  aria-pressed={selected}
                  onClick={() => setFilter(f.key)}
                  label={
                    <>
                      {t(f.labelKey)}
                      <Box component="span" sx={{ ml: 0.75, opacity: selected ? 0.8 : 0.6, fontWeight: 600 }}>
                        {counts[f.key]}
                      </Box>
                    </>
                  }
                  sx={{
                    flexShrink: 0,
                    height: 36,
                    px: 0.5,
                    borderRadius: `${rhRadius.pill}px`,
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    border: '1px solid',
                    borderColor: selected ? 'text.primary' : 'divider',
                    bgcolor: selected ? 'text.primary' : 'background.paper',
                    color: selected ? 'background.paper' : 'text.primary',
                    '&:hover': { bgcolor: selected ? 'text.primary' : (th) => alpha(th.palette.text.primary, 0.05) },
                    '&.MuiChip-clickable:active': { boxShadow: 'none' },
                  }}
                />
              )
            })}
          </Stack>
        ) : (
          <Box sx={{ mb: headingMb }} />
        )}

        <Box
          ref={trackRef}
          role="list"
          aria-labelledby="landing-featured-heading"
          onScroll={updateEdges}
          sx={{
            display: 'grid',
            gridAutoFlow: 'column',
            gridAutoColumns: {
              xs: '78%',
              sm: 'calc((100% - 20px) / 2)',
              md: 'calc((100% - 40px) / 3)',
              xl: 'calc((100% - 60px) / 4)',
            },
            columnGap: '20px',
            overflowX: 'auto',
            overscrollBehaviorX: 'contain',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            WebkitMaskImage: fadeMask,
            maskImage: fadeMask,
            // Room for the card hover shadow so it isn't clipped by the scroller.
            py: 1,
            my: -1,
          }}
        >
          {showSkeleton
            ? [0, 1, 2, 3].map((i) => (
                <Box key={i} role="listitem" data-ride-slide sx={{ scrollSnapAlign: 'start' }}>
                  <Skeleton variant="rounded" height={240} sx={{ borderRadius: `${rhRadius.lg}px` }} />
                  <Skeleton width="70%" sx={{ mt: 1.5 }} />
                  <Skeleton width="45%" />
                  <Skeleton width="30%" />
                </Box>
              ))
            : featured.map((car) => (
                <Box key={car.id} role="listitem" data-ride-slide sx={{ scrollSnapAlign: 'start', minWidth: 0 }}>
                  <CarCard car={car} onNavigate={openListing} showTypeBadge={filter === 'all'} />
                </Box>
              ))}
        </Box>

        <Button
          component={RouterLink}
          to={seeAllHref(filter)}
          variant="outlined"
          color="inherit"
          fullWidth
          endIcon={<ArrowForward />}
          sx={{
            display: { xs: 'flex', sm: 'none' },
            mt: 2.5,
            minHeight: 48,
            fontWeight: 700,
            borderRadius: `${rhRadius.md}px`,
            borderColor: 'divider',
          }}
        >
          {t('landing.seeAll')}
        </Button>
      </Container>
    </Box>
  )
}
