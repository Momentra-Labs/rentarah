import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { isOnboardingDone, markOnboardingDone } from '../../constants/onboardingStorage'
import { useGeolocationStore } from '../../store/useGeolocationStore'
import { useOnboardingUiStore } from '../../store/useOnboardingUiStore'
import OnboardingModal from './OnboardingModal'
import type { OnboardingModalStep } from './OnboardingModal'
import ProductTour from './ProductTour'

type FlowPhase = 'modal' | 'tour' | 'off'

/**
 * First-time onboarding: welcome → feature slides → optional landing-only tour.
 * Skippable everywhere; persisted with `rentarah_onboarding_done`.
 */
export default function OnboardingFlow() {
  const { pathname } = useLocation()
  const [phase, setPhase] = useState<FlowPhase>(() =>
    typeof window !== 'undefined' && !isOnboardingDone() ? 'modal' : 'off',
  )
  const [modalStep, setModalStep] = useState<OnboardingModalStep>('welcome')
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const setSuppressGeoDialog = useOnboardingUiStore((s) => s.setSuppressGeoDialog)
  const closeGeoDialog = useGeolocationStore((s) => s.closeGeoDialog)

  /** Keep suppress in sync; never clear suppress in cleanup (that briefly opened geo between modal → tour). */
  useEffect(() => {
    const active = phase === 'modal' || phase === 'tour'
    setSuppressGeoDialog(active)
    if (active) closeGeoDialog()
  }, [phase, setSuppressGeoDialog, closeGeoDialog])

  useEffect(() => {
    return () => setSuppressGeoDialog(false)
  }, [setSuppressGeoDialog])

  const skipAll = useCallback(() => {
    markOnboardingDone()
    setPhase('off')
  }, [])

  const handleFinishFeatures = useCallback(() => {
    if (pathname === '/') {
      setPhase('tour')
      return
    }
    markOnboardingDone()
    setPhase('off')
  }, [pathname])

  const scrollLandingToHero = useCallback(() => {
    if (pathname !== '/') return
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
    })
  }, [pathname])

  const handleTourComplete = useCallback(() => {
    markOnboardingDone()
    setPhase('off')
    scrollLandingToHero()
  }, [scrollLandingToHero])

  const handleTourSkip = useCallback(() => {
    markOnboardingDone()
    setPhase('off')
    scrollLandingToHero()
  }, [scrollLandingToHero])

  return (
    <>
      <OnboardingModal
        open={phase === 'modal'}
        step={modalStep}
        onStepChange={setModalStep}
        dontShowAgain={dontShowAgain}
        onDontShowAgainChange={setDontShowAgain}
        onSkip={skipAll}
        onFinishFeatures={handleFinishFeatures}
      />
      <ProductTour
        open={phase === 'tour'}
        dontShowAgain={dontShowAgain}
        onDontShowAgainChange={setDontShowAgain}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
      />
    </>
  )
}
