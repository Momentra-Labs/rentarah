/** Shared Framer Motion config for route-level transitions. */
export const pageMotionVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export const pageMotionTransition = { duration: 0.25, ease: 'easeOut' as const }
