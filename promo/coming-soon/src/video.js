// RentaraH — "Coming Soon" promo. 45 s, drawn procedurally on a 1920×1080
// logical canvas (any 16:9 output size; 3840×2160 for the 4K export).
// Every frame is a pure function of time, so preview, scrubbing and the
// frame-by-frame MP4 export all produce identical pictures.

export const W = 1920
export const H = 1080
export const DURATION = 45
export const FPS = 30

export const SCENES = [
  { id: 1, name: 'The Challenge', start: 0, end: 7 },
  { id: 2, name: 'Introducing RentaraH', start: 7, end: 15 },
  { id: 3, name: 'Explore the Possibilities', start: 15, end: 25 },
  { id: 4, name: 'Every Journey Has a Story', start: 25, end: 36 },
  { id: 5, name: 'Official Brand Reveal', start: 36, end: 45 },
]

const FONT = 'Urbanist, "Segoe UI", system-ui, sans-serif'
const C = {
  ink: '#03060f',
  midnight: '#050b1f',
  navy: '#0b1b42',
  cyan: '#2fe6ff',
  gold: '#f2c46d',
  white: '#f4f8ff',
}

/* ───────────────────────── math & easing ───────────────────────── */

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const lerp = (a, b, t) => a + (b - a) * t
const prog = (t, a, b) => clamp((t - a) / (b - a))
const ease = {
  outCubic: (t) => 1 - (1 - t) ** 3,
  inCubic: (t) => t * t * t,
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  outExpo: (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t)),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: (t) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2,
}
/** Fade in over [a, a+fi], hold, fade out over [b-fo, b]. */
const window01 = (t, a, b, fi = 0.4, fo = 0.4) => Math.min(prog(t, a, a + fi), 1 - prog(t, b - fo, b))

function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let r = Math.imul(s ^ (s >>> 15), 1 | s)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/* ───────────────────────── canvas helpers ───────────────────────── */

// shadowBlur ignores the transform, so scale it by the output density.
const blur = (g, px) => px * (g.__s || 1)

function zoomAbout(g, s, cx, cy) {
  g.translate(cx, cy)
  g.scale(s, s)
  g.translate(-cx, -cy)
}

function vGrad(g, y0, y1, stops) {
  const gr = g.createLinearGradient(0, y0, 0, y1)
  stops.forEach(([o, c]) => gr.addColorStop(o, c))
  return gr
}

function radial(g, x, y, r, stops) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r)
  stops.forEach(([o, c]) => gr.addColorStop(o, c))
  return gr
}

function glowDot(g, x, y, r, color, alpha = 1) {
  g.save()
  g.globalCompositeOperation = 'lighter'
  g.globalAlpha = alpha
  g.fillStyle = radial(g, x, y, r, [
    [0, color],
    [1, 'rgba(0,0,0,0)'],
  ])
  g.fillRect(x - r, y - r, r * 2, r * 2)
  g.restore()
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath()
  g.roundRect(x, y, w, h, r)
}

function text(g, str, x, y, o = {}) {
  const {
    size = 72, weight = 800, color = C.white, align = 'center', spacing = 0,
    alpha = 1, shadow = null, shadowBlur = 24, baseline = 'middle',
  } = o
  if (alpha <= 0) return
  g.save()
  g.globalAlpha *= alpha
  g.font = `${weight} ${size}px ${FONT}`
  g.textAlign = align
  g.textBaseline = baseline
  g.letterSpacing = `${spacing}px`
  if (shadow) {
    g.shadowColor = shadow
    g.shadowBlur = blur(g, shadowBlur)
  }
  g.fillStyle = color
  g.fillText(str, x, y)
  g.restore()
}

function textWidth(g, str, size, weight, spacing = 0) {
  g.save()
  g.font = `${weight} ${size}px ${FONT}`
  g.letterSpacing = `${spacing}px`
  const w = g.measureText(str).width
  g.restore()
  return w
}

/** Left-to-right wipe reveal with a glowing leading edge. */
function revealText(g, str, x, y, p, o = {}) {
  if (p <= 0) return
  const size = o.size || 72
  const w = textWidth(g, str, size, o.weight || 800, o.spacing || 0)
  const align = o.align || 'center'
  const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x
  const e = ease.outCubic(clamp(p))
  g.save()
  g.beginPath()
  g.rect(x0 - 40, y - size, (w + 80) * e, size * 2)
  g.clip()
  text(g, str, x, y + (1 - e) * 14, o)
  g.restore()
  if (p < 1 && o.edge !== false) {
    const ex = x0 - 20 + (w + 40) * e
    g.save()
    g.globalAlpha = (o.alpha ?? 1) * (1 - e)
    g.fillStyle = o.edgeColor || C.cyan
    g.shadowColor = o.edgeColor || C.cyan
    g.shadowBlur = blur(g, 18)
    g.fillRect(ex, y - size * 0.55, 3, size * 1.1)
    g.restore()
  }
}

function vignette(g, strength = 0.45) {
  g.fillStyle = radial(g, W / 2, H / 2, W * 0.75, [
    [0.45, 'rgba(0,0,0,0)'],
    [1, `rgba(0,0,0,${strength})`],
  ])
  g.fillRect(0, 0, W, H)
}

/* ───────────────────────── vehicles ───────────────────────── */

const CAR_SPECS = {
  van: { type: 'van', L: 224, clear: 34, R: 38, fw: 142, rw: -142, deckY: -176, roofY: -200, roofRear: -196, roofFront: 74, windBase: 146, hoodY: -122, beltY: -130, glassRear: -194 },
  sedan: { type: 'sedan', L: 215, clear: 30, R: 36, fw: 136, rw: -138, deckY: -96, roofY: -150, roofRear: -80, roofFront: 30, windBase: 100, hoodY: -96, beltY: -104, glassRear: -124 },
  suv: { type: 'suv', L: 212, clear: 40, R: 41, fw: 134, rw: -134, deckY: -150, roofY: -186, roofRear: -170, roofFront: 58, windBase: 120, hoodY: -120, beltY: -126, glassRear: -176 },
  compact: { type: 'compact', L: 176, clear: 28, R: 33, fw: 112, rw: -112, deckY: -128, roofY: -154, roofRear: -150, roofFront: 30, windBase: 90, hoodY: -94, beltY: -102, glassRear: -142 },
}
const pathCache = new Map()

function carPaths(spec) {
  if (pathCache.has(spec.type)) return pathCache.get(spec.type)
  const { L, clear, R, fw, rw, deckY, roofY, roofRear, roofFront, windBase, hoodY, beltY, glassRear } = spec
  const bot = -clear - 6
  const body = new Path2D()
  body.moveTo(-L + 6, bot)
  body.quadraticCurveTo(-L - 4, bot, -L - 4, bot - 20)
  body.lineTo(-L - 2, deckY + 22)
  body.quadraticCurveTo(-L, deckY, -L + 28, deckY - 2)
  if (spec.type === 'sedan') {
    body.lineTo(roofRear - 58, deckY - 6)
    body.quadraticCurveTo(roofRear - 18, roofY + 6, roofRear + 18, roofY)
  } else {
    body.quadraticCurveTo(roofRear - 14, roofY + 10, roofRear + 16, roofY)
  }
  body.quadraticCurveTo((roofRear + roofFront) / 2, roofY - 6, roofFront, roofY + 2)
  body.quadraticCurveTo(roofFront + 26, roofY + 8, windBase, hoodY - 6)
  body.quadraticCurveTo(windBase + 10, hoodY - 8, L - 34, hoodY + 2)
  body.quadraticCurveTo(L + 2, hoodY + 6, L + 6, hoodY + 34)
  body.lineTo(L + 4, bot - 10)
  body.quadraticCurveTo(L + 2, bot, L - 10, bot)
  body.lineTo(fw + R + 9, bot)
  body.arc(fw, -R, R + 9, 0, Math.PI, true)
  body.lineTo(rw + R + 9, bot)
  body.arc(rw, -R, R + 9, 0, Math.PI, true)
  body.closePath()

  const top = roofY + 10
  const sedan = spec.type === 'sedan'
  const glass = new Path2D()
  glass.moveTo(glassRear, beltY)
  glass.quadraticCurveTo(glassRear + (sedan ? 30 : 4), top + (sedan ? 6 : 2), glassRear + (sedan ? 62 : 26), top)
  glass.lineTo(roofFront - 6, top)
  glass.quadraticCurveTo(roofFront + 18, top + 4, windBase - 12, beltY)
  glass.closePath()

  const out = { body, glass, bot, top }
  pathCache.set(spec.type, out)
  return out
}

