// Screenshots a local HTML file at a given size: node tools/shoot.mjs <page.html> <out.png> <w> <h> [scale]
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { launchChrome, sleep } from '../../coming-soon/tools/cdp.mjs'
const [page, out, w, h, scale = '1'] = process.argv.slice(2)
const c = await launchChrome({ port: 9342 })
try {
  await c.send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: +scale, mobile: false })
  await c.navigate(pathToFileURL(resolve(page)).href, { settleMs: 1500 })
  await c.evaluate('document.fonts.ready.then(() => true)')
  await sleep(300)
  const { data } = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: +w, height: +h, scale: 1 } })
  writeFileSync(out, Buffer.from(data, 'base64'))
} finally { await c.close() }
