import BrokenImageOutlined from '@mui/icons-material/BrokenImageOutlined'
import ChevronLeft from '@mui/icons-material/ChevronLeft'
import ChevronRight from '@mui/icons-material/ChevronRight'
import Close from '@mui/icons-material/Close'
import Favorite from '@mui/icons-material/Favorite'
import FavoriteBorder from '@mui/icons-material/FavoriteBorder'
import GridViewOutlined from '@mui/icons-material/GridViewOutlined'
import { Box, Button, Dialog, IconButton, Stack, Typography } from '@mui/material'
import { alpha, type Theme } from '@mui/material/styles'
import { useCallback, useEffect, useRef, useState, type MouseEvent, type TouchEvent } from 'react'

import { useT } from '@/hooks/useT'
import { rhElev, rhRadius } from '@/theme/tokens'

export type ListingPhotoGalleryProps = {
  images: string[]
  alt: string
  contain: boolean
  unavailable?: boolean
  saved: boolean
  onToggleSaved: () => void
  variant: 'mobile' | 'desktop'
}

const SAVE_BTN_SX = {
  width: 36,
  height: 36,
  bgcolor: (th: Theme) => alpha(th.palette.common.white, 0.92),
  boxShadow: '0 1px 6px rgba(15,23,42,0.16)',
  '&:hover': { bgcolor: 'common.white' },
}

function PhotoFallback({ label }: { label: string }) {
  return (
    <Box
      role="img"
      aria-label={label}
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.200',
        color: 'grey.500',
      }}
    >
      <BrokenImageOutlined sx={{ fontSize: 44 }} aria-hidden />
    </Box>
  )
}

function PhotoImg({
  src,
  alt,
  contain,
  failed,
  onError,
  onClick,
  sx,
}: {
  src: string
  alt: string
  contain: boolean
  failed: boolean
  onError: () => void
  onClick?: () => void
  sx?: object
}) {
  if (!src || failed) return <PhotoFallback label={alt} />
  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      onError={onError}
      onClick={onClick}
      sx={{
        width: '100%',
        height: '100%',
        objectFit: contain ? 'contain' : 'cover',
        display: 'block',
        cursor: onClick ? 'pointer' : 'default',
        bgcolor: contain ? 'grey.100' : 'grey.200',
        ...sx,
      }}
    />
  )
}

