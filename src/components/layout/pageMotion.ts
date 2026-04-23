/**
 * Route transitions use opacity only — vertical motion (translateY) made the main column
 * look like a small auto-scroll on load/reload because the whole outlet shifts on screen.
 */
export const pageMotionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const pageMotionTransition = { duration: 0.25, ease: 'easeOut' as const }
