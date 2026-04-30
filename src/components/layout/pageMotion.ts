/**
 * Outlet crossfade uses opacity-only — translating the full page fights sticky layers &
 * backdrop-heavy chrome on mobile GPUs.
 */
export const pageMotionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

/** Short opacity crossfade — avoids “wait” stacking with exits that block the incoming page. */
export const pageMotionTransition = { duration: 0.12, ease: 'easeOut' as const }
