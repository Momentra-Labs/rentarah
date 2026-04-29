import { Box, useTheme } from '@mui/material'
import { useCallback, useLayoutEffect, useState } from 'react'

import { ONBOARDING_TOUR_SELECTORS } from './onboardingTourTargets'
import ProductTourTooltip from './ProductTourTooltip'

const TOUR_COPY = [
  {
    title: 'Search & dates',
    description: 'Set where you’re going and your trip dates — we’ll match you with available cars and motorcycles.',
  },
  {
    title: 'Listings',
    description: 'Browse cards for photos, specs, and host info — tap through to book when you’re ready.',
  },
  {
    title: 'Start here',
    description:
      'Use the trip planner or scroll to explore — search and categories are also in the sidebar.',
  },
] as const

const DIM = 'rgba(15, 23, 42, 0.52)'

type Hole = { left: number; top: number; width: number; height: number }

function TourDimmerPanels({ hole, zIndex, onDimClick }: { hole: Hole; zIndex: number; onDimClick: () => void }) {
  const { left, top, width, height } = hole
  const bottom = top + height

  return (
    <>
      {/* Top */}
      <Box
        role="presentation"
        aria-hidden
        onClick={onDimClick}
        sx={{ position: 'fixed', left: 0, top: 0, width: '100%', height: Math.max(0, top), bgcolor: DIM, zIndex }}
      />
      {/* Left */}
      <Box
        role="presentation"
        aria-hidden
        onClick={onDimClick}
        sx={{
          position: 'fixed',
          left: 0,
          top,
          width: Math.max(0, left),
          height: Math.max(0, height),
          bgcolor: DIM,
          zIndex,
        }}
      />
      {/* Right */}
      <Box
        role="presentation"
        aria-hidden
        onClick={onDimClick}
        sx={{
          position: 'fixed',
          left: left + width,
          top,
          right: 0,
          height: Math.max(0, height),
          bgcolor: DIM,
          zIndex,
        }}
      />
      {/* Bottom */}
      <Box
        role="presentation"
        aria-hidden
        onClick={onDimClick}
        sx={{
          position: 'fixed',
          left: 0,
          top: bottom,
          right: 0,
          bottom: 0,
          bgcolor: DIM,
          zIndex,
        }}
      />
    </>
  )
}

type ProductTourProps = {
  open: boolean
  dontShowAgain: boolean
  onDontShowAgainChange: (v: boolean) => void
  onComplete: () => void
  onSkip: () => void
}

/**
 * Dims only the area *outside* the highlight so the target stays sharp (no full-screen backdrop blur).
 */
export default function ProductTour({ open, dontShowAgain, onDontShowAgainChange, onComplete, onSkip }: ProductTourProps) {
  const theme = useTheme()
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)

  const selector = ONBOARDING_TOUR_SELECTORS[step] ?? ONBOARDING_TOUR_SELECTORS[0]

  const measure = useCallback(() => {
    if (!open) return
    const el = document.querySelector(selector)
    if (!el || !(el instanceof HTMLElement)) {
      setRect(null)
      return
    }
    el.scrollIntoView({ block: 'center', behavior: 'auto' })
    setRect(el.getBoundingClientRect())
  }, [open, selector])

  useLayoutEffect(() => {
    if (!open) return
    measure()
    const onResize = () => measure()
    const onScroll = () => measure()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, true)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => measure()) : null
    const el = document.querySelector(selector)
    if (el instanceof HTMLElement && ro) ro.observe(el)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll, true)
      ro?.disconnect()
    }
  }, [open, selector, measure])

  useLayoutEffect(() => {
    if (open) setStep(0)
  }, [open])

  if (!open) return null

  const pad = 10
  const hole: Hole | null = rect
    ? {
        left: rect.left - pad,
        top: rect.top - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null

  const handleNext = () => {
    if (step >= TOUR_COPY.length - 1) {
      onComplete()
      return
    }
    setStep((s) => s + 1)
  }

  const zDim = theme.zIndex.modal
  const zTooltip = theme.zIndex.modal + 2

  return (
    <>
      {hole && hole.width > 4 && hole.height > 4 ? (
        <TourDimmerPanels hole={hole} zIndex={zDim} onDimClick={onSkip} />
      ) : (
        <Box
          role="presentation"
          aria-hidden
          onClick={onSkip}
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: zDim,
            bgcolor: DIM,
          }}
        />
      )}
      <ProductTourTooltip
        title={TOUR_COPY[step].title}
        description={TOUR_COPY[step].description}
        stepIndex={step}
        stepCount={TOUR_COPY.length}
        dontShowAgain={dontShowAgain}
        onDontShowAgainChange={onDontShowAgainChange}
        onNext={handleNext}
        onSkip={onSkip}
        isLast={step === TOUR_COPY.length - 1}
        anchorRect={rect}
        zIndex={zTooltip}
      />
    </>
  )
}
