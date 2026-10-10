// Generates the promo voice-over with ElevenLabs and wires it into the edit.
//
//   1. Put your key in the ELEVENLABS_API_KEY environment variable (never in the repo):
//        setx ELEVENLABS_API_KEY "your-key"      (then open a new terminal)
//   2. node promo/coming-soon/tools/make-elevenlabs-vo.mjs            # default voice
//      node promo/coming-soon/tools/make-elevenlabs-vo.mjs --list     # voices on your account
//      node promo/coming-soon/tools/make-elevenlabs-vo.mjs --voice <voice_id>
//   3. node promo/coming-soon/tools/render-mp4.mjs 4k
//
// Each line is fitted into its scene window: if a take runs long it is regenerated
// slightly faster (ElevenLabs `speed`, capped at 1.15) rather than overlapping the next cut.
import { execFileSync } from 'node:child_process'
import { writeFileSync, readdirSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'vo')
const API = 'https://api.elevenlabs.io/v1'
// Voice chosen for the promo (from the account owner's ElevenLabs snippet). Override with --voice.
const DEFAULT_VOICE = 'TX3LPaxmHKxFdv7VOQHJ'
const MODEL = 'eleven_multilingual_v2'
const BITRATE = 128_000

// Windows are seconds into the 45 s cut. "Rentarah" is spelled for natural pronunciation.
const LINES = [
  { start: 0.8, end: 6.6, text: "Finding the perfect ride shouldn't be complicated." },
  { start: 8.3, end: 14.7, text: 'Introducing Rentarah. A new way to discover your next ride.' },
  { start: 15.4, end: 24.8, text: 'For everyday drives, weekend escapes, and every adventure in between.' },
  { start: 25.8, end: 35.4, text: 'Because every destination holds a story. And every journey begins with a choice.' },
  // The sign-off lands on the logo reveal (38.3 s) when it fits, and always ends by 44.4 s.
  { start: 38.3, end: 44.4, text: 'Rentarah. Your journey. Your choice. Coming soon. By Momentra Labs.', alignEnd: true, earliest: 37.4 },
]

function apiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim()
  if (process.platform === 'win32') {
    // `setx` only reaches new terminals; read the user-level value directly too.
    try {
      const v = execFileSync('powershell', ['-NoProfile', '-Command', "[Environment]::GetEnvironmentVariable('ELEVENLABS_API_KEY','User')"], { encoding: 'utf8' }).trim()
      if (v) return v
    } catch {}
  }
  console.error('ELEVENLABS_API_KEY is not set. Run:  setx ELEVENLABS_API_KEY "your-key"  and open a new terminal.')
  process.exit(1)
}

const key = apiKey()
const args = process.argv.slice(2)
const headers = { 'xi-api-key': key, 'Content-Type': 'application/json' }

async function api(path, init = {}) {
  const res = await fetch(API + path, { ...init, headers: { ...headers, ...(init.headers || {}) } })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`ElevenLabs ${res.status} on ${path}: ${body.slice(0, 300)}`)
  }
  return res
}

if (args.includes('--list')) {
  const { voices } = await (await api('/voices')).json()
  for (const v of voices) {
    const l = v.labels || {}
    console.log(`${v.voice_id}  ${v.name.padEnd(28)} ${[l.gender, l.age, l.accent, l.description || l.descriptive, l.use_case].filter(Boolean).join(' · ')}`)
  }
  process.exit(0)
}

const voiceId = args[args.indexOf('--voice') + 1] && args.includes('--voice') ? args[args.indexOf('--voice') + 1] : DEFAULT_VOICE
let voiceName = voiceId
try {
  voiceName = (await (await api(`/voices/${voiceId}`)).json()).name
} catch {
  // Restricted keys may only allow text-to-speech; the name is cosmetic.
}
console.log(`Voice: ${voiceName} (${voiceId}), model ${MODEL}`)

async function synth(line, i, speed) {
  const res = await api(`/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: 'POST',
    body: JSON.stringify({
      text: line.text,
      model_id: MODEL,
      previous_text: LINES[i - 1]?.text,
      next_text: LINES[i + 1]?.text,
      voice_settings: { stability: 0.42, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true, speed },
    }),
  })
  const buf = Buffer.from(await res.arrayBuffer())
  return { buf, seconds: (buf.length * 8) / BITRATE }
}

for (const f of readdirSync(OUT)) if (/^line\d\.(wav|mp3)$/.test(f)) unlinkSync(join(OUT, f))

const manifest = []
for (const [i, line] of LINES.entries()) {
  let speed = 1
  let take
  for (let attempt = 0; attempt < 3; attempt++) {
    take = await synth(line, i, speed)
    const room = line.alignEnd ? line.end - line.earliest : line.end - line.start
    if (take.seconds <= room || speed >= 1.15) break
    speed = Math.min(1.15, +(speed * (take.seconds / room) * 1.02).toFixed(2))
  }
  const start = line.alignEnd ? Math.max(line.earliest, Math.min(line.start, line.end - take.seconds)) : line.start
  const file = `line${i + 1}.mp3`
  writeFileSync(join(OUT, file), take.buf)
  const over = start + take.seconds - line.end
  console.log(`${file}  start ${start.toFixed(2)}s  length ${take.seconds.toFixed(2)}s  speed ${speed}${over > 0 ? `  ⚠ runs ${over.toFixed(2)}s past its window` : ''}`)
  manifest.push({ file, start: +start.toFixed(2), text: line.text })
}

writeFileSync(
  join(OUT, 'manifest.json'),
  JSON.stringify({ note: `ElevenLabs voice-over — ${voiceName} (${voiceId}), ${MODEL}.`, lines: manifest }, null, 2),
)
console.log('Wrote assets/vo/manifest.json — re-export with: node promo/coming-soon/tools/render-mp4.mjs 4k')
