import { Box, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion, useReducedMotion } from 'framer-motion'

const easeMirror = {
  duration: 26,
  repeat: Infinity,
  repeatType: 'mirror' as const,
  ease: 'easeInOut' as const,
}

/**
 * Soft hero backdrop: fewer layers than before (blur + Framer cost on low-end GPUs).
 * Respects prefers-reduced-motion (static fallback).
 */
export default function HeroAmbientBackground() {
  const theme = useTheme()
  const reduceMotion = useReducedMotion()
  const p = theme.palette.primary.main

  if (reduceMotion) {
    return (
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0,
          background: `radial-gradient(ellipse 120% 80% at 20% 10%, ${alpha(p, 0.1)} 0%, transparent 50%),
            radial-gradient(ellipse 90% 70% at 90% 75%, ${alpha(p, 0.06)} 0%, transparent 45%)`,
        }}
      />
    )
  }

  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        contain: 'strict',
      }}
    >
      <motion.div
        style={{
          position: 'absolute',
          inset: '-15%',
          background: `radial-gradient(ellipse 85% 65% at 25% 15%, ${alpha(p, 0.14)} 0%, transparent 52%),
            radial-gradient(ellipse 75% 55% at 88% 72%, ${alpha(p, 0.08)} 0%, transparent 48%)`,
        }}
        initial={false}
        animate={{ opacity: [0.78, 1, 0.78], scale: [1, 1.03, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        style={{
          position: 'absolute',
          top: '8%',
          left: '-10%',
          width: 'min(400px, 55vw)',
          height: 'min(400px, 55vw)',
          borderRadius: '50%',
          background: alpha(p, 0.15),
          filter: 'blur(52px)',
        }}
        animate={{ x: [0, 32, -12, 0], y: [0, 18, 24, 0] }}
        transition={{ ...easeMirror, duration: 28 }}
      />
      <motion.div
        style={{
          position: 'absolute',
          bottom: '-6%',
          right: '-4%',
          width: 'min(340px, 48vw)',
          height: 'min(340px, 48vw)',
          borderRadius: '50%',
          background: alpha(p, 0.1),
          filter: 'blur(48px)',
        }}
        animate={{ x: [0, -24, 12, 0], y: [0, -18, -26, 0] }}
        transition={{ ...easeMirror, duration: 32 }}
      />
    </Box>
  )
}
