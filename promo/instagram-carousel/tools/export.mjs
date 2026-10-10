// Exports carousel.html slides 1..6 to slides/rentarah-carousel-0N.png at exactly 1080×1350.
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { launchChrome, sleep } from '../../coming-soon/tools/cdp.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const c = await launchChrome({ port: 9343 })
try {
  await c.send('Emulation.setDeviceMetricsOverride', { width: 1080, height: 1350, deviceScaleFactor: 1, mobile: false })
  for (let n = 1; n <= 6; n++) {
    await c.navigate(pathToFileURL(join(ROOT, 'carousel.html')).href + `?slide=${n}`, { settleMs: 1200 })
    await c.evaluate('document.fonts.ready.then(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))))')
    await sleep(200)
    const { data } = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1080, height: 1350, scale: 1 } })
    writeFileSync(join(ROOT, 'slides', `rentarah-carousel-0${n}.png`), Buffer.from(data, 'base64'))
    console.log('slide', n)
  }
} finally { await c.close() }
