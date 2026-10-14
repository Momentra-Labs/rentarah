import { Box, useTheme } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { keyframes } from '@emotion/react'
import { useId } from 'react'

import {
  ICON_GRADIENT_DARK,
  ICON_GRADIENT_LIGHT,
  ICON_LIFT,
  ICON_VIEWBOX,
  LOGO_VIEWBOX,
  WORDMARK_BODY_D,
  WORDMARK_H_D,
  WORDMARK_VIEWBOX,
} from './rentarahLogoData'

/**
 * RentaraH logo — the original pin + car + scooter icon redrawn as clean vector, and the original
 * wordmark traced from the old artwork (no font). Masters in `docs/brand/svg/`.
 * All artwork shares the original 2640×660 coordinate space.
 */

type Height = number | { xs: number; md: number }

const parse = (vb: string) => vb.split(' ').map(Number)
const aspect = (vb: string) => {
  const [, , w, h] = parse(vb)
  return w / h
}
const widthFor = (h: Height, vb: string): Height =>
  typeof h === 'number' ? h * aspect(vb) : { xs: h.xs * aspect(vb), md: h.md * aspect(vb) }

/** Map-pin drop: the icon hops and settles, like a pin landing on the map. */
const pinDrop = keyframes`
  0%   { transform: translateY(0); }
  35%  { transform: translateY(-48px); }
  65%  { transform: translateY(0); }
  82%  { transform: translateY(-14px); }
  100% { transform: translateY(0); }
`

/** Hover bounce on the logo itself or on the link that wraps it (navbar / sidebar / footer). */
const bounceSx: SxProps<Theme> = {
  '@media (hover: hover) and (prefers-reduced-motion: no-preference)': {
    '&:hover .rh-icon, .rentara-brand-lockup:hover & .rh-icon, a:hover > & .rh-icon': {
      animation: `${pinDrop} 640ms cubic-bezier(0.33, 1, 0.68, 1)`,
    },
  },
}

/** Pin, hook, car and scooter — 32-unit rounded strokes on the original's fitted geometry. */
function IconArt({ uid, paint }: { uid: string; paint: 'gradient' | 'current' }) {
  const theme = useTheme()
  const stops = theme.palette.mode === 'dark' ? ICON_GRADIENT_DARK : ICON_GRADIENT_LIGHT
  const fill = paint === 'gradient' ? `url(#${uid}-grad)` : 'currentColor'

  return (
    <g className="rh-icon">
      <defs>
        <linearGradient id={`${uid}-grad`} gradientUnits="userSpaceOnUse" x1="120" y1="40" x2="720" y2="600">
          <stop offset="0" stopColor={stops[0]} />
          <stop offset="0.55" stopColor={stops[1]} />
          <stop offset="1" stopColor={stops[2]} />
        </linearGradient>
        <mask id={`${uid}-cut`} maskUnits="userSpaceOnUse" x="0" y="0" width="900" height="660">
          <rect width="900" height="660" fill="#fff" />
          {/* Car interior: the pin outline passes behind the car body. */}
          <path
            d="M104 372 C130 362 160 345 236 300 C300 292 352 300 378 324 C392 338 396 352 398 368 L420 372 C400 410 372 440 336 455 L216 455 C205 425 150 418 135 440 L106 430 Z"
            fill="#000"
          />
        </mask>
      </defs>
      <g fill="none" stroke={fill} strokeWidth="32" strokeLinecap="round" strokeLinejoin="round">
        <path mask={`url(#${uid}-cut)`} d="M413.4 586 L259.8 327.6 A178.6 178.6 0 1 1 567 327.6 Z" />
        <path d="M327.6 252.4 A87.5 87.5 0 1 1 496 267.1 C481 309 458 345 437 372 C415 401 376 443 330 467" />
        <path d="M240 360 H516" />
        <path d="M236 290 C300 284 352 294 378 320 C390 333 394 346 395 360" />
        <path d="M236 290 C200 300 176 318 148 339 C130 352 112 356 102 359 Q92 362 92 376 V420 Q93 436 113 440 L138 446" />
        <path d="M216 467 H330" />
        <circle cx="177.1" cy="452.8" r="39.6" />
        <path
          d="M546 362 L590 348 C620 344 645 340 660 334 L638 312 Q630 300 636 290 Q642 284 652 286 C680 292 702 312 712 344 Q714 356 704 360 C680 368 652 380 634 398 Q618 414 602 425 L506 425 Z"
          fill={fill}
          strokeWidth="6"
        />
        <path d="M488 461 H606" />
        <circle cx="700.4" cy="444.8" r="46.3" />
      </g>
    </g>
  )
}

