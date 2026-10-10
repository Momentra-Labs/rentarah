// Renders still frames for review: node tools/snap.mjs <outDir> <t1> <t2> ...
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { launchChrome, sleep } from './cdp.mjs'
import { startServer } from './serve.mjs'

const [outDir, ...times] = process.argv.slice(2)
mkdirSync(outDir, { recursive: true })
const port = 4790
const server = await startServer(port)
const chrome = await launchChrome({ port: 9334 })
try {
  await chrome.send('Runtime.enable')
  chrome.on((m) => m.method === 'Runtime.exceptionThrown' && console.error(m.params.exceptionDetails.exception?.description))
  chrome.on((m) => m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error' && console.error(m.params.args.map((a) => a.value ?? a.description).join(' ')))
  await chrome.navigate(`http://127.0.0.1:${port}/`, { settleMs: 500 })
  for (let i = 0; i < 100 && !(await chrome.evaluate('!!window.__promo?.ready')); i++) await sleep(200)
  for (const t of times) {
    const url = await chrome.evaluate(`window.__promo.snap(${Number(t)}, 1280)`)
    writeFileSync(join(outDir, `t${String(t).padStart(5, '0')}.jpg`), Buffer.from(url.split(',')[1], 'base64'))
  }
  console.log('ok', times.length)
} finally {
  await chrome.close()
  server.close()
}
