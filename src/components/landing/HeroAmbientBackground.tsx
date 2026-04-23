import { Box, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion, useReducedMotion } from 'framer-motion'

const easeMirror = {
  duration: 20,
  repeat: Infinity,
  repeatType: 'mirror' as const,
  ease: 'easeInOut' as const,
}

/**
 * Soft, non-interactive hero backdrop: slow drifting blurs + gentle gradient pulse.
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
      }}
    >
      {/* Breathing wash — ties into existing hero blues without overpowering content */}
      <motion.div
        style={{
          position: 'absolute',
          inset: '-15%',
          background: `radial-gradient(ellipse 85% 65% at 25% 15%, ${alpha(p, 0.16)} 0%, transparent 52%),
            radial-gradient(ellipse 75% 55% at 88% 72%, ${alpha(p, 0.09)} 0%, transparent 48%),
            radial-gradient(ellipse 55% 45% at 55% 95%, ${alpha(theme.palette.grey[500], 0.07)} 0%, transparent 42%)`,
        }}
        initial={false}
        animate={{ opacity: [0.72, 1, 0.72], scale: [1, 1.04, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Large drift blobs */}
      <motion.div
        style={{
          position: 'absolute',
          top: '6%',
          left: '-12%',
          width: 'min(440px, 58vw)',
          height: 'min(440px, 58vw)',
          borderRadius: '50%',
          background: alpha(p, 0.18),
          filter: 'blur(72px)',
        }}
        animate={{ x: [0, 36, -16, 0], y: [0, 22, 28, 0] }}
        transition={{ ...easeMirror, duration: 24 }}
      />
      <motion.div
        style={{
          position: 'absolute',
          bottom: '-8%',
          right: '-6%',
          width: 'min(380px, 50vw)',
          height: 'min(380px, 50vw)',
          borderRadius: '50%',
          background: alpha(p, 0.11),
          filter: 'blur(68px)',
        }}
        animate={{ x: [0, -28, 14, 0], y: [0, -20, -32, 0] }}
        transition={{ ...easeMirror, duration: 28 }}
      />
      <motion.div
        style={{
          position: 'absolute',
          top: '38%',
          right: '4%',
          width: 'min(280px, 38vw)',
          height: 'min(280px, 38vw)',
          borderRadius: '50%',
          background: alpha(theme.palette.grey[400], 0.12),
          filter: 'blur(56px)',
        }}
        animate={{ x: [0, -20, 24, 0], y: [0, 32, -18, 0] }}
        transition={{ ...easeMirror, duration: 21 }}
      />

      {/* Subtle sparkle dots — light motion, invites the eye without noise */}
      {[
        { top: '12%', left: '18%', delay: 0 },
        { top: '22%', left: '72%', delay: 1.2 },
        { top: '58%', left: '8%', delay: 2.1 },
        { top: '78%', left: '42%', delay: 0.6 },
        { top: '34%', left: '52%', delay: 1.8 },
      ].map((dot, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            top: dot.top,
            left: dot.left,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: alpha(p, 0.35),
            boxShadow: `0 0 12px ${alpha(p, 0.25)}`,
          }}
          animate={{ opacity: [0.25, 0.85, 0.25], scale: [0.85, 1.15, 0.85] }}
          transition={{
            duration: 5.5 + i * 0.4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: dot.delay,
          }}
        />
      ))}
    </Box>
  )
}