/** The full “RentaraH” wordmark in the text colour. */
function WordmarkArt() {
  return (
    <Box
      component="path"
      fillRule="evenodd"
      d={WORDMARK_BODY_D + WORDMARK_H_D}
      sx={{ fill: (t) => t.palette.text.primary }}
    />
  )
}

const svgSx = (height: Height, vb: string, extra?: SxProps<Theme>): SxProps<Theme> => [
  { display: 'block', height, width: widthFor(height, vb), flexShrink: 0, overflow: 'visible' },
  ...(Array.isArray(extra) ? extra : extra ? [extra] : []),
]

const useUid = () => `rh-${useId().replace(/:/g, '')}`

/** The icon alone (pin + car + scooter), in the brand gradient. */
export function RentaraMarkSvg({ height, title, sx }: { height: Height; title?: string; sx?: SxProps<Theme> }) {
  const uid = useUid()
  return (
    <Box
      component="svg"
      viewBox={ICON_VIEWBOX}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      sx={svgSx(height, ICON_VIEWBOX, [bounceSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])])}
    >
      <IconArt uid={uid} paint="gradient" />
    </Box>
  )
}

/** The “RentaraH” wordmark alone. */
export function RentaraWordmarkSvg({ height, sx }: { height: Height; sx?: SxProps<Theme> }) {
  return (
    <Box component="svg" viewBox={WORDMARK_VIEWBOX} aria-hidden sx={svgSx(height, WORDMARK_VIEWBOX, sx)}>
      <WordmarkArt />
    </Box>
  )
}

export type RentaraLogoMarkSize = 'sm' | 'md' | 'lg'

/** Lockup height (px) per size. The frame is centred on the wordmark, so the name sits dead-centre. */
const LOGO_HEIGHT: Record<RentaraLogoMarkSize, { xs: number; md: number }> = {
  sm: { xs: 38, md: 40 },
  md: { xs: 40, md: 44 },
  lg: { xs: 72, md: 96 },
}

export type RentaraLogoMarkProps = {
  size?: RentaraLogoMarkSize
  /** `mark` — icon only (compact bars, collapsed rails). `navLockup` — icon + “RentaraH” wordmark. */
  variant?: 'mark' | 'navLockup'
  /** Kept for API compatibility — the logo is inline vector, so there is no image to fail. */
  showTextFallback?: boolean
  className?: string
}

/** Brand logo: the icon, optionally with the wordmark, drawn as one SVG so the proportions never drift. */
export default function RentaraLogoMark({ size = 'md', variant = 'mark', className }: RentaraLogoMarkProps) {
  const height = LOGO_HEIGHT[size]
  const uid = useUid()

  if (variant === 'mark') {
    return (
      <Box data-rentara-logo className={className} sx={{ display: 'inline-flex', lineHeight: 0 }}>
        <RentaraMarkSvg height={{ xs: height.xs * 0.8, md: height.md * 0.8 }} title="RentaraH" />
      </Box>
    )
  }

  return (
    <Box
      component="svg"
      data-rentara-logo
      className={className}
      viewBox={LOGO_VIEWBOX}
      role="img"
      aria-label="RentaraH"
      sx={svgSx(height, LOGO_VIEWBOX, bounceSx)}
    >
      {/* Lifted so both wheels rest on the wordmark's baseline. */}
      <g transform={`translate(0 ${-ICON_LIFT})`}>
        <IconArt uid={uid} paint="gradient" />
      </g>
      <WordmarkArt />
    </Box>
  )
}