export default function ListingPhotoGallery({
  images,
  alt,
  contain,
  unavailable = false,
  saved,
  onToggleSaved,
  variant,
}: ListingPhotoGalleryProps) {
  const t = useT()
  const [index, setIndex] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [failed, setFailed] = useState<Record<number, boolean>>({})
  const touchStartX = useRef<number | null>(null)
  const didSwipe = useRef(false)
  const count = images.length
  const multi = count > 1
  const safeIndex = count === 0 ? 0 : ((index % count) + count) % count

  const markFailed = useCallback((i: number) => {
    setFailed((prev) => (prev[i] ? prev : { ...prev, [i]: true }))
  }, [])

  const step = useCallback(
    (delta: number) => {
      if (count < 2) return
      setIndex((i) => (i + delta + count) % count)
    },
    [count],
  )

  const openAt = (i: number) => {
    setIndex(i)
    setLightbox(true)
  }

  useEffect(() => {
    if (!lightbox || count < 2) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        step(-1)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        step(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, count, step])

  useEffect(() => {
    if (!lightbox) return
    document.getElementById(`listing-photo-thumb-${safeIndex}`)?.scrollIntoView?.({
      inline: 'center',
      block: 'nearest',
      behavior: 'smooth',
    })
  }, [lightbox, safeIndex])

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null
    didSwipe.current = false
  }

  const onTouchEnd = (e: TouchEvent, openOnTap: boolean) => {
    if (touchStartX.current == null) return
    const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current
    touchStartX.current = null
    if (dx > 40) {
      didSwipe.current = true
      step(-1)
    } else if (dx < -40) {
      didSwipe.current = true
      step(1)
    } else if (openOnTap && !didSwipe.current && Math.abs(dx) < 12) {
      openAt(safeIndex)
    }
  }

  const stopSave = (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onToggleSaved()
  }

  const saveButton = (
    <IconButton
      size="small"
      aria-label={saved ? t('detail.unsaveListing') : t('detail.saveListing')}
      onClick={stopSave}
      onMouseDown={(e) => e.stopPropagation()}
      sx={{ ...SAVE_BTN_SX, position: 'absolute', top: 10, right: 10, zIndex: 2 }}
    >
      {saved ? <Favorite color="error" fontSize="small" /> : <FavoriteBorder fontSize="small" />}
    </IconButton>
  )

  const unavailableChip = unavailable ? (
    <Box
      sx={{
        position: 'absolute',
        left: 12,
        top: 12,
        zIndex: 2,
        px: 1,
        py: 0.35,
        borderRadius: 999,
        bgcolor: alpha('#0f172a', 0.72),
        color: 'common.white',
        fontSize: '0.6875rem',
        fontWeight: 700,
        letterSpacing: '0.01em',
      }}
    >
      {t('detail.unavailable')}
    </Box>
  ) : null

  const filmstrip = multi ? (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        px: 2,
        pb: { xs: 2, md: 1.75 },
        pt: 1,
        overflowX: 'auto',
        bgcolor: '#0b1220',
      }}
      role="list"
      aria-label={t('detail.gallery')}
    >
      {images.map((src, i) => (
        <Box key={`${src}-${i}`} role="listitem" sx={{ flexShrink: 0, width: 88, height: 60 }}>
          <Box
            id={`listing-photo-thumb-${i}`}
            component="button"
            type="button"
            aria-label={t('detail.photoAria', { current: i + 1, total: count })}
            aria-current={i === safeIndex ? 'true' : undefined}
            onClick={() => setIndex(i)}
            sx={{
              p: 0,
              width: '100%',
              height: '100%',
              borderRadius: 1.5,
              overflow: 'hidden',
              cursor: 'pointer',
              display: 'block',
              border: i === safeIndex ? '2px solid' : '1px solid',
              borderColor: i === safeIndex ? 'primary.light' : alpha('#fff', 0.2),
              opacity: i === safeIndex ? 1 : 0.7,
              bgcolor: contain ? 'grey.800' : 'transparent',
              '&:hover': { opacity: 1 },
              '&:focus-visible': { boxShadow: 'var(--rh-focus-ring)', outline: 'none' },
            }}
          >
            <PhotoImg
              src={src}
              alt=""
              contain={contain}
              failed={Boolean(failed[i])}
              onError={() => markFailed(i)}
            />
          </Box>
        </Box>
      ))}
    </Stack>
  ) : null

  const lightboxUi = (
    <Dialog
      open={lightbox}
      onClose={() => setLightbox(false)}
      fullScreen={variant === 'mobile'}
      maxWidth="lg"
      fullWidth
      aria-label={t('detail.gallery')}
      PaperProps={{
        sx: {
          bgcolor: '#0b1220',
          backgroundImage: 'none',
          m: { md: 2 },
          height: { md: 'min(92vh, 880px)' },
          maxHeight: { md: '92vh' },
          borderRadius: { xs: 0, md: `${rhRadius.lg}px` },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          flex: 1,
          minHeight: { xs: 0, md: 420 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#0b1220',
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={(e) => onTouchEnd(e, false)}
      >
        <IconButton
          aria-label={t('detail.closeGallery')}
          onClick={() => setLightbox(false)}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 2,
            color: 'common.white',
            bgcolor: alpha('#fff', 0.12),
            '&:hover': { bgcolor: alpha('#fff', 0.22) },
          }}
        >
          <Close />
        </IconButton>
        {multi ? (
          <>
            <IconButton
              aria-label={t('detail.photoPrev')}
              onClick={() => step(-1)}
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 2,
                color: 'common.white',
                bgcolor: alpha('#fff', 0.14),
                '&:hover': { bgcolor: alpha('#fff', 0.24) },
              }}
            >
              <ChevronLeft />
            </IconButton>
            <IconButton
              aria-label={t('detail.photoNext')}
              onClick={() => step(1)}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 2,
                color: 'common.white',
                bgcolor: alpha('#fff', 0.14),
                '&:hover': { bgcolor: alpha('#fff', 0.24) },
              }}
            >
              <ChevronRight />
            </IconButton>
          </>
        ) : null}
        <Box sx={{ width: '100%', height: '100%', p: { xs: 0, md: 6 } }}>
          <PhotoImg
            src={images[safeIndex] ?? ''}
            alt={t('detail.photoAria', { current: safeIndex + 1, total: Math.max(count, 1) })}
            contain
            failed={Boolean(failed[safeIndex])}
            onError={() => markFailed(safeIndex)}
            sx={{ objectFit: 'contain', bgcolor: 'transparent' }}
          />
        </Box>
        {multi ? (
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              bottom: 12,
              left: 0,
              right: 0,
              textAlign: 'center',
              color: 'common.white',
              fontWeight: 700,
            }}
          >
            {t('detail.photoOf', { current: safeIndex + 1, total: count })}
          </Typography>
        ) : null}
      </Box>
      {filmstrip}
    </Dialog>
  )

  const showAllButton =
    count > 1 ? (
      <Button
        size="small"
        variant="contained"
        color="inherit"
        startIcon={<GridViewOutlined sx={{ fontSize: 18 }} />}
        onClick={() => openAt(0)}
        sx={{
          position: 'absolute',
          right: 12,
          bottom: 12,
          zIndex: 2,
          bgcolor: 'common.white',
          color: 'text.primary',
          fontWeight: 700,
          textTransform: 'none',
          borderRadius: 2,
          boxShadow: rhElev.elev1,
          '&:hover': { bgcolor: 'grey.100' },
        }}
      >
        {t('detail.showAllPhotos', { count })}
      </Button>
    ) : null

  const desktopThumbs =
    count > 5 ? (
      <Stack
        direction="row"
        spacing={1}
        sx={{ mt: 1.5, overflowX: 'auto', pb: 0.5 }}
        role="list"
        aria-label={t('detail.gallery')}
      >
        {images.map((src, i) => (
          <Box key={`${src}-desk-${i}`} role="listitem" sx={{ flexShrink: 0, width: 96, height: 64 }}>
            <Box
              component="button"
              type="button"
              aria-label={t('detail.photoAria', { current: i + 1, total: count })}
              onClick={() => openAt(i)}
              sx={{
                p: 0,
                width: '100%',
                height: '100%',
                borderRadius: 2,
                overflow: 'hidden',
                cursor: 'pointer',
                display: 'block',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: contain ? 'grey.100' : 'transparent',
                '&:hover': { borderColor: 'primary.main' },
                '&:focus-visible': { boxShadow: 'var(--rh-focus-ring)', outline: 'none' },
              }}
            >
              <PhotoImg
                src={src}
                alt=""
                contain={contain}
                failed={Boolean(failed[i])}
                onError={() => markFailed(i)}
              />
            </Box>
          </Box>
        ))}
      </Stack>
    ) : null

  const mosaicTile = (i: number, extraSx: object = {}, showMoreOverlay = false) => (
    <Box key={i} sx={{ position: 'relative', minHeight: 0, overflow: 'hidden', ...extraSx }}>
      <PhotoImg
        src={images[i] ?? ''}
        alt={i === 0 ? alt : ''}
        contain={contain}
        failed={Boolean(failed[i])}
        onError={() => markFailed(i)}
        onClick={() => openAt(i)}
      />
      {showMoreOverlay && count > 5 ? (
        <Box
          component="button"
          type="button"
          aria-label={t('detail.morePhotos', { count: count - 5 })}
          onClick={() => openAt(5)}
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha('#0f172a', 0.45),
            color: 'common.white',
            fontWeight: 800,
            cursor: 'pointer',
            fontSize: '1.05rem',
            letterSpacing: '0.02em',
            border: 0,
            '&:focus-visible': { boxShadow: 'var(--rh-focus-ring)', outline: 'none' },
          }}
        >
          +{count - 5}
        </Box>
      ) : null}
    </Box>
  )

  if (variant === 'mobile') {
    return (
      <Box>
        <Box
          sx={{ position: 'relative', bgcolor: contain ? 'grey.100' : 'grey.200' }}
          onTouchStart={onTouchStart}
          onTouchEnd={(e) => onTouchEnd(e, true)}
        >
          <Box sx={{ height: { xs: 280, sm: 340 }, overflow: 'hidden' }}>
            <PhotoImg
              src={images[safeIndex] ?? ''}
              alt={alt}
              contain={contain}
              failed={Boolean(failed[safeIndex])}
              onError={() => markFailed(safeIndex)}
              onClick={() => {
                if (didSwipe.current) return
                openAt(safeIndex)
              }}
            />
          </Box>
          {unavailableChip}
          {saveButton}
          {multi ? (
            <Box
              sx={{
                position: 'absolute',
                right: 12,
                bottom: 12,
                zIndex: 2,
                px: 1,
                py: 0.35,
                borderRadius: 999,
                bgcolor: alpha('#0f172a', 0.72),
                color: 'common.white',
                fontSize: '0.75rem',
                fontWeight: 700,
                backdropFilter: 'blur(6px)',
              }}
            >
              {t('detail.photoOf', { current: safeIndex + 1, total: count })}
            </Box>
          ) : null}
        </Box>
        {multi ? (
          <Stack
            direction="row"
            spacing={0.75}
            justifyContent="center"
            sx={{ py: 1.25 }}
            role="tablist"
            aria-label={t('detail.gallery')}
          >
            {images.map((_, i) => (
              <Box
                key={i}
                component="button"
                type="button"
                role="tab"
                aria-label={t('detail.photoAria', { current: i + 1, total: count })}
                aria-selected={i === safeIndex}
                onClick={() => setIndex(i)}
                sx={{
                  width: i === safeIndex ? 16 : 6,
                  height: 6,
                  p: 0,
                  border: 0,
                  borderRadius: 999,
                  cursor: 'pointer',
                  bgcolor: i === safeIndex ? 'primary.main' : 'action.disabled',
                  transition: 'width 0.15s ease, background-color 0.15s ease',
                  '&:focus-visible': { boxShadow: 'var(--rh-focus-ring)', outline: 'none' },
                }}
              />
            ))}
          </Stack>
        ) : null}
        {lightboxUi}
      </Box>
    )
  }

  let mosaic = null
  if (count >= 5) {
    mosaic = (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          height: 480,
          gap: '6px',
        }}
      >
        {mosaicTile(0, { gridRow: '1 / 3' })}
        {mosaicTile(1)}
        {mosaicTile(2)}
        {mosaicTile(3)}
        {mosaicTile(4, {}, count > 5)}
      </Box>
    )
  } else if (count === 4) {
    mosaic = (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          height: 480,
          gap: '6px',
        }}
      >
        {mosaicTile(0)}
        {mosaicTile(1)}
        {mosaicTile(2)}
        {mosaicTile(3)}
      </Box>
    )
  } else if (count === 3) {
    mosaic = (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1.55fr 1fr',
          gridTemplateRows: '1fr 1fr',
          height: 460,
          gap: '6px',
        }}
      >
        {mosaicTile(0, { gridRow: '1 / 3' })}
        {mosaicTile(1)}
        {mosaicTile(2)}
      </Box>
    )
  } else if (count === 2) {
    mosaic = (
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: 420, gap: '6px' }}>
        {mosaicTile(0)}
        {mosaicTile(1)}
      </Box>
    )
  } else {
    mosaic = (
      <Box sx={{ height: 460 }}>
        {mosaicTile(0)}
      </Box>
    )
  }

  return (
    <Box>
      <Box
        sx={{
          position: 'relative',
          borderRadius: `${rhRadius.lg}px`,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: contain ? 'grey.100' : 'grey.200',
        }}
      >
        {mosaic}
        {unavailableChip}
        {saveButton}
        {showAllButton}
      </Box>
      {desktopThumbs}
      {lightboxUi}
    </Box>
  )
}
