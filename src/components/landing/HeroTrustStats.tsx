import { Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { animate, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'

/** Hero trust-strip figures (marketing copy — animated tally on landing load). */
export const HERO_TRUST_SPECS = [
  { key: 'fleet', subtitle: 'vehicles listed', mode: 'int' as const, target: 2400, suffix: '+' },
  { key: 'renters', subtitle: 'happy renters', mode: 'percent' as const, target: 98 },
  { key: 'fees', subtitle: 'hidden fees', mode: 'peso' as const, target: 0 },
] as const

export type HeroTrustSpec = (typeof HERO_TRUST_SPECS)[number]

const nf = new Intl.NumberFormat('en-US')

function formatDisplay(spec: HeroTrustSpec, n: number): string {
  switch (spec.mode) {
    case 'int':
      return `${nf.format(Math.round(n))}${spec.suffix}`
    case 'percent':
      return `${Math.round(n)}%`
    case 'peso':
      return `₱${nf.format(Math.round(n))}`
    default:
      return ''
  }
}

function useAnimatedTrustFigure(spec: HeroTrustSpec, index: number): string {
  const reduceMotion = useReducedMotion()
  const [display, setDisplay] = useState<number>(() => (reduceMotion ? spec.target : 0))

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(spec.target)
      return
    }

    const delayMs = 180 + index * 140

    let controls: ReturnType<typeof animate> | undefined
    const timeoutId = window.setTimeout(() => {
      controls = animate(0, spec.target, {
        duration: spec.mode === 'peso' && spec.target === 0 ? 0.55 : 1.35,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (latest) => setDisplay(latest),
      })
    }, delayMs)

    return () => {
      window.clearTimeout(timeoutId)
      controls?.stop()
    }
  }, [index, reduceMotion, spec.mode, spec.target])

  return formatDisplay(spec, display)
}

const figureTypographySx = {
  display: 'block',
  fontWeight: 900,
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 1.15,
  fontSize: { xs: '1.05rem', sm: '1.2rem', md: '1.25rem' },
  letterSpacing: '-0.03em',
  color: 'text.primary',
} satisfies SxProps<Theme>

const subtitleSx = {
  display: 'block',
  mt: 0.5,
  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
  lineHeight: 1.45,
  fontWeight: 600,
} satisfies SxProps<Theme>

type HeroTrustStatCellProps = {
  spec: HeroTrustSpec
  index: number
}

export function HeroTrustStatCell({ spec, index }: HeroTrustStatCellProps) {
  const reduceMotion = useReducedMotion()
  const text = useAnimatedTrustFigure(spec, index)

  return (
    <>
      <motion.span
        style={{ display: 'block' }}
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reduceMotion ? 0 : 0.5,
          delay: reduceMotion ? 0 : 0.12 + index * 0.1,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <Typography component="span" variant="h6" sx={figureTypographySx}>
          {text}
        </Typography>
      </motion.span>
      <Typography component="span" variant="body2" color="text.secondary" sx={subtitleSx}>
        {spec.subtitle}
      </Typography>
    </>
  )
}
