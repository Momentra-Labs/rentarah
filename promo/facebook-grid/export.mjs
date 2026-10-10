// Exports grid.html tiles 1..4 to images/rentarah-fb-grid-0N.png (1080×1080, a 2×2 Facebook grid).
//   node promo/facebook-grid/export.mjs
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { launchChrome, sleep } from '../coming-soon/tools/cdp.mjs'

const ROOT = dirname(fileURLToPath(import.meta.url))
const c = await launchChrome({ port: 9344 })
try {
  await c.send('Emulation.setDeviceMetricsOverride', { width: 1080, height: 1080, deviceScaleFactor: 1, mobile: false })
  for (let n = 1; n <= 4; n++) {
    await c.navigate(pathToFileURL(join(ROOT, 'grid.html')).href + `?tile=${n}`, { settleMs: 1200 })
    await c.evaluate('document.fonts.ready.then(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))))')
    await sleep(200)
    const { data } = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1080, height: 1080, scale: 1 } })
    writeFileSync(join(ROOT, 'images', `rentarah-fb-grid-0${n}.png`), Buffer.from(data, 'base64'))
  }
} finally { await c.close() }
