// Decodes an exported MP4 in Chrome and reports duration, size and audio; saves sample frames.
//   node tools/verify-mp4.mjs dist/<file>.mp4 [outDir]
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, relative, dirname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { launchChrome, sleep } from './cdp.mjs'
import { startServer } from './serve.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const [file, outDir] = process.argv.slice(2)
const url = '/' + relative(root, join(process.cwd(), file)).split(sep).join('/')
const port = 4792
const server = await startServer(port)
const chrome = await launchChrome({ port: 9336 })
try {
  await chrome.navigate(`http://127.0.0.1:${port}/index.html`, { settleMs: 300 })
  const info = await chrome.evaluate(`(async () => {
    const v = document.createElement('video')
    v.muted = true
    document.body.appendChild(v)
    v.src = ${JSON.stringify(url)}
    await new Promise((r, j) => { v.onloadeddata = r; v.onerror = () => j(new Error('decode error ' + v.error?.code)) })
    const ac = new AudioContext()
    const buf = await ac.decodeAudioData(await (await fetch(${JSON.stringify(url)})).arrayBuffer())
    let peak = 0, sum = 0
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) { peak = Math.max(peak, Math.abs(d[i])); sum += d[i] * d[i] }
    window.__v = v
    return { duration: v.duration, width: v.videoWidth, height: v.videoHeight,
      audio: { duration: buf.duration, channels: buf.numberOfChannels, rate: buf.sampleRate, peak: +peak.toFixed(3), rmsDb: +(10 * Math.log10(sum / d.length)).toFixed(1) } }
  })()`)
  console.log(JSON.stringify(info, null, 1))
  if (outDir) {
    mkdirSync(outDir, { recursive: true })
    for (const t of [3, 12, 18, 23.5, 30, 42.5, 44.9]) {
      const data = await chrome.evaluate(`(async () => {
        const v = window.__v
        // Headless Chrome only presents new frames while playing, so seek, play briefly, pause.
        v.currentTime = ${t}
        await new Promise((r) => (v.onseeked = r))
        await v.play()
        await new Promise((r) => setTimeout(r, 120))
        v.pause()
        await new Promise((r) => setTimeout(r, 80))
        const c = document.createElement('canvas'); c.width = 960; c.height = 540
        c.getContext('2d').drawImage(v, 0, 0, 960, 540)
        return c.toDataURL('image/jpeg', 0.85)
      })()`)
      writeFileSync(join(outDir, `frame-${t}.jpg`), Buffer.from(data.split(',')[1], 'base64'))
    }
  }
} finally {
  await chrome.close()
  server.close()
}
