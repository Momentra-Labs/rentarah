/**
 * Desktop: opacity-only — vertical motion reads like an accidental scroll on wide layouts.
 * Mobile (`pageMotionVariantsNative`): light slide-up + fade reads closer to native stacks.
 */
export const pageMotionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const pageMotionVariantsNative = {
  initial: { opacity: 0.85, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
}

/** Short opacity crossfade — avoids “wait” stacking with exits that block the incoming page. */
export const pageMotionTransition = { duration: 0.12, ease: 'easeOut' as const }

export const pageMotionTransitionNative = { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const }
