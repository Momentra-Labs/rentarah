import Star from '@mui/icons-material/Star'
import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'

import { useT } from '@/hooks/useT'
import { useCarsStore } from '@/store/useCarsStore'

const THUMBS = 4
const THUMB_PX = 40

/**
 * Hero social proof drawn from the live catalog — real photos, real count, real average rating —
 * so the claim always matches what “See all” shows.
 */
export default function HeroProofRow() {
  const t = useT()
  const cars = useCarsStore((s) => s.cars)

  const { thumbs, count, avgRating } = useMemo(() => {
    const listed = cars.filter((c) => c.available !== false)
    const rated = listed.filter((c) => c.reviewCount > 0 && Number.isFinite(c.rating))
    const avg = rated.length ? rated.reduce((sum, c) => sum + c.rating, 0) / rated.length : null
    // Distinct photos, mixing cars and bikes, so the stack previews the range.
    const seen = new Set<string>()
    const picks: { id: string; src: string }[] = []
    const ordered = [...rated].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    const fourWheel = ordered.filter((c) => c.vehicleType === 'car')
    const twoWheel = ordered.filter((c) => c.vehicleType !== 'car')
    for (let i = 0; picks.length < THUMBS && (i < fourWheel.length || i < twoWheel.length); i++) {
      for (const c of [fourWheel[i], twoWheel[i]]) {
        const src = c?.images[0]
        if (!c || !src || seen.has(src) || picks.length >= THUMBS) continue
        seen.add(src)
        picks.push({ id: c.id, src })
      }
    }
    return { thumbs: picks, count: listed.length, avgRating: avg }
  }, [cars])

  if (count === 0) {
    return <Skeleton variant="rounded" width={280} height={THUMB_PX} sx={{ borderRadius: 999 }} />
  }

  return (
    <Stack direction="row" alignItems="center" spacing={{ xs: 1.25, sm: 1.5 }} sx={{ minWidth: 0 }}>
      <Stack direction="row" sx={{ flexShrink: 0, pl: 1 }} aria-hidden>
        {thumbs.map((thumb, i) => (
          <Box
            key={thumb.id}
            component="img"
            src={thumb.src.replace(/w=\d+/, 'w=120').replace(/h=\d+/, 'h=120')}
            alt=""
            loading="lazy"
            sx={{
              width: { xs: 34, sm: THUMB_PX },
              height: { xs: 34, sm: THUMB_PX },
              ml: -1,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid',
              borderColor: 'background.default',
              bgcolor: 'grey.200',
              position: 'relative',
              zIndex: THUMBS - i,
            }}
          />
        ))}
      </Stack>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '0.9375rem', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
          {t('landing.proofCount', { count })}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary' }}>
          {avgRating != null ? (
            <>
              <Star sx={{ fontSize: 15, color: '#F5A524' }} aria-hidden />
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.8125rem' }}>
                {avgRating.toFixed(1)}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                {t('landing.proofRating')}
              </Typography>
              <Box component="span" aria-hidden sx={{ px: 0.25 }}>
                ·
              </Box>
            </>
          ) : null}
          <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
            {t('landing.proofFees')}
          </Typography>
        </Stack>
      </Box>
    </Stack>
  )
}
