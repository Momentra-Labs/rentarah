// Renders the promo to MP4 in headless Chrome (WebCodecs H.264 + AAC).
//   node tools/render-mp4.mjs [4k|1080p] [--no-vo]
// Output: dist/rentarah-coming-soon-<preset>[-music-only].mp4
import { mkdirSync, openSync, writeSync, closeSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { launchChrome, sleep } from './cdp.mjs'
import { startServer } from './serve.mjs'

const preset = process.argv.find((a) => a === '4k' || a === '1080p') || '4k'
const vo = !process.argv.includes('--no-vo')
const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
mkdirSync(dist, { recursive: true })
const file = join(dist, `rentarah-coming-soon-${preset}${vo ? '' : '-music-only'}.mp4`)

const port = 4791
const server = await startServer(port)
const chrome = await launchChrome({ port: 9335 })
const started = Date.now()
try {
  await chrome.send('Runtime.enable')
  chrome.on((m) => m.method === 'Runtime.exceptionThrown' && console.error(m.params.exceptionDetails.exception?.description))
  await chrome.navigate(`http://127.0.0.1:${port}/`, { settleMs: 500 })
  for (let i = 0; i < 150 && !(await chrome.evaluate('!!window.__promo?.ready')); i++) await sleep(200)
  const ticker = setInterval(async () => {
    try {
      const p = await chrome.evaluate('window.__promo.progress', { awaitPromise: false })
      process.stdout.write(`\r${preset} ${vo ? 'with VO' : 'music only'} — ${(p * 100).toFixed(1)}%   `)
    } catch {}
  }, 3000)
  const result = await chrome.evaluate(`window.__promo.export(${JSON.stringify(preset)}, ${vo})`)
  clearInterval(ticker)
  const size = 4 * 1024 * 1024
  const fd = openSync(file, 'w')
  for (let i = 0; i * size < result.bytes; i++) {
    const b64 = await chrome.evaluate(`window.__promo.chunk(${i}, ${size})`, { awaitPromise: false })
    writeSync(fd, Buffer.from(b64, 'base64'))
  }
  closeSync(fd)
  console.log(`\nWrote ${file} — ${(result.bytes / 1e6).toFixed(1)} MB, VO lines: ${result.voiceOverLines}, ${((Date.now() - started) / 1000).toFixed(0)} s`)
} finally {
  await chrome.close()
  server.close()
}
