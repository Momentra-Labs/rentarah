// Captures real screenshots of the running RentaraH web app for the promo.
// 1) In the repo root: npm run dev   (http://127.0.0.1:5173, mocks on)
// 2) node promo/coming-soon/tools/capture-screens.mjs [baseUrl]
// Writes assets/screens/*.png (2x density, so they stay sharp in the 4K export).
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { launchChrome, sleep } from './cdp.mjs'

const BASE = (process.argv[2] || 'http://127.0.0.1:5173').replace(/\/$/, '')
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'screens')
const W = 1440
const H = 900

// The app shell scrolls inside an inner container, so tall pages use a tall
// viewport instead of a full-page capture.
const SHOTS = [
  { name: 'landing', path: '/', height: 1120 },
  { name: 'search', path: '/search?vt=car', height: 1100 },
  { name: 'detail', path: '/cars/car_001', height: 1900 },
  { name: 'map', path: '/map', height: H },
]

// Marketing figures in the hero (2,400+ listed, 98% happy renters) and the
// feature bullets are not verifiable for a pre-launch product, so they are
// hidden in promo captures. Everything else is the app as rendered.
const HIDE_UNVERIFIED = `(() => {
  const hideAround = (needle, mustAlsoContain) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let n
    while ((n = walker.nextNode())) {
      if (!n.textContent.includes(needle)) continue
      let el = n.parentElement
      while (el && !el.textContent.includes(mustAlsoContain)) el = el.parentElement
      if (el) el.style.visibility = 'hidden'
    }
  }
  hideAround('vehicles listed', 'hidden fees')
  // "Why RentaraH" trust bullets (insured / verified / secure payments / flexible):
  // a stylesheet rule survives the phone layout's animated ticker re-rendering.
  const st = document.createElement('style')
  st.textContent = 'section[aria-labelledby="landing-trust-heading"] { visibility: hidden !important; }'
  document.head.appendChild(st)
})()`

// Phone-size captures for the app-led showcase, plus the on-screen rectangles
// (CSS px) of the controls the video "taps", saved to screens-mobile/hotspots.json.
const MW = 390 // phone content area is 390×800 CSS px (below a drawn status bar)
const MOBILE_SHOTS = [
  { name: 'landing', path: '/', height: 1700, spots: { search: 'Search available vehicles' } },
  { name: 'search', path: '/search?vt=car', height: 2400, spots: { card: '2023 Toyota Fortuner', filters: 'Choose price and type' } },
  { name: 'detail', path: '/cars/car_001', height: 2600, spots: { price: 'Sign in to reserve', specs: 'About this car' } },
  { name: 'map', path: '/map', height: 800, spots: { cluster: 'RENTALS', moto: 'Moto' } },
]
const FIND_SPOTS = (spots) => `(() => {
  const out = {}
  const spots = ${JSON.stringify(spots)}
  for (const [key, needle] of Object.entries(spots)) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let n
    while ((n = walker.nextNode())) {
      if (!n.textContent.trim().startsWith(needle)) continue
      let el = n.parentElement
      const target = el.closest('button, a, [role=button], .MuiCard-root, .MuiPaper-root') || el
      const r = target.getBoundingClientRect()
      if (r.width && r.height) { out[key] = { x: r.x, y: r.y, w: r.width, h: r.height }; break }
    }
  }
  return out
})()`

const chrome = await launchChrome()
try {
  // Skip the first-run welcome modal (same key the app writes on "Don't show again").
  await chrome.navigate(BASE + '/', { settleMs: 500 })
  // ...and the once-per-session location prompt (sessionStorage survives same-tab navigations).
  await chrome.evaluate("localStorage.setItem('rentarah_onboarding_done', '1'); sessionStorage.setItem('rentara:geo-auto-landing', '1'); sessionStorage.setItem('rentara:geo-auto-car-detail', '1')")
  for (const shot of SHOTS) {
    await chrome.send('Emulation.setDeviceMetricsOverride', { width: W, height: shot.height, deviceScaleFactor: 2, mobile: false })
    await chrome.navigate(BASE + shot.path, { settleMs: 4000 })
    await chrome.evaluate(HIDE_UNVERIFIED)
    await sleep(500)
    const { data } = await chrome.send('Page.captureScreenshot', { format: 'png' })
    writeFileSync(join(OUT, `${shot.name}.png`), Buffer.from(data, 'base64'))
    console.log('saved', shot.name)
  }

  const mobileOut = join(OUT, '..', 'screens-mobile')
  mkdirSync(mobileOut, { recursive: true })
  const hotspots = { width: MW }
  for (const shot of MOBILE_SHOTS) {
    await chrome.send('Emulation.setDeviceMetricsOverride', { width: MW, height: shot.height, deviceScaleFactor: 3, mobile: true })
    await chrome.navigate(BASE + shot.path, { settleMs: 4000 })
    await chrome.evaluate(HIDE_UNVERIFIED)
    await sleep(500)
    hotspots[shot.name] = await chrome.evaluate(FIND_SPOTS(shot.spots))
    const { data } = await chrome.send('Page.captureScreenshot', { format: 'png' })
    writeFileSync(join(mobileOut, `${shot.name}.png`), Buffer.from(data, 'base64'))
    console.log('saved mobile', shot.name, JSON.stringify(hotspots[shot.name]))
  }
  writeFileSync(join(mobileOut, 'hotspots.json'), JSON.stringify(hotspots, null, 2))
} finally {
  await chrome.close()
}
