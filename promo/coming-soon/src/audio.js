// Procedural soundtrack for the RentaraH promo: modern electronic bed with
// string-like pads, impacts synced to the cuts, and a closing audio signature.
// Rendered offline, so playback and export use the exact same 45 s buffer.
//
// Voice-over is optional: list WAV/MP3 files in assets/vo/manifest.json
// ({ "lines": [{ "file": "line1.wav", "start": 0.8 }, ...] }). The music ducks
// under each line automatically. Swap the scratch files for a professional
// recording with the same names and re-export.

import { DURATION } from './video.js'

const SR = 48000
const BEAT = 60 / 112 // upbeat 112 BPM

const CHORDS = {
  Dm: [50, 53, 57, 62],
  Bb: [46, 50, 53, 58],
  F: [41, 48, 53, 57],
  C: [48, 52, 55, 60],
  Gm: [43, 50, 55, 58],
}
// Tense minor for "the challenge", then a bright I–V–vi–IV in F from the reveal on.
const PROGRESSION = [
  [0, 'Dm'], [3.5, 'Bb'], [7, 'F'], [9.1, 'C'], [11.3, 'Dm'], [13.4, 'Bb'],
  [15, 'F'], [17.2, 'C'], [19.4, 'Dm'], [21.4, 'Bb'], [23.2, 'C'],
  [25, 'F'], [27, 'C'], [29, 'Dm'], [30.9, 'Bb'], [32.7, 'F'], [34.4, 'C'],
  [36, 'Dm'], [38.5, 'Bb'], [41.5, 'F'],
]

const hz = (m) => 440 * 2 ** ((m - 69) / 12)

function chordAt(t) {
  let c = PROGRESSION[0]
  for (const p of PROGRESSION) if (p[0] <= t + 1e-6) c = p
  return c
}

function noiseBuffer(ctx, seconds = 2) {
  const b = ctx.createBuffer(1, Math.floor(SR * seconds), SR)
  const d = b.getChannelData(0)
  let s = 1234567
  for (let i = 0; i < d.length; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    d[i] = (s / 0x3fffffff) - 1
  }
  return b
}

function impulse(ctx, seconds = 3.2, decay = 3) {
  const len = Math.floor(SR * seconds)
  const b = ctx.createBuffer(2, len, SR)
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch)
    let s = 99 + ch * 77
    for (let i = 0; i < len; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff
      d[i] = ((s / 0x3fffffff) - 1) * (1 - i / len) ** decay
    }
  }
  return b
}

async function loadVoiceOver(ctx, base) {
  try {
    const res = await fetch(base + 'vo/manifest.json', { cache: 'no-store' })
    if (!res.ok) return []
    const manifest = await res.json()
    const lines = []
    for (const line of manifest.lines || []) {
      const r = await fetch(base + 'vo/' + line.file, { cache: 'no-store' })
      if (!r.ok) continue
      const buffer = await ctx.decodeAudioData(await r.arrayBuffer())
      lines.push({ ...line, buffer })
    }
    return lines
  } catch {
    return []
  }
}

/**
 * @param {{ voiceOver?: boolean, base?: string }} opts
 * @returns {Promise<AudioBuffer>}
 */