function wheel(g, x, R, angle, mb = 0) {
  g.fillStyle = '#16181f'
  g.beginPath()
  g.arc(x, -R, R, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = 'rgba(255,255,255,0.12)'
  g.lineWidth = 2
  g.beginPath()
  g.arc(x, -R, R - 4, Math.PI * 1.1, Math.PI * 1.7)
  g.stroke()
  const rr = R * 0.64
  g.fillStyle = radial(g, x - rr * 0.3, -R - rr * 0.3, rr * 1.6, [
    [0, '#f4f7fb'],
    [0.5, '#a9b4c4'],
    [1, '#4a5263'],
  ])
  g.beginPath()
  g.arc(x, -R, rr, 0, Math.PI * 2)
  g.fill()
  g.save()
  g.translate(x, -R)
  g.rotate(angle)
  g.globalAlpha *= 1 - 0.8 * mb
  g.fillStyle = '#20263a'
  for (let i = 0; i < 5; i++) {
    g.rotate((Math.PI * 2) / 5)
    g.beginPath()
    g.moveTo(rr * 0.28, -rr * 0.12)
    g.lineTo(rr * 0.92, -rr * 0.3)
    g.lineTo(rr * 0.92, rr * 0.05)
    g.closePath()
    g.fill()
  }
  g.restore()
  if (mb > 0) {
    // spokes smear into a soft disc at speed
    g.fillStyle = `rgba(120,132,150,${0.5 * mb})`
    g.beginPath()
    g.arc(x, -R, rr * 0.95, 0, Math.PI * 2)
    g.fill()
  }
  g.fillStyle = '#d6dce6'
  g.beginPath()
  g.arc(x, -R, rr * 0.2, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = '#0d1018'
  g.lineWidth = 1.6
  g.beginPath()
  g.arc(x, -R, R, 0, Math.PI * 2)
  g.stroke()
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16)
  const f = (c) => clamp(Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt), 0, 255)
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`
}

/**
 * Stylised side-profile vehicle, facing right, origin at ground centre.
 * holo: 0 = wireframe only, 1 = fully solid. pitch/lift move the body on its
 * suspension while the tyres stay planted; speed (px/s) blurs the wheels.
 */
function drawCar(g, o) {
  const spec = CAR_SPECS[o.type || 'sedan']
  const {
    x, y, scale = 1, color = '#1b2a55', dist = 0, headlights = false, holo = 1, alpha = 1, flipY = false,
    shadow = true, pitch = 0, lift = 0, speed = 0, wire = C.cyan, outline = '#101a2e', time = 0,
  } = o
  const { body, glass, bot, top } = carPaths(spec)
  const { L, R, fw, rw, roofY, hoodY, deckY, beltY, roofFront, glassRear, windBase } = spec
  g.save()
  g.globalAlpha *= alpha
  g.translate(x, y)
  g.scale(scale, flipY ? -scale : scale)

  if (shadow && !flipY && holo > 0.2) {
    g.save()
    g.translate(-18, 0)
    g.scale(1, 0.1)
    g.fillStyle = radial(g, 0, 0, L * 1.2, [
      [0, `rgba(20,30,50,${0.38 * holo})`],
      [1, 'rgba(20,30,50,0)'],
    ])
    g.fillRect(-L * 1.3, -L * 1.3, L * 2.6, L * 2.6)
    g.restore()
    for (const wx of [fw, rw]) {
      g.save()
      g.translate(wx, 0)
      g.scale(1, 0.16)
      g.fillStyle = radial(g, 0, 0, R * 1.2, [
        [0, `rgba(10,15,25,${0.7 * holo})`],
        [1, 'rgba(10,15,25,0)'],
      ])
      g.fillRect(-R * 1.3, -R * 1.3, R * 2.6, R * 2.6)
      g.restore()
    }
  }

  if (holo > 0) {
    g.save()
    g.globalAlpha *= holo
    g.save()
    // body rides on the suspension: pitch about the axle line, plus vertical lift
    g.translate(0, -R - lift)
    g.rotate(pitch)
    g.translate(0, R)
    g.fillStyle = vGrad(g, roofY, bot, [
      [0, shade(color, 0.38)],
      [0.35, shade(color, 0.1)],
      [0.6, color],
      [1, shade(color, -0.5)],
    ])
    g.fill(body)
    g.fillStyle = '#0b0d14'
    for (const wx of [fw, rw]) {
      g.beginPath()
      g.arc(wx, -R, R + 7, Math.PI, 0)
      g.fill()
    }
    g.save()
    g.clip(body)
    // sky reflected on the upper panels, a crisp horizon line, ground bounce below
    g.fillStyle = vGrad(g, roofY, beltY + 18, [
      [0, 'rgba(210,235,255,0.42)'],
      [1, 'rgba(255,255,255,0.06)'],
    ])
    g.fillRect(-L - 10, roofY - 10, L * 2 + 20, beltY + 28 - roofY)
    g.fillStyle = 'rgba(12,22,44,0.28)'
    g.fillRect(-L - 10, beltY + 18, L * 2 + 20, 6)
    g.fillStyle = 'rgba(255,236,205,0.10)'
    g.fillRect(-L - 10, beltY + 24, L * 2 + 20, 30)
    g.fillStyle = 'rgba(0,0,0,0.24)'
    g.fillRect(-L - 10, bot - 24, L * 2 + 20, 24)
    // sunlight sweeping along the paint as the car moves
    const span = L * 2 + 260
    const sx = ((((dist * 0.12 + time * 40) % span) + span) % span) - L - 130
    const sw = g.createLinearGradient(sx - 70, 0, sx + 70, 0)
    sw.addColorStop(0, 'rgba(255,255,255,0)')
    sw.addColorStop(0.5, 'rgba(255,255,255,0.28)')
    sw.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = sw
    g.fillRect(sx - 70, roofY - 10, 140, bot - roofY + 10)
    g.strokeStyle = 'rgba(255,255,255,0.7)'
    g.lineWidth = 2.5
    g.beginPath()
    g.moveTo(-L + 12, beltY + 6)
    g.quadraticCurveTo(0, beltY + 2, L - 20, hoodY + 12)
    g.stroke()
    g.strokeStyle = 'rgba(0,0,0,0.3)'
    g.lineWidth = 1.5
    const dx = roofFront - (roofFront - glassRear) * 0.45
    for (const seam of [dx, glassRear + 18, roofFront + 36]) {
      g.beginPath()
      g.moveTo(seam, beltY + 2)
      g.lineTo(seam + 4, bot - 4)
      g.stroke()
    }
    g.fillStyle = 'rgba(230,236,245,0.85)'
    g.fillRect(dx + 14, beltY + 14, 18, 4)
    g.fillRect(glassRear + 34, beltY + 14, 18, 4)
    g.restore()
    g.strokeStyle = outline
    g.lineWidth = 2.4
    g.stroke(body)

    g.fillStyle = vGrad(g, top, beltY, [
      [0, '#a9d6f5'],
      [0.45, '#4f7aa6'],
      [1, '#1c2b44'],
    ])
    g.fill(glass)
    g.save()
    g.clip(glass)
    g.fillStyle = 'rgba(255,255,255,0.4)'
    g.beginPath()
    g.moveTo(roofFront - 70, top)
    g.lineTo(roofFront - 44, top)
    g.lineTo(roofFront - 120, beltY)
    g.lineTo(roofFront - 146, beltY)
    g.closePath()
    g.fill()
    g.fillStyle = shade(color, -0.55)
    g.fillRect(dx - 4, top - 2, 9, beltY - top + 4)
    g.restore()
    g.strokeStyle = outline
    g.lineWidth = 1.8
    g.stroke(glass)
    g.strokeStyle = '#e7edf6'
    g.lineWidth = 2
    g.beginPath()
    g.moveTo(glassRear + 6, beltY + 3)
    g.lineTo(windBase - 14, beltY + 3)
    g.stroke()
    g.fillStyle = shade(color, -0.2)
    g.beginPath()
    g.ellipse(windBase - 4, beltY - 6, 10, 7, -0.3, 0, Math.PI * 2)
    g.fill()
    g.stroke()

    g.fillStyle = '#f4fbff'
    g.beginPath()
    g.moveTo(L - 30, hoodY + 9)
    g.lineTo(L + 3, hoodY + 14)
    g.lineTo(L + 3, hoodY + 22)
    g.lineTo(L - 26, hoodY + 18)
    g.closePath()
    g.fill()
    g.strokeStyle = outline
    g.lineWidth = 1.4
    g.stroke()
    g.fillStyle = '#ff3b5c'
    g.fillRect(-L - 3, deckY + 6, 18, 10)
    if (headlights) {
      glowDot(g, L, hoodY + 16, 46, 'rgba(160,240,255,0.9)', holo)
      glowDot(g, -L, deckY + 11, 38, 'rgba(255,40,80,0.8)', holo)
    }
    g.restore()
    const mb = clamp(speed / 1700)
    wheel(g, fw, R, dist / R, mb)
    wheel(g, rw, R, dist / R, mb)
    g.restore()
  }

  if (holo < 1) {
    g.save()
    g.globalAlpha *= 1 - holo * 0.85
    g.strokeStyle = wire
    g.shadowColor = wire
    g.shadowBlur = blur(g, 14)
    g.lineWidth = 2.5
    g.stroke(body)
    g.stroke(glass)
    for (const wx of [fw, rw]) {
      g.beginPath()
      g.arc(wx, -R, R, 0, Math.PI * 2)
      g.stroke()
    }
    g.restore()
  }
  g.restore()
}

const MOTO_SPECS = {
  // sport bike: wheels at ±75, R 30
  sport: {
    R: 30, fw: 78, rw: -72,
    body: 'M -102 -80 L -66 -76 L -30 -82 Q -12 -104 22 -102 L 58 -96 Q 88 -88 94 -66 L 70 -58 L 46 -40 L -6 -34 L -30 -50 L -64 -58 Z',
    glass: 'M 58 -96 L 74 -116 L 86 -94 Z',
    fork: [66, -82, 78, -30], arm: [-20, -44, -72, -30], bar: [48, -100, 38, -114], lamp: [92, -72], tail: [-100, -79],
  },
  // step-through scooter: wheels at ±61, R 22
  scooter: {
    R: 22, fw: 62, rw: -60,
    body: 'M -98 -56 Q -96 -36 -64 -34 L 8 -32 Q 28 -34 36 -52 L 48 -98 L 62 -98 L 68 -58 Q 74 -42 86 -38 L 82 -28 L 40 -24 L -20 -24 Q -62 -24 -86 -30 Z',
    glass: 'M 50 -98 L 58 -118 L 64 -98 Z',
    seat: 'M -92 -70 Q -92 -60 -84 -58 L -30 -58 Q -24 -66 -30 -72 Z',
    fork: [58, -96, 62, -22], arm: [-30, -30, -60, -22], bar: [54, -100, 42, -112], lamp: [86, -40], tail: [-97, -57],
  },
}
const motoPaths = new Map()

/** Stylised side-profile motorcycle or scooter, facing right, origin at ground centre. */
function drawMoto(g, o) {
  const spec = MOTO_SPECS[o.type === 'scooter' ? 'scooter' : 'sport']
  const { x, y, scale = 1, color = '#c81e3a', rim = C.cyan, dist = 0, holo = 1, alpha = 1, headlights = true, shadow = true } = o
  if (!motoPaths.has(o.type)) motoPaths.set(o.type, { body: new Path2D(spec.body), glass: new Path2D(spec.glass), seat: spec.seat ? new Path2D(spec.seat) : null })
  const P = motoPaths.get(o.type)
  const { R, fw, rw } = spec
  g.save()
  g.globalAlpha *= alpha
  g.translate(x, y)
  g.scale(scale, scale)
  if (shadow && holo > 0.2) {
    g.fillStyle = radial(g, 0, 0, 130, [
      [0, `rgba(0,0,0,${0.5 * holo})`],
      [1, 'rgba(0,0,0,0)'],
    ])
    g.save()
    g.scale(1, 0.1)
    g.fillRect(-140, -140, 280, 280)
    g.restore()
  }
  const strut = (l, w, col) => {
    g.strokeStyle = col
    g.lineWidth = w
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(l[0], l[1])
    g.lineTo(l[2], l[3])
    g.stroke()
  }
  if (holo > 0) {
    g.save()
    g.globalAlpha *= holo
    strut(spec.arm, 7, '#1b2130')
    strut(spec.fork, 6, '#aab4c4')
    wheel(g, fw, R, dist / R)
    wheel(g, rw, R, dist / R)
    g.fillStyle = vGrad(g, -110, -24, [
      [0, shade(color, 0.4)],
      [0.5, color],
      [1, shade(color, -0.55)],
    ])
    g.fill(P.body)
    if (P.seat) {
      g.fillStyle = '#141824'
      g.fill(P.seat)
    }
    g.fillStyle = 'rgba(160,220,255,0.55)'
    g.fill(P.glass)
    strut(spec.bar, 5, '#20283a')
    g.fillStyle = '#eaffff'
    g.beginPath()
    g.arc(spec.lamp[0], spec.lamp[1], 5, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#ff2d55'
    g.fillRect(spec.tail[0] - 2, spec.tail[1] - 3, 7, 6)
    if (headlights) {
      glowDot(g, spec.lamp[0], spec.lamp[1], 38, 'rgba(160,240,255,0.9)', holo)
      glowDot(g, spec.tail[0], spec.tail[1], 30, 'rgba(255,40,80,0.8)', holo)
    }
    g.strokeStyle = rim
    g.globalAlpha *= 0.55
    g.lineWidth = 2
    g.stroke(P.body)
    g.restore()
  }
  if (holo < 1) {
    g.save()
    g.globalAlpha *= 1 - holo * 0.85
    g.strokeStyle = o.wire || C.cyan
    g.shadowColor = o.wire || C.cyan
    g.shadowBlur = blur(g, 12)
    g.lineWidth = 2.5
    g.stroke(P.body)
    g.stroke(P.glass)
    for (const wx of [fw, rw]) {
      g.beginPath()
      g.arc(wx, -R, R, 0, Math.PI * 2)
      g.stroke()
    }
    strut(spec.fork, 2.5, o.wire || C.cyan)
    strut(spec.arm, 2.5, o.wire || C.cyan)
    strut(spec.bar, 2.5, o.wire || C.cyan)
    g.restore()
  }
  g.restore()
}

const isTwoWheeler = (type) => type === 'sport' || type === 'scooter'
/** Any vehicle: cars, SUVs, vans, motorcycles, scooters. */
function drawVehicle(g, o) {
  return isTwoWheeler(o.type) ? drawMoto(g, o) : drawCar(g, o)
}

/** Rear three-quarter-free rear view for the "drive away" shot. */
function drawCarRear(g, x, y, s, color) {
  g.save()
  g.translate(x, y)
  g.scale(s, s)
  g.fillStyle = radial(g, 0, 0, 200, [
    [0, 'rgba(0,0,0,0.6)'],
    [1, 'rgba(0,0,0,0)'],
  ])
  g.save()
  g.scale(1, 0.14)
  g.fillRect(-220, -220, 440, 440)
  g.restore()
  g.fillStyle = '#06070b'
  g.fillRect(-150, -46, 54, 46)
  g.fillRect(96, -46, 54, 46)
  g.fillStyle = vGrad(g, -190, -20, [
    [0, shade(color, 0.35)],
    [0.5, color],
    [1, shade(color, -0.55)],
  ])
  g.beginPath()
  g.moveTo(-100, -190)
  g.quadraticCurveTo(0, -200, 100, -190)
  g.lineTo(136, -122)
  g.quadraticCurveTo(170, -112, 168, -70)
  g.lineTo(162, -30)
  g.quadraticCurveTo(160, -18, 140, -18)
  g.lineTo(-140, -18)
  g.quadraticCurveTo(-160, -18, -162, -30)
  g.lineTo(-168, -70)
  g.quadraticCurveTo(-170, -112, -136, -122)
  g.closePath()
  g.fill()
  g.strokeStyle = 'rgba(47,230,255,0.5)'
  g.lineWidth = 2
  g.stroke()
  g.fillStyle = vGrad(g, -184, -128, [
    [0, '#22324f'],
    [1, '#070a12'],
  ])
  g.beginPath()
  g.moveTo(-90, -182)
  g.quadraticCurveTo(0, -190, 90, -182)
  g.lineTo(116, -130)
  g.lineTo(-116, -130)
  g.closePath()
  g.fill()
  g.fillStyle = '#ff2d55'
  g.fillRect(-150, -108, 300, 9)
  glowDot(g, -130, -104, 70, 'rgba(255,40,80,0.9)')
  glowDot(g, 130, -104, 70, 'rgba(255,40,80,0.9)')
  glowDot(g, 0, -104, 120, 'rgba(255,40,80,0.35)')
  g.fillStyle = 'rgba(0,0,0,0.35)'
  g.fillRect(-120, -52, 240, 16)
  g.restore()
}

/* ───────────────────────── environments ───────────────────────── */

function building(g, x, base, bw, bh, kind, seed, o) {
  const r = rng(seed)
  const top = base - bh
  g.fillStyle = vGrad(g, top, base, [
    [0, o.top],
    [1, o.bottom],
  ])
  g.beginPath()
  if (kind === 1) {
    g.rect(x, top + bh * 0.12, bw, bh * 0.88)
    g.rect(x + bw * 0.16, top, bw * 0.68, bh * 0.12 + 1)
  } else if (kind === 2) {
    g.moveTo(x, base)
    g.lineTo(x, top + 34)
    g.lineTo(x + bw * 0.5, top)
    g.lineTo(x + bw, top + 34)
    g.lineTo(x + bw, base)
  } else if (kind === 4) {
    g.moveTo(x, base)
    g.lineTo(x, top + bw * 0.45)
    g.lineTo(x + bw, top)
    g.lineTo(x + bw, base)
  } else {
    g.rect(x, top, bw, bh)
  }
  g.fill()
  if (kind === 3) {
    g.fillRect(x + bw / 2 - 1.5, top - bh * 0.16, 3, bh * 0.16)
    g.fillStyle = '#ff4060'
    g.fillRect(x + bw / 2 - 2, top - bh * 0.16 - 3, 4, 4)
  }
  if (o.sheen) {
    const sg = g.createLinearGradient(x, 0, x + bw, 0)
    sg.addColorStop(0, o.sheen)
    sg.addColorStop(0.6, 'rgba(0,0,0,0)')
    g.fillStyle = sg
    g.fillRect(x, top + 30, bw, bh - 30)
  }
  if (o.win) {
    const { dx, dy, p, color } = o.win
    const cols = Math.floor((bw - 8) / dx)
    const rows = Math.floor((bh - 44) / dy)
    for (let cx = 0; cx < cols; cx++) {
      for (let cy = 0; cy < rows; cy++) {
        if (r() < p) {
          g.globalAlpha = 0.35 + r() * 0.65
          g.fillStyle = color
          g.fillRect(x + 6 + cx * dx, top + 40 + cy * dy, dx * 0.55, dy * 0.5)
        }
      }
    }
    g.globalAlpha = 1
  }
  if (o.accent && r() < o.accent.p) {
    g.fillStyle = o.accent.color
    g.globalAlpha = 0.75
    g.fillRect(x + (r() < 0.5 ? 0 : bw - 2), top + 30, 2, bh - 30)
    g.globalAlpha = 1
  }
  if (o.neon && r() < o.neon.p) {
    const ny = top + 50 + r() * (bh * 0.4)
    const nc = o.neon.colors[Math.floor(r() * o.neon.colors.length)]
    g.save()
    g.shadowColor = nc
    g.shadowBlur = blur(g, 16)
    g.fillStyle = nc
    g.fillRect(x + bw * 0.2, ny, bw * 0.6, 5)
    g.restore()
  }
}

function skyline(g, w, h, seed, o) {
  const r = rng(seed)
  let x = -10
  let i = 0
  while (x < w) {
    const bw = o.minW + r() * (o.maxW - o.minW)
    const bh = o.minH + r() * (o.maxH - o.minH)
    const kind = Math.floor(r() * 5)
    const bseed = seed * 1000 + i
    const draw = o.draw || building
    draw(g, x, h, bw, bh, kind, bseed, o)
    if (x + bw > w) draw(g, x - w, h, bw, bh, kind, bseed, o)
    if (x < 0) draw(g, x + w, h, bw, bh, kind, bseed, o)
    x += bw + o.gap * r()
    i++
  }
}

/** Seamless ridge: integer frequencies over the layer width. */
function ridge(g, w, h, seed, o) {
  const r = rng(seed)
  const waves = (o.freqs || [2, 5, 11, 23]).map((f, i) => ({ f, a: 1 / (i + 1) ** 1.2, ph: r() * Math.PI * 2 }))
  const norm = waves.reduce((s, v) => s + v.a, 0)
  g.beginPath()
  g.moveTo(0, h)
  for (let x = 0; x <= w; x += 4) {
    let v = 0
    for (const wv of waves) v += wv.a * (0.5 + 0.5 * Math.sin((Math.PI * 2 * wv.f * x) / w + wv.ph))
    g.lineTo(x, o.base - (v / norm) * o.amp)
  }
  g.lineTo(w, h)
  g.closePath()
  g.fillStyle = vGrad(g, o.base - o.amp, h, o.stops)
  g.fill()
  if (o.rimLight) {
    g.strokeStyle = o.rimLight
    g.lineWidth = 2
    g.stroke()
  }
}

function treeLine(g, w, h, seed, o) {
  const r = rng(seed)
  for (let x = -40; x < w + 40; x += o.size * (0.5 + r() * 0.5)) {
    const s = o.size * (0.6 + r() * 0.6)
    const y = o.y - r() * o.size * 0.5
    for (const ox of [0, -w, w]) {
      g.fillStyle = o.dark
      g.beginPath()
      g.arc(x + ox, y, s, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = o.light
      g.beginPath()
      g.arc(x + ox - s * 0.25, y - s * 0.3, s * 0.55, 0, Math.PI * 2)
      g.fill()
    }
  }
  g.fillStyle = o.dark
  g.fillRect(0, o.y, w, h - o.y)
}

function cloud(g, cx, cy, s, light, dark) {
  const blobs = [
    [0, 0, 1], [-1.1, 0.25, 0.75], [1.1, 0.2, 0.8], [-0.5, -0.45, 0.8], [0.55, -0.5, 0.85], [-1.9, 0.5, 0.5], [1.9, 0.5, 0.55],
  ]
  g.fillStyle = dark
  for (const [bx, by, br] of blobs) {
    g.beginPath()
    g.arc(cx + bx * s, cy + by * s + s * 0.18, br * s, 0, Math.PI * 2)
    g.fill()
  }
  g.fillStyle = light
  for (const [bx, by, br] of blobs) {
    g.beginPath()
    g.arc(cx + bx * s - s * 0.08, cy + by * s - s * 0.06, br * s * 0.9, 0, Math.PI * 2)
    g.fill()
  }
}

function palm(g, x, base, h, lean, color) {
  g.save()
  g.strokeStyle = color
  g.fillStyle = color
  g.lineCap = 'round'
  g.lineWidth = h * 0.045
  const tx = x + lean
  const ty = base - h
  g.beginPath()
  g.moveTo(x, base)
  g.quadraticCurveTo(x + lean * 0.2, base - h * 0.5, tx, ty)
  g.stroke()
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + (i - 3.5) * 0.42
    const len = h * (0.42 + (i % 2) * 0.08)
    const ex = tx + Math.cos(a) * len
    const ey = ty + Math.sin(a) * len * 0.25 + len * 0.45
    g.lineWidth = h * 0.02
    g.beginPath()
    g.moveTo(tx, ty)
    g.quadraticCurveTo(tx + Math.cos(a) * len * 0.6, ty + Math.sin(a) * len * 0.6 - len * 0.1, ex, ey)
    g.stroke()
    g.beginPath()
    g.moveTo(tx, ty)
    g.quadraticCurveTo(tx + Math.cos(a) * len * 0.6, ty + Math.sin(a) * len * 0.6 + len * 0.02, ex, ey)
    g.quadraticCurveTo(tx + Math.cos(a) * len * 0.5, ty + Math.sin(a) * len * 0.5 - len * 0.18, tx, ty)
    g.fill()
  }
  g.restore()
}

function lightTrails(g, t, o) {
  const r = rng(o.seed)
  g.save()
  g.globalCompositeOperation = 'lighter'
  for (let i = 0; i < o.count; i++) {
    const len = o.len * (0.5 + r())
    const speed = o.speed * (0.7 + r() * 0.6)
    const lane = o.y + (r() - 0.5) * o.spread
    const period = W + len + 400
    let x = (r() * period + t * speed * o.dir) % period
    if (x < 0) x += period
    x -= len + 200
    const gr = g.createLinearGradient(x, 0, x + len, 0)
    const head = o.color
    gr.addColorStop(o.dir > 0 ? 0 : 1, 'rgba(0,0,0,0)')
    gr.addColorStop(o.dir > 0 ? 1 : 0, head)
    g.fillStyle = gr
    g.globalAlpha = 0.5
    g.fillRect(x, lane - o.width * 1.8, len, o.width * 3.6)
    g.globalAlpha = 1
    g.fillRect(x, lane - o.width / 2, len, o.width)
  }
  g.restore()
}

function particles(g, t, o) {
  const r = rng(o.seed)
  g.save()
  g.globalCompositeOperation = 'lighter'
  for (let i = 0; i < o.count; i++) {
    const x0 = r() * W
    const y0 = r() * H
    const sp = 10 + r() * o.speed
    const size = 0.8 + r() * o.size
    const tw = 0.5 + 0.5 * Math.sin(t * (1 + r() * 3) + r() * 10)
    const y = ((y0 - t * sp) % H + H) % H
    const x = x0 + Math.sin(t * 0.6 + i) * 12
    g.globalAlpha = (o.alpha ?? 0.8) * tw
    g.fillStyle = r() < (o.goldRatio ?? 0) ? C.gold : o.color || C.cyan
    g.beginPath()
    g.arc(x, y, size, 0, Math.PI * 2)
    g.fill()
  }
  g.restore()
}

function road(g, y, h, offset, o = {}) {
  g.fillStyle = o.fill || vGrad(g, y, y + h, [
    [0, '#14161f'],
    [1, '#07080c'],
  ])
  g.fillRect(-100, y, W + 200, h)
  if (o.edge !== false) {
    g.fillStyle = o.edgeColor || 'rgba(255,255,255,0.55)'
    g.fillRect(-100, y + 4, W + 200, 3)
  }
  const dashY = y + (o.dashAt ?? h * 0.42)
  g.fillStyle = o.dash || 'rgba(255,255,255,0.75)'
  const period = 220
  for (let x = -((offset % period) + period) % period - period; x < W + period; x += period) {
    g.fillRect(x, dashY, 110, 5)
  }
}

function guardrail(g, y, offset, color) {
  g.fillStyle = color
  g.fillRect(-100, y - 26, W + 200, 7)
  g.fillRect(-100, y - 12, W + 200, 4)
  const period = 140
  for (let x = -((offset % period) + period) % period - period; x < W + period; x += period) {
    g.fillRect(x, y - 30, 7, 34)
  }
}

function speedLines(g, t, o) {
  const r = rng(o.seed)
  g.save()
  g.globalCompositeOperation = 'lighter'
  for (let i = 0; i < o.count; i++) {
    const y = o.y0 + r() * (o.y1 - o.y0)
    const len = 120 + r() * 260
    const period = W + len
    const x = W - (((r() * period + t * o.speed) % period) + period) % period
    g.globalAlpha = o.alpha * (0.3 + r() * 0.7)
    g.fillStyle = o.color
    g.fillRect(x, y, len, 1.5)
  }
  g.restore()
}

function techBackdrop(g, t, o = {}) {
  g.fillStyle = radial(g, W / 2, H * 0.42, W * 0.8, [
    [0, '#0f2b5c'],
    [0.55, '#071433'],
    [1, '#02050f'],
  ])
  g.fillRect(-100, -100, W + 200, H + 200)
  const hy = o.horizon ?? 760
  // perspective grid
  g.save()
  g.beginPath()
  g.rect(-100, hy, W + 200, H - hy + 100)
  g.clip()
  g.strokeStyle = 'rgba(47,230,255,0.22)'
  g.lineWidth = 1.2
  for (let i = -24; i <= 24; i++) {
    g.beginPath()
    g.moveTo(W / 2 + i * 26, hy)
    g.lineTo(W / 2 + i * 260, H + 60)
    g.stroke()
  }
  const sp = (t * 0.35) % 1
  for (let k = 0; k < 14; k++) {
    const z = (k + sp) / 14
    const yy = hy + (H - hy + 60) * z * z
    g.globalAlpha = z
    g.beginPath()
    g.moveTo(-100, yy)
    g.lineTo(W + 100, yy)
    g.stroke()
  }
  g.restore()
  g.fillStyle = vGrad(g, hy - 120, hy + 40, [
    [0, 'rgba(47,230,255,0)'],
    [0.75, 'rgba(47,230,255,0.10)'],
    [1, 'rgba(47,230,255,0)'],
  ])
  g.fillRect(-100, hy - 120, W + 200, 160)
  particles(g, t, { seed: 77, count: 70, speed: 26, size: 1.8, alpha: 0.6, goldRatio: 0.15 })
}

/* ───────────────────────── app interface panels ───────────────────────── */

function browserPanel(g, img, o) {
  const { x, y, w, h, scroll = 0, alpha = 1, title = 'RentaraH' } = o
  if (alpha <= 0) return
  const bar = 42
  g.save()
  g.globalAlpha *= alpha
  g.save()
  g.shadowColor = 'rgba(47,230,255,0.35)'
  g.shadowBlur = blur(g, 70)
  roundRect(g, x, y, w, h, 18)
  g.fillStyle = '#0b1428'
  g.fill()
  g.restore()
  g.save()
  roundRect(g, x, y, w, h, 18)
  g.clip()
  g.fillStyle = vGrad(g, y, y + bar, [
    [0, '#16213b'],
    [1, '#0d1529'],
  ])
  g.fillRect(x, y, w, bar)
  ;['#ff6b6b', '#ffd166', '#39d98a'].forEach((c, i) => {
    g.fillStyle = c
    g.globalAlpha = 0.8 * alpha
    g.beginPath()
    g.arc(x + 24 + i * 20, y + bar / 2, 6, 0, Math.PI * 2)
    g.fill()
  })
  g.globalAlpha = alpha
  roundRect(g, x + w / 2 - 110, y + 9, 220, bar - 18, 12)
  g.fillStyle = 'rgba(255,255,255,0.07)'
  g.fill()
  text(g, title, x + w / 2, y + bar / 2 + 1, { size: 15, weight: 600, color: 'rgba(230,240,255,0.85)' })
  const cw = w
  const ch = h - bar
  const sc = cw / img.width
  const srcH = Math.min(img.height, ch / sc)
  const sy = clamp(scroll / sc, 0, Math.max(0, img.height - srcH))
  g.drawImage(img, 0, sy, img.width, srcH, x, y + bar, cw, srcH * sc)
  g.restore()
  roundRect(g, x + 0.5, y + 0.5, w - 1, h - 1, 18)
  g.strokeStyle = 'rgba(140,215,255,0.45)'
  g.lineWidth = 1.5
  g.stroke()
  if (o.label) {
    text(g, o.label, x + w - 4, y + h + 26, { size: 17, weight: 500, align: 'right', color: 'rgba(200,225,255,0.62)', spacing: 1 })
  }
  g.restore()
}

const PREVIEW_LABEL = 'Interface preview · demo data'

/* ───────────────────────── phone mockup (app-led showcase) ───────────────────────── */

const PHONE = { cssW: 390, cssH: 800, status: 44 }
// Fixed UI pinned to the bottom of each captured page (bottom nav, booking bar).
const FIXED_BOTTOM = { landing: 92, search: 92, detail: 168, map: 0 }

/** Draws one captured app screen into the phone's content area (frame px). */
function phoneScreen(g, img, name, scroll, x, y, k) {
  const fixed = FIXED_BOTTOM[name] || 0
  const scale = img.width / PHONE.cssW
  const cssH = img.height / scale
  const viewH = PHONE.cssH - fixed
  const sc = clamp(scroll, 0, Math.max(0, cssH - fixed - viewH))
  g.fillStyle = '#ffffff'
  g.fillRect(x, y, PHONE.cssW * k, PHONE.cssH * k)
  g.drawImage(img, 0, sc * scale, img.width, viewH * scale, x, y, PHONE.cssW * k, viewH * k)
  if (fixed) {
    g.drawImage(img, 0, (cssH - fixed) * scale, img.width, fixed * scale, x, y + viewH * k, PHONE.cssW * k, fixed * k)
  }
  return sc
}

function statusBar(g, x, y, w, k) {
  g.fillStyle = '#eef3fd'
  g.fillRect(x, y, w, PHONE.status * k)
  text(g, '9:41', x + 34 * k, y + 25 * k, { size: 15 * k, weight: 700, color: '#0f172a', align: 'left' })
  g.fillStyle = '#0f172a'
  for (let i = 0; i < 4; i++) g.fillRect(x + w - 92 * k + i * 5 * k, y + (28 - 3 - i * 2.4) * k, 3 * k, (3 + i * 2.4) * k)
  roundRect(g, x + w - 58 * k, y + 17 * k, 25 * k, 12 * k, 3 * k)
  g.lineWidth = 1.4 * k
  g.strokeStyle = '#0f172a'
  g.stroke()
  g.fillRect(x + w - 56 * k, y + 19 * k, 18 * k, 8 * k)
}

/**
 * Phone with a live app screen. `app` = { screen, scroll, from?, fromScroll?, push? (0..1), taps?: [{x,y,p}] }
 * where tap x/y are CSS px within the current screen's viewport (already scroll-adjusted).
 */
function phone(g, assets, cx, cy, o) {
  const { k = 1.03, alpha = 1, rot = 0, app } = o
  const sw = PHONE.cssW * k
  const sh = (PHONE.cssH + PHONE.status) * k
  const bez = 15
  const bw = sw + bez * 2
  const bh = sh + bez * 2
  g.save()
  g.globalAlpha *= alpha
  g.translate(cx, cy)
  g.rotate(rot)
  g.translate(-bw / 2, -bh / 2)
  // body + glow
  g.save()
  g.shadowColor = 'rgba(26,86,219,0.55)'
  g.shadowBlur = blur(g, 90)
  roundRect(g, 0, 0, bw, bh, 74)
  g.fillStyle = '#0b0f19'
  g.fill()
  g.restore()
  const rim = g.createLinearGradient(0, 0, bw, bh)
  rim.addColorStop(0, '#8fa3c6')
  rim.addColorStop(0.5, '#2b3550')
  rim.addColorStop(1, '#a9bad8')
  roundRect(g, 1.5, 1.5, bw - 3, bh - 3, 73)
  g.strokeStyle = rim
  g.lineWidth = 3
  g.stroke()
  // screen
  const sx = bez
  const sy = bez
  g.save()
  roundRect(g, sx, sy, sw, sh, 58)
  g.clip()
  const cy0 = sy + PHONE.status * k
  const img = (n) => assets.mobile[n]
  if (app.from && app.push > 0 && app.push < 1) {
    const e = ease.inOutCubic(app.push)
    g.save()
    g.translate(-sw * 0.3 * e, 0)
    phoneScreen(g, img(app.from), app.from, app.fromScroll || 0, sx, cy0, k)
    g.fillStyle = `rgba(0,0,0,${0.25 * e})`
    g.fillRect(sx, cy0, sw, sh)
    g.restore()
    g.save()
    g.translate(sw * (1 - e), 0)
    g.shadowColor = 'rgba(0,0,0,0.35)'
    g.shadowBlur = blur(g, 30)
    g.fillStyle = '#fff'
    g.fillRect(sx, cy0, sw, sh)
    g.shadowColor = 'transparent'
    phoneScreen(g, img(app.screen), app.screen, app.scroll || 0, sx, cy0, k)
    g.restore()
  } else {
    phoneScreen(g, img(app.screen), app.screen, app.scroll || 0, sx, cy0, k)
  }
  statusBar(g, sx, sy, sw, k)
  // taps: expanding ring + pressed dot, no hands
  for (const tp of app.taps || []) {
    if (tp.p <= 0 || tp.p >= 1) continue
    const px = sx + tp.x * k
    const py = cy0 + tp.y * k
    const e = ease.outCubic(tp.p)
    g.save()
    g.globalAlpha *= 1 - e
    g.strokeStyle = C.cyan
    g.lineWidth = 4
    g.beginPath()
    g.arc(px, py, 18 + 46 * e, 0, Math.PI * 2)
    g.stroke()
    g.fillStyle = 'rgba(47,230,255,0.45)'
    g.beginPath()
    g.arc(px, py, 22 * (1 - e * 0.5), 0, Math.PI * 2)
    g.fill()
    g.restore()
  }
  g.restore()
  // dynamic island + glass sheen
  roundRect(g, bw / 2 - 58, sy + 10, 116, 32, 16)
  g.fillStyle = '#05070c'
  g.fill()
  g.save()
  roundRect(g, sx, sy, sw, sh, 58)
  g.clip()
  const sheen = g.createLinearGradient(0, 0, bw, bh * 0.6)
  sheen.addColorStop(0, 'rgba(255,255,255,0.10)')
  sheen.addColorStop(0.35, 'rgba(255,255,255,0)')
  g.fillStyle = sheen
  g.fillRect(sx, sy, sw, sh)
  g.restore()
  g.restore()
  return { bw, bh, sw, k, left: cx - bw / 2, top: cy - bh / 2, screenTop: cy - bh / 2 + bez + PHONE.status * k }
}

/** Feature callout chip with an icon dot and a leader line to the phone. */
function chip(g, label, x, y, p, o = {}) {
  if (p <= 0) return
  const e = ease.outBack(clamp(p))
  const a = clamp(p * 3) * (o.alpha ?? 1)
  const size = 28
  const w = textWidth(g, label, size, 700) + 94
  const h = 68
  const left = o.align === 'right' ? x - w : x
  g.save()
  g.globalAlpha *= a
  if (o.to) {
    g.strokeStyle = 'rgba(47,230,255,0.85)'
    g.lineWidth = 2.5
    g.setLineDash([2, 8])
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(o.align === 'right' ? left + w : left, y)
    g.lineTo(o.to[0], o.to[1])
    g.stroke()
    g.setLineDash([])
    g.fillStyle = C.cyan
    g.beginPath()
    g.arc(o.to[0], o.to[1], 6, 0, Math.PI * 2)
    g.fill()
  }
  g.translate(left + w / 2, y)
  g.scale(e, e)
  g.shadowColor = 'rgba(2,8,30,0.45)'
  g.shadowBlur = blur(g, 30)
  roundRect(g, -w / 2, -h / 2, w, h, h / 2)
  g.fillStyle = '#ffffff'
  g.fill()
  g.shadowColor = 'transparent'
  g.fillStyle = '#1A56DB'
  g.beginPath()
  g.arc(-w / 2 + h / 2, 0, 22, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = '#fff'
  g.lineWidth = 3.5
  g.lineCap = 'round'
  g.lineJoin = 'round'
  g.beginPath()
  g.moveTo(-w / 2 + h / 2 - 9, 1)
  g.lineTo(-w / 2 + h / 2 - 2, 8)
  g.lineTo(-w / 2 + h / 2 + 10, -7)
  g.stroke()
  text(g, label, -w / 2 + h + 6, 1, { size, weight: 700, color: '#0f172a', align: 'left' })
  g.restore()
}

/** Bold kinetic type on brand-blue highlight blocks (punchy, app-ad style). */
/** Letters pop in one by one: rise, overshoot, settle. */
function kineticChars(g, str, x, y, p, o = {}) {
  if (p <= 0) return
  const size = o.size || 72
  const weight = o.weight || 800
  const spacing = o.spacing || 0
  const spread = o.spread ?? 0.55
  g.save()
  g.font = `${weight} ${size}px ${FONT}`
  g.letterSpacing = `${spacing}px`
  g.textAlign = 'left'
  g.textBaseline = 'middle'
  const chars = [...str]
  const widths = chars.map((ch) => g.measureText(ch).width)
  const total = widths.reduce((a, b) => a + b, 0) - spacing
  let cx = o.align === 'center' ? x - total / 2 : x
  const stagger = spread / Math.max(1, chars.length)
  if (o.shadow) {
    g.shadowColor = o.shadow
    g.shadowBlur = blur(g, o.shadowBlur ?? 24)
  }
  g.fillStyle = o.color || C.white
  for (let i = 0; i < chars.length; i++) {
    const lp = clamp((p - i * stagger) / (1 - spread + 0.001))
    if (lp > 0 && chars[i] !== ' ') {
      const e = ease.outBack(lp)
      g.save()
      g.globalAlpha *= clamp(lp * 2.5) * (o.alpha ?? 1)
      g.translate(cx + widths[i] / 2, y + (1 - e) * size * 0.55)
      g.scale(0.7 + 0.3 * e, 0.7 + 0.3 * e)
      g.fillText(chars[i], -widths[i] / 2, 0)
      g.restore()
    }
    cx += widths[i]
  }
  g.restore()
}

function punchLine(g, str, x, y, p, o = {}) {
  if (p <= 0) return
  const size = o.size || 96
  const weight = o.weight || 800
  const w = textWidth(g, str, size, weight, o.spacing || 0)
  const padX = size * 0.28
  const h = size * 1.2
  const e = ease.outCubic(clamp(p * 1.4))
  const left = o.align === 'center' ? x - w / 2 - padX : x - padX
  g.save()
  g.globalAlpha *= o.alpha ?? 1
  g.save()
  g.transform(1, 0, -0.12, 1, 0.12 * y, 0)
  g.fillStyle = o.fill || '#1A56DB'
  g.shadowColor = 'rgba(2,10,40,0.45)'
  g.shadowBlur = blur(g, 24)
  g.fillRect(left, y - h / 2, (w + padX * 2) * e, h)
  g.restore()
  kineticChars(g, str, x, y + size * 0.03, clamp((p - 0.15) / 0.85), { size, weight, align: o.align || 'left', spacing: o.spacing || 0, color: o.color || '#ffffff' })
  g.restore()
}

/** Smoothly up over [a,b], hold, down over [c,d]. */
const bump = (t, a, b, c, d) => ease.inOutCubic(prog(t, a, b)) * (1 - ease.inOutCubic(prog(t, c, d)))

/** Fast foreground posts whipping past the lens, motion-blurred. */
function fgPosts(g, t, o) {
  const period = o.spacing
  const travel = t * o.speed
  const smear = o.speed * 0.02
  for (let x = W + period - (travel % period) - period * 2; x < W + period; x += period) {
    const gr = g.createLinearGradient(x - smear, 0, x + o.width + smear, 0)
    gr.addColorStop(0, 'rgba(0,0,0,0)')
    gr.addColorStop(0.35, o.color)
    gr.addColorStop(0.65, o.color)
    gr.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = gr
    g.fillRect(x - smear, o.top, o.width + smear * 2, H - o.top + 20)
    if (o.lamp) glowDot(g, x + o.width / 2, o.top + 10, 120, o.lamp)
  }
}

/* ───────────────────────── renderer ───────────────────────── */

/* ───────────────────────── sunny-day art direction ───────────────────────── */

const HERO = '#1b3a7a' // the hero sedan, same paint in every shot
const SUV = '#eef2f7'
const COMPACT = '#d8c49c'
const INK = '#0f2347'

const DAY_FAR = [['#dbe9f6', '#c3d7ec'], ['#e6eef7', '#cddcec'], ['#d5e5f2', '#bcd1e6']]
const DAY_TOWER = [['#eef4fa', '#c9d8ea'], ['#d6e7f6', '#aec6e0'], ['#f4ecdc', '#dccdb0'], ['#d2ebf1', '#a6c9d6'], ['#e7ebf2', '#bec7d6']]
const DAY_GLASS = [['#cfe6f7', '#9fc2e0'], ['#bfe0ec', '#8fbccd'], ['#e9f1f8', '#c2d3e6'], ['#d9e2f0', '#aab9d1']]
const TREE = { trunk: '#7a5a3c', line: '#24502f', dark: '#2f6e3e', mid: '#45a058', light: '#7ccc79' }

/** Clear blue sky with a soft sun, slowly turning rays and a warm halo. */
function sunnySky(g, t, o = {}) {
  const hy = o.horizon ?? 700
  g.fillStyle = vGrad(g, -100, hy, [
    [0, '#2f86e0'],
    [0.55, '#7dc1f2'],
    [1, '#e2f2ff'],
  ])
  g.fillRect(-300, -300, W + 600, hy + 600)
  const sx = o.sunX ?? 1580
  const sy = o.sunY ?? 150
  g.save()
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + t * 0.04
    g.fillStyle = radial(g, sx, sy, 1500, [
      [0, 'rgba(255,250,225,0.16)'],
      [1, 'rgba(255,250,225,0)'],
    ])
    g.beginPath()
    g.moveTo(sx, sy)
    g.arc(sx, sy, 1500, a - 0.05, a + 0.05)
    g.closePath()
    g.fill()
  }
  g.restore()
  g.fillStyle = radial(g, sx, sy, 420, [
    [0, 'rgba(255,250,228,0.95)'],
    [0.25, 'rgba(255,244,205,0.45)'],
    [1, 'rgba(255,244,205,0)'],
  ])
  g.fillRect(sx - 420, sy - 420, 840, 840)
  g.fillStyle = '#fffbe9'
  g.beginPath()
  g.arc(sx, sy, 58, 0, Math.PI * 2)
  g.fill()
}

/** Aerial perspective: distant layers fade toward the sky colour. */
function haze(g, y0, y1, a = 0.35) {
  g.fillStyle = vGrad(g, y0, y1, [
    [0, 'rgba(226,242,255,0)'],
    [1, `rgba(226,242,255,${a})`],
  ])
  g.fillRect(-300, y0, W + 600, y1 - y0)
}

/** Sunlit building: lit face, shaded side, glass floors reflecting the sky, clean outline. */
function buildingDay(g, x, base, bw, bh, kind, seed, o) {
  const r = rng(seed)
  const [face, side] = o.palette[Math.floor(r() * o.palette.length)]
  const top = base - bh
  const p = new Path2D()
  if (kind === 1) {
    p.rect(x, top + bh * 0.12, bw, bh * 0.88)
    p.rect(x + bw * 0.16, top, bw * 0.68, bh * 0.12 + 1)
  } else if (kind === 2) {
    p.moveTo(x, base)
    p.lineTo(x, top + 34)
    p.lineTo(x + bw * 0.5, top)
    p.lineTo(x + bw, top + 34)
    p.lineTo(x + bw, base)
    p.closePath()
  } else if (kind === 4) {
    p.moveTo(x, base)
    p.lineTo(x, top + bw * 0.45)
    p.lineTo(x + bw, top)
    p.lineTo(x + bw, base)
    p.closePath()
  } else {
    p.rect(x, top, bw, bh)
  }
  g.fillStyle = face
  g.fill(p)
  g.save()
  g.clip(p)
  g.fillStyle = side
  g.fillRect(x, top - 60, bw * 0.3, bh + 80)
  const fh = o.floor || 22
  g.fillStyle = o.glass
  for (let fy = top + 28; fy < base - 8; fy += fh) {
    g.globalAlpha = 0.75 + r() * 0.2
    g.fillRect(x + 5, fy, bw - 10, fh * 0.52)
  }
  g.globalAlpha = 1
  g.fillStyle = 'rgba(255,255,255,0.55)'
  const cols = 2 + Math.floor(r() * 4)
  for (let c = 1; c < cols; c++) g.fillRect(x + (bw * c) / cols, top, 1.5, bh)
  g.fillStyle = vGrad(g, top, base, [
    [0, 'rgba(255,255,255,0.4)'],
    [0.55, 'rgba(255,255,255,0)'],
  ])
  g.fillRect(x, top, bw, bh)
  g.restore()
  g.strokeStyle = o.line
  g.lineWidth = 1.5
  g.stroke(p)
  if (kind === 3) {
    g.fillStyle = o.line
    g.fillRect(x + bw / 2 - 1.5, top - bh * 0.14, 3, bh * 0.14)
  }
}

/** Round, outlined 2D tree whose canopy sways from the trunk. */
function tree(g, x, base, s, t, ph, pal = TREE) {
  const sway = Math.sin(t * 1.1 + ph) * 0.035 + Math.sin(t * 2.3 + ph * 2) * 0.01
  g.save()
  g.translate(x, base)
  g.fillStyle = pal.trunk
  g.fillRect(-s * 0.07, -s * 0.9, s * 0.14, s * 0.9)
  g.translate(0, -s * 0.85)
  g.rotate(sway)
  const blobs = [[0, -0.36, 0.5], [-0.4, -0.1, 0.38], [0.4, -0.12, 0.4], [0, 0.06, 0.42]]
  for (const [layerCol, grow, ox, oy] of [[pal.line, 0.06, 0, 0], [pal.dark, 0, 0.04, 0.05], [pal.mid, -0.02, 0, 0]]) {
    g.fillStyle = layerCol
    for (const [bx, by, br] of blobs) {
      g.beginPath()
      g.arc((bx + ox) * s, (by + oy) * s, (br + grow) * s, 0, Math.PI * 2)
      g.fill()
    }
  }
  g.fillStyle = pal.light
  for (const [bx, by, br] of blobs.slice(0, 3)) {
    g.beginPath()
    g.arc((bx - 0.1) * s, (by - 0.12) * s, br * 0.45 * s, 0, Math.PI * 2)
    g.fill()
  }
  g.restore()
}

/** Palm with drooping fronds that sway in the breeze. */
function palmDay(g, x, base, h, lean, t, ph) {
  g.save()
  g.lineCap = 'round'
  const tx = x + lean
  const ty = base - h
  g.strokeStyle = '#3b2a1c'
  g.lineWidth = h * 0.055 + 3
  g.beginPath()
  g.moveTo(x, base)
  g.quadraticCurveTo(x + lean * 0.2, base - h * 0.5, tx, ty)
  g.stroke()
  g.strokeStyle = '#9a774f'
  g.lineWidth = h * 0.055
  g.stroke()
  g.translate(tx, ty)
  g.rotate(Math.sin(t * 1.2 + ph) * 0.06)
  for (let i = 0; i < 11; i++) {
    const a = -Math.PI / 2 + (i - 5) * 0.3 + Math.sin(t * 1.7 + ph + i) * 0.03
    const len = h * (0.36 + (i % 2) * 0.06)
    const ex = Math.cos(a) * len
    const ey = Math.sin(a) * len * 0.35 + len * 0.3
    const cx = Math.cos(a) * len * 0.55
    const cy = Math.sin(a) * len * 0.55 - len * 0.12
    g.fillStyle = '#24502f'
    g.beginPath()
    g.moveTo(0, 0)
    g.quadraticCurveTo(cx - len * 0.12, cy - len * 0.2, ex, ey)
    g.quadraticCurveTo(cx + len * 0.12, cy + len * 0.18, 0, 0)
    g.fill()
    g.fillStyle = i % 2 ? '#3f9a52' : '#56b465'
    g.beginPath()
    g.moveTo(0, 0)
    g.quadraticCurveTo(cx - len * 0.08, cy - len * 0.15, ex * 0.95, ey * 0.95)
    g.quadraticCurveTo(cx + len * 0.06, cy + len * 0.1, 0, 0)
    g.fill()
  }
  g.fillStyle = '#6b4a2a'
  for (const [ox, oy] of [[-8, 8], [7, 9], [0, 15]]) {
    g.beginPath()
    g.arc(ox, oy, 7, 0, Math.PI * 2)
    g.fill()
  }
  g.restore()
}

/** Four-point sparkle, the "single light" on a bright frame. */
function sparkle(g, x, y, s, t) {
  g.save()
  g.fillStyle = radial(g, x, y, s * 5, [
    [0, 'rgba(26,120,255,0.45)'],
    [1, 'rgba(26,120,255,0)'],
  ])
  g.fillRect(x - s * 5, y - s * 5, s * 10, s * 10)
  g.translate(x, y)
  g.rotate(t * 0.6)
  g.beginPath()
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const r = i % 2 ? s * 0.28 : s * 1.7
    g.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  g.closePath()
  g.fillStyle = '#ffffff'
  g.fill()
  g.strokeStyle = '#1A56DB'
  g.lineWidth = 2.5
  g.stroke()
  g.restore()
}

/* ───────── 2D motion: speed profiles, suspension, dust ───────── */

const smoothstep = (u) => u * u * (3 - 2 * u)

/** Speed keyframes [[t, px/s], ...], eased between keys. */
function speedAt(keys, t) {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [ta, va] = keys[i - 1]
      const [tb, vb] = keys[i]
      return lerp(va, vb, smoothstep((t - ta) / (tb - ta)))
    }
  }
  return keys[keys.length - 1][1]
}

/** Distance travelled since the first key, current speed and acceleration. */
function drive(keys, t) {
  const t0 = keys[0][0]
  let d = 0
  if (t <= t0) d = (t - t0) * keys[0][1]
  else {
    const steps = Math.ceil((t - t0) * 120)
    const dt = (t - t0) / steps
    for (let i = 0; i < steps; i++) d += speedAt(keys, t0 + (i + 0.5) * dt) * dt
  }
  const h = 1 / 60
  return { d, v: speedAt(keys, t), a: (speedAt(keys, t + h) - speedAt(keys, t - h)) / (2 * h) }
}

/** Squat under throttle, dive under braking, and a damped settle after stopping. */
function carPitch(a, t, stopAt) {
  let p = clamp(-a * 0.000022, -0.035, 0.035)
  if (stopAt != null && t > stopAt) p += 0.024 * Math.exp(-(t - stopAt) * 5) * Math.sin((t - stopAt) * 13)
  return p
}

/** Small road texture bounce, scaled by speed. */
const roadLift = (t, v) => (Math.sin(t * 17) * 0.6 + Math.sin(t * 29 + 1) * 0.4) * clamp(v / 1500) * 1.4

/** Dust puffs kicked up behind the rear tyre; `ground` = how fast the road moves left in frame. */
function dust(g, t, x, y, speed, o = {}) {
  const amount = clamp(speed / 1400)
  if (amount <= 0.02) return
  const life = 0.7
  const step = 0.05
  const base = Math.floor(t / step) * step
  g.save()
  g.fillStyle = o.color || '#f1e6d0'
  for (let k = 0; k < life / step; k++) {
    const birth = base - k * step
    const age = t - birth
    const r = rng(Math.round(birth * 1000) + 7)
    const px = x - age * (o.ground ?? speed) * 0.55 - r() * 12
    const py = y - age * (22 + r() * 30)
    g.globalAlpha = (o.alpha ?? 0.35) * amount * (1 - age / life) ** 1.5
    g.beginPath()
    g.arc(px, py, 5 + age * 46 * (0.7 + r() * 0.6), 0, Math.PI * 2)
    g.fill()
  }
  g.restore()
}

export function createRenderer(canvas, assets) {
  const S = canvas.width / W
  const g = canvas.getContext('2d', { alpha: false })
  g.__s = S
  const buf = new OffscreenCanvas(canvas.width, canvas.height)
  const bg = buf.getContext('2d', { alpha: false })
  bg.__s = S
  const layers = new Map()

  function layer(key, w, h, draw) {
    let L = layers.get(key)
    if (!L) {
      const c = new OffscreenCanvas(Math.ceil(w * S), Math.ceil(h * S))
      const lg = c.getContext('2d')
      lg.__s = S
      lg.scale(S, S)
      draw(lg, w, h)
      L = { c, w, h }
      layers.set(key, L)
    }
    return L
  }

  function blitWrap(g, L, offset, y, o = {}) {
    const w = L.w
    let x = -(((offset % w) + w) % w) - w
    g.save()
    if (o.alpha != null) g.globalAlpha *= o.alpha
    if (o.flip) {
      g.translate(0, y * 2 + L.h)
      g.scale(1, -1)
    }
    for (; x < W + w; x += w) g.drawImage(L.c, x, y, w, L.h)
    g.restore()
  }

  function dayClouds() {
    return layer('dayCloudsSoft', 2400, 460, (lg, w) => {
      const r = rng(31)
      for (let i = 0; i < 7; i++) {
        const cx = (i / 7) * w + r() * 140
        const cy = 130 + r() * 200
        const sz = 34 + r() * 40
        for (const ox of [0, -w, w]) cloud(lg, cx + ox, cy, sz, '#ffffff', '#cfe0f3')
      }
    })
  }

  function farCity() {
    return layer('d1far', 2400, 460, (lg, w, h) =>
      skyline(lg, w, h, 11, { draw: buildingDay, minW: 50, maxW: 120, minH: 120, maxH: 330, gap: 10, palette: DAY_FAR, glass: '#c4def3', line: 'rgba(90,130,175,0.3)', floor: 18 }))
  }

  /** Bright "studio sky" behind the phone demos. */
  function studioBackdrop(g, t, o = {}) {
    const hy = o.horizon ?? 800
    g.fillStyle = vGrad(g, -100, hy, [
      [0, '#86c3f3'],
      [0.6, '#cbe6fb'],
      [1, '#f3f9ff'],
    ])
    g.fillRect(-300, -300, W + 600, hy + 600)
    g.fillStyle = radial(g, 1680, 110, 760, [
      [0, 'rgba(255,248,222,0.95)'],
      [1, 'rgba(255,248,222,0)'],
    ])
    g.fillRect(-300, -300, W + 600, H + 600)
    blitWrap(g, dayClouds(), t * 12, -40, { alpha: 0.8 })
    g.fillStyle = vGrad(g, hy, H + 100, [
      [0, '#f7fbff'],
      [1, '#d9e7f7'],
    ])
    g.fillRect(-300, hy, W + 600, H - hy + 400)
    g.save()
    g.beginPath()
    g.rect(-300, hy, W + 600, H - hy + 300)
    g.clip()
    g.strokeStyle = 'rgba(26,86,219,0.12)'
    g.lineWidth = 1.2
    for (let i = -24; i <= 24; i++) {
      g.beginPath()
      g.moveTo(W / 2 + i * 26, hy)
      g.lineTo(W / 2 + i * 260, H + 60)
      g.stroke()
    }
    const sp = (t * 0.35) % 1
    for (let k = 0; k < 14; k++) {
      const z = (k + sp) / 14
      g.globalAlpha = z
      g.beginPath()
      g.moveTo(-300, hy + (H - hy + 60) * z * z)
      g.lineTo(W + 300, hy + (H - hy + 60) * z * z)
      g.stroke()
    }
    g.restore()
    particles(g, t, { seed: 77, count: 40, speed: 22, size: 2, alpha: 0.5, color: '#ffffff', goldRatio: 0.4 })
  }

  /* ── Scene 1 — The Challenge (0–7) ── */
  function sceneChallenge(g, t) {
    g.save()
    zoomAbout(g, 1 + 0.06 * ease.inOutSine(prog(t, 0, 7)), 960, 600)
    sunnySky(g, t, { horizon: 820, sunX: 1520, sunY: 170 })
    blitWrap(g, dayClouds(), t * 14, -10)
    blitWrap(g, farCity(), t * 8, 800 - 460)
    haze(g, 420, 800, 0.4)
    const mid = layer('d1mid', 2400, 580, (lg, w, h) =>
      skyline(lg, w, h, 23, { draw: buildingDay, minW: 60, maxW: 150, minH: 180, maxH: 470, gap: 18, palette: DAY_TOWER, glass: '#a3cff0', line: 'rgba(40,70,115,0.4)', floor: 22 }))
    blitWrap(g, mid, t * 18, 806 - 580)
    haze(g, 560, 806, 0.18)
    const near = layer('d1near', 2400, 720, (lg, w, h) =>
      skyline(lg, w, h, 37, { draw: buildingDay, minW: 90, maxW: 210, minH: 300, maxH: 660, gap: 40, palette: DAY_GLASS, glass: '#7fb9e6', line: 'rgba(30,55,95,0.5)', floor: 26 }))
    blitWrap(g, near, t * 30, 812 - 720)
    // park below the expressway
    g.fillStyle = vGrad(g, 840, H + 100, [
      [0, '#86c96f'],
      [1, '#4f9a4a'],
    ])
    g.fillRect(-300, 840, W + 600, H)
    for (let i = 0; i < 14; i++) {
      const x = ((((i * 190 - t * 40) % 2660) + 2660) % 2660) - 300
      tree(g, x, 1060 + (i % 2) * 18, 120 + (i % 3) * 18, t, i)
    }
    // concrete deck with the jam on top
    g.fillStyle = '#5d6676'
    g.fillRect(-300, 838, W + 600, 14)
    g.fillStyle = '#8f99aa'
    g.fillRect(-300, 800, W + 600, 40)
    g.fillStyle = '#d3dae4'
    g.fillRect(-300, 800, W + 600, 3)
    jam(g, t)
    g.restore()

    // listing cards pile up: the confusing hunt for a ride
    const conv = ease.inCubic(prog(t, 4.5, 5.6))
    if (t > 1.4 && t < 5.7) {
      const r = rng(42)
      const cards = []
      for (let i = 0; i < 16; i++) {
        cards.push({
          x: 180 + r() * 1560, y: 330 + r() * 470, w: 200 + r() * 90, rot: (r() - 0.5) * 0.3,
          t0: 1.5 + i * 0.16, status: CARD_STATUS[i % CARD_STATUS.length], type: ['sport', 'sedan', 'scooter', 'suv', 'van', 'compact'][i % 6], ph: r() * 10, z: r(),
        })
      }
      cards.sort((a, b) => a.z - b.z)
      for (const c of cards) {
        const a = ease.outCubic(prog(t, c.t0, c.t0 + 0.4)) * (1 - conv)
        if (a <= 0) continue
        const chaos = prog(t, 1.8, 4.4)
        const jx = Math.sin(t * (3 + c.z * 4) + c.ph) * 18 * chaos + (Math.sin(t * 40 + c.ph) > 0.93 ? 14 : 0)
        const jy = Math.cos(t * (2.5 + c.z * 3) + c.ph) * 12 * chaos
        const cx = lerp(c.x + jx, 960, conv)
        const cy = lerp(c.y + jy, 470, conv)
        const sc = lerp(0.85 + c.z * 0.35, 0.05, conv) * lerp(2.6, 1, ease.outCubic(prog(t, c.t0, c.t0 + 0.55)))
        g.save()
        g.translate(cx, cy)
        g.rotate(c.rot * (1 - conv) + Math.sin(t + c.ph) * 0.04 * chaos)
        g.scale(sc, sc)
        g.globalAlpha = a
        holoCard(g, c.w, c)
        g.restore()
      }
    }
    failedSearch(g, t)

    // clutter clears to a single bright light
    const veil = ease.inOutCubic(prog(t, 4.7, 5.7))
    g.fillStyle = `rgba(246,250,255,${0.86 * veil})`
    g.fillRect(0, 0, W, H)
    if (t > 4.9) {
      const grow = ease.outBack(prog(t, 4.9, 5.4))
      sparkle(g, 960, 470, 34 * grow * (1 + 0.08 * Math.sin(t * 7)), t)
    }
    revealText(g, 'Your journey deserves better.', 960, 650, prog(t, 5.25, 6.0), {
      size: 80, weight: 800, color: INK, alpha: 1 - prog(t, 6.65, 6.95), edgeColor: '#1A56DB',
    })
    const bloom = ease.inCubic(prog(t, 6.55, 7))
    if (bloom > 0) {
      g.fillStyle = radial(g, 960, 470, 200 + 2400 * bloom, [
        [0, `rgba(255,255,255,${bloom})`],
        [1, 'rgba(255,255,255,0)'],
      ])
      g.fillRect(0, 0, W, H)
      g.fillStyle = `rgba(250,253,255,${bloom * bloom})`
      g.fillRect(0, 0, W, H)
    }
  }

  /** Bumper-to-bumper traffic with brake lights; scooters and motorbikes weave through. */
  function jam(g, t) {
    const order = ['sedan', 'suv', 'van', 'compact', 'sedan', 'suv', 'compact', 'van']
    const crawl = t * 16
    const gap = 128
    for (let i = -2; i < 18; i++) {
      const type = order[((i % order.length) + order.length) % order.length]
      const x = i * gap + (crawl % gap) - (i % 3) * 8
      const lurch = Math.max(0, Math.sin(t * 1.3 + i)) * 4
      drawVehicle(g, { type, x: x + lurch, y: 838, scale: 0.19, color: ['#5a6d96', '#b04a5a', '#3f8a7f', '#c9a96a'][i & 3], shadow: false })
      glowDot(g, x + lurch - 0.19 * 215, 820, 14 + 3 * Math.sin(t * 5 + i), 'rgba(255,40,70,0.75)')
    }
    for (let i = 0; i < 4; i++) {
      const type = i % 2 ? 'scooter' : 'sport'
      const x = ((t * (150 + i * 30) + i * 560) % (W + 400)) - 200
      drawVehicle(g, { type, x, y: 852 + (i % 2) * 6, scale: 0.42, color: ['#d1243f', '#f4f6fa', '#f2b544', '#1d4ed8'][i], dist: x * 2, shadow: false })
    }
  }

  const CARD_STATUS = [
    { label: 'UNAVAILABLE', col: '230,60,80' },
    { label: 'NO REPLY', col: '240,150,40' },
    { label: 'FULLY BOOKED', col: '230,60,80' },
    { label: 'SEARCHING…', col: '26,120,230' },
    { label: 'PRICE ON REQUEST', col: '240,150,40' },
  ]

  /** A search that comes back empty. */
  function failedSearch(g, t) {
    const a = ease.outCubic(prog(t, 0.5, 0.9)) * (1 - prog(t, 4.4, 4.8))
    if (a <= 0) return
    const query = 'Car or motorcycle for this weekend'
    const typed = query.slice(0, Math.floor(query.length * prog(t, 0.85, 2.1)))
    const w = 980
    const x = 960 - w / 2
    const y = 120 + (1 - a) * -40
    g.save()
    g.globalAlpha *= a
    g.shadowColor = 'rgba(20,40,80,0.28)'
    g.shadowBlur = blur(g, 30)
    roundRect(g, x, y, w, 88, 44)
    g.fillStyle = 'rgba(255,255,255,0.96)'
    g.fill()
    g.shadowColor = 'transparent'
    g.strokeStyle = 'rgba(26,86,219,0.55)'
    g.lineWidth = 2
    g.stroke()
    g.strokeStyle = '#1A56DB'
    g.lineWidth = 4
    g.beginPath()
    g.arc(x + 56, y + 40, 15, 0, Math.PI * 2)
    g.moveTo(x + 67, y + 51)
    g.lineTo(x + 79, y + 63)
    g.stroke()
    text(g, typed, x + 104, y + 45, { size: 34, weight: 600, align: 'left', color: '#13233f' })
    if (t < 2.2 && Math.sin(t * 18) > 0) {
      g.fillStyle = '#1A56DB'
      g.fillRect(x + 108 + textWidth(g, typed, 34, 600), y + 26, 3, 38)
    }
    if (t > 2.1 && t < 2.9) {
      g.strokeStyle = '#1A56DB'
      g.lineWidth = 5
      g.lineCap = 'round'
      g.beginPath()
      g.arc(x + w - 56, y + 44, 18, t * 9, t * 9 + 4.2)
      g.stroke()
    }
    const res = ease.outBack(prog(t, 2.85, 3.25))
    if (res > 0) {
      const shake = Math.sin(t * 60) * 6 * (1 - prog(t, 2.9, 3.5))
      const label = 'No vehicles available'
      const rw = textWidth(g, label, 30, 700) + 96
      g.save()
      g.translate(960 + shake, y + 150)
      g.scale(res, res)
      g.shadowColor = 'rgba(120,20,40,0.2)'
      g.shadowBlur = blur(g, 20)
      roundRect(g, -rw / 2, -32, rw, 64, 32)
      g.fillStyle = '#fff1f3'
      g.fill()
      g.shadowColor = 'transparent'
      g.strokeStyle = 'rgba(230,60,80,0.9)'
      g.lineWidth = 2
      g.stroke()
      g.fillStyle = '#e63c50'
      g.beginPath()
      g.arc(-rw / 2 + 36, 0, 9, 0, Math.PI * 2)
      g.fill()
      text(g, label, -rw / 2 + 60, 1, { size: 30, weight: 700, align: 'left', color: '#8a1022' })
      g.restore()
    }
    g.restore()
  }

  function holoCard(g, w, c) {
    const h = w * 0.7
    const col = c.status.col
    g.save()
    g.shadowColor = 'rgba(20,40,80,0.28)'
    g.shadowBlur = blur(g, 22)
    roundRect(g, -w / 2, -h / 2, w, h, 14)
    g.fillStyle = 'rgba(255,255,255,0.95)'
    g.fill()
    g.restore()
    roundRect(g, -w / 2, -h / 2, w, h, 14)
    g.strokeStyle = `rgba(${col},0.9)`
    g.lineWidth = 2.5
    g.stroke()
    g.save()
    roundRect(g, -w / 2 + 10, -h / 2 + 10, w - 20, h * 0.5, 9)
    g.fillStyle = 'rgba(26,86,219,0.08)'
    g.fill()
    g.clip()
    drawVehicle(g, { type: c.type, x: 0, y: -h / 2 + 10 + h * 0.46, scale: w / (isTwoWheeler(c.type) ? 300 : 640), holo: 0, shadow: false, wire: '#1A56DB' })
    g.restore()
    g.fillStyle = 'rgba(30,50,85,0.28)'
    roundRect(g, -w / 2 + 14, h * 0.12, w * 0.55, 9, 4)
    g.fill()
    g.fillStyle = 'rgba(30,50,85,0.16)'
    roundRect(g, -w / 2 + 14, h * 0.25, w * 0.38, 8, 4)
    g.fill()
    g.fillStyle = `rgba(${col},0.55)`
    roundRect(g, w / 2 - 14 - w * 0.22, h * 0.21, w * 0.22, 18, 9)
    g.fill()
    const label = c.status.label
    const lw = textWidth(g, label, 15, 800, 1.5) + 22
    g.save()
    g.translate(-w / 2 + 16 + lw / 2, -h / 2 + 24)
    g.rotate(-0.06)
    roundRect(g, -lw / 2, -13, lw, 26, 6)
    g.fillStyle = `rgba(${col},0.95)`
    g.fill()
    text(g, label, 0, 1, { size: 15, weight: 800, spacing: 1.5, color: '#ffffff' })
    g.restore()
  }

  /* ── Scene 2 — Introducing RentaraH (7–15) ── */
  function sceneIntro(g, t) {
    const u = t - 7
    studioBackdrop(g, t, { horizon: 800 })
    for (let i = 0; i < 3; i++) {
      const p = prog(u, 0.05 + i * 0.18, 1.0 + i * 0.18)
      if (p <= 0 || p >= 1) continue
      const y = 470 + (i - 1) * 70
      const x = lerp(-600, W + 600, ease.inOutCubic(p))
      const col = i === 1 ? '242,176,60' : '26,86,219'
      const gr = g.createLinearGradient(x - 700, 0, x, 0)
      gr.addColorStop(0, `rgba(${col},0)`)
      gr.addColorStop(1, `rgba(${col},0.9)`)
      g.fillStyle = gr
      g.fillRect(x - 700, y - 2, 700, 4)
    }
    // logo lockup, then it docks top-left as a brand bug for the app demo
    const logo = assets.logoRaw
    const logoIn = ease.outCubic(prog(u, 0.3, 1.2))
    const dock = ease.inOutCubic(prog(u, 1.55, 2.2))
    if (logoIn > 0) {
      const lw = lerp(860 * (0.94 + 0.06 * logoIn), 300, dock)
      const lh = lw * (logo.height / logo.width)
      const lx = lerp(960, 140 + 150, dock)
      const ly = lerp(500, 96, dock)
      g.save()
      g.globalAlpha = logoIn
      g.shadowColor = 'rgba(26,86,219,0.18)'
      g.shadowBlur = blur(g, 30)
      g.drawImage(logo, lx - lw / 2, ly - lh / 2, lw, lh)
      g.restore()
      text(g, 'MEET', 960, 500 - lh / 2 - 60, { size: 46, weight: 800, spacing: 26, color: '#1A56DB', alpha: logoIn * prog(u, 0.7, 1.1) * (1 - dock * 3) })
    }
    // app-led demo on a phone (real captured screens)
    const enter = ease.outCubic(prog(u, 1.8, 2.6))
    if (enter > 0) {
      const app = demoA(t)
      const cx = 1240
      const cy = 545 + Math.sin(u * 1.3) * 5
      const G = phoneGeom(cx, cy)
      const focus = [
        [bump(t, 9.85, 10.3, 10.75, 11.25), G.at(195, 492)],
        [bump(t, 12.6, 13.0, 13.5, 13.95), G.at(136, 300)],
        [bump(t, 14.0, 14.35, 14.75, 15.2) * 0.7, G.at(195, 330)],
      ].sort((a, b) => b[0] - a[0])[0]
      const zf = 1 + 0.42 * focus[0]
      const [fx, fy] = focus[1]
      const Z = (p) => [fx + (p[0] - fx) * zf, fy + (p[1] - fy) * zf]
      g.save()
      zoomAbout(g, zf, fx, fy)
      g.translate(0, (1 - ease.outCubic(enter)) * 420)
      zoomAbout(g, lerp(0.55, 1, ease.outBack(enter)), cx, cy)
      const P = phone(g, assets, cx, cy, { app, rot: (1 - enter) * 0.4 + Math.sin(u * 0.9) * 0.018 })
      text(g, PREVIEW_LABEL, cx, P.top + P.bh + 30, { size: 17, weight: 600, color: 'rgba(30,50,85,0.65)', spacing: 1, alpha: enter })
      g.restore()
      const at = (cssX, cssY) => Z(G.at(cssX, cssY))
      chip(g, 'Search by city & dates', 1370, 250, prog(t, 9.7, 10.3), { alpha: 1 - prog(t, 11.2, 11.5), to: at(330, 330) })
      chip(g, 'Compare daily rates', 1370, 760, prog(t, 11.9, 12.5), { alpha: 1 - prog(t, 13.3, 13.6), to: at(360, 560) })
      chip(g, 'See the trip total first', 1370, 230, prog(t, 14.1, 14.7), { alpha: 1 - prog(t, 15.2, 15.5), to: at(360, 330) })
      // the hero car materialises off the screen and drives into the next scene
      const holo = prog(t, 14.25, 14.9)
      if (holo > 0) {
        const D = drive([[14.6, 0], [15.5, 1600]], t)
        const cxCar = 1620 + Math.max(0, D.d)
        drawCar(g, { type: 'sedan', x: cxCar, y: 960, scale: 0.62, color: HERO, dist: cxCar, speed: D.v, pitch: carPitch(D.a, t), holo: ease.inOutCubic(holo), alpha: prog(t, 14.25, 14.4), wire: '#1A56DB' })
      }
    }
    const ta = 1 - prog(t, 14.6, 15.0)
    punchLine(g, 'Discover a new', 180, 470, prog(t, 9.1, 9.7), { size: 92, alpha: ta })
    punchLine(g, 'way to rent.', 180, 590, prog(t, 9.35, 9.95), { size: 92, alpha: ta, fill: '#0ea5e9' })
  }

  /** Where a CSS point inside the phone's content area lands in frame px. */
  function phoneGeom(cx, cy, k = 1.03) {
    const bw = PHONE.cssW * k + 30
    const bh = (PHONE.cssH + PHONE.status) * k + 30
    const left = cx - bw / 2 + 15
    const top = cy - bh / 2 + 15 + PHONE.status * k
    return { at: (x, y) => [left + x * k, top + y * k] }
  }

  /** Screen states for the first app demo (landing → search → detail). */
  function demoA(t) {
    const hs = assets.hotspots
    const btn = hs.landing.search
    const card = hs.search.card
    const searchScroll = 760 * ease.inOutCubic(prog(t, 11.4, 12.8))
    const detailScroll = 470 * ease.inOutCubic(prog(t, 13.95, 14.9))
    const tapA = { x: btn.x + btn.w / 2, y: btn.y + btn.h / 2, p: prog(t, 10.35, 10.9) }
    const tapB = { x: card.x + 120, y: card.y - 150 - searchScroll, p: prog(t, 13.05, 13.6) }
    if (t < 10.7) return { screen: 'landing', scroll: 0, taps: [tapA] }
    if (t < 13.4) return { screen: 'search', scroll: searchScroll, from: 'landing', push: prog(t, 10.7, 11.15), taps: [tapA, tapB] }
    return { screen: 'detail', scroll: detailScroll, from: 'search', fromScroll: searchScroll, push: prog(t, 13.4, 13.85), taps: [tapB] }
  }

  // A light sweep that only lights the logo's own pixels.
  let shimmerCanvas = null
  function logoShimmer(g, x, y, w, h, p, alpha = 1, img = assets.logo) {
    if (p <= 0 || p >= 1) return
    const cw = Math.ceil(w * S)
    const ch = Math.ceil(h * S)
    if (!shimmerCanvas || shimmerCanvas.width !== cw || shimmerCanvas.height !== ch) shimmerCanvas = new OffscreenCanvas(cw, ch)
    const sg = shimmerCanvas.getContext('2d')
    sg.setTransform(1, 0, 0, 1, 0, 0)
    sg.globalCompositeOperation = 'source-over'
    sg.clearRect(0, 0, cw, ch)
    sg.drawImage(img, 0, 0, cw, ch)
    sg.globalCompositeOperation = 'source-in'
    const sx = -0.2 * cw + 1.4 * cw * ease.inOutCubic(p)
    const band = 0.12 * cw
    sg.setTransform(1, 0, -0.35, 1, 0.35 * ch, 0)
    const gr = sg.createLinearGradient(sx - band, 0, sx + band, 0)
    gr.addColorStop(0, 'rgba(255,255,255,0)')
    gr.addColorStop(0.5, 'rgba(255,255,255,0.75)')
    gr.addColorStop(1, 'rgba(255,255,255,0)')
    sg.fillStyle = gr
    sg.fillRect(sx - band, 0, band * 2, ch)
    g.save()
    g.globalAlpha *= alpha
    g.globalCompositeOperation = 'lighter'
    g.drawImage(shimmerCanvas, x, y, w, h)
    g.restore()
  }

  function bigWord(g, str, t, a, b) {
    const out = prog(t, b - 0.25, b)
    punchLine(g, str, 170 + (t - a) * 12, 230, prog(t, a, a + 0.45), { size: 128, weight: 900, spacing: 4, alpha: 1 - out })
  }

  function caption(g, str, t, a, b) {
    const alpha = 1 - prog(t, b - 0.35, b)
    punchLine(g, str, 960, 180, prog(t, a, a + 0.6), { size: 84, weight: 800, align: 'center', alpha, fill: 'rgba(26,86,219,0.94)' })
  }

  /** Foreground trees whipping past on a near layer (depth + speed). */
  function fgTrees(g, t, travel, o) {
    const span = W + o.spacing
    for (let k = 0; k < Math.ceil(span / o.spacing) + 1; k++) {
      const x = W + 200 - ((((travel + k * o.spacing) % span) + span) % span)
      tree(g, x, o.base, o.size * (0.85 + (k % 3) * 0.12), t, k * 1.7)
    }
  }

  /* ── Scene 3a — BGC-inspired city, sunny ── */
  function shotCity(g, t) {
    const D = drive([[15, 900], [15.9, 1650], [17.7, 1750]], t)
    sunnySky(g, t, { horizon: 880, sunX: 1640, sunY: 140 })
    blitWrap(g, dayClouds(), (t - 15) * 20, -20)
    const far = layer('cityDayFar', 2400, 600, (lg, w, h) =>
      skyline(lg, w, h, 51, { draw: buildingDay, minW: 50, maxW: 120, minH: 200, maxH: 520, gap: 8, palette: DAY_FAR, glass: '#c6dff3', line: 'rgba(90,130,175,0.3)', floor: 18 }))
    blitWrap(g, far, D.d * 0.04, 880 - 600)
    haze(g, 420, 880, 0.38)
    const mid = layer('cityDayMid', 2400, 720, (lg, w, h) =>
      skyline(lg, w, h, 63, { draw: buildingDay, minW: 80, maxW: 180, minH: 300, maxH: 680, gap: 30, palette: DAY_GLASS, glass: '#86bfe8', line: 'rgba(30,55,95,0.45)', floor: 24 }))
    blitWrap(g, mid, D.d * 0.12, 884 - 720)
    // sidewalk, street trees, road
    g.fillStyle = '#dfe4eb'
    g.fillRect(-300, 880, W + 600, 28)
    g.fillStyle = '#b3bccb'
    g.fillRect(-300, 906, W + 600, 5)
    fgTrees(g, t, D.d * 0.55, { spacing: 420, base: 896, size: 150 })
    road(g, 910, 170, D.d, { fill: vGrad(g, 910, 1080, [[0, '#646c7a'], [1, '#4c5260']]), dashAt: 80, dash: 'rgba(255,255,255,0.9)', edgeColor: 'rgba(255,255,255,0.75)' })
    speedLines(g, t, { seed: 2, count: 20, y0: 620, y1: 1040, speed: 2400, alpha: 0.3, color: '#ffffff' })
    const scale = 1.3
    dust(g, t, 900 - 138 * scale, 1000, D.v, { ground: D.v, alpha: 0.2, color: '#e6e9ee' })
    drawCar(g, { type: 'sedan', x: 900, y: 1000, scale, color: HERO, dist: D.d, speed: D.v, pitch: carPitch(D.a, t), lift: roadLift(t, D.v) })
    bigWord(g, 'EXPLORE.', t, 15.2, 17.45)
  }

  /* ── Scene 3b — Tagaytay-inspired ridge highway ── */
  function shotRidge(g, t) {
    const D = drive([[17.2, 1150], [19.8, 1350]], t)
    sunnySky(g, t, { horizon: 640, sunX: 1660, sunY: 120 })
    blitWrap(g, dayClouds(), (t - 17.2) * 14, -10)
    const farR = layer('ridgeFar', 2400, 420, (lg, w, h) =>
      ridge(lg, w, h, 7, { base: 300, amp: 120, freqs: [2, 3, 7, 13], stops: [[0, '#7b9fb2'], [1, '#8fb0b8']] }))
    blitWrap(g, farR, D.d * 0.015, 570 - 300, { alpha: 0.9 })
    haze(g, 400, 640, 0.3)
    g.fillStyle = vGrad(g, 570, 800, [
      [0, '#8ec7e4'],
      [1, '#4f97c7'],
    ])
    g.fillRect(-300, 570, W + 600, 230)
    const vx = 1180 - D.d * 0.01
    g.fillStyle = '#6c9a8a'
    g.beginPath()
    g.moveTo(vx - 300, 640)
    g.quadraticCurveTo(vx - 130, 585, vx - 46, 548)
    g.lineTo(vx + 46, 548)
    g.quadraticCurveTo(vx + 130, 585, vx + 300, 640)
    g.closePath()
    g.fill()
    g.strokeStyle = 'rgba(36,80,60,0.45)'
    g.lineWidth = 1.5
    g.stroke()
    g.fillStyle = 'rgba(255,255,255,0.55)'
    for (let i = 0; i < 40; i++) {
      const r = rng(i + 100)
      g.globalAlpha = 0.4 + 0.4 * Math.sin(t * 3 + i)
      g.fillRect(((r() * 2400 - D.d * 0.015) % 2000 + 2000) % 2000 - 40, 650 + r() * 110, 30 + r() * 40, 2)
    }
    g.globalAlpha = 1
    const midR = layer('ridgeMidDay', 2400, 520, (lg, w, h) =>
      ridge(lg, w, h, 9, { base: 300, amp: 160, freqs: [1, 3, 8, 17], stops: [[0, '#5fae6c'], [1, '#3b8150']], rimLight: 'rgba(255,250,215,0.7)' }))
    blitWrap(g, midR, D.d * 0.06, 520)
    const trees = layer('ridgeTreesDay', 2400, 260, (lg, w, h) => treeLine(lg, w, h, 13, { y: 150, size: 46, dark: '#2e6b40', light: '#4f9a5c' }))
    blitWrap(g, trees, D.d * 0.32, 650)
    road(g, 870, 90, D.d, { fill: vGrad(g, 870, 960, [[0, '#5a606c'], [1, '#444955']]), dashAt: 40, dash: 'rgba(255,240,200,0.95)' })
    g.fillStyle = vGrad(g, 960, H, [
      [0, '#6cb85a'],
      [1, '#3f8a3f'],
    ])
    g.fillRect(-300, 960, W + 600, 160)
    guardrail(g, 874, D.d, '#f4f7fa')
    const scale = 1.18
    dust(g, t, 880 - 134 * scale, 948, D.v, { ground: D.v, alpha: 0.3 })
    drawCar(g, { type: 'suv', x: 880, y: 948, scale, color: SUV, dist: D.d, speed: D.v, pitch: carPitch(D.a, t), lift: roadLift(t, D.v) })
    fgTrees(g, t, D.d * 1.25, { spacing: 1500, base: 1215, size: 150 })
    bigWord(g, 'DISCOVER.', t, 17.4, 19.65)
  }

  /* ── Scene 3c — the compact pulls up outside a café and parks ── */
  function shotCafe(g, t) {
    const keys = [[19.4, 1300], [20.65, 0]]
    const D = drive(keys, t)
    const stopX = 900
    const cx = stopX - drive(keys, 20.65).d + D.d
    sunnySky(g, t, { horizon: 420, sunX: 1700, sunY: 80 })
    // facade
    g.fillStyle = vGrad(g, 140, 790, [
      [0, '#f6ead4'],
      [1, '#ecdcbf'],
    ])
    g.fillRect(-300, 140, W + 600, 650)
    g.fillStyle = '#dcc7a2'
    g.fillRect(-300, 140, W + 600, 22)
    g.strokeStyle = 'rgba(120,90,50,0.12)'
    g.lineWidth = 2
    for (let y = 190; y < 790; y += 36) {
      g.beginPath()
      g.moveTo(-300, y)
      g.lineTo(W + 300, y)
      g.stroke()
    }
    for (let i = 0; i < 5; i++) {
      const x = 80 + i * 380
      g.fillStyle = vGrad(g, 196, 290, [
        [0, '#cfe8fa'],
        [1, '#8dbbe0'],
      ])
      g.fillRect(x, 196, 160, 94)
      g.strokeStyle = '#7a5a3c'
      g.lineWidth = 6
      g.strokeRect(x, 196, 160, 94)
    }
    // storefront
    const wx = 1000
    const wy = 400
    const ww = 820
    const wh = 360
    g.fillStyle = vGrad(g, wy, wy + wh, [
      [0, '#cde9fb'],
      [1, '#eef8ff'],
    ])
    g.fillRect(wx, wy, ww, wh)
    g.fillStyle = 'rgba(214,160,100,0.35)'
    for (let i = 0; i < 3; i++) g.fillRect(wx + 30, wy + 120 + i * 80, ww - 60, 10)
    g.fillStyle = 'rgba(255,255,255,0.45)'
    for (const ox of [80, 300, 520]) {
      g.beginPath()
      g.moveTo(wx + ox, wy)
      g.lineTo(wx + ox + 90, wy)
      g.lineTo(wx + ox - 30, wy + wh)
      g.lineTo(wx + ox - 120, wy + wh)
      g.closePath()
      g.fill()
    }
    g.strokeStyle = '#6b4a32'
    g.lineWidth = 12
    g.strokeRect(wx, wy, ww, wh)
    g.lineWidth = 6
    g.beginPath()
    g.moveTo(wx + ww / 2, wy)
    g.lineTo(wx + ww / 2, wy + wh)
    g.stroke()
    // striped awning with a breeze ripple
    const ax0 = wx - 40
    const ax1 = wx + ww + 40
    const stripes = 14
    for (let i = 0; i < stripes; i++) {
      const x0 = lerp(ax0, ax1, i / stripes)
      const x1 = lerp(ax0, ax1, (i + 1) / stripes)
      const drop = 70 + Math.sin(t * 3 + i * 0.6) * 3
      g.fillStyle = i % 2 ? '#ffffff' : '#1A56DB'
      g.beginPath()
      g.moveTo(x0 + 12, 330)
      g.lineTo(x1 + 12, 330)
      g.lineTo(x1, 330 + drop)
      g.quadraticCurveTo((x0 + x1) / 2, 330 + drop + 16, x0, 330 + drop)
      g.closePath()
      g.fill()
    }
    g.strokeStyle = 'rgba(15,35,71,0.5)'
    g.lineWidth = 2
    g.strokeRect(ax0 + 12, 326, ax1 - ax0, 6)
    roundRect(g, wx + ww / 2 - 170, 240, 340, 74, 16)
    g.fillStyle = '#0f2347'
    g.fill()
    text(g, 'CAFÉ', wx + ww / 2 + 18, 278, { size: 52, weight: 800, spacing: 14, color: '#ffffff' })
    g.strokeStyle = '#f2c46d'
    g.lineWidth = 4
    roundRect(g, wx + ww / 2 - 136, 262, 32, 30, 6)
    g.stroke()
    g.beginPath()
    g.arc(wx + ww / 2 - 100, 277, 8, -Math.PI / 2, Math.PI / 2)
    g.stroke()
    for (const px of [wx - 70, wx + ww + 70]) {
      g.fillStyle = '#b5653c'
      g.fillRect(px - 30, 720, 60, 70)
      tree(g, px, 726, 120, t, px)
    }
    // sidewalk + street
    g.fillStyle = '#e5e9ef'
    g.fillRect(-300, 790, W + 600, 60)
    g.strokeStyle = 'rgba(120,130,150,0.25)'
    for (let x = -300; x < W + 300; x += 120) {
      g.beginPath()
      g.moveTo(x, 790)
      g.lineTo(x - 30, 850)
      g.stroke()
    }
    g.fillStyle = '#b8c1cf'
    g.fillRect(-300, 846, W + 600, 6)
    g.fillStyle = vGrad(g, 852, H, [
      [0, '#666e7c'],
      [1, '#4e5463'],
    ])
    g.fillRect(-300, 852, W + 600, 300)
    g.fillStyle = 'rgba(255,255,255,0.8)'
    for (let x = -300; x < W + 300; x += 220) g.fillRect(x, 1040, 110, 6)
    const scale = 1.25
    dust(g, t, cx - 112 * scale, 948, D.v, { ground: 0, alpha: 0.35 })
    drawCar(g, { type: 'compact', x: cx, y: 948, scale, color: COMPACT, dist: D.d, speed: D.v, pitch: carPitch(D.a, t, 20.65), time: t })
    // location pin pops once it has parked
    const pa = ease.outBack(prog(t, 20.7, 21.05))
    if (pa > 0) {
      const bob = Math.sin(t * 2.4) * 6
      g.save()
      g.translate(stopX, 650 + bob)
      g.scale(pa, pa)
      g.shadowColor = 'rgba(26,86,219,0.4)'
      g.shadowBlur = blur(g, 20)
      g.fillStyle = '#1A56DB'
      g.beginPath()
      g.arc(0, 0, 30, Math.PI * 0.85, Math.PI * 2.15)
      g.lineTo(0, 54)
      g.closePath()
      g.fill()
      g.shadowColor = 'transparent'
      g.fillStyle = '#ffffff'
      g.beginPath()
      g.arc(0, 0, 12, 0, Math.PI * 2)
      g.fill()
      g.restore()
      g.save()
      g.globalAlpha = pa * 0.7
      g.strokeStyle = '#1A56DB'
      g.lineWidth = 3
      g.beginPath()
      g.ellipse(stopX, 952, 150 + 16 * Math.sin(t * 3), 18, 0, 0, Math.PI * 2)
      g.stroke()
      g.restore()
    }
    bigWord(g, 'GO FURTHER.', t, 19.6, 21.65)
  }

  /* ── Scene 3d — second app demo: car details → rental map ── */
  function shotShowcase(g, t) {
    const u = t - 21.4
    studioBackdrop(g, t, { horizon: 880 })
    const enter = ease.outCubic(prog(u, 0, 0.55))
    const detailScroll = lerp(560, 1010, ease.inOutCubic(prog(t, 21.6, 22.9)))
    const moto = assets.hotspots.map.moto
    const app = t < 23.05
      ? { screen: 'detail', scroll: detailScroll }
      : { screen: 'map', scroll: 0, from: 'detail', fromScroll: detailScroll, push: prog(t, 23.05, 23.5), taps: moto ? [{ x: moto.x + moto.w / 2, y: moto.y + moto.h / 2, p: prog(t, 23.9, 24.45) }] : [] }
    const cx = 780
    const cy = 545 + Math.sin(u * 1.4) * 5
    const G = phoneGeom(cx, cy)
    const zf = 1 + 0.35 * bump(t, 23.55, 23.9, 24.4, 24.9)
    const [fx, fy] = moto ? G.at(moto.x + moto.w / 2, moto.y + moto.h / 2) : [cx, cy]
    const Z = (p) => [fx + (p[0] - fx) * zf, fy + (p[1] - fy) * zf]
    g.save()
    zoomAbout(g, zf, fx, fy)
    g.translate((1 - enter) * -500, 0)
    zoomAbout(g, lerp(0.7, 1, ease.outBack(enter)), cx, cy)
    const P = phone(g, assets, cx, cy, { app, alpha: enter, rot: -0.3 * (1 - enter) + Math.sin(u * 0.9) * 0.018 })
    g.restore()
    const at = (cssX, cssY) => Z(G.at(cssX, cssY))
    chip(g, 'Specs at a glance', 620, 250, prog(t, 21.8, 22.35), { align: 'right', alpha: 1 - prog(t, 22.9, 23.15), to: at(30, 200) })
    chip(g, 'Rentals on the map', 620, 760, prog(t, 23.5, 24.0), { align: 'right', to: at(185, 385) })
    if (moto) chip(g, 'Cars & motorcycles', 620, 330, prog(t, 23.75, 24.25), { align: 'right', to: at(moto.x, moto.y + moto.h / 2) })
    text(g, t < 23.3 ? PREVIEW_LABEL : `${PREVIEW_LABEL} · Map tiles © Esri`, cx, P.top + P.bh + 30, { size: 17, weight: 600, color: 'rgba(30,50,85,0.65)', spacing: 1, alpha: enter })
    punchLine(g, 'Search.', 1210, 380, prog(t, 21.7, 22.2), { size: 104, weight: 900 })
    punchLine(g, 'Compare.', 1210, 520, prog(t, 22.4, 22.9), { size: 104, weight: 900, fill: '#0ea5e9' })
    punchLine(g, 'Go.', 1210, 660, prog(t, 23.2, 23.7), { size: 104, weight: 900, fill: '#f2c46d', color: '#0b1430' })
  }

  /* ── Scene 4a — sunny coastal highway ── */
  function shotCoast(g, t) {
    const D = drive([[25, 700], [29.6, 840]], t)
    sunnySky(g, t, { horizon: 600, sunX: 1450, sunY: 150 })
    blitWrap(g, dayClouds(), (t - 25) * 10, -30)
    const isles = layer('coastIsles', 2400, 300, (lg, w, h) =>
      ridge(lg, w, h, 15, { base: 260, amp: 70, freqs: [1, 2, 5, 9], stops: [[0, '#7fb3a6'], [1, '#9cc7bb']], rimLight: 'rgba(255,255,255,0.5)' }))
    blitWrap(g, isles, D.d * 0.01, 600 - 260)
    haze(g, 480, 600, 0.35)
    g.fillStyle = vGrad(g, 600, 800, [
      [0, '#62cde3'],
      [0.6, '#2ea4cf'],
      [1, '#1f86b9'],
    ])
    g.fillRect(-300, 600, W + 600, 200)
    g.save()
    for (let i = 0; i < 140; i++) {
      const r = rng(i + 400)
      const gx = 1450 + (r() - 0.5) * 900 * (0.3 + r())
      const gy = 606 + r() * 180
      g.globalAlpha = (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 4 + i))) * (1 - (gy - 600) / 220)
      g.fillStyle = '#ffffff'
      g.fillRect(gx - D.d * 0.008, gy, 12 + r() * 34, 2)
    }
    g.restore()
    // beach and gentle surf
    g.fillStyle = '#f4e2b4'
    g.fillRect(-300, 760, W + 600, 46)
    g.strokeStyle = 'rgba(255,255,255,0.85)'
    g.lineWidth = 3
    g.beginPath()
    for (let x = -300; x <= W + 300; x += 20) {
      const yy = 762 + Math.sin(x * 0.012 + t * 1.6) * 4
      x === -300 ? g.moveTo(x, yy) : g.lineTo(x, yy)
    }
    g.stroke()
    road(g, 800, 50, D.d, { fill: vGrad(g, 800, 850, [[0, '#5d6470'], [1, '#474c58']]), dashAt: 24, dash: 'rgba(255,255,255,0.9)', edgeColor: 'rgba(255,255,255,0.85)' })
    guardrail(g, 806, D.d, '#f6f8fb')
    g.fillStyle = vGrad(g, 850, H, [
      [0, '#78c266'],
      [1, '#4b9447'],
    ])
    g.fillRect(-300, 850, W + 600, 300)
    g.fillStyle = '#fff6b0'
    for (let i = 0; i < 60; i++) {
      const r = rng(i + 900)
      const fx = ((r() * 2400 - D.d * 1.0) % 2400 + 2400) % 2400 - 200
      g.beginPath()
      g.arc(fx, 880 + r() * 190, 3 + r() * 2, 0, Math.PI * 2)
      g.fill()
    }
    const cx = lerp(720, 980, smoothstep(prog(t, 25, 29.4)))
    dust(g, t, cx - 138, 826, D.v, { ground: D.v, alpha: 0.25 })
    drawCar(g, { type: 'sedan', x: cx, y: 826, scale: 1.0, color: HERO, dist: D.d, speed: D.v, pitch: carPitch(D.a, t), lift: roadLift(t, D.v) })
    for (let k = 0; k < 3; k++) {
      const span = W + 1400
      const x = W + 300 - ((((D.d * 1.3 + k * 1100) % span) + span) % span)
      palmDay(g, x, H + 60, 470 + (k % 2) * 60, -40 + k * 30, t, k * 2.1)
    }
    caption(g, 'More freedom.', t, 25.5, 29.6)
  }

  /* ── Scene 4b — lush mountain road ── */
  function shotMountains(g, t) {
    const D = drive([[29, 650], [33.2, 760]], t)
    sunnySky(g, t, { horizon: 700, sunX: 300, sunY: 120 })
    blitWrap(g, dayClouds(), (t - 29) * 8 + 600, -40, { alpha: 0.9 })
    const defs = [
      ['mtD1', 21, 340, 180, ['#a9c6dc', '#bcd3e3'], 0.008, 300],
      ['mtD2', 22, 380, 220, ['#7fb59a', '#93c3a8'], 0.025, 380],
      ['mtD3', 23, 420, 240, ['#4fa063', '#3c8550'], 0.06, 470],
    ]
    for (const [key, seed, base, amp, stops, par, y] of defs) {
      const L = layer(key, 2400, 640, (lg, w, h) => ridge(lg, w, h, seed, { base, amp, freqs: [1, 3, 6, 13], stops: [[0, stops[0]], [1, stops[1]]], rimLight: 'rgba(255,252,225,0.6)' }))
      blitWrap(g, L, D.d * par, y - base + 220)
      g.fillStyle = vGrad(g, y + 160, y + 300, [
        [0, 'rgba(245,250,255,0)'],
        [0.5, 'rgba(245,250,255,0.5)'],
        [1, 'rgba(245,250,255,0)'],
      ])
      g.fillRect(-300, y + 160 + Math.sin(t * 0.4 + y) * 6, W + 600, 140)
    }
    const terr = layer('terracesDay', 2400, 360, (lg, w, h) => {
      ridge(lg, w, h, 29, { base: 120, amp: 100, freqs: [1, 2, 4], stops: [[0, '#6fb84a'], [1, '#4a9038']] })
      lg.save()
      lg.globalCompositeOperation = 'source-atop'
      lg.strokeStyle = 'rgba(220,250,160,0.55)'
      lg.lineWidth = 3
      for (let k = 0; k < 14; k++) {
        lg.beginPath()
        for (let x = 0; x <= w; x += 8) {
          const yy = 70 + k * 22 + Math.sin((x / w) * Math.PI * 4 + k * 0.4) * 14
          x === 0 ? lg.moveTo(x, yy) : lg.lineTo(x, yy)
        }
        lg.stroke()
      }
      lg.restore()
    })
    blitWrap(g, terr, D.d * 0.16, 640)
    road(g, 920, 70, D.d, { fill: vGrad(g, 920, 990, [[0, '#5c626e'], [1, '#474c57']]), dashAt: 32, dash: 'rgba(255,245,210,0.95)' })
    g.fillStyle = vGrad(g, 990, H, [
      [0, '#5fae4c'],
      [1, '#3c8536'],
    ])
    g.fillRect(-300, 990, W + 600, 130)
    const cx = lerp(560, 1160, smoothstep(prog(t, 29, 33.4)))
    const scale = 1.05
    dust(g, t, cx - 134 * scale, 958, D.v, { ground: D.v, alpha: 0.3 })
    drawCar(g, { type: 'suv', x: cx, y: 958, scale, color: SUV, dist: D.d + cx, speed: D.v, pitch: carPitch(D.a, t), lift: roadLift(t, D.v) })
    fgTrees(g, t, D.d * 1.2, { spacing: 1600, base: 1225, size: 150 })
    caption(g, 'More possibilities.', t, 29.5, 33.3)
  }

  /* ── Scene 4c — rolling toward a sunny business district ── */
  function shotDistrict(g, t) {
    const u = t - 32.7
    const hy = 600
    sunnySky(g, t, { horizon: hy, sunX: 1500, sunY: 130 })
    blitWrap(g, dayClouds(), t * 6, -40)
    const approach = 1 + 0.32 * ease.inOutSine(prog(u, 0, 3.3))
    g.save()
    zoomAbout(g, approach, 960, hy)
    const towers = layer('districtDay', 2400, 560, (lg, w, h) =>
      skyline(lg, w, h, 88, { draw: buildingDay, minW: 60, maxW: 150, minH: 180, maxH: 540, gap: 10, palette: DAY_GLASS, glass: '#8cc3ea', line: 'rgba(30,55,95,0.45)', floor: 22 }))
    g.drawImage(towers.c, 960 - 1200, hy - 560, 2400, 560)
    g.restore()
    haze(g, 300, hy, 0.25)
    g.fillStyle = vGrad(g, hy, H, [
      [0, '#9fd27f'],
      [1, '#5ea54f'],
    ])
    g.fillRect(-300, hy, W + 600, H)
    g.fillStyle = '#5f6674'
    g.beginPath()
    g.moveTo(940, hy)
    g.lineTo(980, hy)
    g.lineTo(1900, H)
    g.lineTo(20, H)
    g.closePath()
    g.fill()
    g.strokeStyle = '#ffffff'
    g.lineWidth = 4
    for (const side of [-1, 1]) {
      g.beginPath()
      g.moveTo(960 + side * 20, hy)
      g.lineTo(960 + side * 920, H)
      g.stroke()
    }
    const sideItems = []
    for (let k = 0; k < 12; k++) {
      const z = ((k + u * 1.6) % 12) / 12
      const zz = z * z
      const y = hy + (H - hy) * zz
      const hw = 4 + 26 * zz
      g.fillStyle = 'rgba(255,255,255,0.95)'
      g.fillRect(960 - hw / 2, y, hw, 4 + 40 * zz)
      for (const side of [-1, 1]) sideItems.push({ zz, x: 960 + side * (60 + 1150 * zz), y, k })
    }
    sideItems.sort((a, b) => a.zz - b.zz)
    for (const it of sideItems) tree(g, it.x, it.y, 30 + 330 * it.zz, t, it.k)
    const sc = lerp(1.15, 0.8, ease.inOutSine(prog(u, 0, 3.3)))
    drawCarRear(g, 960, lerp(1010, 930, ease.inOutSine(prog(u, 0, 3.3))) + roadLift(t, 900), sc, HERO)
    caption(g, 'More journeys ahead.', t, 33.1, 36.2)
  }

  /* ── Scene 5 — sunny hero shot + brand reveal (36–45) ── */
  function sceneReveal(g, t) {
    const u = t - 36
    sunnySky(g, t, { horizon: 860, sunX: 1580, sunY: 140 })
    blitWrap(g, dayClouds(), t * 8, -40, { alpha: 0.9 })
    blitWrap(g, farCity(), 300, 860 - 460)
    haze(g, 400, 860, 0.6)
    g.fillStyle = vGrad(g, 860, H, [
      [0, '#6a7280'],
      [1, '#4f5563'],
    ])
    g.fillRect(-300, 860, W + 600, 300)
    g.fillStyle = 'rgba(255,255,255,0.8)'
    g.fillRect(-300, 864, W + 600, 4)
    // the hero sedan pulls in and settles under the logo
    const keys = [[36.2, 1150], [37.7, 0]]
    const D = drive(keys, t)
    const cx = 960 - drive(keys, 37.7).d + D.d
    dust(g, t, cx - 138 * 1.25, 1010, D.v, { ground: 0, alpha: 0.35 })
    drawCar(g, { type: 'sedan', x: cx, y: 1010, scale: 1.25, color: HERO, dist: D.d, speed: D.v, pitch: carPitch(D.a, t, 37.7), time: t })
    const logo = assets.logoRaw
    const li = ease.outCubic(prog(u, 1.9, 2.7))
    if (li > 0) {
      const lw = 760 * (0.96 + 0.04 * li)
      const lh = lw * (logo.height / logo.width)
      const ly = 250
      for (let k2 = 0; k2 < 3; k2++) {
        const rp = prog(u, 1.9 + k2 * 0.16, 3.3 + k2 * 0.16)
        if (rp <= 0 || rp >= 1) continue
        const rr = 120 + 1000 * ease.outCubic(rp)
        g.save()
        g.globalAlpha = (1 - rp) * 0.7
        g.strokeStyle = k2 === 1 ? '#f2b544' : '#1A56DB'
        g.lineWidth = 3 * (1 - rp) + 1
        g.beginPath()
        g.ellipse(960, ly, rr, rr * 0.42, 0, 0, Math.PI * 2)
        g.stroke()
        g.restore()
      }
      g.save()
      g.globalAlpha = li
      g.shadowColor = 'rgba(15,35,71,0.18)'
      g.shadowBlur = blur(g, 24)
      g.drawImage(logo, 960 - lw / 2, ly - lh / 2, lw, lh)
      g.restore()
      if (li < 1) {
        g.save()
        for (let i = 1; i <= 10; i++) {
          const zs = 1 + (1 - li) * 0.03 * i
          g.globalAlpha = 0.08 * (1 - li)
          g.drawImage(logo, 960 - (lw * zs) / 2, ly - (lh * zs) / 2, lw * zs, lh * zs)
        }
        g.restore()
      }
    }
    kineticChars(g, 'Your Journey. Your Choice.', 960, 445, prog(u, 3.1, 4.0), { size: 58, weight: 700, spacing: 1, align: 'center', color: INK })
    const cs = ease.outBack(prog(u, 4.2, 4.7))
    if (cs > 0) {
      const label = 'COMING SOON'
      const pw = textWidth(g, label, 60, 900, 14) + 110
      g.save()
      g.translate(960, 560)
      g.scale(cs, cs)
      g.shadowColor = 'rgba(15,35,71,0.3)'
      g.shadowBlur = blur(g, 26)
      roundRect(g, -pw / 2, -44, pw, 88, 44)
      g.fillStyle = '#1A56DB'
      g.fill()
      g.restore()
      kineticChars(g, label, 960, 562, prog(u, 4.3, 5.0), { size: 60, weight: 900, spacing: 14, align: 'center', color: '#ffffff' })
    }
    kineticChars(g, 'BY MOMENTRA LABS', 960, 664, prog(u, 5.2, 6.0), { size: 28, weight: 700, spacing: 12, align: 'center', color: '#2c4a78' })
    g.fillStyle = `rgba(255,255,255,${ease.inCubic(prog(t, 44.4, 45))})`
    g.fillRect(0, 0, W, H)
  }

  /* ── edit decision list ── */
  // cam: zoom from→to across the shot and a horizontal track (px); smooth, no shake.
  const SHOTS = [
    { start: 0, end: 7, draw: sceneChallenge, cam: { z: [1, 1.04], pan: [0, -30] } },
    { start: 7, end: 15, draw: sceneIntro, tin: 'flash', d: 0.7, cam: { z: [1.04, 1], pan: [16, -16] } },
    { start: 15, end: 17.2, draw: shotCity, tin: 'whip', d: 0.5, dir: 1, cam: { z: [1.08, 1.02], pan: [40, -40] } },
    { start: 17.2, end: 19.4, draw: shotRidge, tin: 'whip', d: 0.45, dir: 1, cam: { z: [1.0, 1.07], pan: [-30, 30] } },
    { start: 19.4, end: 21.4, draw: shotCafe, tin: 'whip', d: 0.45, dir: 1, cam: { z: [1.02, 1.07], pan: [60, -50] } },
    { start: 21.4, end: 25, draw: shotShowcase, tin: 'whip', d: 0.45, dir: 1, cam: { z: [1.03, 1], pan: [20, -20] } },
    { start: 25, end: 29, draw: shotCoast, tin: 'leak', d: 0.9, cam: { z: [1.0, 1.08], pan: [-50, 50] } },
    { start: 29, end: 32.7, draw: shotMountains, tin: 'xfade', d: 0.7, cam: { z: [1.08, 1.0], pan: [40, -40] } },
    { start: 32.7, end: 36, draw: shotDistrict, tin: 'xfade', d: 0.7, cam: { z: [1, 1.06], pan: [0, 0] } },
    { start: 36, end: 45, draw: sceneReveal, tin: 'xfade', d: 0.8, cam: { z: [1.05, 1], pan: [0, 0] } },
  ]

  function drawShot(g, shot, t) {
    const c = shot.cam
    if (!c) return shot.draw(g, t)
    const k = ease.inOutSine(clamp((t - shot.start) / (shot.end - shot.start)))
    const z = lerp(c.z[0], c.z[1], k)
    const shake = c.shake || 0
    const dx = lerp(c.pan[0], c.pan[1], k) + Math.sin(t * 0.7) * 4 + Math.sin(t * 23) * shake
    const dy = Math.cos(t * 0.55) * 3 + Math.cos(t * 19) * shake
    g.save()
    g.translate(W / 2 + dx, H / 2 + dy)
    g.rotate(Math.sin(t * 0.45) * 0.002)
    g.scale(z, z)
    g.translate(-W / 2, -H / 2)
    shot.draw(g, t)
    g.restore()
  }

  /** Whip pan: outgoing and incoming shots side by side on a strip, smeared by speed. */
  function whip(g, t, prev, cur, p, dir) {
    const e = ease.inOutCubic(p)
    const s = e * W
    const smear = Math.sin(p * Math.PI) * W * 0.13
    const N = 16
    g.fillStyle = '#000'
    g.fillRect(0, 0, W, H)
    for (const [shot, base] of [[prev, -dir * s], [cur, dir * (W - s)]]) {
      if (Math.abs(base) >= W + smear) continue
      bg.setTransform(S, 0, 0, S, 0, 0)
      drawShot(bg, shot, t)
      g.save()
      g.globalCompositeOperation = 'lighter'
      g.globalAlpha = 1 / N
      for (let i = 0; i < N; i++) g.drawImage(buf, base + dir * smear * (i / (N - 1) - 0.5), 0, W, H)
      g.restore()
    }
    g.fillStyle = `rgba(200,245,255,${0.16 * Math.sin(p * Math.PI)})`
    g.fillRect(0, 0, W, H)
  }

  function wipe(g, t, prev, cur, p, dir) {
    drawShot(g, prev, t)
    const e = ease.inOutCubic(p)
    const edge = dir > 0 ? lerp(-500, W + 500, e) : lerp(W + 500, -500, e)
    const slant = 260
    g.save()
    g.beginPath()
    if (dir > 0) {
      g.moveTo(-600, -10)
      g.lineTo(edge + slant, -10)
      g.lineTo(edge - slant, H + 10)
      g.lineTo(-600, H + 10)
    } else {
      g.moveTo(W + 600, -10)
      g.lineTo(edge + slant, -10)
      g.lineTo(edge - slant, H + 10)
      g.lineTo(W + 600, H + 10)
    }
    g.closePath()
    g.clip()
    drawShot(g, cur, t)
    g.restore()
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.strokeStyle = 'rgba(47,230,255,0.9)'
    g.shadowColor = C.cyan
    g.shadowBlur = blur(g, 30)
    g.lineWidth = 4
    g.beginPath()
    g.moveTo(edge + slant, -10)
    g.lineTo(edge - slant, H + 10)
    g.stroke()
    g.restore()
  }

  function drawFrame(g, t) {
    t = clamp(t, 0, DURATION - 1e-6)
    let i = SHOTS.findIndex((s) => t < s.end)
    if (i < 0) i = SHOTS.length - 1
    const cur = SHOTS[i]
    const prev = SHOTS[i - 1]
    const p = cur.d ? (t - cur.start) / cur.d : 1
    if (prev && cur.tin && p < 1) {
      if (cur.tin === 'wipe') wipe(g, t, prev, cur, p, cur.dir)
      else if (cur.tin === 'whip') whip(g, t, prev, cur, p, cur.dir)
      else if (cur.tin === 'xfade') {
        drawShot(g, prev, t)
        bg.setTransform(S, 0, 0, S, 0, 0)
        drawShot(bg, cur, t)
        g.save()
        g.globalAlpha = ease.inOutSine(p)
        g.drawImage(buf, 0, 0, W, H)
        g.restore()
      } else if (cur.tin === 'leak') {
        // warm light-leak dip: previous shot burns out to gold, next one emerges
        const first = p < 0.5
        drawShot(g, first ? prev : cur, t)
        const k = first ? ease.inCubic(p * 2) : 1 - ease.outCubic((p - 0.5) * 2)
        g.save()
        g.globalCompositeOperation = 'lighter'
        g.fillStyle = radial(g, 1420, 540, 1500, [
          [0, `rgba(255,236,190,${k})`],
          [1, `rgba(255,170,110,${k * 0.85})`],
        ])
        g.fillRect(0, 0, W, H)
        g.restore()
      } else if (cur.tin === 'flash') {
        drawShot(g, cur, t)
        g.fillStyle = `rgba(235,252,255,${(1 - ease.outCubic(p)) ** 1.5})`
        g.fillRect(0, 0, W, H)
      }
    } else {
      drawShot(g, cur, t)
    }
    vignette(g, 0.16)
  }

  return {
    render(t) {
      g.setTransform(S, 0, 0, S, 0, 0)
      g.globalAlpha = 1
      g.globalCompositeOperation = 'source-over'
      drawFrame(g, t)
    },
    scale: S,
  }
}

/* ───────────────────────── assets ───────────────────────── */

function placeholder(label) {
  const c = new OffscreenCanvas(2880, 1800)
  const g = c.getContext('2d')
  g.fillStyle = '#e8edf5'
  g.fillRect(0, 0, c.width, c.height)
  g.fillStyle = '#5b6b85'
  g.font = `600 96px ${FONT}`
  g.textAlign = 'center'
  g.fillText(`Screenshot placeholder — ${label}`, c.width / 2, c.height / 2)
  g.font = `400 56px ${FONT}`
  g.fillText('Run tools/capture-screens.mjs to replace', c.width / 2, c.height / 2 + 110)
  return c
}

/**
 * The official lockup is dark-on-white. For the night-time frames, key out the
 * white, turn the wordmark white and the blue mark into the brand-cyan glow.
 */
function darkLogo(img) {
  const c = new OffscreenCanvas(img.naturalWidth, img.naturalHeight)
  const g = c.getContext('2d', { willReadFrequently: true })
  g.drawImage(img, 0, 0)
  const data = g.getImageData(0, 0, c.width, c.height)
  const d = data.data
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i]
    const gg = d[i + 1]
    const b = d[i + 2]
    const alpha = (d[i + 3] / 255) * clamp((255 - Math.min(r, gg, b)) / 225)
    const blue = (b - r) / (256 - r) > 0.35
    const x = (i / 4) % c.width
    if (blue) {
      const k = clamp(x / (c.width * 0.25))
      d[i] = lerp(125, 31, k)
      d[i + 1] = lerp(243, 168, k)
      d[i + 2] = 255
    } else {
      d[i] = 244
      d[i + 1] = 248
      d[i + 2] = 255
    }
    d[i + 3] = alpha * 255
  }
  g.putImageData(data, 0, 0)
  return c
}

export async function loadAssets(base = './assets/') {
  const files = {
    logo: 'rentarah-logo.png',
    landing: 'screens/landing.png',
    search: 'screens/search.png',
    detail: 'screens/detail.png',
    map: 'screens/map.png',
  }
  const out = { mobile: {} }
  const mobile = ['landing', 'search', 'detail', 'map']
  await Promise.all(
    mobile.map(async (key) => {
      const img = new Image()
      img.src = `${base}screens-mobile/${key}.png`
      try {
        await img.decode()
        out.mobile[key] = img
      } catch {
        out.mobile[key] = placeholder(`mobile ${key}`)
      }
    }),
  )
  try {
    out.hotspots = await (await fetch(`${base}screens-mobile/hotspots.json`)).json()
  } catch {
    out.hotspots = {}
  }
  for (const [k, v] of Object.entries({ landing: { search: { x: 31, y: 469, w: 328, h: 46 } }, search: { card: { x: 16, y: 1213, w: 143, h: 20 } }, map: {} })) {
    out.hotspots[k] = { ...v, ...(out.hotspots[k] || {}) }
  }
  await Promise.all(
    Object.entries(files).map(async ([key, file]) => {
      const img = new Image()
      img.src = base + file
      try {
        await img.decode()
        out[key] = key === 'logo' ? darkLogo(img) : img
        if (key === 'logo') out.logoRaw = img
      } catch {
        out[key] = placeholder(key)
      }
    }),
  )
  await Promise.all(
    ['300', '500', '600', '700', '800', '900'].map((wt) => document.fonts.load(`${wt} 64px Urbanist`).catch(() => {})),
  )
  return out
}
