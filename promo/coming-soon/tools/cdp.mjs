// Minimal Chrome DevTools Protocol driver (Node 22+: global fetch + WebSocket).
// Launches the locally installed Chrome headless — no extra npm packages needed.
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function launchChrome({ port = 9333, headless = true } = {}) {
  const exe = CANDIDATES.find((p) => existsSync(p))
  if (!exe) throw new Error('Chrome not found — set CHROME_PATH')
  const profile = mkdtempSync(join(tmpdir(), 'rh-promo-'))
  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--autoplay-policy=no-user-gesture-required',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    'about:blank',
  ]
  if (headless) args.unshift('--headless=new')
  const proc = spawn(exe, args, { stdio: 'ignore' })
  let version
  for (let i = 0; i < 100; i++) {
    try {
      version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()
      break
    } catch {
      await sleep(150)
    }
  }
  if (!version) throw new Error('Chrome did not expose DevTools')
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  const page = targets.find((t) => t.type === 'page')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((res, rej) => {
    ws.onopen = res
    ws.onerror = rej
  })
  let id = 0
  const pending = new Map()
  const listeners = []
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
    } else if (msg.method) {
      listeners.forEach((fn) => fn(msg))
    }
  }
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const mid = ++id
      pending.set(mid, { resolve, reject })
      ws.send(JSON.stringify({ id: mid, method, params }))
    })
  const on = (fn) => listeners.push(fn)

  async function evaluate(expression, { awaitPromise = true } = {}) {
    const r = await send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true })
    if (r.exceptionDetails) {
      throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
    }
    return r.result.value
  }

  async function navigate(url, { settleMs = 1500 } = {}) {
    await send('Page.enable')
    const loaded = new Promise((res) => on((m) => m.method === 'Page.loadEventFired' && res()))
    await send('Page.navigate', { url })
    await Promise.race([loaded, sleep(30000)])
    await sleep(settleMs)
  }

  async function setViewport(width, height) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
  }

  async function close() {
    try { ws.close() } catch {}
    proc.kill()
  }

  return { send, on, evaluate, navigate, setViewport, close }
}

export { sleep }