export async function renderSoundtrack({ voiceOver = true, base = './assets/' } = {}) {
  const ctx = new OfflineAudioContext(2, Math.ceil(SR * DURATION), SR)
  const noise = noiseBuffer(ctx)

  const master = ctx.createGain()
  master.gain.value = 0.9
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -14
  comp.ratio.value = 3
  comp.attack.value = 0.01
  comp.release.value = 0.25
  master.connect(comp).connect(ctx.destination)

  const music = ctx.createGain()
  music.connect(master)
  const reverb = ctx.createConvolver()
  reverb.buffer = impulse(ctx)
  const wet = ctx.createGain()
  wet.gain.value = 0.32
  reverb.connect(wet).connect(music)

  const out = (node, send = 0.4) => {
    node.connect(music)
    if (send > 0) {
      const s = ctx.createGain()
      s.gain.value = send
      node.connect(s).connect(reverb)
    }
  }

  const env = (param, t, a, peak, hold, r, floor = 0.0001) => {
    param.setValueAtTime(floor, t)
    param.linearRampToValueAtTime(peak, t + a)
    param.setValueAtTime(peak, t + a + hold)
    param.exponentialRampToValueAtTime(floor, t + a + hold + r)
  }

  /* instruments */
  function pad(t, dur, notes, gain = 0.05, cutoff = 1400, attack = 0.9) {
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.setValueAtTime(cutoff * 0.5, t)
    f.frequency.linearRampToValueAtTime(cutoff, t + dur * 0.6)
    f.Q.value = 0.7
    const g = ctx.createGain()
    env(g.gain, t, attack, gain, Math.max(0, dur - attack), 1.4)
    f.connect(g)
    out(g, 0.6)
    for (const n of notes) {
      for (const det of [-7, 6]) {
        const o = ctx.createOscillator()
        o.type = 'sawtooth'
        o.frequency.value = hz(n)
        o.detune.value = det
        o.connect(f)
        o.start(t)
        o.stop(t + dur + 1.6)
      }
    }
  }

  function strings(t, dur, notes, gain = 0.035) {
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 2600
    const g = ctx.createGain()
    env(g.gain, t, 1.2, gain, Math.max(0, dur - 1.2), 1.6)
    f.connect(g)
    out(g, 0.7)
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 5.2
    const lg = ctx.createGain()
    lg.gain.value = 6
    lfo.connect(lg)
    lfo.start(t)
    lfo.stop(t + dur + 2)
    for (const n of notes) {
      for (const det of [-4, 0, 5]) {
        const o = ctx.createOscillator()
        o.type = 'sawtooth'
        o.frequency.value = hz(n + 12)
        o.detune.value = det
        lg.connect(o.detune)
        o.connect(f)
        o.start(t)
        o.stop(t + dur + 2)
      }
    }
  }

  function pluck(t, note, gain = 0.05, send = 0.45) {
    const o = ctx.createOscillator()
    o.type = 'square'
    o.frequency.value = hz(note)
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.setValueAtTime(3800, t)
    f.frequency.exponentialRampToValueAtTime(500, t + 0.22)
    const g = ctx.createGain()
    env(g.gain, t, 0.004, gain, 0, 0.32)
    o.connect(f).connect(g)
    out(g, send)
    o.start(t)
    o.stop(t + 0.4)
  }

  function bell(t, note, gain = 0.06, decay = 2.2) {
    for (const [ratio, amp] of [[1, 1], [2.76, 0.4], [5.4, 0.2], [8.9, 0.08]]) {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = hz(note) * ratio
      const g = ctx.createGain()
      env(g.gain, t, 0.003, gain * amp, 0, decay / ratio ** 0.4)
      o.connect(g)
      out(g, 0.7)
      o.start(t)
      o.stop(t + decay + 0.2)
    }
  }

  function bass(t, note, dur, gain = 0.12) {
    const o = ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.value = hz(note)
    const s = ctx.createOscillator()
    s.type = 'sine'
    s.frequency.value = hz(note - 12)
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.setValueAtTime(900, t)
    f.frequency.exponentialRampToValueAtTime(180, t + dur)
    const g = ctx.createGain()
    env(g.gain, t, 0.008, gain, dur * 0.4, dur * 0.6)
    o.connect(f)
    s.connect(f)
    f.connect(g)
    out(g, 0.05)
    o.start(t)
    s.start(t)
    o.stop(t + dur + 0.1)
    s.stop(t + dur + 0.1)
  }

  function kick(t, gain = 0.5) {
    const o = ctx.createOscillator()
    o.frequency.setValueAtTime(130, t)
    o.frequency.exponentialRampToValueAtTime(42, t + 0.14)
    const g = ctx.createGain()
    env(g.gain, t, 0.002, gain, 0.02, 0.38)
    o.connect(g)
    out(g, 0.05)
    o.start(t)
    o.stop(t + 0.5)
  }

  function noiseHit(t, { type = 'highpass', freq = 8000, q = 0.7, gain = 0.05, a = 0.001, d = 0.06, send = 0.1, sweepTo = null } = {}) {
    const n = ctx.createBufferSource()
    n.buffer = noise
    const f = ctx.createBiquadFilter()
    f.type = type
    f.frequency.setValueAtTime(freq, t)
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + a + d)
    f.Q.value = q
    const g = ctx.createGain()
    env(g.gain, t, a, gain, 0, d)
    n.connect(f).connect(g)
    out(g, send)
    n.start(t, (t * 7.31) % 1)
    n.stop(t + a + d + 0.1)
  }

  const hat = (t, gain = 0.035) => noiseHit(t, { freq: 9000, gain, d: 0.05 })
  const clap = (t, gain = 0.09) => noiseHit(t, { type: 'bandpass', freq: 1700, q: 1.2, gain, d: 0.2, send: 0.35 })
  const whoosh = (t, len = 0.6, gain = 0.12) => noiseHit(t - len * 0.7, { type: 'bandpass', freq: 300, q: 1.4, gain, a: len * 0.7, d: len * 0.5, send: 0.5, sweepTo: 5000 })
  const riser = (end, len = 2, gain = 0.1) => noiseHit(end - len, { type: 'bandpass', freq: 400, q: 2, gain, a: len, d: 0.05, send: 0.5, sweepTo: 7000 })

  function boom(t, gain = 0.7, len = 2.6) {
    const o = ctx.createOscillator()
    o.frequency.setValueAtTime(70, t)
    o.frequency.exponentialRampToValueAtTime(28, t + len)
    const g = ctx.createGain()
    env(g.gain, t, 0.004, gain, 0.05, len)
    o.connect(g)
    out(g, 0.3)
    o.start(t)
    o.stop(t + len + 0.2)
    noiseHit(t, { type: 'lowpass', freq: 1800, gain: 0.25, d: 0.9, send: 0.8, sweepTo: 120 })
  }

  function timpani(t, gain = 0.35) {
    const o = ctx.createOscillator()
    o.frequency.setValueAtTime(98, t)
    o.frequency.exponentialRampToValueAtTime(72, t + 0.5)
    const g = ctx.createGain()
    env(g.gain, t, 0.003, gain, 0.02, 1.1)
    o.connect(g)
    out(g, 0.5)
    o.start(t)
    o.stop(t + 1.3)
    noiseHit(t, { type: 'lowpass', freq: 600, gain: 0.08, d: 0.25, send: 0.4 })
  }

  function blip(t, note, gain = 0.018) {
    const o = ctx.createOscillator()
    o.type = 'square'
    o.frequency.value = hz(note)
    const g = ctx.createGain()
    env(g.gain, t, 0.002, gain, 0.03, 0.05)
    o.connect(g)
    out(g, 0.2)
    o.start(t)
    o.stop(t + 0.12)
  }

  /* arrangement */
  // Pads follow the progression the whole way through.
  PROGRESSION.forEach(([t, name], i) => {
    const next = PROGRESSION[i + 1]?.[0] ?? DURATION
    const notes = CHORDS[name]
    if (t < 7) pad(t, next - t, notes, 0.035, 700, 1.4)
    else if (t < 15) pad(t, next - t, notes, 0.045, 1600)
    else if (t < 25) pad(t, next - t, notes, 0.04, 2200, 0.3)
    else if (t < 36) {
      pad(t, next - t, notes, 0.035, 1800)
      strings(t, next - t, notes, 0.03 + 0.012 * ((t - 25) / 11))
    } else if (t < 41.5) pad(t, next - t, notes, 0.03, 1200, 1.2)
  })

  // Scene 1 — uneasy clutter: card blips, a low pulse, rising tension.
  // traffic horns, typing, the empty result, then cards stamping in
  for (const [t, n] of [[0.25, 52], [0.55, 55], [1.3, 50], [3.9, 53]]) {
    blip(t, n, 0.035)
    blip(t + 0.12, n, 0.03)
  }
  for (let i = 0; i < 26; i++) noiseHit(0.85 + i * 0.048 + (i % 3) * 0.006, { type: 'highpass', freq: 4500, gain: 0.03, d: 0.025 })
  blip(2.88, 64, 0.04)
  blip(3.02, 59, 0.04)
  for (let i = 0; i < 16; i++) {
    blip(1.5 + i * 0.16, 74 + ((i * 5) % 12), 0.014)
    noiseHit(1.55 + i * 0.16, { type: 'lowpass', freq: 900, gain: 0.05, d: 0.08 })
  }
  for (let t = 0.6; t < 4.6; t += BEAT) noiseHit(t, { type: 'bandpass', freq: 2400, q: 6, gain: 0.02, d: 0.04 })
  for (let t = 0; t < 4.8; t += BEAT * 2) bass(t, 38, 1.1, 0.06)
  bell(5.0, 81, 0.05, 2.5)
  riser(7.0, 1.6, 0.14)

  // Scene 2 — reveal impact, shimmer, arpeggio enters.
  boom(7.0, 0.65)
  bell(7.55, 74, 0.06, 3)
  bell(7.75, 81, 0.05, 3)
  bell(8.0, 86, 0.04, 3)
  whoosh(8.8, 0.6, 0.1)
  for (let t = 8.6; t < 15; t += BEAT / 2) {
    const [, name] = chordAt(t)
    const notes = CHORDS[name]
    const step = Math.round((t - 8.6) / (BEAT / 2))
    pluck(t, notes[step % 4] + 12 + (step % 8 >= 4 ? 12 : 0), 0.026)
  }
  for (let t = 8.6; t < 15; t += BEAT) {
    kick(t, 0.36)
    const beat = Math.round((t - 8.6) / BEAT)
    if (beat % 2 === 1) clap(t, 0.06)
    hat(t + BEAT / 2, 0.03)
  }
  // phone demo foley: taps, screen pushes, callout pops
  for (const t of [10.35, 13.05, 23.9]) {
    bell(t, 96, 0.03, 0.4)
    blip(t, 84, 0.03)
  }
  for (const t of [10.7, 13.4, 23.05]) whoosh(t + 0.35, 0.35, 0.06)
  for (const t of [9.7, 11.9, 14.1, 21.8, 23.5, 23.75]) pluck(t, 88, 0.035, 0.3)
  for (const [t, n] of [[21.7, 81], [22.4, 84], [23.2, 89]]) bell(t, n, 0.045, 1.2)
  riser(15.0, 1.4, 0.1)

  // Scene 3 — driving montage: four-on-the-floor, bass, hats, arps, cut whooshes.
  for (let t = 15; t < 25 - 0.01; t += BEAT) {
    kick(t, 0.5)
    const beat = Math.round((t - 15) / BEAT)
    if (beat % 2 === 1) clap(t, 0.08)
    hat(t + BEAT / 2, 0.04)
    hat(t + BEAT / 4, 0.018)
    hat(t + (3 * BEAT) / 4, 0.018)
    const root = CHORDS[chordAt(t)[1]][0] - 12
    bass(t + BEAT / 2, root, BEAT / 2 - 0.02, 0.1)
  }
  for (let t = 15; t < 25; t += BEAT / 4) {
    const notes = CHORDS[chordAt(t)[1]]
    const step = Math.round((t - 15) / (BEAT / 4))
    pluck(t, notes[[0, 2, 1, 3, 2, 1, 3, 2][step % 8]] + 24, 0.02, 0.35)
  }
  for (const c of [15, 17.2, 19.4, 21.4]) {
    whoosh(c + 0.1, 0.55, 0.11)
    noiseHit(c, { type: 'highpass', freq: 3000, gain: 0.05, d: 0.6, send: 0.6 })
  }
  // offbeat chord stabs for a brighter, pop feel
  for (let t = 15 + BEAT / 2; t < 36; t += BEAT) {
    if (t > 21.4 && t < 25) continue
    for (const n of CHORDS[chordAt(t)[1]].slice(1)) pluck(t, n + 12, 0.012, 0.25)
  }

  // Scene 4 — cinematic lift: timpani on the turns, gold chime melody, crescendo.
  for (const t of [25, 27, 29, 30.9, 32.7, 34.4]) timpani(t, 0.3 + (t - 25) * 0.02)
  for (let t = 25; t < 36; t += BEAT) {
    kick(t, 0.3 + 0.015 * (t - 25))
    if (Math.round((t - 25) / BEAT) % 2 === 1) clap(t, 0.05)
    hat(t + BEAT / 2, 0.025)
  }
  const melody = [[25.6, 69], [26.2, 72], [26.8, 74], [27.8, 77], [29.5, 76], [30.1, 74], [30.7, 72], [31.6, 74], [33.2, 77], [33.8, 79], [34.4, 81]]
  melody.forEach(([t, n]) => bell(t, n, 0.045, 2.4))
  for (let t = 25; t < 36; t += BEAT / 2) {
    const root = CHORDS[chordAt(t)[1]][0] - 12
    bass(t, root, BEAT / 2 - 0.02, 0.07)
  }
  riser(36.0, 2.6, 0.16)
  noiseHit(35.2, { type: 'highpass', freq: 5000, gain: 0.06, a: 0.8, d: 0.05, send: 0.8 })

  // Scene 5 — brand reveal and audio signature.
  boom(36.05, 0.35, 2)
  for (let i = 0; i < 6; i++) whoosh(36.6 + i * 0.28, 0.5, 0.05)
  riser(38.2, 1.8, 0.08)
  boom(38.25, 0.75, 3.2)
  bell(38.3, 77, 0.07, 3.5)
  bell(38.3, 84, 0.05, 3.5)
  bell(39.5, 81, 0.035, 2)
  bell(40.5, 86, 0.04, 2.5)
  // signature: low hit + bright F(add9) bloom + rising shimmer, ringing out
  boom(41.5, 0.8, 3.4)
  timpani(41.5, 0.4)
  pad(41.5, 3.1, [41, 48, 53, 57, 60, 67], 0.05, 3200, 0.05)
  strings(41.5, 2.6, [53, 57, 60, 67], 0.035)
  ;[77, 81, 84, 89].forEach((n, i) => bell(41.5 + i * 0.09, n, 0.05, 3.4))
  bell(42.6, 93, 0.025, 2.4)

  // Voice-over and ducking.
  const lines = voiceOver ? await loadVoiceOver(ctx, base) : []
  music.gain.setValueAtTime(1, 0)
  for (const line of lines) {
    const src = ctx.createBufferSource()
    src.buffer = line.buffer
    const g = ctx.createGain()
    g.gain.value = line.gain ?? 1.15
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 90
    src.connect(hp).connect(g).connect(master)
    const vs = ctx.createGain()
    vs.gain.value = 0.08
    g.connect(vs).connect(reverb)
    src.start(line.start)
    const end = line.start + line.buffer.duration
    music.gain.setTargetAtTime(0.5, line.start - 0.15, 0.08)
    music.gain.setTargetAtTime(1, end + 0.05, 0.25)
  }

  // Fade the tail to silence by the final frame.
  master.gain.setValueAtTime(0.9, DURATION - 0.7)
  master.gain.linearRampToValueAtTime(0, DURATION)

  const buffer = await ctx.startRendering()
  normalize(buffer, 0.89)
  buffer.voiceOverLines = lines.length
  return buffer
}

function normalize(buffer, target) {
  let peak = 0
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const d = buffer.getChannelData(c)
    for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]))
  }
  if (peak < 1e-6) return
  const k = target / peak
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const d = buffer.getChannelData(c)
    for (let i = 0; i < d.length; i++) d[i] *= k
  }
}
